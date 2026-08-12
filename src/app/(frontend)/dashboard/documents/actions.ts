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
import { documentContentSchema } from '@/lib/schemas/document'

export type DocumentFormState = ContentFormState

function optionalString(value?: string) {
  return value?.trim() ? value.trim() : undefined
}

function optionalProjectId(value?: string): string | undefined {
  return optionalString(value)
}

function revalidateDocuments() {
  revalidatePath('/dashboard/documents')
  revalidatePath('/documents')
}

export async function createDocumentAction(
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const parsed = documentContentSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    category: formData.get('category'),
    publicationDate: formData.get('publicationDate'),
    externalUrl: formData.get('externalUrl') || undefined,
    sourceUrl: formData.get('sourceUrl') || undefined,
    projectId: formData.get('projectId') || undefined,
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

  const projectId = optionalProjectId(parsed.data.projectId)
  let createdId: string | number
  try {
    const created = await payload.create({
      collection: 'documents',
      user,
      overrideAccess: false,
      data: {
        tenant: tenantId as unknown as number,
        title: parsed.data.title,
        slug: parsed.data.slug,
        category: parsed.data.category,
        publicationDate: parsed.data.publicationDate,
        externalUrl: optionalString(parsed.data.externalUrl),
        sourceUrl: optionalString(parsed.data.sourceUrl),
        project: projectId,
        disclosureLevel: parsed.data.disclosureLevel,
        status,
      },
    })
    createdId = created.id
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create document.' }
  }

  revalidateDocuments()
  redirect(`/dashboard/documents/${createdId}`)
}

export async function updateDocumentContentAction(
  documentId: string,
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('documents', documentId, tenantId, user)
  if ('error' in owned) return { error: owned.error }

  const parsed = documentContentSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    category: formData.get('category'),
    publicationDate: formData.get('publicationDate'),
    externalUrl: formData.get('externalUrl') || undefined,
    sourceUrl: formData.get('sourceUrl') || undefined,
    projectId: formData.get('projectId') || undefined,
    disclosureLevel: formData.get('disclosureLevel'),
  })

  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  const projectId = optionalProjectId(parsed.data.projectId)
  try {
    await payload.update({
      collection: 'documents',
      id: documentId,
      user,
      overrideAccess: false,
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        category: parsed.data.category,
        publicationDate: parsed.data.publicationDate,
        externalUrl: optionalString(parsed.data.externalUrl),
        sourceUrl: optionalString(parsed.data.sourceUrl),
        project: projectId,
        disclosureLevel: parsed.data.disclosureLevel,
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update document.' }
  }

  revalidatePath(`/dashboard/documents/${documentId}`)
  revalidateDocuments()
  return { success: 'Document saved.' }
}

export async function updateDocumentStatusAction(
  documentId: string,
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('documents', documentId, tenantId, user)
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
      collection: 'documents',
      id: documentId,
      user,
      overrideAccess: false,
      data: {
        status: parsed.data.status,
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update status.' }
  }

  revalidatePath(`/dashboard/documents/${documentId}`)
  revalidateDocuments()
  return { success: 'Publication status updated.' }
}
