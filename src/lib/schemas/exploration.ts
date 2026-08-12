import { z } from 'zod'

import { DISCLOSURE_LEVELS } from '@/lib/constants'

export const explorationContentSchema = z.object({
  projectId: z.string().min(1, 'Project is required.'),
  title: z.string().min(2, 'Title is required.'),
  contentDate: z.string().min(1, 'Date is required.'),
  summary: z.string().min(10, 'Summary is required.'),
  technicalDetails: z.string().min(20, 'Technical details are required.'),
  sourceUrl: z.string().url('Enter a valid URL.').optional().or(z.literal('')),
  disclosureLevel: z.enum(DISCLOSURE_LEVELS),
})
