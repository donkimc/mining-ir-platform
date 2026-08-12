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
import { personContentSchema } from '@/lib/schemas/person'

export type PersonFormState = ContentFormState

function revalidateManagement() {
  revalidatePath('/dashboard/management')
  revalidatePath('/management')
}

export async function createPersonAction(
  _prev: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const parsed = personContentSchema.safeParse({
    name: formData.get('name'),
    roleTitle: formData.get('roleTitle'),
    group: formData.get('group'),
    biography: formData.get('biography'),
    displayOrder: formData.get('displayOrder') || undefined,
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
      collection: 'people',
      user,
      overrideAccess: false,
      data: {
        tenant: tenantId as unknown as number,
        name: parsed.data.name,
        roleTitle: parsed.data.roleTitle,
        group: parsed.data.group,
        biography: parsed.data.biography,
        displayOrder: Number.isFinite(parsed.data.displayOrder)
          ? parsed.data.displayOrder
          : undefined,
        disclosureLevel: parsed.data.disclosureLevel,
        status,
      },
    })
    createdId = created.id
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create person.' }
  }

  revalidateManagement()
  redirect(`/dashboard/management/${createdId}`)
}

export async function updatePersonContentAction(
  personId: string,
  _prev: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('people', personId, tenantId, user)
  if ('error' in owned) return { error: owned.error }

  const parsed = personContentSchema.safeParse({
    name: formData.get('name'),
    roleTitle: formData.get('roleTitle'),
    group: formData.get('group'),
    biography: formData.get('biography'),
    displayOrder: formData.get('displayOrder') || undefined,
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
      collection: 'people',
      id: personId,
      user,
      overrideAccess: false,
      data: {
        name: parsed.data.name,
        roleTitle: parsed.data.roleTitle,
        group: parsed.data.group,
        biography: parsed.data.biography,
        displayOrder: Number.isFinite(parsed.data.displayOrder)
          ? parsed.data.displayOrder
          : undefined,
        disclosureLevel: parsed.data.disclosureLevel,
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update person.' }
  }

  revalidatePath(`/dashboard/management/${personId}`)
  revalidateManagement()
  return { success: 'Person saved.' }
}

export async function updatePersonStatusAction(
  personId: string,
  _prev: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('people', personId, tenantId, user)
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
      collection: 'people',
      id: personId,
      user,
      overrideAccess: false,
      data: {
        status: parsed.data.status,
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update status.' }
  }

  revalidatePath(`/dashboard/management/${personId}`)
  revalidateManagement()
  return { success: 'Publication status updated.' }
}
