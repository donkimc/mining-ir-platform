import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

async function clearCollection(
  payload: Awaited<ReturnType<typeof import('payload').getPayload>>,
  collection:
    | 'tenant-memberships'
    | 'projects'
    | 'investment-highlights'
    | 'catalysts'
    | 'share-structures'
    | 'companies'
    | 'users'
    | 'media',
) {
  const existing = await payload.find({
    collection,
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  for (const doc of existing.docs) {
    await payload.delete({
      collection,
      id: doc.id,
      overrideAccess: true,
    })
  }
}

async function seed() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')
  const payload = await getPayload({ config })
  const reset = process.env.SEED_RESET === 'true'

  if (reset) {
    console.log('Resetting seed collections...')
    await clearCollection(payload, 'tenant-memberships')
    await clearCollection(payload, 'projects')
    await clearCollection(payload, 'investment-highlights')
    await clearCollection(payload, 'catalysts')
    await clearCollection(payload, 'share-structures')
    await clearCollection(payload, 'companies')
    await clearCollection(payload, 'users')
  }

  const platformEmail = process.env.SEED_PLATFORM_EMAIL || 'platform@mining-ir.local'
  const platformPassword = process.env.SEED_PLATFORM_PASSWORD || 'ChangeMeLocal1!'
  const companyEmail = process.env.SEED_COMPANY_ADMIN_EMAIL || 'admin@auroragold.local'
  const companyPassword = process.env.SEED_COMPANY_ADMIN_PASSWORD || 'ChangeMeLocal1!'

  const existingPlatform = await payload.find({
    collection: 'users',
    where: { email: { equals: platformEmail } },
    limit: 1,
    overrideAccess: true,
  })

  const platformAdmin =
    existingPlatform.docs[0] ??
    (await payload.create({
      collection: 'users',
      data: {
        email: platformEmail,
        password: platformPassword,
        name: 'Platform Admin',
        platformRole: 'platform_admin',
        status: 'active',
      },
      overrideAccess: true,
    }))

  const existingCompanyAdmin = await payload.find({
    collection: 'users',
    where: { email: { equals: companyEmail } },
    limit: 1,
    overrideAccess: true,
  })

  const companyAdmin =
    existingCompanyAdmin.docs[0] ??
    (await payload.create({
      collection: 'users',
      data: {
        email: companyEmail,
        password: companyPassword,
        name: 'Aurora Gold Admin',
        status: 'active',
      },
      overrideAccess: true,
    }))

  const existingAurora = await payload.find({
    collection: 'companies',
    where: { slug: { equals: 'aurora-gold' } },
    limit: 1,
    overrideAccess: true,
  })

  const aurora =
    existingAurora.docs[0] ??
    (await payload.create({
      collection: 'companies',
      data: {
        legalName: 'Aurora Gold Exploration Ltd.',
        displayName: 'Aurora Gold',
        slug: 'aurora-gold',
        status: 'active',
        publicationStatus: 'draft',
        templateKey: 'explorer',
        primaryCommodity: 'Gold',
        jurisdiction: 'British Columbia, Canada',
        tickerSymbol: 'AGX',
        exchange: 'TSX-V',
        websiteDomain: 'aurora-gold.example',
        subdomain: 'aurora-gold',
        brandColors: {
          primary: '#1F3A2E',
          secondary: '#0F1C16',
          accent: '#C4A35A',
        },
        shortDescription:
          'Aurora Gold advances high-grade gold exploration across the Cariboo district.',
        longDescription:
          'Aurora Gold is a junior exploration company focused on discovering and advancing gold assets in established Canadian mining jurisdictions. The company prioritizes disciplined drilling, transparent disclosure and investor-ready project storytelling.',
        investmentThesis:
          'Aurora combines a flagship Cariboo discovery corridor with district-scale upside, lean capital structure and a clear path of catalysts through systematic drilling and resource definition.',
        irContactName: 'Jordan Hale',
        irContactEmail: 'ir@auroragold.example',
        irContactPhone: '+1 604 555 0142',
        officeAddress: '900 — 543 Granville Street, Vancouver, BC',
        socialLinks: [
          { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
          { label: 'X', url: 'https://x.com/' },
        ],
      },
      overrideAccess: true,
    }))

  if (aurora.publicationStatus !== 'published') {
    await payload.update({
      collection: 'companies',
      id: aurora.id,
      data: { publicationStatus: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })

    await payload.update({
      collection: 'companies',
      id: aurora.id,
      data: { publicationStatus: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })
  }

  const existingNorthern = await payload.find({
    collection: 'companies',
    where: { slug: { equals: 'northern-copper' } },
    limit: 1,
    overrideAccess: true,
  })

  if (!existingNorthern.docs[0]) {
    const northern = await payload.create({
      collection: 'companies',
      data: {
        legalName: 'Northern Copper Corp.',
        displayName: 'Northern Copper',
        slug: 'northern-copper',
        status: 'active',
        publicationStatus: 'draft',
        templateKey: 'explorer',
        primaryCommodity: 'Copper',
        jurisdiction: 'Yukon, Canada',
        tickerSymbol: 'NCU',
        exchange: 'TSX-V',
        shortDescription:
          'Isolation fixture tenant used only in tests and local multi-tenant checks.',
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'companies',
      id: northern.id,
      data: { publicationStatus: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })
    await payload.update({
      collection: 'companies',
      id: northern.id,
      data: { publicationStatus: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })
  }

  const memberships = await payload.find({
    collection: 'tenant-memberships',
    where: {
      and: [{ user: { equals: companyAdmin.id } }, { tenant: { equals: aurora.id } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (!memberships.docs[0]) {
    await payload.create({
      collection: 'tenant-memberships',
      data: {
        user: companyAdmin.id,
        tenant: aurora.id,
        role: 'company_admin',
        status: 'active',
        invitedAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  }

  const existingProjects = await payload.find({
    collection: 'projects',
    where: { tenant: { equals: aurora.id } },
    limit: 10,
    overrideAccess: true,
  })

  if (existingProjects.totalDocs === 0) {
    const flagshipDraft = await payload.create({
      collection: 'projects',
      data: {
        tenant: aurora.id,
        name: 'North Ridge',
        slug: 'north-ridge',
        status: 'draft',
        isFlagship: true,
        commodity: 'Gold',
        jurisdiction: 'Cariboo, British Columbia',
        locationSummary: 'Road-accessible claims along the North Ridge structural corridor.',
        latitude: 53.12,
        longitude: -121.58,
        ownershipPercent: 100,
        stage: 'advanced_exploration',
        summary:
          'North Ridge is Aurora Gold’s flagship gold project, featuring multiple drill-ready targets along a kilometer-scale structural trend.',
        highlights: [
          { item: 'Multi-kilometer gold-in-soil anomaly open along strike' },
          { item: 'Prior intercepts include high-grade near-surface intervals' },
          { item: 'Year-round road access supporting efficient drill campaigns' },
        ],
        technicalSummary:
          'Exploration to date supports a structurally controlled orogenic gold model. Material results are summarized for investors and should be read with the linked technical sources.',
        sourceLinks: [
          {
            label: 'Technical Report (placeholder)',
            url: 'https://example.com/aurora-gold-north-ridge-technical-report',
          },
        ],
        displayOrder: 1,
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'projects',
      id: flagshipDraft.id,
      data: { status: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })
    await payload.update({
      collection: 'projects',
      id: flagshipDraft.id,
      data: { status: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })

    const secondaryDraft = await payload.create({
      collection: 'projects',
      data: {
        tenant: aurora.id,
        name: 'Cedar Creek',
        slug: 'cedar-creek',
        status: 'draft',
        isFlagship: false,
        commodity: 'Gold',
        jurisdiction: 'Cariboo, British Columbia',
        locationSummary: 'Early-stage claim package south of the North Ridge corridor.',
        ownershipPercent: 100,
        stage: 'early_exploration',
        summary: 'Cedar Creek provides district-scale optionality adjacent to the flagship trend.',
        highlights: [{ item: 'Historical trenches with anomalous gold values' }],
        technicalSummary: 'Early-stage target generation; no resource estimate.',
        sourceLinks: [
          {
            label: 'Assessment Report (placeholder)',
            url: 'https://example.com/aurora-gold-cedar-creek',
          },
        ],
        displayOrder: 2,
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'projects',
      id: secondaryDraft.id,
      data: { status: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })
    await payload.update({
      collection: 'projects',
      id: secondaryDraft.id,
      data: { status: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })

    await payload.create({
      collection: 'projects',
      data: {
        tenant: aurora.id,
        name: 'Hidden Lake (Draft)',
        slug: 'hidden-lake',
        status: 'draft',
        isFlagship: false,
        commodity: 'Gold',
        jurisdiction: 'British Columbia',
        summary: 'Internal draft only — must never appear on public pages.',
        displayOrder: 99,
      },
      overrideAccess: true,
    })
  }

  const highlights = await payload.find({
    collection: 'investment-highlights',
    where: { tenant: { equals: aurora.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (highlights.totalDocs === 0) {
    const items = [
      {
        title: 'Flagship discovery corridor',
        summary: 'North Ridge anchors a focused drill strategy in an established gold belt.',
        displayOrder: 1,
      },
      {
        title: 'Lean capital structure',
        summary: 'Simple share structure designed for exploration-stage investors.',
        displayOrder: 2,
      },
      {
        title: 'Near-term catalysts',
        summary: 'Upcoming drill results and technical updates paced through the field season.',
        displayOrder: 3,
      },
    ]

    for (const item of items) {
      await payload.create({
        collection: 'investment-highlights',
        data: {
          tenant: aurora.id,
          ...item,
          status: 'published',
        },
        overrideAccess: true,
      })
    }
  }

  const catalysts = await payload.find({
    collection: 'catalysts',
    where: { tenant: { equals: aurora.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (catalysts.totalDocs === 0) {
    await payload.create({
      collection: 'catalysts',
      data: {
        tenant: aurora.id,
        title: 'Phase 2 drill program results',
        expectedTiming: 'Q4 2026',
        summary: 'Assays from expansion drilling at North Ridge.',
        status: 'published',
        displayOrder: 1,
      },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'catalysts',
      data: {
        tenant: aurora.id,
        title: 'Updated technical presentation',
        expectedTiming: 'Q1 2027',
        summary: 'Investor presentation refresh after field season.',
        status: 'published',
        displayOrder: 2,
      },
      overrideAccess: true,
    })
  }

  const shares = await payload.find({
    collection: 'share-structures',
    where: { tenant: { equals: aurora.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (shares.totalDocs === 0) {
    const shareDraft = await payload.create({
      collection: 'share-structures',
      data: {
        tenant: aurora.id,
        asOfDate: '2026-06-30',
        sharesOutstanding: 128_400_000,
        options: 8_200_000,
        warrants: 12_000_000,
        fullyDiluted: 148_600_000,
        marketCapNote: 'Market capitalization varies with share price; figure omitted for Sprint 1.',
        status: 'draft',
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'share-structures',
      id: shareDraft.id,
      data: { status: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })
    await payload.update({
      collection: 'share-structures',
      id: shareDraft.id,
      data: { status: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })
  }

  console.log('Seed complete.')
  console.log(`Platform Admin: ${platformEmail} / ${platformPassword}`)
  console.log(`Company Admin:  ${companyEmail} / ${companyPassword}`)
  console.log('Public tenant slug: aurora-gold')
  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
