// Extremely basic LLM mock for now until Python/AI microservice is attached.
export const llmNode = async (config, input) => {
  const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
  
  if (aiUrl === 'http://localhost:8000') {
    // Mock sleep to simulate AI typing
    await new Promise(r => setTimeout(r, 1500))
    return { response: `[MOCK AI] Processed input: ${JSON.stringify(input)} using prompt: ${config.promptTemplate || 'none'}` }
  }

  // Real LLM call based on the roadmap spec
  const res = await fetch(`${aiUrl}/invoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model || 'claude-3-haiku',
      prompt: config.promptTemplate ? config.promptTemplate.replace('{{input}}', JSON.stringify(input)) : JSON.stringify(input)
    })
  })

  if (!res.ok) throw new Error(`AI service error: ${res.status}`)
  return res.json()
}
