'use client'

import { useActionState } from 'react'

import { MachineOriginReviewPanel } from '@/components/dashboard/MachineOriginReviewPanel'
import { FormMessage } from '@/components/ui/FormMessage'
import { StatusBadge } from '@/components/public/StatusBadge'
import { PROJECT_STAGES } from '@/lib/constants'
import {
  createProjectAction,
  updateProjectContentAction,
  updateProjectStatusAction,
  type ProjectFormState,
} from './actions'

const initialState: ProjectFormState = {}

type ProjectValues = {
  name?: string
  slug?: string
  commodity?: string | null
  jurisdiction?: string | null
  stage?: string | null
  ownershipPercent?: number | null
  summary?: string | null
  highlights?: Array<{ item: string } | null> | null
  technicalSummary?: string | null
  locationSummary?: string | null
  isFlagship?: boolean | null
  status?: string
  contentOrigin?: string | null
  sourceLocation?: unknown
  provenanceClaims?: unknown
  extractionProvider?: string | null
}

function ProjectStatusForm({
  projectId,
  status,
  machineAssisted = false,
}: {
  projectId: string
  status?: string
  machineAssisted?: boolean
}) {
  const [statusState, statusFormAction, statusPending] = useActionState(
    updateProjectStatusAction.bind(null, projectId),
    initialState,
  )

  return (
    <form action={statusFormAction} className="panel space-y-4">
      <h2 className="display text-2xl">Publication status</h2>
      <FormMessage type="success" message={statusState.success} />
      <FormMessage type="error" message={statusState.error} />
      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-semibold">
          Status
        </label>
        <select id="status" name="status" className="select" defaultValue={status || 'draft'}>
          <option value="draft">Draft</option>
          <option value="review">Review (submit for review)</option>
          <option value="published">Published (approve &amp; publish)</option>
          <option value="archived">Archived</option>
        </select>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Status-only action. Draft cannot jump to Published. Approve only after Review.
        </p>
      </div>
      {machineAssisted ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="sourceCheckAcknowledged"
            value="true"
            className="mt-1"
            required={status === 'review'}
          />
          <span>
            I verified the machine-assisted proposals against the source document and page/location
            before approving to Published.
          </span>
        </label>
      ) : null}
      <button type="submit" className="btn btn-dark" disabled={statusPending}>
        {statusPending ? 'Updating…' : 'Update status'}
      </button>
    </form>
  )
}

export function ProjectForm({
  mode,
  projectId,
  initial,
}: {
  mode: 'create' | 'edit'
  projectId?: string
  initial?: ProjectValues
}) {
  const contentAction =
    mode === 'create'
      ? createProjectAction
      : updateProjectContentAction.bind(null, projectId as string)

  const [contentState, contentFormAction, contentPending] = useActionState(
    contentAction,
    initialState,
  )

  const highlightsText =
    initial?.highlights?.map((item) => item?.item).filter(Boolean).join('\n') || ''
  const machineAssisted = initial?.contentOrigin === 'machine_assisted'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">{mode === 'create' ? 'New project' : 'Edit project'}</h1>
        {initial?.status ? <StatusBadge status={initial.status} /> : null}
      </div>

      {mode === 'edit' ? (
        <MachineOriginReviewPanel
          contentOrigin={initial?.contentOrigin}
          sourceLocation={initial?.sourceLocation as never}
          provenanceClaims={initial?.provenanceClaims as never}
          extractionProvider={initial?.extractionProvider}
        />
      ) : null}

      <form action={contentFormAction} className="panel space-y-5">
        <h2 className="display text-2xl">Project content</h2>
        <FormMessage type="success" message={contentState.success} />
        <FormMessage type="error" message={contentState.error} />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Name"
            name="name"
            defaultValue={initial?.name || ''}
            error={contentState.fieldErrors?.name}
            required
          />
          <Field
            label="Slug"
            name="slug"
            defaultValue={initial?.slug || ''}
            error={contentState.fieldErrors?.slug}
            required
          />
          <Field label="Commodity" name="commodity" defaultValue={initial?.commodity || ''} />
          <Field
            label="Jurisdiction"
            name="jurisdiction"
            defaultValue={initial?.jurisdiction || ''}
          />
          <div>
            <label htmlFor="stage" className="mb-1 block text-sm font-semibold">
              Stage
            </label>
            <select id="stage" name="stage" className="select" defaultValue={initial?.stage || ''}>
              <option value="">Select stage</option>
              {PROJECT_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Ownership %"
            name="ownershipPercent"
            defaultValue={
              initial?.ownershipPercent != null ? String(initial.ownershipPercent) : ''
            }
          />
          <label className="flex items-center gap-2 self-end text-sm font-semibold">
            <input type="checkbox" name="isFlagship" defaultChecked={Boolean(initial?.isFlagship)} />
            Flagship project
          </label>
        </div>

        <Field label="Summary" name="summary" defaultValue={initial?.summary || ''} textarea />
        <Field
          label="Highlights (one per line)"
          name="highlights"
          defaultValue={highlightsText}
          textarea
        />
        <Field
          label="Technical summary"
          name="technicalSummary"
          defaultValue={initial?.technicalSummary || ''}
          textarea
        />
        <Field
          label="Location summary"
          name="locationSummary"
          defaultValue={initial?.locationSummary || ''}
          textarea
        />

        <button type="submit" className="btn btn-dark" disabled={contentPending}>
          {contentPending
            ? 'Saving…'
            : mode === 'create'
              ? 'Create project'
              : 'Save changes'}
        </button>
        {mode === 'edit' ? (
          <p className="text-xs text-[var(--ink-soft)]">
            Saving never changes publication status. Disclosure fields on a Published project must
            be moved back to Review before editing.
          </p>
        ) : (
          <p className="text-xs text-[var(--ink-soft)]">New projects are created as Draft.</p>
        )}
      </form>

      {mode === 'edit' && projectId ? (
        <ProjectStatusForm
          projectId={projectId}
          status={initial?.status}
          machineAssisted={machineAssisted}
        />
      ) : null}
    </div>
  )
}

function Field({
  label,
  name,
  defaultValue,
  error,
  required,
  textarea,
}: {
  label: string
  name: string
  defaultValue: string
  error?: string
  required?: boolean
  textarea?: boolean
}) {
  const errorId = `${name}-error`
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          required={required}
          className="textarea"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      ) : (
        <input
          id={name}
          name={name}
          defaultValue={defaultValue}
          required={required}
          className="input"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      )}
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
