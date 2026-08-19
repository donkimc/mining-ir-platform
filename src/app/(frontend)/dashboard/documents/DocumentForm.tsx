'use client'

import { useActionState } from 'react'

import { DashboardField, PublicationStatusForm } from '@/components/dashboard/ContentForms'
import { MachineOriginReviewPanel } from '@/components/dashboard/MachineOriginReviewPanel'
import { FormMessage } from '@/components/ui/FormMessage'
import { StatusBadge } from '@/components/public/StatusBadge'
import { DISCLOSURE_LEVELS, DOCUMENT_CATEGORIES } from '@/lib/constants'

import {
  attachDocumentPdfAction,
  createDocumentAction,
  updateDocumentContentAction,
  updateDocumentStatusAction,
  type DocumentFormState,
} from './actions'

const initialState: DocumentFormState = {}

type ProjectOption = { id: string | number; name: string }

type DocumentValues = {
  title?: string
  slug?: string
  category?: string | null
  publicationDate?: string | null
  externalUrl?: string | null
  sourceUrl?: string | null
  project?: unknown
  disclosureLevel?: string | null
  status?: string
  contentOrigin?: string | null
  sourceLocation?: unknown
  provenanceClaims?: unknown
  extractionProvider?: string | null
  file?: unknown
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

export function DocumentForm({
  mode,
  documentId,
  initial,
  projects,
  attachedFileLabel,
  attachedFileUrl,
}: {
  mode: 'create' | 'edit'
  documentId?: string
  initial?: DocumentValues
  projects: ProjectOption[]
  attachedFileLabel?: string | null
  attachedFileUrl?: string | null
}) {
  const contentAction =
    mode === 'create'
      ? createDocumentAction
      : updateDocumentContentAction.bind(null, documentId as string)

  const [contentState, contentFormAction, contentPending] = useActionState(
    contentAction,
    initialState,
  )

  const [uploadState, uploadFormAction, uploadPending] = useActionState(
    documentId
      ? attachDocumentPdfAction.bind(null, documentId)
      : async (_prev: DocumentFormState, _formData: FormData): Promise<DocumentFormState> => ({}),
    initialState,
  )

  const projectValue = relationValue(initial?.project)
  const machineAssisted = initial?.contentOrigin === 'machine_assisted'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">
          {mode === 'create' ? 'New document' : 'Edit document'}
        </h1>
        {initial?.status ? <StatusBadge status={initial.status} /> : null}
      </div>

      {mode === 'edit' ? (
        <MachineOriginReviewPanel
          contentOrigin={initial?.contentOrigin}
          sourceLocation={initial?.sourceLocation as never}
          provenanceClaims={initial?.provenanceClaims as never}
          sourceDocumentId={relationValue(initial?.sourceDocument) || null}
          fileUrl={attachedFileUrl}
          extractionProvider={initial?.extractionProvider}
        />
      ) : null}

      {mode === 'create' ? (
        <section className="panel space-y-2" aria-labelledby="pdf-create-hint">
          <h2 id="pdf-create-hint" className="display text-2xl">
            Technical report PDF
          </h2>
          <p className="text-sm text-[var(--ink-soft)]">
            PDF upload is available on the next screen after you create this draft. Create the
            document first (title, slug, dates), then use <strong>Attach PDF</strong> on the edit
            page. External URL is optional and separate from the private file upload.
          </p>
        </section>
      ) : null}

      {mode === 'edit' && documentId ? (
        <form
          action={uploadFormAction}
          className="panel space-y-4 border-[color-mix(in_oklab,var(--accent)_35%,transparent)]"
          encType="multipart/form-data"
          id="attach-pdf"
        >
          <h2 className="display text-2xl">Technical report PDF</h2>
          <FormMessage type="success" message={uploadState.success} />
          <FormMessage type="error" message={uploadState.error} />
          {attachedFileLabel ? (
            <p className="text-sm text-[var(--ink-soft)]">
              Current file: {attachedFileLabel}
              {attachedFileUrl ? (
                <>
                  {' '}
                  —{' '}
                  <a href={attachedFileUrl} className="underline" target="_blank" rel="noopener">
                    Open while logged in
                  </a>
                </>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">No PDF attached yet.</p>
          )}
          <div>
            <label htmlFor="pdf" className="mb-1 block text-sm font-semibold">
              Upload PDF (max 10 MiB)
            </label>
            <input id="pdf" name="pdf" type="file" accept="application/pdf,.pdf" className="input" />
            {uploadState.fieldErrors?.pdf ? (
              <p className="mt-1 text-sm text-[var(--danger)]">{uploadState.fieldErrors.pdf}</p>
            ) : null}
          </div>
          <button type="submit" className="btn btn-dark" disabled={uploadPending}>
            {uploadPending ? 'Uploading…' : 'Attach PDF'}
          </button>
          <p className="text-xs text-[var(--ink-soft)]">
            Uses private Supabase Storage via Payload Media. Open the file with the logged-in
            dashboard link above (Draft/Review are blocked on the public media route until
            Published). Max 10 MiB PDF.
          </p>
        </form>
      ) : null}

      <form action={contentFormAction} className="panel space-y-5">
        <h2 className="display text-2xl">Document content</h2>
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
            <label htmlFor="category" className="mb-1 block text-sm font-semibold">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="select"
              defaultValue={initial?.category || 'presentation'}
              required
            >
              {DOCUMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            {contentState.fieldErrors?.category ? (
              <p className="mt-1 text-sm text-[var(--danger)]">
                {contentState.fieldErrors.category}
              </p>
            ) : null}
          </div>
          <DashboardField
            label="Publication date"
            name="publicationDate"
            type="date"
            defaultValue={toDateInput(initial?.publicationDate)}
            error={contentState.fieldErrors?.publicationDate}
            required
          />
          <DashboardField
            label="External URL"
            name="externalUrl"
            defaultValue={initial?.externalUrl || ''}
            error={contentState.fieldErrors?.externalUrl}
          />
          <DashboardField
            label="Source URL"
            name="sourceUrl"
            defaultValue={initial?.sourceUrl || ''}
            error={contentState.fieldErrors?.sourceUrl}
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
          </div>
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

        <button type="submit" className="btn btn-dark" disabled={contentPending}>
          {contentPending
            ? 'Saving…'
            : mode === 'create'
              ? 'Create document'
              : 'Save changes'}
        </button>
        {mode === 'edit' ? (
          <p className="text-xs text-[var(--ink-soft)]">
            Saving never changes publication status. Disclosure fields on a Published document must
            be moved back to Review before editing.
          </p>
        ) : (
          <p className="text-xs text-[var(--ink-soft)]">
            New documents are created as Draft. After you create, this page opens the draft so you
            can attach a technical-report PDF.
          </p>
        )}
      </form>

      {mode === 'edit' && documentId ? (
        <PublicationStatusForm
          status={initial?.status}
          machineAssisted={machineAssisted}
          action={updateDocumentStatusAction.bind(null, documentId)}
        />
      ) : null}
    </div>
  )
}
