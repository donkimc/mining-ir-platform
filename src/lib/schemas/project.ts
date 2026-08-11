import { z } from 'zod'

import { PROJECT_STAGES } from '@/lib/constants'

export const projectContentSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  slug: z
    .string()
    .min(2, 'Slug is required.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase slug-case.'),
  commodity: z.string().optional(),
  jurisdiction: z.string().optional(),
  stage: z.enum(PROJECT_STAGES).optional().or(z.literal('')),
  ownershipPercent: z.coerce.number().min(0).max(100).optional().or(z.nan()),
  summary: z.string().optional(),
  highlights: z.string().optional(),
  technicalSummary: z.string().optional(),
  locationSummary: z.string().optional(),
  isFlagship: z.boolean().optional(),
})

export const projectStatusSchema = z.object({
  status: z.enum(['draft', 'review', 'published', 'archived']),
})
