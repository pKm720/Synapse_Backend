import mongoose from 'mongoose'

const stepSchema = new mongoose.Schema({
  nodeId:     String,
  nodeType:   String,
  status:     { type: String, enum: ['pending','running','success','failed'] },
  input:      mongoose.Schema.Types.Mixed,
  output:     mongoose.Schema.Types.Mixed,
  error:      String,
  startedAt:  Date,
  finishedAt: Date,
  tokens:     { input: Number, output: Number },
}, { _id: false })

const runSchema = new mongoose.Schema({
  pipelineId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline' },
  status:      { type: String, enum: ['queued','running','completed','failed'], default: 'queued' },
  triggerInput: mongoose.Schema.Types.Mixed,
  steps:       [stepSchema],
  totalTokens: { input: Number, output: Number },
  totalCost:   Number,
  startedAt:   Date,
  finishedAt:  Date,
}, { timestamps: true })

export default mongoose.model('Run', runSchema)
