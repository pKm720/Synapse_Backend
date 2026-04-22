import { inputNode } from './inputNode.js'
import { outputNode } from './outputNode.js'
import { llmNode } from './llmNode.js'
import { transformNode } from './transformNode.js'
import { conditionNode } from './conditionNode.js'
import { integrationNode } from './integrationNode.js'

export const handlers = {
  input: inputNode,
  output: outputNode,
  llm: llmNode,
  transform: transformNode,
  condition: conditionNode,
  integration: integrationNode,
  // New synapse types
  synapseInput: inputNode,
  synapseOutput: outputNode,
  synapseLLM: llmNode,
  synapseIntegration: integrationNode
}
