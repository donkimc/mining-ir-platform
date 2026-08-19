'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { assertPublicationTransition, guardCreateNotPublished } from '@/lib/publishing'
import { projectContentSchema, projectStatusSchema } from '@/lib/schemas/project'

export type ProjectFormState = {
  success?: string
  error?: string
  fieldErrors?: Record<string, string>
}

function parseHighlights(value?: string) {
  if (!value?.trim()) return []
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((item) => ({ item }))
}

function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    fieldErrors[issue.path.join('.')] = issue.message
  }
  return fieldErrors
}

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const parsed = projectContentSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    commodity: formData.get('commodity') || undefined,
    jurisdiction: formData.get('jurisdiction') || undefined,
    stage: formData.get('stage') || '',
    ownershipPercent: formData.get('ownershipPercent') || undefined,
    summary: formData.get('summary') || undefined,
    highlights: formData.get('highlights') || undefined,
    technicalSummary: formData.get('technicalSummary') || undefined,
    locationSummary: formData.get('locationSummary') || undefined,
    isFlagship: formData.get('isFlagship') === 'on',
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
      collection: 'projects',
      user,
      overrideAccess: false,
      data: {
        tenant: tenantId as unknown as number,
        name: parsed.data.name,
        slug: parsed.data.slug,
        commodity: parsed.data.commodity,
        jurisdiction: parsed.data.jurisdiction,
        stage: parsed.data.stage || undefined,
        ownershipPercent: Number.isFinite(parsed.data.ownershipPercent)
          ? parsed.data.ownershipPercent
          : undefined,
        summary: parsed.data.summary,
        highlights: parseHighlights(parsed.data.highlights),
        technicalSummary: parsed.data.technicalSummary,
        locationSummary: parsed.data.locationSummary,
        isFlagship: parsed.data.isFlagship || false,
        status,
      },
    })
    createdId = created.id
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create project.' }
  }

  revalidatePath('/dashboard/projects')
  revalidatePath('/projects')
  redirect(`/dashboard/projects/${createdId}`)
}

export async function updateProjectContentAction(
  projectId: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  let existing
  try {
    existing = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    return { error: 'Forbidden.' }
  }

  const existingTenant =
    existing.tenant && typeof existing.tenant === 'object'
      ? existing.tenant.id
      : existing.tenant

  if (String(existingTenant) !== String(tenantId)) {
    return { error: 'Forbidden.' }
  }

  const parsed = projectContentSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    commodity: formData.get('commodity') || undefined,
    jurisdiction: formData.get('jurisdiction') || undefined,
    stage: formData.get('stage') || '',
    ownershipPercent: formData.get('ownershipPercent') || undefined,
    summary: formData.get('summary') || undefined,
    highlights: formData.get('highlights') || undefined,
    technicalSummary: formData.get('technicalSummary') || undefined,
    locationSummary: formData.get('locationSummary') || undefined,
    isFlagship: formData.get('isFlagship') === 'on',
  })

  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  try {
    await payload.update({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        commodity: parsed.data.commodity,
        jurisdiction: parsed.data.jurisdiction,
        stage: parsed.data.stage || undefined,
        ownershipPercent: Number.isFinite(parsed.data.ownershipPercent)
          ? parsed.data.ownershipPercent
          : undefined,
        summary: parsed.data.summary,
        highlights: parseHighlights(parsed.data.highlights),
        technicalSummary: parsed.data.technicalSummary,
        locationSummary: parsed.data.locationSummary,
        isFlagship: parsed.data.isFlagship || false,
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update project.' }
  }

  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/projects')
  revalidatePath(`/projects/${parsed.data.slug}`)
  return { success: 'Project saved.' }
}

export async function updateProjectStatusAction(
  projectId: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  let existing
  try {
    existing = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    return { error: 'Forbidden.' }
  }

  const existingTenant =
    existing.tenant && typeof existing.tenant === 'object'
      ? existing.tenant.id
      : existing.tenant

  if (String(existingTenant) !== String(tenantId)) {
    return { error: 'Forbidden.' }
  }

  const parsed = projectStatusSchema.safeParse({
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
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      data: {
        status: parsed.data.status,
      },
      context: {
        sourceCheckAcknowledged: formData.get('sourceCheckAcknowledged') === 'true',
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update status.' }
  }

  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/projects')
  revalidatePath(`/projects/${existing.slug}`)
  return { success: 'Publication status updated.' }
}
