'use client'

import { useActionState } from 'react'

import { DashboardField, PublicationStatusForm } from '@/components/dashboard/ContentForms'
import { MachineOriginReviewPanel } from '@/components/dashboard/MachineOriginReviewPanel'
import { FormMessage } from '@/components/ui/FormMessage'
import { StatusBadge } from '@/components/public/StatusBadge'
import { DISCLOSURE_LEVELS } from '@/lib/constants'

import {
  createExplorationAction,
  updateExplorationContentAction,
  updateExplorationStatusAction,
  type ExplorationFormState,
} from './actions'

const initialState: ExplorationFormState = {}

type ProjectOption = { id: string | number; name: string }

type ExplorationValues = {
  project?: unknown
  title?: string
  contentDate?: string | null
  summary?: string | null
  technicalDetails?: string | null
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

export function ExplorationForm({
  mode,
  contentId,
  initial,
  projects,
}: {
  mode: 'create' | 'edit'
  contentId?: string
  initial?: ExplorationValues
  projects: ProjectOption[]
}) {
  const contentAction =
    mode === 'create'
      ? createExplorationAction
      : updateExplorationContentAction.bind(null, contentId as string)

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
          {mode === 'create' ? 'New exploration content' : 'Edit exploration content'}
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
        <h2 className="display text-2xl">Exploration content</h2>
        <FormMessage type="success" message={contentState.success} />
        <FormMessage type="error" message={contentState.error} />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="projectId" className="mb-1 block text-sm font-semibold">
              Project
            </label>
            <select
              id="projectId"
              name="projectId"
              className="select"
              defaultValue={projectValue}
              required
            >
              <option value="">Select project</option>
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
            label="Title"
            name="title"
            defaultValue={initial?.title || ''}
            error={contentState.fieldErrors?.title}
            required
          />
          <DashboardField
            label="Content date"
            name="contentDate"
            type="date"
            defaultValue={toDateInput(initial?.contentDate)}
            error={contentState.fieldErrors?.contentDate}
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
              defaultValue={initial?.disclosureLevel || 'technical'}
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
          label="Summary"
          name="summary"
          defaultValue={initial?.summary || ''}
          error={contentState.fieldErrors?.summary}
          textarea
          required
        />
        <DashboardField
          label="Technical details"
          name="technicalDetails"
          defaultValue={initial?.technicalDetails || ''}
          error={contentState.fieldErrors?.technicalDetails}
          textarea
          required
        />

        <button type="submit" className="btn btn-dark" disabled={contentPending}>
          {contentPending
            ? 'Saving…'
            : mode === 'create'
              ? 'Create exploration content'
              : 'Save changes'}
        </button>
        {mode === 'edit' ? (
          <p className="text-xs text-[var(--ink-soft)]">
            Saving never changes publication status. Technical details on a Published record must
            be moved back to Review before editing.
          </p>
        ) : (
          <p className="text-xs text-[var(--ink-soft)]">New records are created as Draft.</p>
        )}
      </form>

      {mode === 'edit' && contentId ? (
        <PublicationStatusForm
          status={initial?.status}
          machineAssisted={machineAssisted}
          action={updateExplorationStatusAction.bind(null, contentId)}
        />
      ) : null}
    </div>
  )
}
