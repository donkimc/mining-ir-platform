import { z } from 'zod'

import { DISCLOSURE_LEVELS } from '@/lib/constants'
import { slugSchema } from '@/lib/schemas/content'

export const newsContentSchema = z.object({
  title: z.string().min(2, 'Title is required.'),
  slug: slugSchema,
  projectId: z.string().optional().or(z.literal('')),
  releaseDate: z.string().min(1, 'Release date is required.'),
  excerpt: z.string().min(10, 'Excerpt is required.'),
  body: z.string().min(20, 'Body is required.'),
  sourceUrl: z.string().url('Enter a valid URL.').optional().or(z.literal('')),
  disclosureLevel: z.enum(DISCLOSURE_LEVELS),
})
