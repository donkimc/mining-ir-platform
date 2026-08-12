'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { assertOwnedRecord } from '@/lib/dashboard-crud'
import { assertPublicationTransition, guardCreateNotPublished } from '@/lib/publishing'
import {
  fieldErrorsFromZod,
  publicationStatusSchema,
  type ContentFormState,
} from '@/lib/schemas/content'
import { shareStructureContentSchema } from '@/lib/schemas/share-structure'

export type ShareStructureFormState = ContentFormState

function optionalString(value?: string) {
  return value?.trim() ? value.trim() : undefined
}

function revalidateShareStructure() {
  revalidatePath('/dashboard/share-structure')
  revalidatePath('/share-structure')
  revalidatePath('/')
}

export async function createShareStructureAction(
  _prev: ShareStructureFormState,
  formData: FormData,
): Promise<ShareStructureFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const parsed = shareStructureContentSchema.safeParse({
    asOfDate: formData.get('asOfDate'),
    sharesOutstanding: formData.get('sharesOutstanding') || undefined,
    options: formData.get('options') || undefined,
    warrants: formData.get('warrants') || undefined,
    fullyDiluted: formData.get('fullyDiluted') || undefined,
    marketCapNote: formData.get('marketCapNote') || undefined,
    sourceUrl: formData.get('sourceUrl') || undefined,
  })

  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  const status = 'draft'
  try {
    guardCreateNotPublished(status)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid status.' }
  }

  let createdId: string | number
  try {
    const created = await payload.create({
      collection: 'share-structures',
      user,
      overrideAccess: false,
      data: {
        tenant: tenantId as unknown as number,
        asOfDate: parsed.data.asOfDate,
        sharesOutstanding: Number.isFinite(parsed.data.sharesOutstanding)
          ? parsed.data.sharesOutstanding
          : undefined,
        options: Number.isFinite(parsed.data.options) ? parsed.data.options : undefined,
        warrants: Number.isFinite(parsed.data.warrants) ? parsed.data.warrants : undefined,
        fullyDiluted: Number.isFinite(parsed.data.fullyDiluted)
          ? parsed.data.fullyDiluted
          : undefined,
        marketCapNote: optionalString(parsed.data.marketCapNote),
        sourceUrl: optionalString(parsed.data.sourceUrl),
        status,
      },
    })
    createdId = created.id
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create share structure.' }
  }

  revalidateShareStructure()
  redirect(`/dashboard/share-structure/${createdId}`)
}

export async function updateShareStructureContentAction(
  recordId: string,
  _prev: ShareStructureFormState,
  formData: FormData,
): Promise<ShareStructureFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('share-structures', recordId, tenantId, user)
  if ('error' in owned) return { error: owned.error }

  const parsed = shareStructureContentSchema.safeParse({
    asOfDate: formData.get('asOfDate'),
    sharesOutstanding: formData.get('sharesOutstanding') || undefined,
    options: formData.get('options') || undefined,
    warrants: formData.get('warrants') || undefined,
    fullyDiluted: formData.get('fullyDiluted') || undefined,
    marketCapNote: formData.get('marketCapNote') || undefined,
    sourceUrl: formData.get('sourceUrl') || undefined,
  })

  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  try {
    await payload.update({
      collection: 'share-structures',
      id: recordId,
      user,
      overrideAccess: false,
      data: {
        asOfDate: parsed.data.asOfDate,
        sharesOutstanding: Number.isFinite(parsed.data.sharesOutstanding)
          ? parsed.data.sharesOutstanding
          : undefined,
        options: Number.isFinite(parsed.data.options) ? parsed.data.options : undefined,
        warrants: Number.isFinite(parsed.data.warrants) ? parsed.data.warrants : undefined,
        fullyDiluted: Number.isFinite(parsed.data.fullyDiluted)
          ? parsed.data.fullyDiluted
          : undefined,
        marketCapNote: optionalString(parsed.data.marketCapNote),
        sourceUrl: optionalString(parsed.data.sourceUrl),
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update share structure.' }
  }

  revalidatePath(`/dashboard/share-structure/${recordId}`)
  revalidateShareStructure()
  return { success: 'Share structure saved.' }
}

export async function updateShareStructureStatusAction(
  recordId: string,
  _prev: ShareStructureFormState,
  formData: FormData,
): Promise<ShareStructureFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('share-structures', recordId, tenantId, user)
  if ('error' in owned) return { error: owned.error }
  const existing = owned.existing as { status?: string }

  const parsed = publicationStatusSchema.safeParse({
    status: formData.get('status'),
  })

  if (!parsed.success) {
    return { error: 'Choose a valid status.' }
  }

  try {
    assertPublicationTransition({
      incomingStatus: parsed.data.status,
      previousStatus: existing.status,
    })
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Invalid publication transition.',
    }
  }

  try {
    await payload.update({
      collection: 'share-structures',
      id: recordId,
      user,
      overrideAccess: false,
      data: {
        status: parsed.data.status,
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update status.' }
  }

  revalidatePath(`/dashboard/share-structure/${recordId}`)
  revalidateShareStructure()
  return { success: 'Publication status updated.' }
}
