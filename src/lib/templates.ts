import type { Company } from '@/payload-types'

export const TEMPLATE_KEYS = ['explorer', 'summit'] as const
export type TemplateKey = (typeof TEMPLATE_KEYS)[number]

export function resolveTemplateKey(company: Pick<Company, 'templateKey'>): TemplateKey {
  const key = company.templateKey
  if (key === 'summit') return 'summit'
  if (key === 'explorer' || key == null) return 'explorer'
  // Unknown keys fail closed (ADR-0017).
  throw new Error(`Unknown templateKey: ${String(key)}`)
}

export function templateShellClass(template: TemplateKey): string {
  return template === 'summit' ? 'template-summit' : 'template-explorer'
}
