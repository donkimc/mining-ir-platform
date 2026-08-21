import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

async function clearCollection(
  payload: Awaited<ReturnType<typeof import('payload').getPayload>>,
  collection:
    | 'tenant-memberships'
    | 'company-listings'
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
    | 'exploration-contents'
    | 'company-listings',
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

async function ensurePrimaryListing(
  payload: Awaited<ReturnType<typeof import('payload').getPayload>>,
  args: {
    tenantId: string | number
    symbol: string
    exchange: string
    reviewer: { id: string | number }
  },
) {
  const existing = await payload.find({
    collection: 'company-listings',
    where: {
      and: [
        { tenant: { equals: args.tenantId } },
        { symbol: { equals: args.symbol } },
        { exchange: { equals: args.exchange } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    if (existing.docs[0].status !== 'published') {
      await publishViaReview(payload, 'company-listings', existing.docs[0].id, args.reviewer)
    }
    return existing.docs[0]
  }
  const created = await payload.create({
    collection: 'company-listings',
    data: {
      tenant: args.tenantId as number,
      symbol: args.symbol,
      exchange: args.exchange,
      isPrimary: true,
      displayOrder: 0,
      status: 'draft',
      disclosureLevel: 'standard',
      sourceUrl: 'https://example.invalid/fictional-listing-source',
    },
    overrideAccess: true,
  })
  await publishViaReview(payload, 'company-listings', created.id, args.reviewer)
  return created
}

async function seed() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')
  const payload = await getPayload({ config })
  const reset = process.env.SEED_RESET === 'true'

  if (reset) {
    console.log('Resetting seed collections...')
    await clearCollection(payload, 'tenant-memberships')
    await clearCollection(payload, 'company-listings')
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
  const companyEmail = process.env.SEED_COMPANY_ADMIN_EMAIL || 'admin@qelvarion.local'
  const companyPassword = process.env.SEED_COMPANY_ADMIN_PASSWORD || 'ChangeMeLocal1!'
  const veylithraEmail = process.env.SEED_VEY_LITHRA_ADMIN_EMAIL || 'admin@veylithra.local'

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
        name: 'Qelvarion Resource Admin',
        status: 'active',
      },
      overrideAccess: true,
    }))

  const existingVeylithraAdmin = await payload.find({
    collection: 'users',
    where: { email: { equals: veylithraEmail } },
    limit: 1,
    overrideAccess: true,
  })

  const veylithraAdmin =
    existingVeylithraAdmin.docs[0] ??
    (await payload.create({
      collection: 'users',
      data: {
        email: veylithraEmail,
        password: companyPassword,
        name: 'Veylithra Tungsten Admin',
        status: 'active',
      },
      overrideAccess: true,
    }))

  // --- Primary demo tenant: Qelvarion Resource Corp. ---
  const existingQelvarion = await payload.find({
    collection: 'companies',
    where: { slug: { equals: 'qelvarion-resource' } },
    limit: 1,
    overrideAccess: true,
  })

  const qelvarion =
    existingQelvarion.docs[0] ??
    (await payload.create({
      collection: 'companies',
      data: {
        legalName: 'Qelvarion Resource Corp.',
        displayName: 'Qelvarion Resource',
        slug: 'qelvarion-resource',
        status: 'active',
        publicationStatus: 'draft',
        templateKey: 'explorer',
        primaryCommodity: 'Gold',
        jurisdiction: 'British Columbia, Canada',
        tickerSymbol: 'QVRN',
        exchange: 'TSXV',
        websiteDomain: 'qelvarion-resource.example',
        subdomain: 'qelvarion-resource',
        brandColors: {
          primary: '#1F3A2E',
          secondary: '#0F1C16',
          accent: '#C4A35A',
        },
        shortDescription:
          'Qelvarion Resource advances high-grade gold exploration across the Northridge Belt.',
        longDescription:
          'Qelvarion Resource is a junior exploration company focused on discovering and advancing gold assets in established Canadian mining jurisdictions. The company prioritizes disciplined drilling, transparent disclosure and investor-ready project storytelling.',
        investmentThesis:
          'Qelvarion combines a flagship Northridge Belt discovery corridor with district-scale upside, lean capital structure and a clear path of catalysts through systematic drilling and resource definition.',
        irContactName: 'Jordan Hale',
        irContactEmail: 'ir@qelvarion.example',
        irContactPhone: '+1 604 555 0142',
        officeAddress: '900 — 543 Granville Street, Vancouver, BC',
        socialLinks: [
          { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
          { label: 'X', url: 'https://x.com/' },
        ],
      },
      overrideAccess: true,
    }))

  if (qelvarion.publicationStatus !== 'published') {
    await payload.update({
      collection: 'companies',
      id: qelvarion.id,
      data: { publicationStatus: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })

    await payload.update({
      collection: 'companies',
      id: qelvarion.id,
      data: { publicationStatus: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })
  }

  await ensurePrimaryListing(payload, {
    tenantId: qelvarion.id,
    symbol: 'QVRN',
    exchange: 'TSXV',
    reviewer: platformAdmin,
  })

  // --- Isolation fixture: Zenthoriq Resource Ltd. (no company-admin membership) ---
  const existingZenthoriq = await payload.find({
    collection: 'companies',
    where: { slug: { equals: 'zenthoriq-resource' } },
    limit: 1,
    overrideAccess: true,
  })

  let zenthoriq = existingZenthoriq.docs[0]
  if (!zenthoriq) {
    zenthoriq = await payload.create({
      collection: 'companies',
      data: {
        legalName: 'Zenthoriq Resource Ltd.',
        displayName: 'Zenthoriq Resource',
        slug: 'zenthoriq-resource',
        status: 'active',
        publicationStatus: 'draft',
        templateKey: 'explorer',
        primaryCommodity: 'Copper',
        jurisdiction: 'Yukon, Canada',
        tickerSymbol: 'ZQRI',
        exchange: 'TSXV',
        websiteDomain: 'zenthoriq-resource.example',
        subdomain: 'zenthoriq-resource',
        shortDescription:
          'Isolation fixture tenant used only in tests and local multi-tenant checks.',
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'companies',
      id: zenthoriq.id,
      data: { publicationStatus: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })
    await payload.update({
      collection: 'companies',
      id: zenthoriq.id,
      data: { publicationStatus: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })
  }

  await ensurePrimaryListing(payload, {
    tenantId: zenthoriq.id,
    symbol: 'ZQRI',
    exchange: 'TSXV',
    reviewer: platformAdmin,
  })

  // --- Second fully populated tenant: Veylithra Tungsten Corp. ---
  const existingVeylithra = await payload.find({
    collection: 'companies',
    where: { slug: { equals: 'veylithra-tungsten' } },
    limit: 1,
    overrideAccess: true,
  })

  const veylithra =
    existingVeylithra.docs[0] ??
    (await payload.create({
      collection: 'companies',
      data: {
        legalName: 'Veylithra Tungsten Corp.',
        displayName: 'Veylithra Tungsten',
        slug: 'veylithra-tungsten',
        status: 'active',
        publicationStatus: 'draft',
        templateKey: 'summit',
        primaryCommodity: 'Tungsten',
        jurisdiction: 'Newfoundland and Labrador, Canada',
        tickerSymbol: 'VYTH',
        exchange: 'CSE',
        websiteDomain: 'veylithra-tungsten.example',
        subdomain: 'veylithra-tungsten',
        brandColors: {
          primary: '#2C3E50',
          secondary: '#1A252F',
          accent: '#7F8C8D',
        },
        shortDescription:
          'Veylithra Tungsten explores skarn-hosted tungsten systems across Atlantic Canada.',
        longDescription:
          'Veylithra Tungsten is a fictional junior exploration company advancing tungsten projects with a focus on transparent disclosure, staged drilling and clear catalyst pacing. All demo content is invented for platform testing.',
        investmentThesis:
          'Veylithra pairs a flagship Hollowspire Ridge tungsten corridor with secondary Fennwick Drift optionality, a simple capital structure and near-term technical catalysts.',
        irContactName: 'Morgan Ellis',
        irContactEmail: 'ir@veylithra.example',
        irContactPhone: '+1 709 555 0188',
        officeAddress: '210 — 100 Water Street, St. John’s, NL',
        socialLinks: [
          { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
          { label: 'X', url: 'https://x.com/' },
        ],
      },
      overrideAccess: true,
    }))

  if (veylithra.publicationStatus !== 'published') {
    await payload.update({
      collection: 'companies',
      id: veylithra.id,
      data: { publicationStatus: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })
    await payload.update({
      collection: 'companies',
      id: veylithra.id,
      data: { publicationStatus: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })
  }

  await ensurePrimaryListing(payload, {
    tenantId: veylithra.id,
    symbol: 'VYTH',
    exchange: 'CSE',
    reviewer: platformAdmin,
  })

  const qelvarionMemberships = await payload.find({
    collection: 'tenant-memberships',
    where: {
      and: [{ user: { equals: companyAdmin.id } }, { tenant: { equals: qelvarion.id } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (!qelvarionMemberships.docs[0]) {
    await payload.create({
      collection: 'tenant-memberships',
      data: {
        user: companyAdmin.id,
        tenant: qelvarion.id,
        role: 'company_admin',
        status: 'active',
        invitedAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  }

  const veylithraMemberships = await payload.find({
    collection: 'tenant-memberships',
    where: {
      and: [{ user: { equals: veylithraAdmin.id } }, { tenant: { equals: veylithra.id } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (!veylithraMemberships.docs[0]) {
    await payload.create({
      collection: 'tenant-memberships',
      data: {
        user: veylithraAdmin.id,
        tenant: veylithra.id,
        role: 'company_admin',
        status: 'active',
        invitedAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  }

  // --- Qelvarion projects ---
  const existingQelvarionProjects = await payload.find({
    collection: 'projects',
    where: { tenant: { equals: qelvarion.id } },
    limit: 10,
    overrideAccess: true,
  })

  if (existingQelvarionProjects.totalDocs === 0) {
    const flagshipDraft = await payload.create({
      collection: 'projects',
      data: {
        tenant: qelvarion.id,
        name: 'Northridge Belt',
        slug: 'northridge-belt',
        status: 'draft',
        isFlagship: true,
        commodity: 'Gold',
        jurisdiction: 'British Columbia, Canada',
        locationSummary: 'Road-accessible claims along the Northridge Belt structural corridor.',
        latitude: 53.12,
        longitude: -121.58,
        ownershipPercent: 100,
        stage: 'advanced_exploration',
        summary:
          'Northridge Belt is Qelvarion Resource’s flagship gold project, featuring multiple drill-ready targets along a kilometer-scale structural trend.',
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
            url: 'https://example.com/qelvarion-resource-northridge-belt-technical-report',
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
        tenant: qelvarion.id,
        name: 'Greywater Flats',
        slug: 'greywater-flats',
        status: 'draft',
        isFlagship: false,
        commodity: 'Gold',
        jurisdiction: 'British Columbia, Canada',
        locationSummary: 'Early-stage claim package south of the Northridge Belt corridor.',
        ownershipPercent: 100,
        stage: 'early_exploration',
        summary: 'Greywater Flats provides district-scale optionality adjacent to the flagship trend.',
        highlights: [{ item: 'Historical trenches with anomalous gold values' }],
        technicalSummary: 'Early-stage target generation; no resource estimate.',
        sourceLinks: [
          {
            label: 'Assessment Report (placeholder)',
            url: 'https://example.com/qelvarion-resource-greywater-flats',
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
        tenant: qelvarion.id,
        name: 'Mistfall Hollow (Draft)',
        slug: 'mistfall-hollow',
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

  const qelvarionHighlights = await payload.find({
    collection: 'investment-highlights',
    where: { tenant: { equals: qelvarion.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (qelvarionHighlights.totalDocs === 0) {
    const items = [
      {
        title: 'Flagship discovery corridor',
        summary: 'Northridge Belt anchors a focused drill strategy in an established gold belt.',
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
          tenant: qelvarion.id,
          ...item,
          status: 'published',
        },
        overrideAccess: true,
      })
    }
  }

  const qelvarionCatalysts = await payload.find({
    collection: 'catalysts',
    where: { tenant: { equals: qelvarion.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (qelvarionCatalysts.totalDocs === 0) {
    await payload.create({
      collection: 'catalysts',
      data: {
        tenant: qelvarion.id,
        title: 'Phase 2 drill program results',
        expectedTiming: 'Q4 2026',
        summary: 'Assays from expansion drilling at Northridge Belt.',
        status: 'published',
        displayOrder: 1,
      },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'catalysts',
      data: {
        tenant: qelvarion.id,
        title: 'Updated technical presentation',
        expectedTiming: 'Q1 2027',
        summary: 'Investor presentation refresh after field season.',
        status: 'published',
        displayOrder: 2,
      },
      overrideAccess: true,
    })
  }

  const qelvarionShares = await payload.find({
    collection: 'share-structures',
    where: { tenant: { equals: qelvarion.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (qelvarionShares.totalDocs === 0) {
    const shareDraft = await payload.create({
      collection: 'share-structures',
      data: {
        tenant: qelvarion.id,
        asOfDate: '2026-06-30',
        sharesOutstanding: 128_400_000,
        options: 8_200_000,
        warrants: 12_000_000,
        fullyDiluted: 148_600_000,
        marketCapNote:
          'Fictional demo figures only. Market capitalization varies with share price.',
        sourceUrl: 'https://example.com/qelvarion-resource-share-structure-2026-06-30',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'share-structures', shareDraft.id, platformAdmin)

    await payload.create({
      collection: 'share-structures',
      data: {
        tenant: qelvarion.id,
        asOfDate: '2026-03-31',
        sharesOutstanding: 120_000_000,
        options: 7_000_000,
        warrants: 10_000_000,
        fullyDiluted: 137_000_000,
        marketCapNote: 'Draft historical share structure — must stay private.',
        sourceUrl: 'https://example.com/qelvarion-resource-share-structure-draft',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  const northridgeBelt = await payload.find({
    collection: 'projects',
    where: {
      and: [{ tenant: { equals: qelvarion.id } }, { slug: { equals: 'northridge-belt' } }],
    },
    limit: 1,
    overrideAccess: true,
  })
  const northridgeBeltId = northridgeBelt.docs[0]?.id

  const qelvarionDocs = await payload.find({
    collection: 'documents',
    where: { tenant: { equals: qelvarion.id } },
    limit: 1,
    overrideAccess: true,
  })

  let publishedDocId: string | number | undefined
  if (qelvarionDocs.totalDocs === 0) {
    const presentation = await payload.create({
      collection: 'documents',
      data: {
        tenant: qelvarion.id,
        title: 'Qelvarion Resource Corporate Presentation',
        slug: 'corporate-presentation',
        category: 'presentation',
        publicationDate: '2026-07-15',
        externalUrl: 'https://example.com/qelvarion-resource-corporate-presentation.pdf',
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
        tenant: qelvarion.id,
        title: 'Internal Draft Technical Memo',
        slug: 'draft-technical-memo',
        category: 'technical_report',
        publicationDate: '2026-08-01',
        externalUrl: 'https://example.com/qelvarion-resource-draft-memo.pdf',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
  } else {
    publishedDocId = qelvarionDocs.docs[0]?.id
  }

  // Ensure at least one Document is backed by a real uploaded media file.
  const qelvarionFileBacked = await payload.find({
    collection: 'documents',
    where: {
      and: [{ tenant: { equals: qelvarion.id } }, { file: { exists: true } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (qelvarionFileBacked.totalDocs === 0) {
    const publishedBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\nFictional Qelvarion Resource corporate presentation fixture.\n',
    )
    const publishedMedia = await payload.create({
      collection: 'media',
      data: {
        alt: 'Qelvarion Resource corporate presentation PDF',
        tenant: qelvarion.id,
        originalFilename: 'qelvarion-resource-corporate-presentation.pdf',
      },
      file: {
        data: publishedBuffer,
        mimetype: 'application/pdf',
        name: 'qelvarion-resource-corporate-presentation.pdf',
        size: publishedBuffer.length,
      },
      overrideAccess: true,
      user: platformAdmin,
    })

    const uploadPresentation = await payload.create({
      collection: 'documents',
      data: {
        tenant: qelvarion.id,
        title: 'Qelvarion Resource Uploaded Corporate Presentation',
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
        alt: 'Qelvarion Resource draft technical memo PDF',
        tenant: qelvarion.id,
        originalFilename: 'qelvarion-resource-draft-memo.pdf',
      },
      file: {
        data: draftBuffer,
        mimetype: 'application/pdf',
        name: 'qelvarion-resource-draft-memo.pdf',
        size: draftBuffer.length,
      },
      overrideAccess: true,
      user: platformAdmin,
    })

    await payload.create({
      collection: 'documents',
      data: {
        tenant: qelvarion.id,
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

  const qelvarionNews = await payload.find({
    collection: 'news-releases',
    where: { tenant: { equals: qelvarion.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (qelvarionNews.totalDocs === 0 && northridgeBeltId) {
    const release = await payload.create({
      collection: 'news-releases',
      data: {
        tenant: qelvarion.id,
        title: 'Qelvarion Resource Commences Northridge Belt Drill Program',
        slug: 'northridge-belt-drill-program',
        project: northridgeBeltId,
        releaseDate: '2026-07-20',
        excerpt:
          'Fictional demo release: Qelvarion Resource starts a focused drill campaign at Northridge Belt.',
        body: 'This fictional news release describes a demo drill program at the Northridge Belt project. It is not a real disclosure and must not be treated as investment advice.',
        sourceUrl: 'https://example.com/qelvarion-resource-news-northridge-belt-drill',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'news-releases', release.id, platformAdmin)

    await payload.create({
      collection: 'news-releases',
      data: {
        tenant: qelvarion.id,
        title: 'Draft Financing Placeholder',
        slug: 'draft-financing-placeholder',
        releaseDate: '2026-08-05',
        excerpt: 'Internal draft financing note — must never appear publicly.',
        body: 'Draft-only financing commentary for dashboard testing.',
        sourceUrl: 'https://example.com/qelvarion-resource-draft-financing',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  const qelvarionPeople = await payload.find({
    collection: 'people',
    where: { tenant: { equals: qelvarion.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (qelvarionPeople.totalDocs === 0) {
    const ceo = await payload.create({
      collection: 'people',
      data: {
        tenant: qelvarion.id,
        name: 'Alex Rivera',
        roleTitle: 'Chief Executive Officer',
        group: 'management',
        biography:
          'Fictional CEO biography for Qelvarion Resource demo. Exploration-focused operator with prior junior mining experience.',
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
        tenant: qelvarion.id,
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

  const qelvarionExploration = await payload.find({
    collection: 'exploration-contents',
    where: { tenant: { equals: qelvarion.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (qelvarionExploration.totalDocs === 0 && northridgeBeltId) {
    const result = await payload.create({
      collection: 'exploration-contents',
      data: {
        tenant: qelvarion.id,
        project: northridgeBeltId,
        title: 'Northridge Belt Phase 1 Summary',
        contentDate: '2026-06-01',
        summary: 'Fictional summary of early drilling and surface work at Northridge Belt.',
        technicalDetails:
          'Demo technical note describing anomalous intervals along the Northridge Belt corridor. Not a real assay disclosure.',
        sourceUrl: 'https://example.com/qelvarion-resource-northridge-belt-phase-1',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'exploration-contents', result.id, platformAdmin)

    await payload.create({
      collection: 'exploration-contents',
      data: {
        tenant: qelvarion.id,
        project: northridgeBeltId,
        title: 'Draft Hole Log Notes',
        contentDate: '2026-07-01',
        summary: 'Internal draft exploration notes.',
        technicalDetails: 'Must remain unpublished for isolation checks.',
        sourceUrl: 'https://example.com/qelvarion-resource-draft-hole-log',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  // --- Zenthoriq isolation fixtures (no company-admin membership) ---
  const zenthoriqProjects = await payload.find({
    collection: 'projects',
    where: { tenant: { equals: zenthoriq.id } },
    limit: 1,
    overrideAccess: true,
  })
  let zenthoriqProjectId = zenthoriqProjects.docs[0]?.id
  if (!zenthoriqProjectId) {
    const zenthoriqProject = await payload.create({
      collection: 'projects',
      data: {
        tenant: zenthoriq.id,
        name: 'Hollowspire Isolation',
        slug: 'hollowspire-isolation',
        status: 'draft',
        isFlagship: true,
        commodity: 'Copper',
        jurisdiction: 'British Columbia, Canada',
        locationSummary: 'Fictional isolation fixture project for wrong-tenant relation tests.',
        // Distinctive poison coordinates — must never appear on Qelvarion or Veylithra maps.
        latitude: 54.123456,
        longitude: -125.654321,
        ownershipPercent: 100,
        stage: 'early_exploration',
        summary: 'Zenthoriq Resource isolation project used only for cross-tenant assignment checks.',
        highlights: [{ item: 'Isolation fixture — not for public demo focus.' }],
        technicalSummary: 'Fictional technical summary for tenant isolation tests only.',
        displayOrder: 1,
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'projects', zenthoriqProject.id, platformAdmin)
    zenthoriqProjectId = zenthoriqProject.id
  } else {
    // Ensure poison coordinates exist on the isolation fixture for map negative tests.
    await payload.update({
      collection: 'projects',
      id: zenthoriqProjectId,
      data: {
        latitude: 54.123456,
        longitude: -125.654321,
      },
      overrideAccess: true,
    })
  }
  void zenthoriqProjectId

  const zenthoriqHighlights = await payload.find({
    collection: 'investment-highlights',
    where: {
      and: [
        { tenant: { equals: zenthoriq.id } },
        { title: { equals: 'ZENTHORIQ SECRET' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (zenthoriqHighlights.totalDocs === 0) {
    await payload.create({
      collection: 'investment-highlights',
      data: {
        tenant: zenthoriq.id,
        title: 'ZENTHORIQ SECRET',
        summary:
          'Isolation fixture highlight — must never appear on Qelvarion anonymous API reads.',
        displayOrder: 99,
        status: 'published',
      },
      overrideAccess: true,
    })
  }

  const zenthoriqCatalysts = await payload.find({
    collection: 'catalysts',
    where: {
      and: [
        { tenant: { equals: zenthoriq.id } },
        { title: { equals: 'ZENTHORIQ CATALYST SECRET' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (zenthoriqCatalysts.totalDocs === 0) {
    await payload.create({
      collection: 'catalysts',
      data: {
        tenant: zenthoriq.id,
        title: 'ZENTHORIQ CATALYST SECRET',
        expectedTiming: 'Never — isolation fixture',
        summary:
          'Isolation fixture catalyst — must never appear on Qelvarion public routes, APIs or maps.',
        displayOrder: 99,
        status: 'published',
      },
      overrideAccess: true,
    })
  }

  const zenthoriqNews = await payload.find({
    collection: 'news-releases',
    where: { tenant: { equals: zenthoriq.id } },
    limit: 1,
    overrideAccess: true,
  })
  if (zenthoriqNews.totalDocs === 0) {
    const zenthoriqDoc = await payload.create({
      collection: 'documents',
      data: {
        tenant: zenthoriq.id,
        title: 'Zenthoriq Resource Isolation Doc',
        slug: 'zenthoriq-isolation-doc',
        category: 'other',
        publicationDate: '2026-01-01',
        externalUrl: 'https://example.com/zenthoriq-resource-doc',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'documents', zenthoriqDoc.id, platformAdmin)

    const zenthoriqRelease = await payload.create({
      collection: 'news-releases',
      data: {
        tenant: zenthoriq.id,
        title: 'Zenthoriq Resource Isolation Release',
        slug: 'zenthoriq-isolation-release',
        releaseDate: '2026-01-02',
        excerpt: 'Isolation fixture news for wrong-tenant tests.',
        body: 'Zenthoriq Resource published news used only for tenant isolation tests.',
        sourceUrl: 'https://example.com/zenthoriq-resource-news',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'news-releases', zenthoriqRelease.id, platformAdmin)

    // Keep an unpublished draft poison record for negative published-only checks.
    await payload.create({
      collection: 'news-releases',
      data: {
        tenant: zenthoriq.id,
        title: 'Zenthoriq Draft Poison Release',
        slug: 'zenthoriq-draft-poison-release',
        releaseDate: '2026-01-03',
        excerpt: 'Draft-only isolation poison — must never appear publicly.',
        body: 'Unpublished Zenthoriq draft used only for negative published-only tests.',
        sourceUrl: 'https://example.com/zenthoriq-resource-draft-poison',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  // --- Veylithra Tungsten fully populated content ---
  const existingVeylithraProjects = await payload.find({
    collection: 'projects',
    where: { tenant: { equals: veylithra.id } },
    limit: 10,
    overrideAccess: true,
  })

  if (existingVeylithraProjects.totalDocs === 0) {
    const hollowspireDraft = await payload.create({
      collection: 'projects',
      data: {
        tenant: veylithra.id,
        name: 'Hollowspire Ridge',
        slug: 'hollowspire-ridge',
        status: 'draft',
        isFlagship: true,
        commodity: 'Tungsten',
        jurisdiction: 'Newfoundland and Labrador, Canada',
        locationSummary: 'Skarn-hosted tungsten targets along the Hollowspire Ridge trend.',
        latitude: 48.95,
        longitude: -56.12,
        ownershipPercent: 100,
        stage: 'advanced_exploration',
        summary:
          'Hollowspire Ridge is Veylithra Tungsten’s flagship project, with drill-ready skarn targets and staged resource-definition work.',
        highlights: [
          { item: 'Multiple tungsten skarn zones mapped along a multi-kilometer trend' },
          { item: 'Prior surface sampling supports follow-up drilling' },
          { item: 'Seasonal road access with staged camp logistics' },
        ],
        technicalSummary:
          'Exploration supports a skarn-hosted tungsten model. Material results are fictional demo summaries and must be read with linked technical sources.',
        sourceLinks: [
          {
            label: 'Technical Report (placeholder)',
            url: 'https://example.com/veylithra-tungsten-hollowspire-ridge-technical-report',
          },
        ],
        displayOrder: 1,
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'projects', hollowspireDraft.id, platformAdmin)

    const fennwickDraft = await payload.create({
      collection: 'projects',
      data: {
        tenant: veylithra.id,
        name: 'Fennwick Drift',
        slug: 'fennwick-drift',
        status: 'draft',
        isFlagship: false,
        commodity: 'Tungsten',
        jurisdiction: 'Newfoundland and Labrador, Canada',
        locationSummary: 'Secondary claim package northwest of Hollowspire Ridge.',
        ownershipPercent: 100,
        stage: 'early_exploration',
        summary: 'Fennwick Drift adds early-stage tungsten optionality adjacent to the flagship.',
        highlights: [{ item: 'Historical trenches with anomalous tungsten values' }],
        technicalSummary: 'Early-stage target generation; no resource estimate.',
        sourceLinks: [
          {
            label: 'Assessment Report (placeholder)',
            url: 'https://example.com/veylithra-tungsten-fennwick-drift',
          },
        ],
        displayOrder: 2,
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'projects', fennwickDraft.id, platformAdmin)

    await payload.create({
      collection: 'projects',
      data: {
        tenant: veylithra.id,
        name: 'Ashmere Gap (Draft)',
        slug: 'ashmere-gap',
        status: 'draft',
        isFlagship: false,
        commodity: 'Tungsten',
        jurisdiction: 'Newfoundland and Labrador',
        summary: 'Internal draft only — must never appear on public pages.',
        displayOrder: 99,
      },
      overrideAccess: true,
    })
  }

  const hollowspireRidge = await payload.find({
    collection: 'projects',
    where: {
      and: [{ tenant: { equals: veylithra.id } }, { slug: { equals: 'hollowspire-ridge' } }],
    },
    limit: 1,
    overrideAccess: true,
  })
  const hollowspireRidgeId = hollowspireRidge.docs[0]?.id

  const veylithraHighlights = await payload.find({
    collection: 'investment-highlights',
    where: { tenant: { equals: veylithra.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (veylithraHighlights.totalDocs === 0) {
    const items = [
      {
        title: 'Flagship tungsten corridor',
        summary: 'Hollowspire Ridge anchors a focused tungsten exploration strategy.',
        displayOrder: 1,
      },
      {
        title: 'District optionality',
        summary: 'Fennwick Drift provides secondary targets without diluting flagship focus.',
        displayOrder: 2,
      },
      {
        title: 'Clear catalyst path',
        summary: 'Staged drilling and technical updates paced for investor follow-through.',
        displayOrder: 3,
      },
    ]

    for (const item of items) {
      await payload.create({
        collection: 'investment-highlights',
        data: {
          tenant: veylithra.id,
          ...item,
          status: 'published',
        },
        overrideAccess: true,
      })
    }
  }

  const veylithraCatalysts = await payload.find({
    collection: 'catalysts',
    where: { tenant: { equals: veylithra.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (veylithraCatalysts.totalDocs === 0) {
    await payload.create({
      collection: 'catalysts',
      data: {
        tenant: veylithra.id,
        title: 'Hollowspire Ridge drill assays',
        expectedTiming: 'Q4 2026',
        summary: 'Assays from initial tungsten skarn drilling at Hollowspire Ridge.',
        status: 'published',
        displayOrder: 1,
      },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'catalysts',
      data: {
        tenant: veylithra.id,
        title: 'Updated tungsten presentation',
        expectedTiming: 'Q1 2027',
        summary: 'Investor presentation refresh after the field season.',
        status: 'published',
        displayOrder: 2,
      },
      overrideAccess: true,
    })
  }

  const veylithraShares = await payload.find({
    collection: 'share-structures',
    where: { tenant: { equals: veylithra.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (veylithraShares.totalDocs === 0) {
    const shareDraft = await payload.create({
      collection: 'share-structures',
      data: {
        tenant: veylithra.id,
        asOfDate: '2026-06-30',
        sharesOutstanding: 86_500_000,
        options: 5_400_000,
        warrants: 9_100_000,
        fullyDiluted: 101_000_000,
        marketCapNote:
          'Fictional demo figures only. Market capitalization varies with share price.',
        sourceUrl: 'https://example.com/veylithra-tungsten-share-structure-2026-06-30',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'share-structures', shareDraft.id, platformAdmin)

    await payload.create({
      collection: 'share-structures',
      data: {
        tenant: veylithra.id,
        asOfDate: '2026-03-31',
        sharesOutstanding: 80_000_000,
        options: 4_800_000,
        warrants: 8_000_000,
        fullyDiluted: 92_800_000,
        marketCapNote: 'Draft historical share structure — must stay private.',
        sourceUrl: 'https://example.com/veylithra-tungsten-share-structure-draft',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  const veylithraDocs = await payload.find({
    collection: 'documents',
    where: { tenant: { equals: veylithra.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (veylithraDocs.totalDocs === 0) {
    const presentation = await payload.create({
      collection: 'documents',
      data: {
        tenant: veylithra.id,
        title: 'Veylithra Tungsten Corporate Presentation',
        slug: 'corporate-presentation',
        category: 'presentation',
        publicationDate: '2026-07-18',
        externalUrl: 'https://example.com/veylithra-tungsten-corporate-presentation.pdf',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'documents', presentation.id, platformAdmin)

    await payload.create({
      collection: 'documents',
      data: {
        tenant: veylithra.id,
        title: 'Internal Draft Tungsten Memo',
        slug: 'draft-tungsten-memo',
        category: 'technical_report',
        publicationDate: '2026-08-02',
        externalUrl: 'https://example.com/veylithra-tungsten-draft-memo.pdf',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  const veylithraFileBacked = await payload.find({
    collection: 'documents',
    where: {
      and: [{ tenant: { equals: veylithra.id } }, { file: { exists: true } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (veylithraFileBacked.totalDocs === 0) {
    const publishedBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\nFictional Veylithra Tungsten corporate presentation fixture.\n',
    )
    const publishedMedia = await payload.create({
      collection: 'media',
      data: {
        alt: 'Veylithra Tungsten corporate presentation PDF',
        tenant: veylithra.id,
        originalFilename: 'veylithra-tungsten-corporate-presentation.pdf',
      },
      file: {
        data: publishedBuffer,
        mimetype: 'application/pdf',
        name: 'veylithra-tungsten-corporate-presentation.pdf',
        size: publishedBuffer.length,
      },
      overrideAccess: true,
      user: platformAdmin,
    })

    const uploadPresentation = await payload.create({
      collection: 'documents',
      data: {
        tenant: veylithra.id,
        title: 'Veylithra Tungsten Uploaded Corporate Presentation',
        slug: 'corporate-presentation-upload',
        category: 'presentation',
        publicationDate: '2026-07-19',
        file: publishedMedia.id,
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'documents', uploadPresentation.id, platformAdmin)

    const draftBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\nDraft-only tungsten memo — must stay unpublished.\n',
    )
    const draftMedia = await payload.create({
      collection: 'media',
      data: {
        alt: 'Veylithra Tungsten draft technical memo PDF',
        tenant: veylithra.id,
        originalFilename: 'veylithra-tungsten-draft-memo.pdf',
      },
      file: {
        data: draftBuffer,
        mimetype: 'application/pdf',
        name: 'veylithra-tungsten-draft-memo.pdf',
        size: draftBuffer.length,
      },
      overrideAccess: true,
      user: platformAdmin,
    })

    await payload.create({
      collection: 'documents',
      data: {
        tenant: veylithra.id,
        title: 'Uploaded Draft Tungsten Memo',
        slug: 'draft-tungsten-memo-upload',
        category: 'technical_report',
        publicationDate: '2026-08-02',
        file: draftMedia.id,
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  const veylithraNews = await payload.find({
    collection: 'news-releases',
    where: { tenant: { equals: veylithra.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (veylithraNews.totalDocs === 0 && hollowspireRidgeId) {
    const release = await payload.create({
      collection: 'news-releases',
      data: {
        tenant: veylithra.id,
        title: 'Veylithra Tungsten Commences Hollowspire Ridge Drill Program',
        slug: 'hollowspire-ridge-drill-program',
        project: hollowspireRidgeId,
        releaseDate: '2026-07-22',
        excerpt:
          'Fictional demo release: Veylithra Tungsten starts a focused drill campaign at Hollowspire Ridge.',
        body: 'This fictional news release describes a demo drill program at Hollowspire Ridge. It is not a real disclosure and must not be treated as investment advice.',
        sourceUrl: 'https://example.com/veylithra-tungsten-news-hollowspire-ridge-drill',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'news-releases', release.id, platformAdmin)

    await payload.create({
      collection: 'news-releases',
      data: {
        tenant: veylithra.id,
        title: 'Draft Financing Placeholder',
        slug: 'draft-financing-placeholder',
        releaseDate: '2026-08-06',
        excerpt: 'Internal draft financing note — must never appear publicly.',
        body: 'Draft-only financing commentary for dashboard testing.',
        sourceUrl: 'https://example.com/veylithra-tungsten-draft-financing',
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  const veylithraPeople = await payload.find({
    collection: 'people',
    where: { tenant: { equals: veylithra.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (veylithraPeople.totalDocs === 0) {
    const ceo = await payload.create({
      collection: 'people',
      data: {
        tenant: veylithra.id,
        name: 'Casey Nguyen',
        roleTitle: 'Chief Executive Officer',
        group: 'management',
        biography:
          'Fictional CEO biography for Veylithra Tungsten demo. Critical-metals operator with prior junior exploration experience.',
        displayOrder: 1,
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'people', ceo.id, platformAdmin)

    const vp = await payload.create({
      collection: 'people',
      data: {
        tenant: veylithra.id,
        name: 'Riley Okonkwo',
        roleTitle: 'VP Exploration',
        group: 'management',
        biography:
          'Fictional VP Exploration biography focused on tungsten skarn systems and staged drill planning.',
        displayOrder: 2,
        disclosureLevel: 'standard',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'people', vp.id, platformAdmin)

    await payload.create({
      collection: 'people',
      data: {
        tenant: veylithra.id,
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

  const veylithraExploration = await payload.find({
    collection: 'exploration-contents',
    where: { tenant: { equals: veylithra.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (veylithraExploration.totalDocs === 0 && hollowspireRidgeId) {
    const result = await payload.create({
      collection: 'exploration-contents',
      data: {
        tenant: veylithra.id,
        project: hollowspireRidgeId,
        title: 'Hollowspire Ridge Phase 1 Summary',
        contentDate: '2026-06-05',
        summary: 'Fictional summary of early drilling and surface work at Hollowspire Ridge.',
        technicalDetails:
          'Demo technical note describing anomalous tungsten intervals along Hollowspire Ridge. Not a real assay disclosure.',
        sourceUrl: 'https://example.com/veylithra-tungsten-hollowspire-ridge-phase-1',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
    await publishViaReview(payload, 'exploration-contents', result.id, platformAdmin)

    await payload.create({
      collection: 'exploration-contents',
      data: {
        tenant: veylithra.id,
        project: hollowspireRidgeId,
        title: 'Draft Hole Log Notes',
        contentDate: '2026-07-03',
        summary: 'Internal draft exploration notes.',
        technicalDetails: 'Must remain unpublished for isolation checks.',
        sourceUrl: 'https://example.com/veylithra-tungsten-draft-hole-log',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      overrideAccess: true,
    })
  }

  console.log('Seed complete.')
  console.log(`Platform Admin: ${platformEmail} / ${platformPassword}`)
  console.log(`Qelvarion Admin: ${companyEmail} / ${companyPassword}`)
  console.log(`Veylithra Admin: ${veylithraEmail} / ${companyPassword}`)
  console.log('Public tenant slugs: qelvarion-resource, veylithra-tungsten')
  console.log('Isolation fixture slug: zenthoriq-resource')
  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
