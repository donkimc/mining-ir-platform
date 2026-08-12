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
import { explorationContentSchema } from '@/lib/schemas/exploration'

export type ExplorationFormState = ContentFormState

function optionalString(value?: string) {
  return value?.trim() ? value.trim() : undefined
}

function projectIdValue(value: string): string {
  return value.trim()
}

function revalidateExploration() {
  revalidatePath('/dashboard/exploration')
  revalidatePath('/projects')
  revalidatePath('/projects', 'layout')
}

export async function createExplorationAction(
  _prev: ExplorationFormState,
  formData: FormData,
): Promise<ExplorationFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const parsed = explorationContentSchema.safeParse({
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    contentDate: formData.get('contentDate'),
    summary: formData.get('summary'),
    technicalDetails: formData.get('technicalDetails'),
    sourceUrl: formData.get('sourceUrl') || undefined,
    disclosureLevel: formData.get('disclosureLevel'),
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
      collection: 'exploration-contents',
      user,
      overrideAccess: false,
      data: {
        tenant: tenantId as unknown as number,
        project: projectIdValue(parsed.data.projectId) as unknown as number,
        title: parsed.data.title,
        contentDate: parsed.data.contentDate,
        summary: parsed.data.summary,
        technicalDetails: parsed.data.technicalDetails,
        sourceUrl: optionalString(parsed.data.sourceUrl),
        disclosureLevel: parsed.data.disclosureLevel,
        status,
      },
    })
    createdId = created.id
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create exploration content.' }
  }

  revalidateExploration()
  redirect(`/dashboard/exploration/${createdId}`)
}

export async function updateExplorationContentAction(
  contentId: string,
  _prev: ExplorationFormState,
  formData: FormData,
): Promise<ExplorationFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('exploration-contents', contentId, tenantId, user)
  if ('error' in owned) return { error: owned.error }

  const parsed = explorationContentSchema.safeParse({
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    contentDate: formData.get('contentDate'),
    summary: formData.get('summary'),
    technicalDetails: formData.get('technicalDetails'),
    sourceUrl: formData.get('sourceUrl') || undefined,
    disclosureLevel: formData.get('disclosureLevel'),
  })

  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  try {
    await payload.update({
      collection: 'exploration-contents',
      id: contentId,
      user,
      overrideAccess: false,
      data: {
        project: projectIdValue(parsed.data.projectId) as unknown as number,
        title: parsed.data.title,
        contentDate: parsed.data.contentDate,
        summary: parsed.data.summary,
        technicalDetails: parsed.data.technicalDetails,
        sourceUrl: optionalString(parsed.data.sourceUrl),
        disclosureLevel: parsed.data.disclosureLevel,
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update exploration content.' }
  }

  revalidatePath(`/dashboard/exploration/${contentId}`)
  revalidateExploration()
  return { success: 'Exploration content saved.' }
}

export async function updateExplorationStatusAction(
  contentId: string,
  _prev: ExplorationFormState,
  formData: FormData,
): Promise<ExplorationFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('exploration-contents', contentId, tenantId, user)
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
      collection: 'exploration-contents',
      id: contentId,
      user,
      overrideAccess: false,
      data: {
        status: parsed.data.status,
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update status.' }
  }

  revalidatePath(`/dashboard/exploration/${contentId}`)
  revalidateExploration()
  return { success: 'Publication status updated.' }
}
