import express from 'express'
import Pipeline from '../models/Pipeline.js'
import { ApiError } from '../utils/ApiError.js'
import { pipelineQueue } from '../workers/pipelineWorker.js'
import { runLogger } from '../services/runLogger.js'

const router = express.Router()

// POST /api/public/run/:slug - Webhook trigger for 3rd parties
// Notice: NO JWT 'protect' middleware here!
router.post('/run/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    const triggerInput = req.body

    const pipeline = await Pipeline.findOne({ apiSlug: slug, status: 'published', deletedAt: { $exists: false } })
    if (!pipeline) throw new ApiError(404, 'Public pipeline endpoint not found or inactive')

    // 1. Create Run doc immediately to give them a tracking reference
    const runDoc = await runLogger.createRun(pipeline._id, triggerInput)
    
    // 2. Offload the execution to BullMQ worker queue background
    await pipelineQueue.add('public_webhook_run', {
      pipelineId: pipeline._id.toString(),
      triggerInput,
      runId: runDoc._id.toString()
    })

    // 3. Return immediately (Async/Fire-and-forget interface)
    res.status(202).json({ 
      success: true, 
      message: 'Run queued via public API',
      runId: runDoc._id
    })
  } catch (error) {
    next(error)
  }
})

export default router
