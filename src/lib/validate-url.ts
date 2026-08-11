/** Payload field validate: require http(s) absolute URLs. */
export function validateHttpUrl(value: unknown): true | string {
  if (value == null || value === '') return true
  if (typeof value !== 'string') return 'URL must be a string.'
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'URL must start with http:// or https://'
    }
    return true
  } catch {
    return 'Enter a valid http:// or https:// URL.'
  }
}
