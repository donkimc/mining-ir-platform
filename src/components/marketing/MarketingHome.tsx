import Link from 'next/link'

/**
 * Platform marketing homepage for nrlaunch.com (ADR-0016).
 * Original Mining IR Platform branding — no tenant data, no Allied Critical content.
 */
export function MarketingHome() {
  return (
    <main className="marketing-shell min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="hero-plane marketing-hero">
        <header className="section-shell flex items-center justify-between py-6 text-[var(--paper)]">
          <p className="display text-2xl tracking-tight md:text-3xl">Mining IR Platform</p>
          <a href="mailto:hello@nrlaunch.example" className="btn btn-secondary no-underline">
            Request a demo
          </a>
        </header>
        <div
          id="main-content"
          tabIndex={-1}
          className="section-shell relative flex flex-1 flex-col justify-end pb-16 pt-10 md:pt-24"
        >
          <p className="fade-up text-sm uppercase tracking-[0.22em] text-[var(--mineral-soft)]">
            Junior mining investor relations
          </p>
          <h1 className="display fade-up mt-4 max-w-4xl text-5xl leading-none text-[var(--paper)] md:text-7xl">
            Self-service IR websites for exploration companies
          </h1>
          <p className="fade-up-delay mt-6 max-w-2xl text-lg text-[var(--paper-deep)] md:text-xl">
            Publish projects, news, documents and disclosure-ready pages with tenant isolation,
            human approval and private media — without rebuilding a site for every issuer.
          </p>
          <div className="fade-up-delay mt-8 flex flex-wrap gap-3">
            <a href="mailto:hello@nrlaunch.example" className="btn btn-primary no-underline">
              Request a demo
            </a>
            <a href="#product" className="btn btn-secondary no-underline">
              See the product
            </a>
          </div>
        </div>
      </div>

      <section id="product" className="bg-[var(--paper)] py-20">
        <div className="section-shell grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Product</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">A CMS shaped for mining disclosure</h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-[var(--ink-soft)]">
            <p>
              Company admins manage structured content — company profile, projects, newsroom,
              documents, management, share structure and exploration summaries — through a
              dashboard with Draft, Review and Published states.
            </p>
            <p>
              Technical claims stay behind human approval. Machine-assisted drafts carry provenance
              markers. Unpublished files stay in a private media path.
            </p>
          </div>
        </div>
        <div className="section-shell mt-14">
          <div
            className="product-preview border border-[color-mix(in_oklab,var(--ink)_12%,transparent)] bg-[var(--forest-deep)] p-4 text-[var(--paper)] md:p-8"
            aria-label="Product interface preview"
          >
            <div className="flex gap-2 text-xs uppercase tracking-[0.16em] text-[var(--mineral-soft)]">
              <span>Dashboard</span>
              <span aria-hidden>·</span>
              <span>Review</span>
              <span aria-hidden>·</span>
              <span>Published site</span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="border border-white/15 p-4">
                <p className="text-sm text-[var(--mineral-soft)]">Status</p>
                <p className="mt-2 text-xl">Review → Published</p>
              </div>
              <div className="border border-white/15 p-4">
                <p className="text-sm text-[var(--mineral-soft)]">Tenant scope</p>
                <p className="mt-2 text-xl">Server-side membership</p>
              </div>
              <div className="border border-white/15 p-4">
                <p className="text-sm text-[var(--mineral-soft)]">Media</p>
                <p className="mt-2 text-xl">Private until Published</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--paper-deep)] py-20">
        <div className="section-shell">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Templates</p>
          <h2 className="display mt-3 text-4xl">Explorer and Summit</h2>
          <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
            Two presentation templates share the same published-data contract, authorization and
            disclosure rules. Previews use clearly fictional demo companies — never unpublished
            customer content.
          </p>
          <ul className="mt-10 grid gap-10 md:grid-cols-2">
            <li>
              <h3 className="display text-3xl">Explorer</h3>
              <p className="mt-3 text-[var(--ink-soft)]">
                Exploration-first storytelling for juniors: flagship project, catalysts and
                transparent source links.
              </p>
            </li>
            <li>
              <h3 className="display text-3xl">Summit</h3>
              <p className="mt-3 text-[var(--ink-soft)]">
                A denser corporate presentation for multi-project issuers — same controls, distinct
                layout rhythm.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-[var(--paper)] py-20">
        <div className="section-shell grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Trust</p>
            <h2 className="display mt-3 text-4xl">Built for multi-tenant disclosure</h2>
          </div>
          <ul className="space-y-4 text-lg text-[var(--ink-soft)]">
            <li>Tenant isolation on every public and dashboard surface</li>
            <li>Private media with published-reference authorization</li>
            <li>Status-only human approval for technical content</li>
            <li>No investor accounts, market data feed or automatic publication</li>
          </ul>
        </div>
      </section>

      <section className="bg-[var(--forest)] py-20 text-[var(--paper)]">
        <div className="section-shell">
          <h2 className="display text-4xl md:text-5xl">Request a demo</h2>
          <p className="mt-4 max-w-xl text-lg text-[var(--paper-deep)]">
            Tell us about your company. This is a platform-owner contact path — not investor
            onboarding, billing or a public signup form.
          </p>
          <a href="mailto:hello@nrlaunch.example" className="btn btn-primary mt-8 no-underline">
            Email hello@nrlaunch.example
          </a>
        </div>
      </section>

      <footer className="border-t border-[color-mix(in_oklab,var(--ink)_12%,transparent)] py-10">
        <div className="section-shell flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--ink-soft)]">
          <p>Mining IR Platform · nrlaunch.com</p>
          <p>Fictional demo tenants only until customer-content promotion.</p>
        </div>
      </footer>
    </main>
  )
}

export function MarketingStub({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <div className="section-shell py-20">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          Mining IR Platform
        </p>
        <h1 className="display mt-3 text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">{body}</p>
        <Link href="/" className="btn btn-dark mt-8 no-underline">
          Back to home
        </Link>
      </div>
    </main>
  )
}
