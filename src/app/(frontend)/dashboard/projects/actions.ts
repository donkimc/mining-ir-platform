'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { assertPublicationTransition, guardCreateNotPublished } from '@/lib/publishing'
import { PROJECT_STAGES } from '@/lib/constants'

const projectSchema = z.object({
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
  status: z.enum(['draft', 'review', 'published', 'archived']),
})

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

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const parsed = projectSchema.safeParse({
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
    status: formData.get('status') || 'draft',
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.')] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  try {
    guardCreateNotPublished(parsed.data.status)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid status.' }
  }

  let createdId: string | number
  try {
    const created = await payload.create({
      collection: 'projects',
      user,
      data: {
        tenant: Number(tenantId),
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
        status: parsed.data.status,
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

export async function updateProjectAction(
  projectId: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const existing = await payload.findByID({
    collection: 'projects',
    id: projectId,
    depth: 0,
    overrideAccess: true,
  })

  const existingTenant =
    existing.tenant && typeof existing.tenant === 'object'
      ? existing.tenant.id
      : existing.tenant

  if (String(existingTenant) !== String(tenantId)) {
    return { error: 'Forbidden.' }
  }

  const parsed = projectSchema.safeParse({
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
    status: formData.get('status'),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.')] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
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
        status: parsed.data.status,
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
