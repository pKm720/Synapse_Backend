import Run from '../models/Run.js'

export const runLogger = {
  createRun: async (pipelineId, triggerInput) => {
    return await Run.create({
      pipelineId,
      status: 'running',
      triggerInput,
      startedAt: new Date()
    })
  },

  markStepRunning: async (runId, nodeId, nodeType) => {
    await Run.updateOne(
      { _id: runId },
      { $push: { steps: { nodeId, nodeType, status: 'running', startedAt: new Date() } } }
    )
  },

  markStepSuccess: async (runId, nodeId, input, output, tokens = { input: 0, output: 0 }) => {
    await Run.updateOne(
      { _id: runId, 'steps.nodeId': nodeId },
      { 
        $set: { 
          'steps.$.status': 'success',
          'steps.$.input': input,
          'steps.$.output': output,
          'steps.$.tokens': tokens,
          'steps.$.finishedAt': new Date()
        },
        $inc: {
          'totalTokens.input': tokens.input,
          'totalTokens.output': tokens.output
        }
      }
    )
  },

  markStepFailed: async (runId, nodeId, error) => {
    await Run.updateOne(
      { _id: runId, 'steps.nodeId': nodeId },
      { 
        $set: { 
          'steps.$.status': 'failed',
          'steps.$.error': error,
          'steps.$.finishedAt': new Date()
        }
      }
    )
    
    // Also mark the overall Run as failed
    await Run.updateOne(
      { _id: runId },
      { $set: { status: 'failed', finishedAt: new Date() } }
    )
  },

  markRunCompleted: async (runId) => {
    await Run.updateOne(
      { _id: runId },
      { $set: { status: 'completed', finishedAt: new Date() } }
    )
  }
}
