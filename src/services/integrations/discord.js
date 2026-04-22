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
           embeds: [{
             title: "✨ Synapse Intelligence Update",
             description: text.replace(/\*\*/g, ''), // Strip ugly double asterisks for a cleaner look
             color: 0x6366f1, // Indigo color to match brand
             timestamp: new Date().toISOString(),
             footer: { text: "Processed via Synapse AI" }
           }]
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `Discord API error: ${response.status}`)
      }

      return { success: true, messageId: data.id, channelId }
      
    } catch (e) {
       console.error('[Discord Connector] Failed:', e.message)
       throw e // Throw so the pipeline actually fails and shows the error
    }
  }
}
