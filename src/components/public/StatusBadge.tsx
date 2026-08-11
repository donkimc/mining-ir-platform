const labels: Record<string, string> = {
  draft: 'Draft',
  review: 'In review',
  published: 'Published',
  archived: 'Archived',
  active: 'Active',
  suspended: 'Suspended',
  provisioning: 'Provisioning',
  platform_admin: 'Platform Admin',
}

export function StatusBadge({ status }: { status: string }) {
  const label = labels[status] ?? status
  return (
    <span
      className="inline-flex items-center gap-2 border border-current px-2 py-1 text-xs font-semibold uppercase tracking-wide"
      data-status={status}
    >
      <span aria-hidden="true">●</span>
      <span>{label}</span>
    </span>
  )
}
