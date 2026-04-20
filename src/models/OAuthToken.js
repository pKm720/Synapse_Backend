import mongoose from 'mongoose'

const oauthTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['gmail', 'slack', 'notion', 'sheets'], required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresAt: { type: Date }
}, { timestamps: true })

// Ensure a user can only have one token set per provider
oauthTokenSchema.index({ userId: 1, provider: 1 }, { unique: true })

export default mongoose.model('OAuthToken', oauthTokenSchema)
