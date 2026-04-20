import { slackConnector } from '../integrations/slack.js'
import { gmailConnector } from '../integrations/gmail.js'

export const integrationNode = async (config, input) => {
  // We assume 'userId' is magically passed through the graphRunner context
  // or injected. For this implementation, we will assume it's part of the config 
  // or injected explicitly before we reach here.
  const userId = config.injectedUserId || 'dummy_user_for_dev'

  if (config.provider === 'slack') {
    return await slackConnector.postMessage(userId, config.channel, config.text || input.message)
  }
  
  if (config.provider === 'gmail') {
    return await gmailConnector.sendEmail(
      userId, 
      config.to, 
      config.subject || 'Synapse Action', 
      config.body || input.text
    )
  }
  
  return { status: 'failed', error: 'Unknown integration provider configuration' }
}
