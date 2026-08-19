'use client'

import { useActionState } from 'react'

import { DashboardField, PublicationStatusForm } from '@/components/dashboard/ContentForms'
import { MachineOriginReviewPanel } from '@/components/dashboard/MachineOriginReviewPanel'
import { FormMessage } from '@/components/ui/FormMessage'
import { StatusBadge } from '@/components/public/StatusBadge'

import {
  createShareStructureAction,
  updateShareStructureContentAction,
  updateShareStructureStatusAction,
  type ShareStructureFormState,
} from './actions'

const initialState: ShareStructureFormState = {}

type ShareStructureValues = {
  asOfDate?: string | null
  sharesOutstanding?: number | null
  options?: number | null
  warrants?: number | null
  fullyDiluted?: number | null
  marketCapNote?: string | null
  sourceUrl?: string | null
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

function numberValue(value?: number | null) {
  return value != null ? String(value) : ''
}

function relationValue(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  return String(value)
}

export function ShareStructureForm({
  mode,
  recordId,
  initial,
}: {
  mode: 'create' | 'edit'
  recordId?: string
  initial?: ShareStructureValues
}) {
  const contentAction =
    mode === 'create'
      ? createShareStructureAction
      : updateShareStructureContentAction.bind(null, recordId as string)

  const [contentState, contentFormAction, contentPending] = useActionState(
    contentAction,
    initialState,
  )

  const machineAssisted = initial?.contentOrigin === 'machine_assisted'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">
          {mode === 'create' ? 'New share structure' : 'Edit share structure'}
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
        <h2 className="display text-2xl">Share structure content</h2>
        <FormMessage type="success" message={contentState.success} />
        <FormMessage type="error" message={contentState.error} />

        <div className="grid gap-4 md:grid-cols-2">
          <DashboardField
            label="As-of date"
            name="asOfDate"
            type="date"
            defaultValue={toDateInput(initial?.asOfDate)}
            error={contentState.fieldErrors?.asOfDate}
            required
          />
          <DashboardField
            label="Shares outstanding"
            name="sharesOutstanding"
            type="number"
            defaultValue={numberValue(initial?.sharesOutstanding)}
            error={contentState.fieldErrors?.sharesOutstanding}
          />
          <DashboardField
            label="Options"
            name="options"
            type="number"
            defaultValue={numberValue(initial?.options)}
            error={contentState.fieldErrors?.options}
          />
          <DashboardField
            label="Warrants"
            name="warrants"
            type="number"
            defaultValue={numberValue(initial?.warrants)}
            error={contentState.fieldErrors?.warrants}
          />
          <DashboardField
            label="Fully diluted"
            name="fullyDiluted"
            type="number"
            defaultValue={numberValue(initial?.fullyDiluted)}
            error={contentState.fieldErrors?.fullyDiluted}
          />
          <DashboardField
            label="Source URL"
            name="sourceUrl"
            defaultValue={initial?.sourceUrl || ''}
            error={contentState.fieldErrors?.sourceUrl}
          />
        </div>

        <DashboardField
          label="Market cap note"
          name="marketCapNote"
          defaultValue={initial?.marketCapNote || ''}
          error={contentState.fieldErrors?.marketCapNote}
          textarea
        />

        <button type="submit" className="btn btn-dark" disabled={contentPending}>
          {contentPending
            ? 'Saving…'
            : mode === 'create'
              ? 'Create share structure'
              : 'Save changes'}
        </button>
        {mode === 'edit' ? (
          <p className="text-xs text-[var(--ink-soft)]">
            Saving never changes publication status. Share counts on a Published record must be
            moved back to Review before editing.
          </p>
        ) : (
          <p className="text-xs text-[var(--ink-soft)]">New records are created as Draft.</p>
        )}
      </form>

      {mode === 'edit' && recordId ? (
        <PublicationStatusForm
          status={initial?.status}
          machineAssisted={machineAssisted}
          action={updateShareStructureStatusAction.bind(null, recordId)}
        />
      ) : null}
    </div>
  )
}
