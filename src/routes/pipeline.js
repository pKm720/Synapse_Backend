import express from 'express'
import Pipeline from '../models/Pipeline.js'
import { ApiError } from '../utils/ApiError.js'
import { protect } from '../middleware/auth.js'
import { validatePipelineGraph } from '../services/pipelineValidator.js'

const router = express.Router()

router.use(protect)

// POST /pipelines - create new pipeline
router.post('/', async (req, res, next) => {
  try {
    const { name, nodes = [], edges = [] } = req.body

    const validation = validatePipelineGraph(nodes, edges)
    if (!validation.isValid) {
      throw new ApiError(400, `Graph validation failed: ${validation.errors.join(', ')}`)
    }

    const pipeline = await Pipeline.create({
      userId: req.user.id,
      name,
      nodes,
      edges
    })

    res.status(201).json(pipeline)
  } catch (error) {
    next(error)
  }
})

// GET /pipelines - list user's pipelines
router.get('/', async (req, res, next) => {
  try {
    const pipelines = await Pipeline.find({ userId: req.user.id, deletedAt: { $exists: false } })
      .select('name status createdAt updatedAt')
      .sort('-updatedAt')
    res.json(pipelines)
  } catch (error) {
    next(error)
  }
})

// GET /pipelines/:id - fetch single pipeline
router.get('/:id', async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOne({ _id: req.params.id, userId: req.user.id, deletedAt: { $exists: false } })
    if (!pipeline) throw new ApiError(404, 'Pipeline not found')
    res.json(pipeline)
  } catch (error) {
    next(error)
  }
})

// PUT /pipelines/:id - update pipeline graph
router.put('/:id', async (req, res, next) => {
  try {
    const { name, nodes, edges } = req.body

    if (nodes && edges) {
      const validation = validatePipelineGraph(nodes, edges)
      if (!validation.isValid) {
        throw new ApiError(400, `Graph validation failed: ${validation.errors.join(', ')}`)
      }
    }

    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, deletedAt: { $exists: false } },
      { $set: { ...(name && { name }), ...(nodes && { nodes }), ...(edges && { edges }) } },
      { returnDocument: 'after', runValidators: true }
    )

    if (!pipeline) throw new ApiError(404, 'Pipeline not found')
      
    res.json(pipeline)
  } catch (error) {
    next(error)
  }
})

// DELETE /pipelines/:id - soft delete
router.delete('/:id', async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, deletedAt: { $exists: false } },
      { $set: { deletedAt: new Date() } },
      { returnDocument: 'after' }
    )
    
    if (!pipeline) throw new ApiError(404, 'Pipeline not found')
      
    res.json({ success: true, message: 'Pipeline deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
