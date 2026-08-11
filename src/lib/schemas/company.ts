import { z } from 'zod'

export const companyContentSchema = z.object({
  displayName: z.string().min(2, 'Display name is required.'),
  tickerSymbol: z.string().optional(),
  exchange: z.string().optional(),
  shortDescription: z.string().min(10, 'Short description is required.'),
  longDescription: z.string().optional(),
  investmentThesis: z.string().optional(),
  irContactName: z.string().optional(),
  irContactEmail: z.string().email('Enter a valid IR email.').optional().or(z.literal('')),
  irContactPhone: z.string().optional(),
  brandPrimary: z.string().optional(),
  brandSecondary: z.string().optional(),
  brandAccent: z.string().optional(),
})

export const companyStatusSchema = z.object({
  publicationStatus: z.enum(['draft', 'review', 'published', 'archived']),
})
