import { z } from 'zod'

import { DISCLOSURE_LEVELS, DOCUMENT_CATEGORIES } from '@/lib/constants'
import { slugSchema } from '@/lib/schemas/content'

export const documentContentSchema = z.object({
  title: z.string().min(2, 'Title is required.'),
  slug: slugSchema,
  category: z.enum(DOCUMENT_CATEGORIES),
  publicationDate: z.string().min(1, 'Publication date is required.'),
  externalUrl: z.string().url('Enter a valid URL.').optional().or(z.literal('')),
  sourceUrl: z.string().url('Enter a valid URL.').optional().or(z.literal('')),
  projectId: z.string().optional().or(z.literal('')),
  disclosureLevel: z.enum(DISCLOSURE_LEVELS),
})
