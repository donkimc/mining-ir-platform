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
import { newsContentSchema } from '@/lib/schemas/news'

export type NewsFormState = ContentFormState

function optionalString(value?: string) {
  return value?.trim() ? value.trim() : undefined
}

function optionalProjectId(value?: string): string | undefined {
  return optionalString(value)
}

function revalidateNews(slug?: string) {
  revalidatePath('/dashboard/news')
  revalidatePath('/news')
  revalidatePath('/')
  if (slug) revalidatePath(`/news/${slug}`)
}

export async function createNewsAction(
  _prev: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const parsed = newsContentSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    projectId: formData.get('projectId') || undefined,
    releaseDate: formData.get('releaseDate'),
    excerpt: formData.get('excerpt'),
    body: formData.get('body'),
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

  const projectId = optionalProjectId(parsed.data.projectId)
  let createdId: string | number
  try {
    const created = await payload.create({
      collection: 'news-releases',
      user,
      overrideAccess: false,
      data: {
        tenant: tenantId as unknown as number,
        title: parsed.data.title,
        slug: parsed.data.slug,
        project: projectId as unknown as number | undefined,
        releaseDate: parsed.data.releaseDate,
        excerpt: parsed.data.excerpt,
        body: parsed.data.body,
        sourceUrl: optionalString(parsed.data.sourceUrl),
        disclosureLevel: parsed.data.disclosureLevel,
        status,
      },
    })
    createdId = created.id
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create news release.' }
  }

  revalidateNews(parsed.data.slug)
  redirect(`/dashboard/news/${createdId}`)
}

export async function updateNewsContentAction(
  newsId: string,
  _prev: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('news-releases', newsId, tenantId, user)
  if ('error' in owned) return { error: owned.error }

  const parsed = newsContentSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    projectId: formData.get('projectId') || undefined,
    releaseDate: formData.get('releaseDate'),
    excerpt: formData.get('excerpt'),
    body: formData.get('body'),
    sourceUrl: formData.get('sourceUrl') || undefined,
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
      collection: 'news-releases',
      id: newsId,
      user,
      overrideAccess: false,
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        project: projectId as unknown as number | undefined,
        releaseDate: parsed.data.releaseDate,
        excerpt: parsed.data.excerpt,
        body: parsed.data.body,
        sourceUrl: optionalString(parsed.data.sourceUrl),
        disclosureLevel: parsed.data.disclosureLevel,
      },
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update news release.' }
  }

  revalidatePath(`/dashboard/news/${newsId}`)
  revalidateNews(parsed.data.slug)
  return { success: 'News release saved.' }
}

export async function updateNewsStatusAction(
  newsId: string,
  _prev: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  const owned = await assertOwnedRecord('news-releases', newsId, tenantId, user)
  if ('error' in owned) return { error: owned.error }
  const existing = owned.existing as { status?: string; slug?: string }

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
      collection: 'news-releases',
      id: newsId,
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

  revalidatePath(`/dashboard/news/${newsId}`)
  revalidateNews(existing.slug)
  return { success: 'Publication status updated.' }
}
