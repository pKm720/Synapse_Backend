export const inputNode = async (config, input) => {
  // Input node simply passes the data forward.
  // It merges triggerInput with any hardcoded config variables
  return { ...config, ...input }
}
