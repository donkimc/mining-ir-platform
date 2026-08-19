'use client'

import { useActionState } from 'react'

import { DashboardField, PublicationStatusForm } from '@/components/dashboard/ContentForms'
import { MachineOriginReviewPanel } from '@/components/dashboard/MachineOriginReviewPanel'
import { FormMessage } from '@/components/ui/FormMessage'
import { StatusBadge } from '@/components/public/StatusBadge'
import { DISCLOSURE_LEVELS } from '@/lib/constants'

import {
  createNewsAction,
  updateNewsContentAction,
  updateNewsStatusAction,
  type NewsFormState,
} from './actions'

const initialState: NewsFormState = {}

type ProjectOption = { id: string | number; name: string }

type NewsValues = {
  title?: string
  slug?: string
  project?: unknown
  releaseDate?: string | null
  excerpt?: string | null
  body?: string | null
  sourceUrl?: string | null
  disclosureLevel?: string | null
  status?: string
  contentOrigin?: string | null
  sourceLocation?: unknown
  provenanceClaims?: unknown
  extractionProvider?: string | null
  sourceDocument?: unknown
}

function toDateInput(value?: string | null) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function relationValue(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  return String(value)
}

export function NewsForm({
  mode,
  newsId,
  initial,
  projects,
}: {
  mode: 'create' | 'edit'
  newsId?: string
  initial?: NewsValues
  projects: ProjectOption[]
}) {
  const contentAction =
    mode === 'create' ? createNewsAction : updateNewsContentAction.bind(null, newsId as string)

  const [contentState, contentFormAction, contentPending] = useActionState(
    contentAction,
    initialState,
  )

  const projectValue = relationValue(initial?.project)
  const machineAssisted = initial?.contentOrigin === 'machine_assisted'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">
          {mode === 'create' ? 'New news release' : 'Edit news release'}
        </h1>
        {initial?.status ? <StatusBadge status={initial.status} /> : null}
      </div>

      {mode === 'edit' ? (
        <MachineOriginReviewPanel
          contentOrigin={initial?.contentOrigin}
          sourceLocation={initial?.sourceLocation as never}
          provenanceClaims={initial?.provenanceClaims as never}
          sourceDocumentId={relationValue(initial?.sourceDocument) || null}
          extractionProvider={initial?.extractionProvider}
        />
      ) : null}

      <form action={contentFormAction} className="panel space-y-5">
        <h2 className="display text-2xl">News content</h2>
        <FormMessage type="success" message={contentState.success} />
        <FormMessage type="error" message={contentState.error} />

        <div className="grid gap-4 md:grid-cols-2">
          <DashboardField
            label="Title"
            name="title"
            defaultValue={initial?.title || ''}
            error={contentState.fieldErrors?.title}
            required
          />
          <DashboardField
            label="Slug"
            name="slug"
            defaultValue={initial?.slug || ''}
            error={contentState.fieldErrors?.slug}
            required
          />
          <div>
            <label htmlFor="projectId" className="mb-1 block text-sm font-semibold">
              Related project
            </label>
            <select
              id="projectId"
              name="projectId"
              className="select"
              defaultValue={projectValue}
            >
              <option value="">None</option>
              {projects.map((project) => (
                <option key={project.id} value={String(project.id)}>
                  {project.name}
                </option>
              ))}
            </select>
            {contentState.fieldErrors?.projectId ? (
              <p className="mt-1 text-sm text-[var(--danger)]">
                {contentState.fieldErrors.projectId}
              </p>
            ) : null}
          </div>
          <DashboardField
            label="Release date"
            name="releaseDate"
            type="date"
            defaultValue={toDateInput(initial?.releaseDate)}
            error={contentState.fieldErrors?.releaseDate}
            required
          />
          <div>
            <label htmlFor="disclosureLevel" className="mb-1 block text-sm font-semibold">
              Disclosure level
            </label>
            <select
              id="disclosureLevel"
              name="disclosureLevel"
              className="select"
              defaultValue={initial?.disclosureLevel || 'standard'}
              required
            >
              {DISCLOSURE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            {contentState.fieldErrors?.disclosureLevel ? (
              <p className="mt-1 text-sm text-[var(--danger)]">
                {contentState.fieldErrors.disclosureLevel}
              </p>
            ) : null}
          </div>
          <DashboardField
            label="Source URL"
            name="sourceUrl"
            defaultValue={initial?.sourceUrl || ''}
            error={contentState.fieldErrors?.sourceUrl}
          />
        </div>

        <DashboardField
          label="Excerpt"
          name="excerpt"
          defaultValue={initial?.excerpt || ''}
          error={contentState.fieldErrors?.excerpt}
          textarea
          required
        />
        <DashboardField
          label="Body"
          name="body"
          defaultValue={initial?.body || ''}
          error={contentState.fieldErrors?.body}
          textarea
          required
        />

        <button type="submit" className="btn btn-dark" disabled={contentPending}>
          {contentPending
            ? 'Saving…'
            : mode === 'create'
              ? 'Create news release'
              : 'Save changes'}
        </button>
        {mode === 'edit' ? (
          <p className="text-xs text-[var(--ink-soft)]">
            Saving never changes publication status. Disclosure fields on a Published release must
            be moved back to Review before editing.
          </p>
        ) : (
          <p className="text-xs text-[var(--ink-soft)]">New releases are created as Draft.</p>
        )}
      </form>

      {mode === 'edit' && newsId ? (
        <PublicationStatusForm
          status={initial?.status}
          machineAssisted={machineAssisted}
          action={updateNewsStatusAction.bind(null, newsId)}
        />
      ) : null}
    </div>
  )
}
