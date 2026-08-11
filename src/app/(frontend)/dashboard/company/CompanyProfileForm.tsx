'use client'

import { useActionState } from 'react'

import { FormMessage } from '@/components/ui/FormMessage'
import { StatusBadge } from '@/components/public/StatusBadge'
import { updateCompanyAction, type CompanyFormState } from './actions'

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
  const [state, formAction, pending] = useActionState(updateCompanyAction, initialState)

  return (
    <form action={formAction} className="panel space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">Company profile</h1>
        <StatusBadge status={company.publicationStatus} />
      </div>

      <FormMessage type="success" message={state.success} />
      <FormMessage type="error" message={state.error} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Display name"
          name="displayName"
          defaultValue={company.displayName}
          error={state.fieldErrors?.displayName}
          required
        />
        <Field label="Ticker" name="tickerSymbol" defaultValue={company.tickerSymbol || ''} />
        <Field label="Exchange" name="exchange" defaultValue={company.exchange || ''} />
        <div>
          <label htmlFor="publicationStatus" className="mb-1 block text-sm font-semibold">
            Publication status
          </label>
          <select
            id="publicationStatus"
            name="publicationStatus"
            className="select"
            defaultValue={company.publicationStatus}
          >
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Draft cannot jump to Published. Submit for Review, then approve.
          </p>
        </div>
      </div>

      <Field
        label="Short description"
        name="shortDescription"
        defaultValue={company.shortDescription}
        error={state.fieldErrors?.shortDescription}
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
        <Field label="IR contact name" name="irContactName" defaultValue={company.irContactName || ''} />
        <Field
          label="IR contact email"
          name="irContactEmail"
          defaultValue={company.irContactEmail || ''}
          error={state.fieldErrors?.irContactEmail}
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

      <button type="submit" className="btn btn-dark" disabled={pending}>
        {pending ? 'Saving…' : 'Save company profile'}
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
