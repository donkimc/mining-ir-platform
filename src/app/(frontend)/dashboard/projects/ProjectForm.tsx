'use client'

import { useActionState } from 'react'

import { FormMessage } from '@/components/ui/FormMessage'
import { PROJECT_STAGES } from '@/lib/constants'
import { createProjectAction, updateProjectAction, type ProjectFormState } from './actions'

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
  const action =
    mode === 'create'
      ? createProjectAction
      : updateProjectAction.bind(null, projectId as string)

  const [state, formAction, pending] = useActionState(action, initialState)
  const highlightsText =
    initial?.highlights?.map((item) => item?.item).filter(Boolean).join('\n') || ''

  return (
    <form action={formAction} className="panel space-y-5">
      <h1 className="display text-4xl">{mode === 'create' ? 'New project' : 'Edit project'}</h1>
      <FormMessage type="success" message={state.success} />
      <FormMessage type="error" message={state.error} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" name="name" defaultValue={initial?.name || ''} error={state.fieldErrors?.name} required />
        <Field label="Slug" name="slug" defaultValue={initial?.slug || ''} error={state.fieldErrors?.slug} required />
        <Field label="Commodity" name="commodity" defaultValue={initial?.commodity || ''} />
        <Field label="Jurisdiction" name="jurisdiction" defaultValue={initial?.jurisdiction || ''} />
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
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-semibold">
            Status
          </label>
          <select id="status" name="status" className="select" defaultValue={initial?.status || 'draft'}>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
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

      <button type="submit" className="btn btn-dark" disabled={pending}>
        {pending ? 'Saving…' : mode === 'create' ? 'Create project' : 'Save project'}
      </button>
    </form>
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
        />
      ) : (
        <input
          id={name}
          name={name}
          defaultValue={defaultValue}
          required={required}
          className="input"
        />
      )}
      {error ? <p className="mt-1 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  )
}
