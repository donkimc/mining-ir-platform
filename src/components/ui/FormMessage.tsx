export function FormMessage({
  type,
  message,
}: {
  type: 'success' | 'error' | 'info'
  message?: string | null
}) {
  if (!message) return null

  const styles =
    type === 'success'
      ? 'border-[var(--success)] text-[var(--success)]'
      : type === 'error'
        ? 'border-[var(--danger)] text-[var(--danger)]'
        : 'border-[var(--ink-soft)] text-[var(--ink-soft)]'

  return (
    <p role={type === 'error' ? 'alert' : 'status'} className={`border px-3 py-2 text-sm ${styles}`}>
      {message}
    </p>
  )
}
