/**
 * Empty optional text fields on create may be omitted (`undefined`).
 * On update they must be `null` so Payload clears the column (`undefined` = leave unchanged).
 */
export function optionalString(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function clearableString(value?: string): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
