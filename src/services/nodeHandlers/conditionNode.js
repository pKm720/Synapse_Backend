export const conditionNode = async (config, input) => {
  // Evaluates a simple condition.
  // Returns specifically configured data for the edge matching 'true' or 'false'
  const targetField = config.field
  const operator = config.operator || 'exists'
  
  let result = false
  
  if (operator === 'exists') result = input[targetField] !== undefined
  else if (operator === 'equals') result = input[targetField] == config.value
  else if (operator === 'includes') result = String(input[targetField]).includes(config.value)

  return { __branch: result ? 'true' : 'false', data: input }
}
