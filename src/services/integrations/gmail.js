import nodemailer from 'nodemailer'

export const gmailConnector = {
  
  sendEmail: async (userId, to, subject, bodyText) => {
    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_APP_PASS

    // 1. Check for App Password credentials in .env
    if (user && pass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass }
        })

        const info = await transporter.sendMail({
          from: user,
          to,
          subject,
          text: bodyText
        })

        return { success: true, messageId: info.messageId }
      } catch (e) {
        console.error('[Gmail Connector] SMTP Error:', e.message)
        throw new Error(`Email failed: ${e.message}`)
      }
    }

    // 2. Fallback: Mock Data (No keys found)
    console.log('[Gmail Connector (Mock)] No GMAIL_USER/PASS found. Simulating send...')
    await new Promise(r => setTimeout(r, 1000))
    return { success: true, mock: true, messageId: 'mock_smtp_123', to, subject }
  }
}
