import { z } from 'zod'

export const shareStructureContentSchema = z.object({
  asOfDate: z.string().min(1, 'As-of date is required.'),
  sharesOutstanding: z.coerce.number().optional().or(z.nan()),
  options: z.coerce.number().optional().or(z.nan()),
  warrants: z.coerce.number().optional().or(z.nan()),
  fullyDiluted: z.coerce.number().optional().or(z.nan()),
  marketCapNote: z.string().optional(),
  sourceUrl: z.string().url('Enter a valid URL.').optional().or(z.literal('')),
})
