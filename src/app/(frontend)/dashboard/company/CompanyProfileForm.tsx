'use client'

import { useActionState } from 'react'

import { FormMessage } from '@/components/ui/FormMessage'
import { StatusBadge } from '@/components/public/StatusBadge'
import {
  updateCompanyContentAction,
  updateCompanyStatusAction,
  type CompanyFormState,
} from './actions'

const initialState: CompanyFormState = {}

type CompanyFormProps = {
  company: {
    displayName: string
    tickerSymbol?: string | null
    exchange?: string | null
    shortDescription: string
    longDescription?: string | null
    investmentThesis?: string | null
    irContactName?: string | null
    irContactEmail?: string | null
    irContactPhone?: string | null
    publicationStatus: string
    brandColors?: {
      primary?: string | null
      secondary?: string | null
      accent?: string | null
    } | null
  }
}

export function CompanyProfileForm({ company }: CompanyFormProps) {
  const [contentState, contentAction, contentPending] = useActionState(
    updateCompanyContentAction,
    initialState,
  )
  const [statusState, statusAction, statusPending] = useActionState(
    updateCompanyStatusAction,
    initialState,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">Company profile</h1>
        <StatusBadge status={company.publicationStatus} />
      </div>

      <form action={contentAction} className="panel space-y-5">
        <h2 className="display text-2xl">Profile content</h2>
        <FormMessage type="success" message={contentState.success} />
        <FormMessage type="error" message={contentState.error} />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Display name"
            name="displayName"
            defaultValue={company.displayName}
            error={contentState.fieldErrors?.displayName}
            required
          />
          <Field label="Ticker" name="tickerSymbol" defaultValue={company.tickerSymbol || ''} />
          <Field label="Exchange" name="exchange" defaultValue={company.exchange || ''} />
        </div>

        <Field
          label="Short description"
          name="shortDescription"
          defaultValue={company.shortDescription}
          error={contentState.fieldErrors?.shortDescription}
          required
          textarea
        />
        <Field
          label="Long description"
          name="longDescription"
          defaultValue={company.longDescription || ''}
          textarea
        />
        <Field
          label="Investment thesis"
          name="investmentThesis"
          defaultValue={company.investmentThesis || ''}
          textarea
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="IR contact name"
            name="irContactName"
            defaultValue={company.irContactName || ''}
          />
          <Field
            label="IR contact email"
            name="irContactEmail"
            defaultValue={company.irContactEmail || ''}
            error={contentState.fieldErrors?.irContactEmail}
          />
          <Field
            label="IR contact phone"
            name="irContactPhone"
            defaultValue={company.irContactPhone || ''}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Brand primary"
            name="brandPrimary"
            defaultValue={company.brandColors?.primary || ''}
          />
          <Field
            label="Brand secondary"
            name="brandSecondary"
            defaultValue={company.brandColors?.secondary || ''}
          />
          <Field
            label="Brand accent"
            name="brandAccent"
            defaultValue={company.brandColors?.accent || ''}
          />
        </div>

        <button type="submit" className="btn btn-dark" disabled={contentPending}>
          {contentPending ? 'Saving…' : 'Save changes'}
        </button>
        <p className="text-xs text-[var(--ink-soft)]">
          Saving never changes publication status. Disclosure fields on a Published company must be
          moved back to Review before editing.
        </p>
      </form>

      <form action={statusAction} className="panel space-y-4">
        <h2 className="display text-2xl">Publication status</h2>
        <FormMessage type="success" message={statusState.success} />
        <FormMessage type="error" message={statusState.error} />
        <div>
          <label htmlFor="publicationStatus" className="mb-1 block text-sm font-semibold">
            Status
          </label>
          <select
            id="publicationStatus"
            name="publicationStatus"
            className="select"
            defaultValue={company.publicationStatus}
          >
            <option value="draft">Draft</option>
            <option value="review">Review (submit for review)</option>
            <option value="published">Published (approve &amp; publish)</option>
            <option value="archived">Archived</option>
          </select>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Status-only action. Draft cannot jump to Published. Approve only after Review.
          </p>
        </div>
        <button type="submit" className="btn btn-dark" disabled={statusPending}>
          {statusPending ? 'Updating…' : 'Update status'}
        </button>
      </form>
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
