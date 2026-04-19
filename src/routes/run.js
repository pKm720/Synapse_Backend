import express from 'express'
import Pipeline from '../models/Pipeline.js'
import Run from '../models/Run.js'
import { ApiError } from '../utils/ApiError.js'
import { protect } from '../middleware/auth.js'
import { runLogger } from '../services/runLogger.js'
import { runPipeline } from '../services/graphRunner.js'

const router = express.Router()
router.use(protect)

// POST /pipelines/:id/run - trigger an immediate run
router.post('/pipelines/:id/run', async (req, res, next) => {
  try {
    const triggerInput = req.body
    
    // Fetch the active pipeline
    const pipeline = await Pipeline.findOne({ _id: req.params.id, userId: req.user.id, deletedAt: { $exists: false } })
    if (!pipeline) throw new ApiError(404, 'Pipeline not found')

    // 1. Create the Run log record immediately
    const runDoc = await runLogger.createRun(pipeline._id, triggerInput)
    
    // 2. Start execution in background (we don't wait for it unless it's a synchronous API deployment)
    // For now we will await it directly to satisfy the CRUD phase tests
    try {
      const output = await runPipeline(pipeline, triggerInput, runDoc._id)
      await runLogger.markRunCompleted(runDoc._id)
      
      res.status(200).json({ runId: runDoc._id, status: 'completed', output })
    } catch (err) {
      res.status(500).json({ runId: runDoc._id, status: 'failed', error: err.message })
    }
  } catch (error) {
    next(error)
  }
})

// GET /pipelines/:id/runs - fetch run history for a pipeline
router.get('/pipelines/:id/runs', async (req, res, next) => {
  try {
    const runs = await Run.find({ pipelineId: req.params.id })
      .select('status startedAt finishedAt')
      .sort('-startedAt')
      .limit(50)
      
    res.json(runs)
  } catch (error) {
    next(error)
  }
})

// GET /runs/:id - fetch detailed run trace
router.get('/runs/:id', async (req, res, next) => {
  try {
    const run = await Run.findById(req.params.id).populate({
      path: 'pipelineId', 
      select: 'name userId'
    })
    
    if (!run) throw new ApiError(404, 'Run trace not found')
    
    // Security check - ensure they own the pipeline this run belongs to
    if (run.pipelineId.userId.toString() !== req.user.id) {
      throw new ApiError(403, 'Unauthorized access to run trace')
    }

    res.json(run)
  } catch (error) {
    next(error)
  }
})

// POST /runs/:id/replay - Replay a previous run
router.post('/runs/:id/replay', async (req, res, next) => {
  try {
    const oldRun = await Run.findById(req.params.id)
    if (!oldRun) throw new ApiError(404, 'Original run not found')
    
    // Allow overriding the input via body, otherwise fallback to exact same old trigger Input
    const triggerInput = Object.keys(req.body).length > 0 ? req.body : oldRun.triggerInput

    const pipeline = await Pipeline.findOne({ _id: oldRun.pipelineId, userId: req.user.id })
    if (!pipeline) throw new ApiError(404, 'Pipeline no longer exists')

    const newRunDoc = await runLogger.createRun(pipeline._id, triggerInput)
    
    try {
      const output = await runPipeline(pipeline, triggerInput, newRunDoc._id)
      await runLogger.markRunCompleted(newRunDoc._id)
      res.status(200).json({ runId: newRunDoc._id, status: 'completed', output })
    } catch (err) {
      res.status(500).json({ runId: newRunDoc._id, status: 'failed', error: err.message })
    }
  } catch (error) {
    next(error)
  }
})

export default router
