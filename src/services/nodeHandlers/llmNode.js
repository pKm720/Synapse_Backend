export const llmNode = async (config, input) => {
  const groqApiKey = process.env.GROQ_API_KEY

  // 1. If Groq API Key is present, go direct for maximum speed
  if (groqApiKey) {
    const prompt = config.promptTemplate 
      ? config.promptTemplate.replace('{{input}}', JSON.stringify(input)) 
      : JSON.stringify(input)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || `Groq API error: ${res.status}`)
      }
      
      const data = await res.json()
      return { response: data.choices[0].message.content, model: data.model }
    } catch (err) {
      console.error('[LLM Node] Live call failed:', err.message)
      // Fallback to mock with the actual error message so the user can debug
      return { 
        response: `[MOCK AI] Cloud call failed: ${err.message}. Showing mock for: ${JSON.stringify(input)}`,
        mock: true 
      }
    }
  }

  // 2. Fallback to Local AI Service if configured
  const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
  if (aiUrl !== 'http://localhost:8000') {
    const res = await fetch(`${aiUrl}/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt: config.promptTemplate ? config.promptTemplate.replace('{{input}}', JSON.stringify(input)) : JSON.stringify(input)
      })
    })
    if (res.ok) return res.json()
  }

  // 3. Absolute Fallback: Mock Data (Perfect for dev without keys)
  await new Promise(r => setTimeout(r, 1000))
  return { 
    response: `[MOCK AI] No GROQ_API_KEY found. Simulated response for: ${JSON.stringify(input)}`,
    mock: true 
  }
}
