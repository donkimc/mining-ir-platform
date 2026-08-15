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
    | 'news-releases'
    | 'documents'
    | 'people'
    | 'exploration-contents'
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

async function publishViaReview(
  payload: Awaited<ReturnType<typeof import('payload').getPayload>>,
  collection:
    | 'projects'
    | 'share-structures'
    | 'news-releases'
    | 'documents'
    | 'people'
    | 'exploration-contents',
  id: string | number,
  reviewer: { id: string | number },
) {
  await payload.update({
    collection,
    id,
    data: { status: 'review' },
    overrideAccess: true,
    user: reviewer,
  })
  await payload.update({
    collection,
    id,
    data: { status: 'published' },
    overrideAccess: true,
    user: reviewer,
  })
}

async function seed() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')
  const payload = await getPayload({ config })
  const reset = process.env.SEED_RESET === 'true'

  if (reset) {
    console.log('Resetting seed collections...')
    await clearCollection(payload, 'tenant-memberships')
    await clearCollection(payload, 'exploration-contents')
    await clearCollection(payload, 'news-releases')
    await clearCollection(payload, 'documents')
    await clearCollection(payload, 'people')
    await clearCollection(payload, 'projects')
    await clearCollection(payload, 'investment-highlights')
    await clearCollection(payload, 'catalysts')
    await clearCollection(payload, 'share-structures')
    await clearCollection(payload, 'media')
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

  let northern = existingNorthern.docs[0]
  if (!northern) {
    northern = await payload.create({
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
        marketCapNote:
          'Fictional demo figures only. Market capitalization varies with share price.',
        sourceUrl: 'https://example.com/aurora-gold-share-structure-2026-06-30',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'share-structures', shareDraft.id, platformAdmin)

    await payload.create({
      collection: 'share-structures',
      data: {
        tenant: aurora.id,
        asOfDate: '2026-03-31',
        sharesOutstanding: 120_000_000,
        options: 7_000_000,
        warrants: 10_000_000,
        fullyDiluted: 137_000_000,
        marketCapNote: 'Draft historical share structure — must stay private.',
        sourceUrl: 'https://example.com/aurora-gold-share-structure-draft',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  const northRidge = await payload.find({
    collection: 'projects',
    where: {
      and: [{ tenant: { equals: aurora.id } }, { slug: { equals: 'north-ridge' } }],
    },
    limit: 1,
    overrideAccess: true,
  })
  const northRidgeId = northRidge.docs[0]?.id

  const docs = await payload.find({
    collection: 'documents',
    where: { tenant: { equals: aurora.id } },
    limit: 1,
    overrideAccess: true,
  })

  let publishedDocId: string | number | undefined
  if (docs.totalDocs === 0) {
    const presentation = await payload.create({
      collection: 'documents',
      data: {
        tenant: aurora.id,
        title: 'Aurora Gold Corporate Presentation',
        slug: 'corporate-presentation',
        category: 'presentation',
        publicationDate: '2026-07-15',
        externalUrl: 'https://example.com/aurora-gold-corporate-presentation.pdf',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'documents', presentation.id, platformAdmin)
    publishedDocId = presentation.id

    await payload.create({
      collection: 'documents',
      data: {
        tenant: aurora.id,
        title: 'Internal Draft Technical Memo',
        slug: 'draft-technical-memo',
        category: 'technical_report',
        publicationDate: '2026-08-01',
        externalUrl: 'https://example.com/aurora-gold-draft-memo.pdf',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
  } else {
    publishedDocId = docs.docs[0]?.id
  }

  // M5: ensure at least one Document is backed by a real uploaded media file.
  const fileBacked = await payload.find({
    collection: 'documents',
    where: {
      and: [{ tenant: { equals: aurora.id } }, { file: { exists: true } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (fileBacked.totalDocs === 0) {
    const publishedBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\nFictional Aurora Gold corporate presentation fixture.\n',
    )
    const publishedMedia = await payload.create({
      collection: 'media',
      data: {
        alt: 'Aurora Gold corporate presentation PDF',
        tenant: aurora.id,
        originalFilename: 'aurora-gold-corporate-presentation.pdf',
      },
      file: {
        data: publishedBuffer,
        mimetype: 'application/pdf',
        name: 'aurora-gold-corporate-presentation.pdf',
        size: publishedBuffer.length,
      },
      overrideAccess: true,
      user: platformAdmin,
    })

    const uploadPresentation = await payload.create({
      collection: 'documents',
      data: {
        tenant: aurora.id,
        title: 'Aurora Gold Uploaded Corporate Presentation',
        slug: 'corporate-presentation-upload',
        category: 'presentation',
        publicationDate: '2026-07-16',
        file: publishedMedia.id,
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'documents', uploadPresentation.id, platformAdmin)
    publishedDocId = uploadPresentation.id

    const draftBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\nDraft-only technical memo — must stay unpublished.\n',
    )
    const draftMedia = await payload.create({
      collection: 'media',
      data: {
        alt: 'Aurora Gold draft technical memo PDF',
        tenant: aurora.id,
        originalFilename: 'aurora-gold-draft-memo.pdf',
      },
      file: {
        data: draftBuffer,
        mimetype: 'application/pdf',
        name: 'aurora-gold-draft-memo.pdf',
        size: draftBuffer.length,
      },
      overrideAccess: true,
      user: platformAdmin,
    })

    await payload.create({
      collection: 'documents',
      data: {
        tenant: aurora.id,
        title: 'Uploaded Draft Technical Memo',
        slug: 'draft-technical-memo-upload',
        category: 'technical_report',
        publicationDate: '2026-08-01',
        file: draftMedia.id,
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  void publishedDocId

  const news = await payload.find({
    collection: 'news-releases',
    where: { tenant: { equals: aurora.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (news.totalDocs === 0 && northRidgeId) {
    const release = await payload.create({
      collection: 'news-releases',
      data: {
        tenant: aurora.id,
        title: 'Aurora Gold Commences North Ridge Drill Program',
        slug: 'north-ridge-drill-program',
        project: northRidgeId,
        releaseDate: '2026-07-20',
        excerpt:
          'Fictional demo release: Aurora Gold starts a focused drill campaign at North Ridge.',
        body: 'This fictional news release describes a demo drill program at the North Ridge project. It is not a real disclosure and must not be treated as investment advice.',
        sourceUrl: 'https://example.com/aurora-gold-news-north-ridge-drill',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'news-releases', release.id, platformAdmin)

    await payload.create({
      collection: 'news-releases',
      data: {
        tenant: aurora.id,
        title: 'Draft Financing Placeholder',
        slug: 'draft-financing-placeholder',
        releaseDate: '2026-08-05',
        excerpt: 'Internal draft financing note — must never appear publicly.',
        body: 'Draft-only financing commentary for dashboard testing.',
        sourceUrl: 'https://example.com/aurora-gold-draft-financing',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  const people = await payload.find({
    collection: 'people',
    where: { tenant: { equals: aurora.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (people.totalDocs === 0) {
    const ceo = await payload.create({
      collection: 'people',
      data: {
        tenant: aurora.id,
        name: 'Alex Rivera',
        roleTitle: 'Chief Executive Officer',
        group: 'management',
        biography:
          'Fictional CEO biography for Aurora Gold demo. Exploration-focused operator with prior junior mining experience.',
        displayOrder: 1,
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'people', ceo.id, platformAdmin)

    await payload.create({
      collection: 'people',
      data: {
        tenant: aurora.id,
        name: 'Draft Advisor',
        roleTitle: 'Technical Advisor',
        group: 'advisors',
        biography: 'Unpublished advisor profile used for draft/public isolation checks.',
        displayOrder: 99,
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  const exploration = await payload.find({
    collection: 'exploration-contents',
    where: { tenant: { equals: aurora.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (exploration.totalDocs === 0 && northRidgeId) {
    const result = await payload.create({
      collection: 'exploration-contents',
      data: {
        tenant: aurora.id,
        project: northRidgeId,
        title: 'North Ridge Phase 1 Summary',
        contentDate: '2026-06-01',
        summary: 'Fictional summary of early drilling and surface work at North Ridge.',
        technicalDetails:
          'Demo technical note describing anomalous intervals along the North Ridge corridor. Not a real assay disclosure.',
        sourceUrl: 'https://example.com/aurora-gold-north-ridge-phase-1',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'exploration-contents', result.id, platformAdmin)

    await payload.create({
      collection: 'exploration-contents',
      data: {
        tenant: aurora.id,
        project: northRidgeId,
        title: 'Draft Hole Log Notes',
        contentDate: '2026-07-01',
        summary: 'Internal draft exploration notes.',
        technicalDetails: 'Must remain unpublished for Sprint 2 isolation checks.',
        sourceUrl: 'https://example.com/aurora-gold-draft-hole-log',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  // Northern Copper isolation fixtures (no company-admin membership).
  const northernProjects = await payload.find({
    collection: 'projects',
    where: { tenant: { equals: northern.id } },
    limit: 1,
    overrideAccess: true,
  })
  let northernProjectId = northernProjects.docs[0]?.id
  if (!northernProjectId) {
    const northernProject = await payload.create({
      collection: 'projects',
      data: {
        tenant: northern.id,
        name: 'Copper Ridge Isolation',
        slug: 'copper-ridge-isolation',
        status: 'draft',
        isFlagship: true,
        commodity: 'Copper',
        jurisdiction: 'British Columbia, Canada',
        locationSummary: 'Fictional isolation fixture project for wrong-tenant relation tests.',
        ownershipPercent: 100,
        stage: 'early_exploration',
        summary: 'Northern Copper isolation project used only for cross-tenant assignment checks.',
        highlights: [{ item: 'Isolation fixture — not for public demo focus.' }],
        technicalSummary: 'Fictional technical summary for tenant isolation tests only.',
        displayOrder: 1,
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'projects', northernProject.id, platformAdmin)
    northernProjectId = northernProject.id
  }
  void northernProjectId

  const northernHighlights = await payload.find({
    collection: 'investment-highlights',
    where: {
      and: [
        { tenant: { equals: northern.id } },
        { title: { equals: 'NORTHERN SECRET' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (northernHighlights.totalDocs === 0) {
    await payload.create({
      collection: 'investment-highlights',
      data: {
        tenant: northern.id,
        title: 'NORTHERN SECRET',
        summary: 'Isolation fixture highlight — must never appear on Aurora anonymous API reads.',
        displayOrder: 99,
        status: 'published',
      },
      overrideAccess: true,
    })
  }

  const northernNews = await payload.find({
    collection: 'news-releases',
    where: { tenant: { equals: northern.id } },
    limit: 1,
    overrideAccess: true,
  })
  if (northernNews.totalDocs === 0) {
    const northernDoc = await payload.create({
      collection: 'documents',
      data: {
        tenant: northern.id,
        title: 'Northern Copper Isolation Doc',
        slug: 'northern-isolation-doc',
        category: 'other',
        publicationDate: '2026-01-01',
        externalUrl: 'https://example.com/northern-copper-doc',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'documents', northernDoc.id, platformAdmin)

    const northernRelease = await payload.create({
      collection: 'news-releases',
      data: {
        tenant: northern.id,
        title: 'Northern Copper Isolation Release',
        slug: 'northern-isolation-release',
        releaseDate: '2026-01-02',
        excerpt: 'Isolation fixture news for wrong-tenant tests.',
        body: 'Northern Copper published news used only for tenant isolation tests.',
        sourceUrl: 'https://example.com/northern-copper-news',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'news-releases', northernRelease.id, platformAdmin)
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
