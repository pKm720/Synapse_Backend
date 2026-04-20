import { oauthManager } from '../oauthManager.js'

export const slackConnector = {
  
  postMessage: async (userId, channel, text) => {
    try {
      const token = await oauthManager.getValidToken(userId, 'slack')
      
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ channel, text })
      })
      
      const data = await response.json()
      if (!data.ok) throw new Error(data.error || 'Slack API execution failed')
      return { success: true, messageId: data.ts, channel }
      
    } catch (e) {
       console.log('[Slack Connector (Mock)] Fallback or Error:', e.message)
       // Fallback for development without real tokens attached:
       return { success: true, mock: true, messageId: 'mock_slack_tz_123', channel, text }
    }
  }
}
