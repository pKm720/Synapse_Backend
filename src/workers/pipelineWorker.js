import { Worker, Queue } from 'bullmq'
import { redis } from '../config/redis.js'
import { runPipeline } from '../services/graphRunner.js'
import { runLogger } from '../services/runLogger.js'
import Pipeline from '../models/Pipeline.js'
import Run from '../models/Run.js'

// 1. Export the Queue so other files (deploy/schedule) can add jobs to it
export const pipelineQueue = new Queue('pipeline-runs', { connection: redis })

// 2. Define the Worker that processes jobs from this queue automatically
const worker = new Worker('pipeline-runs', async (job) => {
  let { pipelineId, triggerInput, runId, isCronRun } = job.data

  try {
    const pipeline = await Pipeline.findById(pipelineId)
    if (!pipeline) throw new Error('Pipeline not found during worker execution')

    if (isCronRun && !runId) {
      const runDoc = await runLogger.createRun(pipelineId, triggerInput || { trigger: 'cron_schedule' })
      runId = runDoc._id.toString()
    }

    // Start Phase
    await Run.findByIdAndUpdate(runId, { status: 'running', startedAt: new Date() })

    // Execute the core engine from Phase 4
    const result = await runPipeline(pipeline, triggerInput, runId)

    // Complete Phase
    await runLogger.markRunCompleted(runId)
    return result

  } catch (error) {
    // RunLogger's markStepFailed already handles marking the Run as failed internally
    console.error(`Worker failed for Run ID ${runId}:`, error.message)
    throw error // Let BullMQ know the job officially failed
  }
}, { connection: redis, concurrency: 5 })

worker.on('completed', job => {
  console.log(`[BullMQ Worker] Job ${job.id} completed successfully for Pipeline ${job.data.pipelineId}`)
})

worker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] Job ${job.id} officially failed`, err)
})
