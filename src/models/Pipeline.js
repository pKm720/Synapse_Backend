import mongoose from 'mongoose'

const nodeSchema = new mongoose.Schema({
  id: String,
  type: { type: String, enum: ['input','output','llm','transform','condition','integration'] },
  config: mongoose.Schema.Types.Mixed,
  position: { x: Number, y: Number }
}, { _id: false })

const edgeSchema = new mongoose.Schema({
  id: String,
  source: String,
  target: String,
  sourceHandle: String,  // for condition branches: 'true' | 'false'
}, { _id: false })

const pipelineSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:      { type: String, required: true },
  nodes:     [nodeSchema],
  edges:     [edgeSchema],
  status:    { type: String, enum: ['draft','deployed','published'], default: 'draft' },
  apiSlug:   String,   // set when published as API
  cronExpr:  String,   // set when scheduled
  deletedAt: Date,
}, { timestamps: true })

export default mongoose.model('Pipeline', pipelineSchema)
