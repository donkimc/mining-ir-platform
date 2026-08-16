type FilterField =
  | { name: string; label: string; type: 'search'; placeholder?: string; defaultValue?: string }
  | {
      name: string
      label: string
      type: 'select'
      defaultValue?: string
      options: Array<{ value: string; label: string }>
    }

type PublicDiscoveryFiltersProps = {
  action: string
  fields: FilterField[]
}

/**
 * GET form for server-side published-only discovery (ADR-0011).
 * Submits query params; the page re-queries with tenant + Published filters.
 */
export function PublicDiscoveryFilters({ action, fields }: PublicDiscoveryFiltersProps) {
  return (
    <form
      method="get"
      action={action}
      className="mt-8 grid gap-4 border border-[color-mix(in_oklab,var(--ink)_14%,transparent)] p-4 sm:grid-cols-[1fr_auto] sm:items-end"
      role="search"
      aria-label="Filter published content"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <label key={field.name} className="block text-sm">
            <span className="text-[var(--ink-soft)]">{field.label}</span>
            {field.type === 'search' ? (
              <input
                type="search"
                name={field.name}
                defaultValue={field.defaultValue ?? ''}
                placeholder={field.placeholder}
                className="mt-1 w-full border border-[color-mix(in_oklab,var(--ink)_20%,transparent)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)]"
              />
            ) : (
              <select
                name={field.name}
                defaultValue={field.defaultValue ?? ''}
                className="mt-1 w-full border border-[color-mix(in_oklab,var(--ink)_20%,transparent)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)]"
              >
                {field.options.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn btn-dark">
          Apply filters
        </button>
        <a href={action} className="btn no-underline">
          Clear
        </a>
      </div>
    </form>
  )
}
