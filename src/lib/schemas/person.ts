import { z } from 'zod'

import { DISCLOSURE_LEVELS, PERSON_GROUPS } from '@/lib/constants'

export const personContentSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  roleTitle: z.string().min(2, 'Role title is required.'),
  group: z.enum(PERSON_GROUPS),
  biography: z.string().min(20, 'Biography is required.'),
  displayOrder: z.coerce.number().optional().or(z.nan()),
  disclosureLevel: z.enum(DISCLOSURE_LEVELS),
})
