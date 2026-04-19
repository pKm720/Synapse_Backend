import express from 'express'
import Template from '../models/Template.js'
import Pipeline from '../models/Pipeline.js'
import { ApiError } from '../utils/ApiError.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// POST /templates - save pipeline snapshot as template
router.post('/', async (req, res, next) => {
  try {
    const { name, pipelineId, isPublic } = req.body

    const pipeline = await Pipeline.findOne({ _id: pipelineId, userId: req.user.id, deletedAt: { $exists: false } })
    if (!pipeline) throw new ApiError(404, 'Source pipeline not found')

    const template = await Template.create({
      userId: req.user.id,
      name: name || `${pipeline.name} Template`,
      isPublic: isPublic || false,
      pipelineSnapshot: {
        nodes: pipeline.nodes,
        edges: pipeline.edges
      }
    })

    res.status(201).json(template)
  } catch (error) {
    next(error)
  }
})

// GET /templates - list public + user's own templates
router.get('/', async (req, res, next) => {
  try {
    const templates = await Template.find({
      $or: [
        { isPublic: true },
        { userId: req.user.id }
      ]
    }).select('name isPublic createdAt')
    
    res.json(templates)
  } catch (error) {
    next(error)
  }
})

// POST /templates/:id/clone - clone template into new pipeline
router.post('/:id/clone', async (req, res, next) => {
  try {
    const { name } = req.body
    
    const template = await Template.findOne({
      _id: req.params.id,
      $or: [
        { isPublic: true },
        { userId: req.user.id }
      ]
    })
    
    if (!template) throw new ApiError(404, 'Template not found or access denied')

    const pipeline = await Pipeline.create({
      userId: req.user.id,
      name: name || `Clone of ${template.name}`,
      nodes: template.pipelineSnapshot.nodes,
      edges: template.pipelineSnapshot.edges
    })

    res.status(201).json(pipeline)
  } catch (error) {
    next(error)
  }
})

export default router
