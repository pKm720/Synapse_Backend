import { pipelineQueue } from '../workers/pipelineWorker.js'
import { runLogger } from './runLogger.js'

export const scheduler = {
  
  // Schedules a pipeline to run on a repeating cron expression
  schedulePipeline: async (pipelineId, cronExpr) => {
    // BullMQ repeatable jobs require a unique job name string. We use the pipeline ID.
    await pipelineQueue.add(
      `cron_run_${pipelineId}`, 
      { pipelineId, isCronRun: true },
       // Note: BullMQ handles creating the physical runId before it fires
      { 
        repeat: { pattern: cronExpr },
        jobId: `cron_${pipelineId}` // Ensure idempotency (only one cron per pipeline)
      }
    )
  },

  // Removes a pipeline from the cron scheduler
  unschedulePipeline: async (pipelineId, cronExpr) => {
    await pipelineQueue.removeRepeatable(
      `cron_run_${pipelineId}`,
      { pattern: cronExpr, jobId: `cron_${pipelineId}` }
    )
  }
}
