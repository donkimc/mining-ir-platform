'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { assertPublicationTransition } from '@/lib/publishing'

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

const companyStatusSchema = z.object({
  publicationStatus: z.enum(['draft', 'review', 'published', 'archived']),
})

export type CompanyFormState = {
  success?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export async function updateCompanyContentAction(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const parsed = companyContentSchema.safeParse({
    displayName: formData.get('displayName'),
    tickerSymbol: formData.get('tickerSymbol') || undefined,
    exchange: formData.get('exchange') || undefined,
    shortDescription: formData.get('shortDescription'),
    longDescription: formData.get('longDescription') || undefined,
    investmentThesis: formData.get('investmentThesis') || undefined,
    irContactName: formData.get('irContactName') || undefined,
    irContactEmail: formData.get('irContactEmail') || '',
    irContactPhone: formData.get('irContactPhone') || undefined,
    brandPrimary: formData.get('brandPrimary') || undefined,
    brandSecondary: formData.get('brandSecondary') || undefined,
    brandAccent: formData.get('brandAccent') || undefined,
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.')] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  const existing = await payload.findByID({
    collection: 'companies',
    id: tenantId,
    depth: 0,
    overrideAccess: true,
  })

  if (String(existing.id) !== String(tenantId)) {
    return { error: 'Forbidden.' }
  }

  try {
    await payload.update({
      collection: 'companies',
      id: tenantId,
      user,
      data: {
        displayName: parsed.data.displayName,
        tickerSymbol: parsed.data.tickerSymbol,
        exchange: parsed.data.exchange,
        shortDescription: parsed.data.shortDescription,
        longDescription: parsed.data.longDescription,
        investmentThesis: parsed.data.investmentThesis,
        irContactName: parsed.data.irContactName,
        irContactEmail: parsed.data.irContactEmail || undefined,
        irContactPhone: parsed.data.irContactPhone,
        brandColors: {
          primary: parsed.data.brandPrimary,
          secondary: parsed.data.brandSecondary,
          accent: parsed.data.brandAccent,
        },
      },
    })
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to save company profile.',
    }
  }

  revalidatePath('/')
  revalidatePath('/dashboard/company')
  return { success: 'Company profile saved.' }
}

export async function updateCompanyStatusAction(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const parsed = companyStatusSchema.safeParse({
    publicationStatus: formData.get('publicationStatus'),
  })

  if (!parsed.success) {
    return { error: 'Choose a valid publication status.' }
  }

  const existing = await payload.findByID({
    collection: 'companies',
    id: tenantId,
    depth: 0,
    overrideAccess: true,
  })

  if (String(existing.id) !== String(tenantId)) {
    return { error: 'Forbidden.' }
  }

  try {
    assertPublicationTransition({
      incomingStatus: parsed.data.publicationStatus,
      previousStatus: existing.publicationStatus,
    })
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Invalid publication transition.',
    }
  }

  try {
    await payload.update({
      collection: 'companies',
      id: tenantId,
      user,
      data: {
        publicationStatus: parsed.data.publicationStatus,
      },
    })
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to update publication status.',
    }
  }

  revalidatePath('/')
  revalidatePath('/dashboard/company')
  return { success: 'Publication status updated.' }
}
