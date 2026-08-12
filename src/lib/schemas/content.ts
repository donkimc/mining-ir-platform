import { z } from 'zod'

export type ContentFormState = {
  success?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export const publicationStatusSchema = z.object({
  status: z.enum(['draft', 'review', 'published', 'archived']),
})

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    fieldErrors[issue.path.join('.')] = issue.message
  }
  return fieldErrors
}

export const slugSchema = z
  .string()
  .min(2, 'Slug is required.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase slug-case.')
