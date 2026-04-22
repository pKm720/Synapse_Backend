import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import pipelineRoutes from './routes/pipeline.js'
import templateRoutes from './routes/template.js'
import runRoutes from './routes/run.js'
import deployRoutes from './routes/deploy.js'
import publicRunRoutes from './routes/publicRun.js'
import { setupSwagger } from '../swagger.js'

const app = express()

app.use(helmet())
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (like Postman/curl) or whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json())

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})
app.use(limiter)

// Setup Swagger Docs
setupSwagger(app)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/pipelines', pipelineRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/public', publicRunRoutes)
app.use('/api', runRoutes) // runRoutes covers /api/pipelines/:id/run and /api/runs
app.use('/api/deploy', deployRoutes)

app.use(errorHandler)

export default app
