import express from 'express'
import crypto from 'crypto'
import Pipeline from '../models/Pipeline.js'
import { ApiError } from '../utils/ApiError.js'
import { protect } from '../middleware/auth.js'
import { scheduler } from '../services/scheduler.js'

const router = express.Router()
router.use(protect)

// POST /deploy/:id - Mark pipeline as deployed worker
router.post('/:id', async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, deletedAt: { $exists: false } },
      { $set: { status: 'deployed' } },
      { returnDocument: 'after' }
    )
    if (!pipeline) throw new ApiError(404, 'Pipeline not found')
    res.json({ success: true, message: 'Pipeline deployed to worker pool', pipeline })
  } catch (error) {
    next(error)
  }
})

// DELETE /deploy/:id - Undeploy
router.delete('/:id', async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, deletedAt: { $exists: false } },
      { $set: { status: 'draft' } },
      { returnDocument: 'after' }
    )
    if (!pipeline) throw new ApiError(404, 'Pipeline not found')
    res.json({ success: true, message: 'Pipeline undeployed', pipeline })
  } catch (error) {
    next(error)
  }
})

// POST /deploy/:id/publish-api - Generate public webhook endpoint slug
router.post('/:id/publish-api', async (req, res, next) => {
  try {
    const slug = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, deletedAt: { $exists: false } },
      { $set: { status: 'published', apiSlug: slug } },
      { returnDocument: 'after' }
    )

    if (!pipeline) throw new ApiError(404, 'Pipeline not found')
    
    // Provide the user exactly what URL to ping as a 3rd party
    const publicEndpoint = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/public/run/${slug}`
    res.json({ success: true, apiSlug: slug, publicEndpoint, pipeline })
  } catch (error) {
    next(error)
  }
})

// POST /deploy/:id/schedule - Set Cron
router.post('/:id/schedule', async (req, res, next) => {
  try {
    const { cron } = req.body
    if (!cron) throw new ApiError(400, 'Cron expression required')

    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, deletedAt: { $exists: false } },
      { $set: { cronExpr: cron } },
      { returnDocument: 'after' }
    )
    
    if (!pipeline) throw new ApiError(404, 'Pipeline not found')

    await scheduler.schedulePipeline(pipeline._id.toString(), cron)
    res.json({ success: true, message: `Scheduled at ${cron}`, pipeline })
  } catch (error) {
    next(error)
  }
})

// DELETE /deploy/:id/schedule - Remove Cron
router.delete('/:id/schedule', async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOne({ _id: req.params.id, userId: req.user.id, deletedAt: { $exists: false } })
    if (!pipeline) throw new ApiError(404, 'Pipeline not found')
    
    if (pipeline.cronExpr) {
      await scheduler.unschedulePipeline(pipeline._id.toString(), pipeline.cronExpr)
      pipeline.cronExpr = null
      await pipeline.save()
    }
    
    res.json({ success: true, message: 'Schedule removed', pipeline })
  } catch (error) {
    next(error)
  }
})

export default router
