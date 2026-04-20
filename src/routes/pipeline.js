import express from 'express'
import Pipeline from '../models/Pipeline.js'
import { ApiError } from '../utils/ApiError.js'
import { protect } from '../middleware/auth.js'
import { validatePipelineGraph } from '../services/pipelineValidator.js'

const router = express.Router()

router.use(protect)

/**
 * @swagger
 * /api/pipelines:
 *   post:
 *     summary: Create a new pipeline
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               nodes:
 *                 type: array
 *                 items:
 *                   type: object
 *               edges:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Pipeline created
 */
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

/**
 * @swagger
 * /api/pipelines:
 *   get:
 *     summary: List all user pipelines
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pipelines
 */
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

/**
 * @swagger
 * /api/pipelines/{id}:
 *   get:
 *     summary: Get a specific pipeline
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pipeline data
 */
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
