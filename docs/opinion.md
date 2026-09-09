# Session Opinion: Product Direction & Go-to-Market Strategy (Sept 8, 2026)

## Context

User is a solo freelancer/engineer who has built Mining IR Platform — a multi-tenant SaaS for junior mining companies to host investor relations websites. The system is live on nrlaunch.com with three fictional tenants, has passed security reviews (Sprints 1-6), and is technically sound. However, user is uncertain about:

1. Whether to pivot to a different product/market
2. Whether the system is "ready" for real customers
3. How to find first customers
4. Whether to open-source or pursue consulting

## Key Constraints Identified

1. **No marketing/sales expertise** — User is a solo engineer, not a business person. This is the real blocker, not product quality.
2. **No market validation** — User has never talked to an actual mining company about whether they'd pay for this.
3. **Reliability concerns** — System is technically verified but has never handled real customer data at scale.
4. **No existing customer relationships** — User doesn't have warm leads or a network in mining/IR space to start with.

## Pivot Analysis

Explored four pivot options:

| Option | Effort | Upside | Downside |
|--------|--------|--------|----------|
| Single-tenant mining IR | 2-3 weeks | Simpler to consult, lower ops | Lose SaaS scalability |
| Expand to other natural resources | 4-6 weeks/vertical | Larger TAM | Still niche |
| General small-cap IR | 3-4 weeks | Large TAM, higher demand | More competition |
| **Regulated disclosure portal** (healthcare/fintech/legal) | 6-8 weeks | Highest leverage: higher willingness to pay, compliance as moat, much larger TAM | Requires market validation in chosen vertical |

**Recommendation:** Option 4 (regulated disclosure portal) has best leverage IF user can validate market need in one vertical first (healthcare, fintech, or legal). However, **pivot doesn't solve the go-to-market problem** — shifting verticals just changes who you have to convince.

## Strategic Direction: Hybrid Consulting + Open-Source (C + D)

User expressed interest in combining:
- **Option C (Consulting):** Use codebase as foundation for custom IR platforms; generate revenue and real customer feedback
- **Option D (Open-source):** Release code publicly to build reputation and attract collaborators

**Recommended sequence:**
1. Open-source the existing multi-tenant Mining IR Platform (as-is, with good docs)
2. Use OSS as credibility proof
3. Outreach to potential customers for consulting projects
4. Deliver custom builds; extract reusable components
5. Post-revenue, decide whether to pivot to single-tenant or keep multi-tenant

**Why this sequence:** Avoids "pivot before validation" trap. Real customers validate product direction better than guesses.

## Product Readiness Assessment

User concerned system "not ready for production." Analysis:

**Technical readiness:** ✅ Good
- Passes security reviews (tenant isolation verified, media/storage privacy confirmed)
- 125 tests, 21 files
- Live on nrlaunch.com (even with fictional data)
- Open findings from Sprint 6 are Medium/Low, documented

**Design readiness:** ✅ Good
- UI is professional (clean dark theme, good typography, accessible colors)
- Not the blocker user feared
- Screenshots show credible, B2B-appropriate design

**Actual blocker:** Market readiness (does anyone want it?) and sales readiness (can you reach customers?), not product readiness.

**Verdict:** Don't polish further before finding customers. Polishing for unknown buyers is a waste. One real customer gives better feedback than infinite design cycles.

## Customer Acquisition: Four Paths

1. **Your network** (fastest, most reliable)
   - List 20 people you know
   - Email 5-10 asking if they know junior mining CFOs/IR people
   - Follow up warm intros with actual people

2. **Cold outreach** (slower, higher volume)
   - Find junior mining companies (TSX Venture, ASX-listed, mining directories)
   - Find IR/investor relations contact
   - Send personalized cold email
   - Expect 1-3% response rate

3. **Industry communities** (medium effort, builds relationships)
   - Mining forums, Reddit (r/mining, r/investing), LinkedIn groups
   - Answer questions, build credibility
   - Mention product when relevant

4. **Consultants as channel** (medium effort)
   - Find IR consultants / investor relations advisors serving junior miners
   - Pitch: "I have a platform that makes their IR life easier, want to beta-test and refer?"

**Recommendation:** Start with Path 1 (network). Send 5-10 emails this week. That's it. Don't overthink.

## Why Not Fiverr/Upwork

User asked about posting on Fiverr/Upwork. **Not recommended.**

**Why:**
- Wrong marketplace (services gigs, not software platforms)
- Wrong price tier (Fiverr starts $5-50; custom IR site is $5k-15k)
- High competition (thousands of web devs bidding on mining projects)
- High commission (20-40% cut)
- Wrong positioning (clients want "build me a site," not "managed IR platform")

**One exception:** Upwork *could* work as secondary channel for "Custom IR Website — Mining Companies" gigs (consulting service, not SaaS). But should not be primary strategy.

## Action Items for Next Session

1. **Week 1:** Reach out to 5-10 people in network or cold-email mining IR contacts (Path 1 or 2)
2. **Week 2:** Follow up conversations, schedule calls with anyone who expresses interest
3. **Parallel:** If no traction by Week 3, open-source the code + post on GitHub (for reputation + visibility)
4. **Post-customer:** Customize system for their needs; learn what real market wants

## Bottom Line

**You have a credible product and professional design. The blocker is customer acquisition, not product quality.**

The fastest path to knowing whether this works:
1. Talk to 10 people
2. Get 1 willing to try it
3. Learn what they actually need
4. Pivot the product based on real feedback, not guesses

Everything else (open-source, platform polish, pivot strategy) is secondary to finding that first customer.
