export const topologicalSort = (nodes, edges) => {
  const inDegree = {}
  const adjList = {}

  // Initialize data structures
  nodes.forEach(n => { 
    inDegree[n.id] = 0
    adjList[n.id] = [] 
  })
  
  edges.forEach(e => {
    // Only build adjency logic if source and target nodes exist in the graph
    if (adjList[e.source] !== undefined && inDegree[e.target] !== undefined) {
      adjList[e.source].push(e.target)
      inDegree[e.target]++
    }
  })

  // Start with nodes that have no incoming edges
  const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
  const order = []

  while (queue.length) {
    const curr = queue.shift()
    order.push(curr)
    
    adjList[curr].forEach(next => {
      inDegree[next]--
      if (inDegree[next] === 0) queue.push(next)
    })
  }

  if (order.length !== nodes.length) {
    throw new Error('Pipeline has a cycle or invalid node references')
  }
  
  return order.map(id => nodes.find(n => n.id === id))
}
