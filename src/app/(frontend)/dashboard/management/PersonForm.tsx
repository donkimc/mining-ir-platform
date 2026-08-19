'use client'

import { useActionState } from 'react'

import { DashboardField, PublicationStatusForm } from '@/components/dashboard/ContentForms'
import { MachineOriginReviewPanel } from '@/components/dashboard/MachineOriginReviewPanel'
import { FormMessage } from '@/components/ui/FormMessage'
import { StatusBadge } from '@/components/public/StatusBadge'
import { DISCLOSURE_LEVELS, PERSON_GROUPS } from '@/lib/constants'

import {
  createPersonAction,
  updatePersonContentAction,
  updatePersonStatusAction,
  type PersonFormState,
} from './actions'

const initialState: PersonFormState = {}

type PersonValues = {
  name?: string
  roleTitle?: string | null
  group?: string | null
  biography?: string | null
  displayOrder?: number | null
  disclosureLevel?: string | null
  status?: string
  contentOrigin?: string | null
  sourceLocation?: unknown
  provenanceClaims?: unknown
  extractionProvider?: string | null
  sourceDocument?: unknown
}

function relationValue(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  return String(value)
}

export function PersonForm({
  mode,
  personId,
  initial,
}: {
  mode: 'create' | 'edit'
  personId?: string
  initial?: PersonValues
}) {
  const contentAction =
    mode === 'create'
      ? createPersonAction
      : updatePersonContentAction.bind(null, personId as string)

  const [contentState, contentFormAction, contentPending] = useActionState(
    contentAction,
    initialState,
  )

  const machineAssisted = initial?.contentOrigin === 'machine_assisted'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">
          {mode === 'create' ? 'New team member' : 'Edit team member'}
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
        <h2 className="display text-2xl">Profile content</h2>
        <FormMessage type="success" message={contentState.success} />
        <FormMessage type="error" message={contentState.error} />

        <div className="grid gap-4 md:grid-cols-2">
          <DashboardField
            label="Name"
            name="name"
            defaultValue={initial?.name || ''}
            error={contentState.fieldErrors?.name}
            required
          />
          <DashboardField
            label="Role title"
            name="roleTitle"
            defaultValue={initial?.roleTitle || ''}
            error={contentState.fieldErrors?.roleTitle}
            required
          />
          <div>
            <label htmlFor="group" className="mb-1 block text-sm font-semibold">
              Group
            </label>
            <select
              id="group"
              name="group"
              className="select"
              defaultValue={initial?.group || 'management'}
              required
            >
              {PERSON_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                </option>
              ))}
            </select>
            {contentState.fieldErrors?.group ? (
              <p className="mt-1 text-sm text-[var(--danger)]">{contentState.fieldErrors.group}</p>
            ) : null}
          </div>
          <DashboardField
            label="Display order"
            name="displayOrder"
            type="number"
            defaultValue={
              initial?.displayOrder != null ? String(initial.displayOrder) : ''
            }
            error={contentState.fieldErrors?.displayOrder}
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
        </div>

        <DashboardField
          label="Biography"
          name="biography"
          defaultValue={initial?.biography || ''}
          error={contentState.fieldErrors?.biography}
          textarea
          required
        />

        <button type="submit" className="btn btn-dark" disabled={contentPending}>
          {contentPending
            ? 'Saving…'
            : mode === 'create'
              ? 'Create team member'
              : 'Save changes'}
        </button>
        {mode === 'edit' ? (
          <p className="text-xs text-[var(--ink-soft)]">
            Saving never changes publication status. Biography on a Published profile must be moved
            back to Review before editing.
          </p>
        ) : (
          <p className="text-xs text-[var(--ink-soft)]">New profiles are created as Draft.</p>
        )}
      </form>

      {mode === 'edit' && personId ? (
        <PublicationStatusForm
          status={initial?.status}
          machineAssisted={machineAssisted}
          action={updatePersonStatusAction.bind(null, personId)}
        />
      ) : null}
    </div>
  )
}
