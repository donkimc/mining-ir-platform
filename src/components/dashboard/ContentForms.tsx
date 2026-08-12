'use client'

import { useActionState } from 'react'

import { FormMessage } from '@/components/ui/FormMessage'
import type { ContentFormState } from '@/lib/schemas/content'

const initialState: ContentFormState = {}

export function PublicationStatusForm({
  status,
  action,
}: {
  status?: string
  action: (prev: ContentFormState, formData: FormData) => Promise<ContentFormState>
}) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="panel space-y-4">
      <h2 className="display text-2xl">Publication status</h2>
      <FormMessage type="success" message={state.success} />
      <FormMessage type="error" message={state.error} />
      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-semibold">
          Status
        </label>
        <select id="status" name="status" className="select" defaultValue={status || 'draft'}>
          <option value="draft">Draft (save without review)</option>
          <option value="review">Review (submit for review)</option>
          <option value="published">Published (approve &amp; publish)</option>
          <option value="archived">Archived</option>
        </select>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Status-only action. Draft cannot jump to Published. Approve only after Review. Do not
          change disclosure fields in the same request.
        </p>
      </div>
      <button type="submit" className="btn btn-dark" disabled={pending}>
        {pending ? 'Updating…' : 'Update status'}
      </button>
    </form>
  )
}

export function DashboardField({
  label,
  name,
  defaultValue,
  error,
  required,
  textarea,
  type = 'text',
}: {
  label: string
  name: string
  defaultValue?: string
  error?: string
  required?: boolean
  textarea?: boolean
  type?: string
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
          defaultValue={defaultValue || ''}
          required={required}
          className="textarea"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue || ''}
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
