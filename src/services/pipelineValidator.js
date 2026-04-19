export const validatePipelineGraph = (nodes, edges) => {
  const errors = []
  
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return { isValid: false, errors: ['Nodes and edges must be arrays'] }
  }

  const nodeIds = new Set(nodes.map(n => n.id))

  // 1. Check all edges reference valid node IDs
  edges.forEach(edge => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`)
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`)
    }
  })

  // 2. Very basic required configs
  nodes.forEach(node => {
    if (!node.type) {
      errors.push(`Node ${node.id} is missing a type`)
    }
  })

  // Note: Cycle detection via Kahn's topology check will be handled in execution
  // but if needed, we could add basic cycle validation here too.

  return {
    isValid: errors.length === 0,
    errors
  }
}
