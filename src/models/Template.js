import mongoose from 'mongoose'

const templateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  pipelineSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  isPublic: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('Template', templateSchema)
