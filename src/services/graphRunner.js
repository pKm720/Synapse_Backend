import { topologicalSort } from '../utils/topologicalSort.js'
import { handlers } from './nodeHandlers/index.js'
import { runLogger } from './runLogger.js'

export const runPipeline = async (pipeline, triggerInput, runId) => {
  const { nodes, edges } = pipeline
  const orderedNodes = topologicalSort(nodes, edges)

  // nodeOutputs[nodeId] = that node's output
  const nodeOutputs = {} 

  for (const node of orderedNodes) {
    await runLogger.markStepRunning(runId, node.id, node.type)

    // Gather inputs from all parent nodes that have an edge pointing to the current node
    const parentEdges = edges.filter(e => e.target === node.id)
    
    // Condition branch handling: 
    // If a node receives input from a conditioned node, make sure the edge's sourceHandle matches the condition branch
    const validParentEdges = parentEdges.filter(e => {
      const sourceOutput = nodeOutputs[e.source]
      // If the parent output was a condition branch object, only allow the edge if it matches
      if (sourceOutput && typeof sourceOutput === 'object' && sourceOutput.__branch) {
        return e.sourceHandle === sourceOutput.__branch
      }
      return true
    })

    // Skip execution of this node if it was supposed to receive input from a conditional path that failed
    // (Meaning its parent evaluated to 'false', but this node was connected to 'true')
    if (parentEdges.length > 0 && validParentEdges.length === 0) {
      nodeOutputs[node.id] = { __skipped: true }
      await runLogger.markStepSuccess(runId, node.id, null, 'Skipped due to condition branch')
      continue
    }

    // Build the input object for this node
    let input = {}
    if (node.type === 'input') {
      input = triggerInput || {}
    } else if (validParentEdges.length === 1) {
      input = nodeOutputs[validParentEdges[0].source]
      if (input && input.__branch) input = input.data // Strip the branch wrapper if it exists
    } else {
      validParentEdges.forEach(e => {
        let parentData = nodeOutputs[e.source]
        if (parentData && parentData.__branch) parentData = parentData.data
        input = { ...input, ...parentData }
      })
    }

    try {
      const handler = handlers[node.type]
      if (!handler) throw new Error(`No handler for node type: ${node.type}`)

      // Resolve variables like {{input}} or {{fieldName}} inside the config
      const resolvedConfig = resolveConfig(node.config || {}, input)

      const output = await executeWithRetry(handler, resolvedConfig, input)
      nodeOutputs[node.id] = output
      await runLogger.markStepSuccess(runId, node.id, input, output)

    } catch (err) {
      await runLogger.markStepFailed(runId, node.id, err.message)
      throw err  // Halt pipeline on first hard failure
    }
  }

  // The final output of the pipeline is typically the output of the terminal node(s)
  const outputNodes = orderedNodes.filter(n => n.type === 'output')
  if (outputNodes.length === 0) return nodeOutputs[orderedNodes.at(-1).id]
  
  if (outputNodes.length === 1) return nodeOutputs[outputNodes[0].id]
  
  return outputNodes.reduce((acc, current) => {
     acc[current.id] = nodeOutputs[current.id]
     return acc
  }, {})
}

// Helper to replace {{variables}} with actual data
const resolveConfig = (config, input) => {
  const resolved = JSON.parse(JSON.stringify(config)) // Deep copy
  
  const getValue = (path, data) => {
    if (path === 'input') return typeof data === 'object' ? JSON.stringify(data) : data
    
    // Support dot notation like {{input.response}} or {{response}}
    const keys = path.replace(/^input\./, '').split('.')
    let current = data
    for (const key of keys) {
      if (current === null || current[key] === undefined) return null
      current = current[key]
    }
    return current
  }

  const deepResolve = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/\{\{(.*?)\}\}/g, (match, path) => {
          const val = getValue(path.trim(), input)
          if (val === null) return match
          return typeof val === 'object' ? JSON.stringify(val) : val
        })
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        deepResolve(obj[key])
      }
    }
  }

  deepResolve(resolved)
  return resolved
}

const executeWithRetry = async (handler, config, input, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await handler(config, input)
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, i)))  // Exponential backoff
    }
  }
}
