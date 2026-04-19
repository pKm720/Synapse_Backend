export const transformNode = async (config, input) => {
  // A simple Javascript evaluation mapping transform
  // VERY DANGEROUS to use eval in production without a sandbox!
  // This is a basic demonstration of pulling a specific key or formatting string.
  try {
    if (config.operation === 'uppercase') {
      return JSON.parse(JSON.stringify(input).toUpperCase())
    }
    if (config.operation === 'extractKey' && config.key) {
      return { [config.key]: input[config.key] }
    }
    return input // Passthrough if no valid transform configured
  } catch (e) {
    throw new Error(`Transform failed: ${e.message}`)
  }
}
