import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import pipelineRoutes from './routes/pipeline.js'
import templateRoutes from './routes/template.js'
import runRoutes from './routes/run.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})
app.use(limiter)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/pipelines', pipelineRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api', runRoutes) // runRoutes covers /api/pipelines/:id/run and /api/runs

app.use(errorHandler)

export default app
