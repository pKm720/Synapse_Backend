import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  refreshToken: { type: String }
}, { timestamps: true })

export default mongoose.model('User', userSchema)
