import OAuthToken from '../models/OAuthToken.js'

export const oauthManager = {
  // Save or update tokens after the frontend completes the OAuth handshake
  saveTokens: async (userId, provider, tokens) => {
    return await OAuthToken.findOneAndUpdate(
      { userId, provider },
      { 
        $set: { 
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt
        } 
      },
      { upsert: true, returnDocument: 'after' }
    )
  },

  // Retrieve a valid access token, handling manual refreshing if needed
  getValidToken: async (userId, provider) => {
    const record = await OAuthToken.findOne({ userId, provider })
    if (!record) throw new Error(`No OAuth tokens found for provider: ${provider}`)

    // If token is expired, in a full production app we would use the refreshToken 
    // to hit the provider's /oauth2/token endpoint here and save the new accessToken.
    if (record.expiresAt && new Date() > record.expiresAt) {
      console.log(`[TokenManager] Token for ${provider} is expired. Simulating refresh...`)
      // Logic to actually refresh goes here (Provider specific)
    }

    return record.accessToken
  }
}
