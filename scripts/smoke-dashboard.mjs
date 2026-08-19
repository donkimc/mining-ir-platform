import { chromium } from 'playwright'

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3000'
const EMAIL = process.env.SEED_COMPANY_ADMIN_EMAIL || 'admin@auroragold.local'
const PASSWORD = process.env.SEED_COMPANY_ADMIN_PASSWORD
if (!PASSWORD) {
  throw new Error('Set SEED_COMPANY_ADMIN_PASSWORD (from .env.local) before running smoke-dashboard.')
}
const SLUG = `smoke-${Date.now()}`

async function loginViaApi(context) {
  const res = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) {
    throw new Error(`Login API failed: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  if (!data.token) throw new Error('Login API returned no token')

  // Form login used to set Secure whenever NODE_ENV=production. next start on
  // http://localhost drops that cookie, so inject a non-Secure token for local UI smoke.
  await context.addCookies([
    {
      name: 'payload-token',
      value: data.token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const serverErrors = []

  page.on('response', (res) => {
    if (res.status() >= 500) serverErrors.push(`${res.status()} ${res.url()}`)
  })

  console.log('1. Login (API token + cookie for http localhost)')
  await loginViaApi(context)
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  if (!page.url().includes('/dashboard')) {
    throw new Error(`Expected dashboard, got ${page.url()}`)
  }
  console.log('   OK ->', page.url())

  console.log('2. Create project')
  await page.goto(`${BASE}/dashboard/projects/new`, { waitUntil: 'networkidle' })
  await page.fill('input[name="name"]', `Smoke Project ${SLUG}`)
  await page.fill('input[name="slug"]', SLUG)
  await page.fill('input[name="commodity"]', 'Gold')
  await page.fill('input[name="jurisdiction"]', 'BC')
  await page.fill('textarea[name="summary"]', 'Smoke test summary')
  await Promise.all([
    page.waitForURL(/\/dashboard\/projects\/\d+/, { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ])
  console.log('   OK ->', page.url())

  console.log('3. Save project content')
  await page.fill('input[name="jurisdiction"]', 'Yukon')
  await page.locator('form.panel').filter({ hasText: 'Project content' }).locator('button[type="submit"]').click()
  await page.waitForSelector('[role="status"]:has-text("Project saved.")', { timeout: 15000 })
  console.log('   OK Project saved')

  console.log('4. Change publication status draft -> review')
  await page.selectOption('select[name="status"]', 'review')
  await page.locator('form.panel').filter({ hasText: 'Publication status' }).locator('button[type="submit"]').click()
  await page.waitForSelector('[role="status"]:has-text("Publication status updated.")', {
    timeout: 15000,
  })
  console.log('   OK status -> review')

  console.log('5. Save company profile')
  await page.goto(`${BASE}/dashboard/company`, { waitUntil: 'networkidle' })
  const short = await page.inputValue('textarea[name="shortDescription"]')
  const tagged = short.includes('(smoke)') ? short : `${short} (smoke)`
  await page.fill('textarea[name="shortDescription"]', tagged)
  await page.locator('form.panel').filter({ hasText: 'Profile content' }).locator('button[type="submit"]').click()
  await page.waitForSelector('[role="status"]:has-text("Company profile saved.")', {
    timeout: 15000,
  })
  console.log('   OK Company profile saved')
  await page.fill('textarea[name="shortDescription"]', short.replace(/ \(smoke\)/g, ''))
  await page.locator('form.panel').filter({ hasText: 'Profile content' }).locator('button[type="submit"]').click()
  await page.waitForSelector('[role="status"]:has-text("Company profile saved.")', {
    timeout: 15000,
  })

  console.log('6. C1: published technicalSummary rejected; jurisdiction still ok')
  await page.goto(`${BASE}/dashboard/projects`, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: /North Ridge/i }).first().click()
  await page.waitForURL(/\/dashboard\/projects\/\d+/)

  const technical = await page.inputValue('textarea[name="technicalSummary"]')
  await page.fill('textarea[name="technicalSummary"]', `${technical} UNAUTHORIZED`)
  await page.locator('form.panel').filter({ hasText: 'Project content' }).locator('button[type="submit"]').click()
  await page.waitForSelector('[role="alert"]', { timeout: 15000 })
  const disclosureError = (await page.locator('[role="alert"]').first().textContent()) || ''
  console.log('   disclosure reject:', disclosureError.trim())
  if (/Project saved/i.test(disclosureError) || !disclosureError.trim()) {
    throw new Error('C1 failed: published technicalSummary edit was not rejected')
  }

  await page.reload({ waitUntil: 'networkidle' })
  const jurisdiction = await page.inputValue('input[name="jurisdiction"]')
  const nextJurisdiction = jurisdiction.includes('smoke-ok')
    ? jurisdiction.replace(/ \(smoke-ok\)/g, '')
    : `${jurisdiction} (smoke-ok)`
  await page.fill('input[name="jurisdiction"]', nextJurisdiction)
  await page.locator('form.panel').filter({ hasText: 'Project content' }).locator('button[type="submit"]').click()
  await page.waitForSelector('[role="status"]:has-text("Project saved.")', { timeout: 15000 })
  console.log('   OK jurisdiction saved on published project')
  await page.fill('input[name="jurisdiction"]', jurisdiction.replace(/ \(smoke-ok\)/g, ''))
  await page.locator('form.panel').filter({ hasText: 'Project content' }).locator('button[type="submit"]').click()
  await page.waitForSelector('[role="status"]:has-text("Project saved.")', { timeout: 15000 })

  if (serverErrors.length) {
    console.error('5xx responses:', serverErrors)
    throw new Error('Smoke test saw 5xx responses')
  }

  console.log('SMOKE PASS')
  await browser.close()
}

main().catch((err) => {
  console.error('SMOKE FAIL', err)
  process.exit(1)
})
