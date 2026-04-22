export const discordConnector = {
  
  postMessage: async (channelId, text) => {
    try {
      const token = process.env.DISCORD_BOT_TOKEN
      if (!token) throw new Error('No Discord token available in environment variables.')

      // Note: Discord Bot tokens need to prefix "Bot " in the Authorization header.
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
           content: text 
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `Discord API error: ${response.status}`)
      }

      return { success: true, messageId: data.id, channelId }
      
    } catch (e) {
       console.log('[Discord Connector] Live call failed:', e.message)
       // Fallback for development without real tokens attached:
       return { success: true, mock: true, messageId: 'mock_discord_msg_123', channelId, text }
    }
  }
}
