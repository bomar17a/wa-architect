# W&A Architect — Improvement Work: Notes & Backlog

This file tracks progress against the **"W&A Architect — Comprehensive Improvement Prompt"**
review doc (pasted into chat, not stored as a file in-repo). Picking this back up? Read this
file first, then re-open the todo list in the same conversation (or recreate it from the
"Remaining Backlog" section below) and continue in priority order.

Last updated: 2026-09-18 (session 13). **The original backlog is empty**; sessions 8-13 cover post-backlog work.

> ## ✅ Nothing is blocked
> - `gemini-ai` edge function deployed **v33** — Interview Prep and Story Analysis are live.
> - `profiles` table **applied to production**, RLS verified (anonymous SELECT returns `[]`).
> - Migration history **reconciled** — `supabase db push` works normally again.
>
> Authenticated paths are now covered by `scripts/db/auth-smoke.mjs` (18/18).

---

## How this has worked across sessions

1. Read the full improvement doc (7 known bugs + a UI facelift spec + 10 AdCom-grounded
   feature priorities + a Week-by-week ship order).
2. Did an independent pass over the actual codebase (components, hooks, services, the
   Supabase edge function, DB migrations) to verify which claims in the doc still held —
   **the doc was written against an earlier snapshot of the app; some things it flagged were
   already fixed, and several more significant gaps turned up that it didn't mention at all.**
3. Work happens in small, self-contained commits, each verified with `tsc --noEmit` +
   `npm run build` + a throwaway local preview harness (see "How I visually verify UI changes"
   below) before committing, then pushed straight to `main` per user instruction.

## Important: reconcile doc claims against current code before acting on them further

- **Bug #7 in the doc ("Mobile navigation is broken") was already fixed** before session 1
  started. `components/Dashboard.tsx` has a working fixed bottom tab bar. Don't redo this.
- **Bug #4 ("cards have no hover affordance") was mostly already fixed** — cards already had
  `cursor-pointer` and `hover:shadow-md`; only a lift (`hover:-translate-y-0.5`) was missing.
- Archetype toggles are **6**, not 5 (Investigator, Advocate, Practitioner, Innovator, Leader,
  Balanced) — confirmed from `SCHOOL_ARCHETYPES` in `components/MissionFitRadar.tsx`. Doc
  contradicts itself on this across sections; trust the code.
- **The AMCAS opening date was wrong in the code, not just the doc.** It was hardcoded as
  May 28. The user corrected this directly: AMCAS opens the *portal* (login, coursework entry,
  personal statement upload) in the **first week of May**, historically **May 1st at ~9:30 AM
  ET**. May 28-ish is closer to when *submission* opens — a distinct, later date. Fixed in
  `hooks/useDashboardState.ts` (see `AMCAS_OPENING_MONTH`/`AMCAS_OPENING_DAY` constants).
  If this date ever needs correcting again, it only lives in one place now.

## Independent findings not in the doc

**1. The Most Meaningful Experience essay had no UI at all.** `Activity.mmeAction`,
`mmeResult`, `mmeEssay` existed in `types.ts`, were persisted end-to-end, were scored by the
scoring engine, and `geminiService.synthesizeMmeEssay()` / the edge function's `mme-synthesis`
action existed to write them — but **no component ever rendered an input for them.** Fixed:
`components/Activity/MMEPanel.tsx`. This made "Priority 4: MME Coach" a from-scratch build,
not an enhancement — treat it as done.

**2. `index.html` was shipping a second, conflicting Tailwind engine to production.** On top of
the real Vite+PostCSS `tailwind.config.js` pipeline, `index.html` also loaded
`cdn.tailwindcss.com` with its own stale inline config (missing the new color tokens added this
session — would have silently failed to render `bg-brand-danger` etc. the moment anything used
them), plus a dead browser import map for React/framer-motion/lucide-react/recharts pointing at
`aistudiocdn.com`/`esm.sh` (a leftover from a pre-Vite prototype, confirmed unused via grep —
no dynamic bare-specifier imports anywhere), plus an unused `cytoscape` CDN script. All removed.
`dist/index.html` dropped from 2.76kB to 1.40kB and prod no longer double-loads a JIT CSS engine.
**If a future change needs a Tailwind color/token to show up and it isn't rendering, this is not
an issue anymore — but if someone re-adds a CDN script to `index.html` "to fix styling," push
back — it's the wrong direction.**

**3. `components/Dashboard.tsx` imported `ACTIVITY_WEIGHTS` from `constants.ts`, which doesn't
exist there and never did.** It was an unused import, so it silently never failed the build
(esbuild/Rollup didn't catch it) — but it's exactly the kind of thing that breaks the moment
someone changes the bundler config. Removed.

**4. `useDashboardState`'s `activeTab` state was typed `'overview' | 'mission-fit'`** even
though `Dashboard.tsx` sets/compares it against `'school-recommender'` throughout. Empirically
confirmed this doesn't currently produce a `tsc` error in this project's config (tested with a
minimal in-project repro) — but it's still a wrong type. Widened to a proper `DashboardTab`
union type, now exported from the hook.

## How I visually verify UI changes (no seeded auth account exists)

There's no test account for this Supabase project, and the existing Playwright spec
(`tests/resume_upload.spec.ts`) explicitly notes auth can't be bypassed in E2E. Rather than
create a real account against the live project, each UI change in this session was verified by:
1. Writing a temporary `preview.html` + `preview-entry.tsx` at the repo root that mounts
   `<Dashboard>` directly with mock `activities` data and the real `AuthProvider`/`ToastProvider`
   (Dashboard doesn't gate on `session`, only reads `user` optionally — works fine logged out).
2. `npm run dev`, then a small Playwright script (`chromium.launch()`, no `chromium-cli` in this
   environment) to screenshot and/or exercise the feature (click-through, clipboard reads,
   download interception).
3. Deleting the temporary files before committing — **never commit `preview.html`,
   `preview-entry.tsx`, or `_preview_screenshot*.mjs`.**

This pattern is reusable for the remaining backlog items below.

---

## Completed so far

All changes build clean (`npm run build` and `tsc --noEmit` both pass — `tsc` alone shows
unrelated pre-existing errors under `temp_skills/`, a scaffolding folder not part of the app;
filter those out or just trust `npm run build`, which is what CI's
`.github/workflows/build-check.yml` runs).

**Session 1:**
- Bug fixes: float display bug in Mission Fit Radar gap analysis, "5 archetypes" → "6", Settings
  no-op → real `SettingsModal`, activity card hover lift, empty-state CTA, readiness % label.
- Built the MME writer UI from scratch (`MMEPanel.tsx`) — see finding #1 above.

**Session 2:**
- **UI facelift**: extracted shared `components/Dashboard/ScoreDial.tsx` (light/dark variants),
  added a dark hero score panel to the top of the Dashboard overview tab (replaces the old
  standalone "Clinical Insight Nudge" banner so the insight isn't told twice), redesigned
  activity cards (colored left border by status, status/hours/char-count pills, staggered
  fade-in via framer-motion), added `brand-highlight`/`danger`/`success`/`surface`/`card` tokens
  to `tailwind.config.js` (additive only — core teal/gold/dark hex intentionally untouched, see
  reasoning in the commit and below), fixed findings #2 and #3 above.
- **Red Flag Audit** (`services/redFlagService.ts`): six client-side, no-backend checks —
  Impossible Hours (was silently capped in scoring, now surfaced as a message), Shadowing
  Overload, Short-term Pattern, Clinical Gap, MME Selection Quality (prestige vs. meaning), AI
  Prose Detector (unedited-LLM phrase tells). Surfaced as dismissible cards on the Dashboard
  (full-portfolio) and as a persistent strip in `ActivityEditor` (scoped to one activity).
- **Export to AMCAS Format** (`services/exportService.ts` + `ExportModal.tsx`): a
  `sanitizeForAmcas()` pass strips markdown/bullets/smart-quotes per the doc's explicit
  requirement, then offers `.txt` download, copy-per-activity, copy-all — plus, per a mid-session
  user request beyond the original doc scope, **Excel/Google Sheets via `.csv`** and
  **Word/Google Docs via `.doc`** (a formatted HTML document saved with a `.doc` extension and
  `application/msword` type — both Word and Google Docs' importer open this directly; avoided
  adding `xlsx`/`docx` npm dependencies for either). Print/Save-as-PDF reuses the same HTML
  builder as the `.doc` export.
- **Deadlines + AMCAS countdown + cycle selector**: `useDashboardState` now owns
  `computeAmcasInfo()` (color-coded green/amber/red, handles the "already open" case) and a
  localStorage-persisted cycle-year override; new Settings > Application Cycle control; new
  "Upcoming Deadlines" strip on the Dashboard reading `Activity.dueDate` (existed, was never
  surfaced anywhere); fixed the auto-save chip being `hidden sm:flex` (invisible on mobile);
  fixed finding #4 above.
- **AMCAS date correction** (see "Important" section above) — this was a real data-accuracy bug
  in the app, not just documentation.

### Key files added this session
- `components/Dashboard/ScoreDial.tsx`
- `services/redFlagService.ts`
- `services/exportService.ts`, `components/Dashboard/ExportModal.tsx`
- `components/Dashboard/SettingsModal.tsx` (session 1) — extended with cycle selector (session 2)
- `components/Activity/MMEPanel.tsx` (session 1)

---

## Session 3 additions

- **Narrative Quality Score** (`services/narrativeQualityService.ts`): 0–100 across four 0–25
  sub-scores (Specificity, Quantification, Reflection, Voice Authenticity). Voice reuses the
  existing weak-verb/cliché/passive detector as a penalty signal rather than duplicating it.
  This is the **client-side heuristic** version, labeled as such in the UI tooltip. NQ pill on
  Dashboard cards, live sub-score bars in the editor.
- **Onboarding wizard** (`components/Onboarding/OnboardingWizard.tsx`): 3 steps, shown once to
  users with no onboarding flag *and* zero activities. Step 2 reuses the already-deployed
  `parse-resume` action, so it works today. Step 3's North Star pick feeds `MissionFitRadar`'s
  initial archetype selection.
- **Interview Prep Mode** + **Application Story Analysis** — built and merged, **awaiting the
  deploy called out at the top of this file.**
- Fixed the AACOMAS MME-persistence bug previously listed under "small things".
- Fixed a stale-deadline bug found by running the app: the panel sorted ascending, so the most
  stale item got top billing and buried actionable dates. Now excludes anything >30 days past.

### Key files added in session 3
- `services/narrativeQualityService.ts`, `components/Activity/NarrativeQualityBreakdown.tsx`
- `components/Onboarding/OnboardingWizard.tsx`
- `components/Activity/InterviewPrepPanel.tsx`, `components/Dashboard/StoryAnalysisModal.tsx`

---

## Remaining backlog

**Empty.** The landing page overhaul — the last item from the original review doc — shipped in
session 7. See that section below for what was built and, more importantly, for the unsupported
claims that were already live on the page.

---

## Supabase access — what actually works (corrected 2026-08-26)

**Sessions 1–3 recorded this wrongly.** They checked `which supabase`, got nothing, and
concluded deploys were impossible. That was an incomplete check. The real situation:

- ✅ **`npx supabase` works.** No global install needed. `which supabase` fails but that
  proves nothing — always test `npx --yes supabase@latest --version` instead.
- ✅ **Already authenticated.** Credentials live in the OS credential store (Windows
  Credential Manager), not a dotfile, which is why `ls ~/.supabase` looked empty.
  `npx supabase projects list` returns the org's projects.
- ✅ **Edge function deploys work.**
  `npx supabase functions deploy gemini-ai --project-ref jitzwwxsnpylaistotgq`
- ✅ **Project is linked** (state in `supabase/.temp/`, now gitignored).
- ❌ **`supabase db push` fails.** The account lacks `CREATEROLE`/`ADMIN` on
  `cli_login_postgres`, which the CLI's migration flow needs to bootstrap a login role:
  `LegacyDbConfigLoginRoleStatusError ... permission denied to alter role`.

### Applying migrations despite that

Don't fix this by granting `CREATEROLE` on production — that's far more standing privilege
than a migration needs. Two lower-privilege options:

1. **Dashboard SQL editor** — paste the migration file's contents and run. Zero credential
   handling, works immediately. Best for one-off migrations.
2. **Set the DB password as an env var**, then push — bypasses the login-role bootstrap:
   ```
   export SUPABASE_DB_PASSWORD='...'      # set it yourself; never paste it into chat
   npx --yes supabase@latest db push
   ```
   Get/reset it at Dashboard → Project Settings → Database → Database password.

Either way, **verify RLS is enabled** on any new table afterward — `profiles` holds
per-user application data and its policies are the only thing preventing cross-user reads.

### Edge function actions currently supported

`supabase/functions/gemini-ai/index.ts` (deployed v33): `draft-analysis`, `rewrite`,
`mme-synthesis`, `parse-resume`, `parse-msar`, `theme-analysis`, `interview-questions`,
`story-analysis`.

A new action added to that file does not go live until it is deployed. The auth guard runs
*before* action routing, so an unauthenticated probe returns 401 for every action name — you
cannot confirm a new action is routed by curling it without a real user JWT. Check the version
number instead: `npx supabase functions list --project-ref jitzwwxsnpylaistotgq`.

## Small things noticed but not yet acted on (low priority / judgment calls)

- `useDashboardState.ts` exports a `scrollToTop` function that's never called from
  `Dashboard.tsx` — dead code, harmless, low priority to remove.
- ~~`App.tsx` AACOMAS MME-persistence bug~~ — **fixed in session 3.**
- `stats.html` at repo root is a tracked bundle-analyzer artifact (from
  `rollup-plugin-visualizer`) that's *not* in `.gitignore` even though `dist/` is. It churns on
  every build (visible as a stray modified file in `git status` after any `npm run build`) — not
  committed as part of any change this session, left as pre-existing. Worth gitignoring later
  (ask before removing it from tracking).
- The doc's proposed deep-teal re-skin (`#2E6B6B` → `#0D5C63` etc.) was deliberately not done —
  see the UI facelift entry above and the session-1 reasoning preserved in git history
  (`git log --grep=facelift`). Revisit as its own dedicated pass with real browser QA if wanted.
- No true `.xlsx`/`.docx` generation — the CSV/`.doc`-via-HTML approach in the Export feature was
  a deliberate trade-off to avoid new dependencies. If a user reports formatting issues opening
  the `.doc` file in a specific Word version, that's the first place to look; the alternative is
  adding the `docx` npm package and generating a real OOXML document.

---

## Session 4 (Supabase access)

Corrected a wrong belief carried through sessions 1–3: deploys were never actually blocked.
`which supabase` fails but `npx supabase` works, and credentials were already in the OS
credential store. See "Supabase access — what actually works" above.

- Deployed `gemini-ai` v32 → v33, activating Interview Prep and Story Analysis.
- Created and applied the `profiles` table. Verified RLS end-to-end: anonymous REST SELECT
  returns `[]`, and role grants match the working `activities` table so logged-in users can
  read their own row.
- **Recovered the lost May 12 migration.** It was `reclassify_school_archetypes` — a DATA
  migration applied via the dashboard and never committed, correcting
  `medical_schools.primary_category` (16 schools Advocate→Balanced; Harvard, UChicago, WashU
  →Investigator). Those categories drive archetype match scores, so a fix to core
  recommendation logic existed only in production. Now committed.
- Reconciled migration history: renamed local files to the versions that actually ran and
  removed duplicate rows. `db push` reports "Remote database is up to date".
- Moved onboarding state, cycle year and North Star off localStorage onto the profiles row,
  with a migration path so already-onboarded users aren't shown the wizard again.

### Running migrations from here
`supabase db push` works now. For anything it chokes on, `scripts/db/apply-migration.mjs`
connects directly (transaction-wrapped, reads `SUPABASE_DB_PASSWORD` from the env).
Permission rules for that live in `.claude/settings.local.json`, which is gitignored on
purpose — in the repo, anyone cloning would inherit auto-approval for `scripts/db/*`.

**Do NOT** "fix" migration drift with `supabase migration repair --status reverted` (the
CLI suggests it). That records live migrations as rolled back, which is false and risks
them re-running against a database that already has those objects.

---

## Session 5 — backlog closed except the landing page

All three remaining buildable items shipped. Edge function is at **v35**, migrations report
"Remote database is up to date", and `main` is in sync.

- **School Targeting Mode** (the last untouched doc feature). Star up to 5 schools in the
  Recommender → `profiles.target_school_ids`; the editor's `SchoolTargetingPanel` rates the
  entry against each school's real mission statement and suggests one alignment sentence.
  The prompt requires suggestions stay truthful to what the applicant actually wrote and to
  return nothing rather than invent experience — AdComs interview on these entries.
- **AI-scored Narrative Quality.** "AI Score" grades the four dimensions via Gemini plus a
  weakness summary and top fix. The badge is labeled `est` vs `AI` so a heuristic guess is
  never mistaken for a real read, and the AI score clears on edit rather than describing text
  that no longer exists. Sub-scores are clamped 0–25 client-side against malformed responses.
- **Drag-to-reorder** with a new `sort_order` column (backfilled from the existing
  created_at order so no list visibly reshuffled). Native HTML5 drag **plus** up/down
  buttons — HTML5 drag does not work on touch and this app has a mobile nav, so drag alone
  would have been desktop-only. Buttons also give keyboard/screen-reader users a real path.
  Reordering is disabled during search so a drop can't reshuffle hidden entries.

### Still untested anywhere
The **authenticated** paths have never been exercised — profile row creation, the
localStorage→profile migration, wizard writes, target-school persistence, and every AI action
(they all 401 without a real user JWT). There is still no test account. This is now the
single largest verification gap; a throwaway signup would close most of it in a few minutes.

---

## Session 6 — authenticated paths verified

`scripts/db/auth-smoke.mjs` closes the gap that every prior session flagged. It creates a
throwaway **pre-confirmed** user via the Auth Admin API (so no confirmation email is sent to
anyone), exercises the real endpoints as that user, and deletes it afterwards. It never prints
tokens, passwords, or the service-role key.

```
SR=$(npx supabase projects api-keys --project-ref jitzwwxsnpylaistotgq --output json \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);process.stdout.write(j.find(k=>k.name==='service_role').api_key)})")
SUPABASE_SERVICE_ROLE_KEY="$SR" node scripts/db/auth-smoke.mjs        # add --keep to leave the user for UI testing
```

**18/18 passing.** Covers profile creation, onboarding writes, target-school persistence,
sort_order round-trip, all five AI actions, RLS isolation, and rejection of unauthenticated
edge-function calls.

### Two real bugs it caught
1. **Deleting a user failed.** `activities.user_id` had no `ON DELETE CASCADE`, so removing a
   user who owned activities threw an FK violation — account deletion / GDPR erasure would
   have failed for any real user. `profiles` cascaded; `activities` did not. Fixed in
   `20260826020000_activities_cascade_on_user_delete.sql`.
2. **Gemini silently dropped response fields.** `school-alignment` returned `fit: undefined`
   because Gemini treats `responseSchema` properties as optional unless named in `required`.
   Added `required` to the three newer schemas and constrained `fit` to an enum. The other
   handlers passed by luck — worth adding `required` to any future schema by default.

### Note for future testing
`example.com` is rejected by Supabase signup validation, and the public signup endpoint sends
a real confirmation email — do not sign up against a domain you do not control. Use the Admin
API with `email_confirm: true` as this script does. Always verify cleanup afterwards:
production should stay at its real counts with zero `claude-qa-%` users.

---

## Session 7 — landing page rebuilt; the backlog is closed

`components/LandingPage.tsx` was the last untouched item. It is now a slim composition root over
`components/Landing/*`, with **every user-facing string in `components/Landing/landingData.ts`** so
claims can be audited in one file instead of hunted through JSX.

### The part that matters more than the redesign

The page was already shipping claims the code does not support. These were live, not proposed:

| Claim | Reality |
|---|---|
| "Methodology aligned with core competencies from: AAMC · Harvard Medical · Stanford · Johns Hopkins" | Only the AAMC list is real. Those three schools appear in the repo solely as rows in the 175-school mission table. It read as institutional endorsement. |
| "Dataset Sample / +10k Verified Profiles" | No such dataset exists anywhere. |
| `index.html` meta: "10,000+ AMCAS work and activities section examples" | Same. |
| `MissionFitRadar`'s **"Admitted Student Avg."** series | The hardcoded `HERO_TARGET` constant `{Inquiry:7, Service:8, Teamwork:7, Clinical:8}`. No admissions outcome data exists in this repo. **This one was shipping inside the app**, not only on marketing. Renamed to "Archetype Target". |

All removed. Added in their place: a footer line stating no affiliation with the AAMC, AMCAS, or
any medical school, and an on-panel disclosure that the hour thresholds are our heuristics rather
than published admissions data.

**If anyone proposes adding testimonials, acceptance rates, or school logos to this page, the
answer is still no** unless the claim is real and permissioned. The product is sold to applicants.

### What the page argues

GPA and MCAT are filters that clear the screen; Work & Activities is what the interview decision
is made from. And since the 15 entries are the raw evidence, writing them *first* surfaces the
themes a personal statement should start from. The page never claims a personal-statement
feature — none exists. `theme-analysis` in the edge function is still dead code; the live
portfolio-level feature is `story-analysis` ("Analyze My Story"), and that is what the Themes tab
demonstrates.

### Structure
Four-tab product frame (Score & gaps / Rewrite / Themes / Mission fit) with real `tablist`
semantics and arrow-key navigation. The before/after comparison is a toggle now — the old
`ComparisonSlider` was a mouse/touch drag with no keyboard path at all.

### Two decisions worth not re-litigating

1. **The mission-fit panel deliberately does not reuse `<MissionFitRadar>`.** That component reads
   profile context and fetches schools from Supabase on mount, which has no business firing on a
   logged-out marketing page. The panel uses recharts directly with static sample data, same four
   pillars and same visual language.
2. **No scroll-triggered reveals.** An earlier pass used framer-motion `whileInView`, and three
   sections rendered completely blank — content starts at `opacity: 0` and depends on an
   IntersectionObserver that a full-page screenshot (and any crawler) never fires. Marketing copy
   has to be in the DOM and visible without waiting on JS. The hero's mount animation stays.

### Verification
`tsc --noEmit` and `npm run build` clean. Playwright at 390 / 768 / 1440: no horizontal overflow,
no console errors, tab arrow-keys work, the rewrite toggle works, and CTA → signup → back returns
to the landing page. That last path is new — `App.tsx` had a literal "add a back button mechanism
here if desired" comment and visitors who clicked Log in were stranded.

### Still open (small, deliberate)
- `index.html` has **no `canonical` or `og:url`** — the production domain was not in the repo, so
  they were left as a TODO rather than guessed. Fill them in; the rest of the OG/Twitter tags are
  there.
- Favicon is still Vite's default `/vite.svg`.
- The old FAQ claimed "successful matriculants average 12-13 high-quality entries." No source for
  that exists in the repo, so it was cut. Restore it only with a citation.

---

## Session 8 — export formats, assets, and a sanitizer bug worth knowing about

### The bug: `sanitizeForAmcas` never stripped smart quotes

Found while verifying the new .docx actually contained sanitized text. The source held:

```
.replace(/[""]/g, '"')
.replace(/['']/g, "'")
```

Both character classes contained **plain ASCII** `0x22` / `0x27`, not curly quotes — flattened by
an editor or encoding pass at some point. So each line read "replace a straight quote with a
straight quote": a silent no-op. The adjacent dash rule still had real U+2013/U+2014, which is
why em dashes converted correctly and quotes didn't — and why this went unnoticed across seven
sessions.

It affected **every export path**: .txt, clipboard copy, spreadsheet, document, print. AMCAS
strips formatting and curly quotes can land as mojibake in its text box, so this was the one job
the function existed to do.

Now written as `\u` escapes (`/[\u201C\u201D\u201E\u201F\u2033]/g`) so an editor cannot flatten
them again, extended to prime marks, ellipsis, minus sign and non-breaking spaces. The
bullet-glyph class was hardened the same way.

**Lesson for this repo: do not put literal non-ASCII glyphs inside regex character classes.**
If you see one, treat it as suspect and check the bytes with `od -c`, not your eyes — a flattened
curly quote and a straight quote are visually identical in most editors.

### Real .docx / .xlsx

"Word / Docs" was an HTML document renamed `.doc`; "Excel / Sheets" was a `.csv`. Both opened, but
neither was the real format. Now generated with `docx` and `write-excel-file`.

- Both are **dynamically imported**, so they code-split into their own chunks. Main bundle grew
  2.8kB rather than ~350kB. Keep it that way — do not hoist these to top-level imports.
- `write-excel-file` v4 has **no root export**; use `write-excel-file/browser`. It returns
  `{ toBlob, toFile }`, not a Blob, so we call `toBlob()` and use our own `downloadBlob`.
- Print-to-PDF still uses `buildActivitiesHtmlDocument`; that path is unchanged.
- Neither package introduced a vulnerability (`@xmldom/xmldom` in the audit predates this and
  comes from `mammoth`).

### Assets
Real favicon (`public/favicon.svg`, solid-fill so it survives 16px — the nav's stroked mark does
not), a PNG `apple-touch-icon` (iOS ignores SVG for that rel), and a 1200x630 `og-image.png`.
`twitter:card` is back to `summary_large_image` now that there is an image behind it.

### Cleanup
`stats.html` is gitignored and untracked (build output from rollup-plugin-visualizer). Dead
`scrollToTop` removed from `useDashboardState`.

### How the exports were verified
No auth needed. A throwaway harness mounted `<ExportModal>` directly with `DEMO_ACTIVITIES`, and
Playwright clicked the real buttons and intercepted the downloads. The files were then unzipped
and inspected: valid OOXML (PK magic, `xl/workbook.xml` and `word/document.xml` present), content
populated, and a `**markdown**` + curly-quote + em-dash test string came out as plain ASCII.
Delete `_modal_test.*`, `_export_test.*` and `_dl*/` before committing — never commit them.

### Still open
- The deep-teal re-skin remains deliberately not done (see session 1 reasoning in git history).

---

## Session 9 — scoring recalibration (Mission Fit Radar + School Recommender)

Reported by the user: a profile with 5 activities, one 500-hour research role, and **zero
clinical hours** scored 10/10 on Inquiry and a 76% match against four schools that all read
76%. Both numbers were wrong, for different reasons.

### What was actually broken

- **The Inquiry curve topped out at 500 hours.** `milestone()` flatlines at its last breakpoint,
  and that breakpoint was `[500, 10]`. In published matriculant data 500 research hours is the
  *middle* of the sustained-engagement band. The "AAMC-researched" header comment cited nothing,
  and `utils/scoring.tsx` separately used a research target of 100h — the two engines disagreed.
- **The match formula never punished a zero.** `Σ min(student, target) / Σ target` caps
  overperformance but a missing pillar only costs its own weight, so no clinical experience at
  all still cleared 76%.
- **The two tabs used different formulas.** The Radar did cosine × magnitude ratio; the
  Recommender did the coverage ratio above. Same profile, two different numbers.
- **Nothing school-specific entered the match**, so a whole archetype bucket shared one score.

### What changed

Curves now run to genuine top-decile figures (2,000 research hours for a 10) with the sources in
the header comment. An **evidence gate** caps each pillar by how many distinct activities support
it (1 → 6.5, 2 → 8.5, 3+ → 10), because logged hours are self-reported and one huge claimed
number should not outrank three sustained roles. The soft-bonus ceiling dropped 2.0 → 1.25; at
20% of the scale it had been pushing merely-solid profiles to a flat 10.0 on three pillars.

One shared match formula now serves both tabs: coverage × balance (weakest pillar drags) × shape
(is your emphasis where this school looks) × completeness. Archetype targets were re-derived onto
the new scale, and the readiness score re-weighted so the pillars carry 70 of 100 rather than
competing with 47 points of bonuses that mostly measure diligence at filling in the form. Tier
cutoffs (40/70/90) are unchanged and still mean what they say.

**On the reported profile: Inquiry 10 → 6.5, match 76% → 26%, readiness 37 → 31.**

### Structure — read this before touching the scoring again

The engine moved **out of `components/MissionFitRadar.tsx`** into `utils/missionFit.ts`, and the
numeric half of the readiness score into `utils/adcomScore.ts`. Neither imports React or Supabase.
`utils/scoring.tsx` is now only a presentation wrapper that attaches lucide icons to feedback
items. `MissionFitRadar.tsx` re-exports from `utils/missionFit` so existing import paths still work.

This split exists so the engine can be run headlessly. **`node scripts/calibrate-scoring.ts` is
the acceptance test** — five reference profiles asserted into bands, plus monotonicity and
archetype-reachability checks. No new dependency; Node 24 strips the types natively (hence the
explicit `.ts` extension on the runtime import in `adcomScore.ts` — `allowImportingTsExtensions`
was already on). **If you change a curve, a bonus, or a match constant, run it.**

One thing the harness taught us mid-session, worth not re-litigating: the AdCom score must rise
strictly across the reference ladder, but the **match may not** — it measures fit to one
archetype and saturates by design. Once an applicant clears every target a school looks for,
being stronger cannot make them a better fit. Strong and Exceptional both land at the 95% ceiling
and that is correct; they separate on the readiness score (86 vs 93), not on match.

### Per-school targets — generated, NOT applied

`scripts/derive-school-targets.ts` reads each school's published mission statement and emits a
target vector + emphasis tags into `school_targets.json` (reviewable; records the matched terms
per pillar). `scripts/build-school-targets-migration.mjs` turns that into
`supabase/migrations/20260908000000_add_school_target_vectors.sql`.

> **Correction (session 13):** it has been applied. A read of production on 2026-09-18 found
> target vectors and `emphasis_tags` on all 175 rows. The paragraph below describes the state
> when session 9 ended.

**The migration has not been applied.** `schoolTargets()` falls back to the archetype baseline
whenever the columns are absent or null, which is the state of the live table today — so the app
is correct either way, and applying it is a deliberate follow-up, not a prerequisite.

It is a **keyword lexicon, not a model**, on purpose: these numbers are shown to applicants making
expensive decisions, so each adjustment should trace to the words that caused it. It also could
not have been a model here — the Gemini key lives in edge-function secrets and `geminiService`
requires an authenticated session, and there is still no test account.

Sanity check on a median-matriculant profile: matches spread 52–81% across 27 distinct values,
and rank sensibly (research-heavy → UT Southwestern / UC Irvine; service-heavy → Alice L. Walton /
UBC, each the other's worst fit).

---

## Session 10a — exemplar corpus, and what it revealed about the NQ heuristic

Goal was a Supabase corpus of published AMCAS Work & Activities entries to ground `draft-analysis`
and `narrative-quality`. The corpus got built. The more useful outcome was that pointing it at the
existing scorer showed the scorer is measuring the wrong things.

### The heuristic is broken, and it fails upward

`scoreNarrativeQuality()` in `services/narrativeQualityService.ts` runs on every keystroke and is
the number users see in the header bar before any AI call resolves. Eight entries from the corpus
were hand-scored on the same 0-25 scale and run against it:

```
entry                                  human  heuristic   delta
sorority-philanthropy-coordinator       57        73     +16
lyme-disease-research                   52        46      -6
custom-sneakers                         52        65     +13
patient-navigator-interpreter           51        73     +22
ed-technician                           44        45      +1
ed-assistant                            37        55     +18
lawrence-memorial-shadowing             28        53     +25
maple-grove-hospital-volunteer          26        57     +31
```

Six of eight score too high, and **the error grows as entries get worse** — the two weakest are off
by +25 and +31. That is the wrong direction for a coaching tool: it is most wrong exactly where a
user most needs to be told something is wrong.

Direct probes of the mechanisms (all reproducible with `scoreNarrativeQuality`):

- **Specificity is length wearing a disguise.** 20 sentences of contentless filler ("The work
  continued. My role expanded. The team responded.") scores **25/25 specificity, 25/25 voice,
  59/100 total**. `lengthScore` maxes out at 250 characters, and the named-entity regex
  `/[a-z][.,!?]?\s+[A-Z][a-zA-Z]+/g` matches every sentence boundary, so any multi-sentence draft
  of normal length collects the full 25. `maple-grove-hospital-volunteer`, the emptiest entry in
  the corpus, scores a perfect 25.
- **That filler outscores the corpus.** 59 beats the Lyme research description (46) and the ED
  technician description (45), both of which are genuinely good writing.
- **Quantification is a digit counter.** "I saw 1 patient, 2 patients, 3 patients, and 4 patients"
  → **25/25**. Four numerals is full marks, and `$20,000` counts as two. Meanwhile "results
  indicated a risk for human infection well above the established threshold" → **0**.
- **Voice is 25/25 unless a listed cliché appears.** Four uses of "wonderful" plus "I had the
  pleasure of" scores 23-25, because that padding vocabulary is not in the `CLICHES` map.
- **Reflection is keyword bingo.** Nine points per hit from a 17-word list, so three hits is full
  marks and real reflection phrased differently scores zero.

Not fixed this session — the fix is a rewrite of all four dimensions, and it deserves its own
pass with the harness already in place to prove it. `scripts/audit-exemplars.ts` currently exits 1
on `voiceAuthenticity` (MAE 8.25 against a threshold of 5.0). **That failure is the accurate
state of the code, not a broken test.**

### The corpus

`data/amcas-exemplars.json` — 47 entries from two Cracking Med School Admissions PDFs, normalised
to the 18 AMCAS types, banded `exemplar` / `solid` / `weak` / `counter_example`, each with a
required `curator_note` saying why it lands there. `data/README.md` has the governance rules.

The source PDFs needed real curation, not import:

- Two entries filed under **"Community Health Advocacy"**, which is not an AMCAS experience type.
- One entry titled **"Clinical Shadowing at Vibrant Health Clinic"** whose description is about
  tutoring for Varsity Tutors. Loading that verbatim teaches a classifier to map tutoring text to
  shadowing.
- One hours field reading **"3 years"**.
- **10 of 47 descriptions are over the 700-character limit**, two MMEs over 1,325. Median
  description is 689 characters, so the distribution sits right against the ceiling and a fifth of
  it spills over. These are published examples that could not be submitted as written.

Coverage is 12/18 experience types and 15/15 AAMC competencies. Missing: Artistic Endeavors,
Conferences Attended, Intercollegiate Athletics, Military Service, Other, Publications.

**Anchors are scored against the `description` field only**, because that is the only text
`scoreNarrativeQuality()` ever receives. The first version of the anchor set was scored against
whole entries and reported a 33-point error on Lyme that was largely the curator's, not the
scorer's. Worth not repeating.

### Retrieval — wired, migration NOT applied

`supabase/functions/gemini-ai/index.ts` gained `fetchExemplars()` plus two renderers.
`narrative-quality` now receives up to four scored anchors so "a mediocre entry should score in
the 40s" has something behind it; `draft-analysis` receives one strong and one weak entry of the
same type with the curator's reasoning attached.

Three properties this is built to hold:

1. **Nothing reaches the browser.** `public.wa_exemplars` has RLS enabled and **no SELECT policy**
   — clients read zero rows, `service_role` bypasses. The edge function is the only reader.
2. **The model may not quote.** Every prompt forbids quoting or paraphrasing exemplars into
   feedback; keepers and trimmers must come from the applicant's own draft.
3. **Retrieval is optional.** `fetchExemplars()` never throws and returns `[]` on any failure, so
   both prompts degrade to exactly the text that shipped before this existed. Same posture as the
   school-target vectors in session 9.

`supabase/migrations/20260908120000_create_wa_exemplars.sql` and
`scripts/db/seed-exemplars.mjs` are **applied and seeded** (47 rows), and `gemini-ai` is deployed
at **v38**, which also activated `narrative-quality` on flash-lite and the bounded
`draft-analysis` output.

`pg` is a normal `devDependency` now, so `npm ci` is all anyone needs — it used to be installed
ad hoc, which meant a fresh clone hit a module-not-found on the first migration or seed with
nothing explaining why. The seeder still imports it lazily, but for a different reason: `--dry-run`
is the schema-drift check that runs in CI, and CI should not need a database driver to run it.

### Two small import fixes

`constants.ts` and `narrativeQualityService.ts` needed explicit `.ts` extensions, and
`constants.ts` needed `type`-qualified imports, so the corpus harness can run headlessly the way
`calibrate-scoring.ts` does. Note the harness needs `--experimental-transform-types`, not bare
`node`, because `types.ts` exports enums and strip-only mode rejects those. `npm run build` is
unaffected.

### Still open
- ~~Rewrite the four NQ dimensions against the anchors.~~ Done in session 10b.
- Apply the migration and seed, then deploy the edge function.
- Six uncovered experience types; a second source with a different house style would help more
  than more entries from this one.

---

## Session 10b — the NQ rewrite

`scoreNarrativeQuality()` is rewritten. The audit harness now passes.

```
                 tuning MAE      held-out MAE
before              16.50              n/a
after                6.13             6.25     generalisation gap +0.13
```

### Protocol

Eight more anchors were hand-scored **before** the rewrite and withheld during it
(`anchor_set: "holdout"` in the corpus). Sixteen anchors against roughly a dozen weights is
thin enough to overfit by accident, and a scorer tuned into agreement with its own tuning set
proves nothing. The +0.13 gap is the evidence that the weights track the rubric rather than
those eight rows. `scripts/audit-exemplars.ts` gates both sets independently and fails on a
generalisation gap over 6 points.

### Three of the four fixes were bugs, not weights

- **Substring matching.** `includes()` scored "ratio" inside *collabo**ratio**n*, "weekly"
  inside *bi**weekly***, and both "sample" and "samples" on the single word *samples*. Three
  false positives that pushed entries containing no numbers at all to 12/25 on quantification.
  Everything now matches on word boundaries.
- **Specificity was length.** `lengthScore` maxed out at 250 characters and the named-entity
  regex `/[a-z][.,!?]?\s+[A-Z][a-zA-Z]+/g` matched every sentence boundary, so any
  multi-sentence draft collected all 25. Proper nouns are now counted **distinctly** and
  sentence-initial capitals are excluded, so repeating one doctor's name six times is one
  specific, not six.
- **Voice had no ceiling logic.** Starting at 25 and subtracting meant any entry with no
  detectable tells scored full marks — `psychiatric-ward-volunteer` (clean, institutional,
  human 16) tied with the most distinctive prose in the corpus. Base is now **19**, with the
  last six points earned by `voiceCredit()`: a non-"I" opening, a question, an admitted
  interior state, genuinely varied pacing.
- **Reflection was keyword bingo** — 9 points per hit from one flat 17-word list, so three uses
  of "learned" maxed it. Now five categories scored by **breadth** (learning, change, revision,
  forward-link, interiority) with diminishing credit inside each. A sixth, `transfer`, was added
  after the first pass scored `in-house-mechanic` ("other facets of my life") 4 against a human
  14 and `x-house-orphanage` ("a person is not their illness") 0 against a human 15 — both
  generalise, neither uses a learning verb.

### The pathologies, before and after

| probe | before | after |
|---|---|---|
| 20 sentences of contentless filler | **59** (spec 25, voice 25) | **31** (spec 11, voice 16) |
| "I had the pleasure... wonderful... truly memorable" | voice **25** | voice **0** |
| "a risk well above the established threshold" | quant **0** | quant **6** |
| `lyme-disease-research` description | 46 | 55 |
| `maple-grove-hospital-volunteer` (the empty one) | 57 | 19 |

Filler used to outscore every real entry in the corpus. It now sits below all of them.

**Still generous in one place**, and left that way on purpose: "I saw 1 patient, 2 patients, 3
patients, and 4 patients" still scores 18/25 on quantification. A lexicon cannot tell a
meaningful number from a meaningless one. Its specificity (12) and reflection (0) drag the total
to 49, below the corpus's good entries, so the composite behaves even where the dimension does not.

### One real bug found on the way

`services/aiCache.ts` keys on `hash(payload)` with a hardcoded `VERSION = 'v1'`. Once the edge
function injects exemplars, the same draft produces different output — but every user with a
cached `draft-analysis` or `narrative-quality` result would keep seeing the pre-grounding answer
for up to the 30-day TTL. Bumped to **v2**, which `prune()` self-cleans. **Bump it whenever an
edge-function change alters output for an unchanged payload.**

### Still open
- Apply `20260908120000_create_wa_exemplars.sql`, seed, deploy the edge function. Nothing is live.
- ~~Nothing scores the MME.~~ Done in session 10c. Was: `mmeEssay` has a 1,325-character budget, is one of only three per
  application, and gets no quality signal at all — the largest single gap in the product.
- The AI score and the heuristic can disagree by 30 points with no reconciliation shown.
- Six uncovered experience types; AACOMAS has no corpus at all.

---

## Session 10c — the MME scorer

Nothing scored the Most Meaningful Experience remark. `scoreNarrativeQuality()` was only ever
called on `description`; the 1,325-character box — three per application, the highest-leverage
writing in the app — got no quality signal at all. It has one now: `scoreMmeQuality(mme, description)`.

```
              tuning MAE   held-out MAE   gap
MME scorer        4.43          7.86     +3.43
```

Fourteen MME anchors, hand-scored by reading and **recorded before the scorer was written** —
7 tuning, 7 held out. Same protocol as 10b.

### It needed its own rubric

Not the description's four dimensions. AMCAS asks two things of this box (what you learned, how
it prepared you to practise medicine), so quantification is close to irrelevant. The dimensions
are **insight / evidence / distinctness / voice**, and the third one is why this could not be a
parameter on the existing scorer:

**Distinctness needs both texts.** The characteristic MME failure is re-telling the 700 in 1,325,
and it is invisible inside either text alone. `clinical-research-internship-neuro` reads fine
twice over and is still spending most of its MME on the ODI-score story its entry already told.

### The overlap metric was wrong the first time

The first implementation measured **4-gram containment**, on the theory that shared phrasing is
the tell. It returned **0-2% for all 14 entries**, including the one a reader scores 7/25. The
retelling is a paraphrase — no n-gram survives it.

Switching to **content-word overlap** (stopwords and unavoidable clinical vocabulary excluded)
tracks the reader almost monotonically:

```
overlap   17%  15%  13%  13%  11%  10%  10%   7%   7%   7%   6%   5%   4%   3%
human      7   14   14   20   17   16   10   19   21   24   22   23   23   23
distinctness
```

n-gram containment stays as a separate check — verbatim copy-paste is a different and worse
failure than paraphrased retelling, and it now costs an extra 4 points when it appears.

### Two more findings worth keeping

- **Proper nouns barely carry evidence in an MME.** The most concrete passage in the corpus — a
  pineal tumour obstructing the circulation of cerebrospinal fluid — contains none. Evidence is
  now carried by `technicalVocabulary()`: distinct words of 9+ characters that are *not*
  abstractions. The exclusion list matters as much as the rule; without it
  `midland-care-hospice` scored as full of detail on the strength of "preconceptions",
  "individuals" and "environment", when its whole weakness is that it never names a person.
- **Breadth scoring was wrong at both ends.** Flat per-category credit saturated wide-but-shallow
  remarks at 25 (reader: 20) while scoring `patient-navigator-interpreter` — which lands its
  entire insight inside two categories and reads 21/25 — as shallow. Now a diminishing ladder
  (4.5, 3.5, 2.8, 2.2, 1.6, 1.2) over a base of 5. The stock-frame penalty is also capped at half
  of what was earned: "This experience was meaningful because" dilutes real reflection next to
  it, it does not delete it, and at a flat 3 points a hit it was scoring a 9 as a 1.

The shared `REFLECTION_CATEGORIES` gained MME-register terms. Description calibration was re-run
after every change and is unmoved at 6.13 / 6.25 — reassuring, since both scorers read the same
lexicon.

### Surfaced, not just computed

- **`components/Activity/MmeQualityBreakdown.tsx`** — four bars in `MMEPanel`, below the essay.
  Hidden under 200 characters; a red score on two sentences is discouraging noise, not feedback.
- **The overlap percentage is shown as a number**, not only as a lowered bar. "Roughly 17% of
  this covers ground your entry already covers" tells someone what to cut; a short bar does not.
  Notice fires at 12%.
- **`redFlagService` rules 7a and 7b.** `mme-overlap` at 15% shared content, and
  `mme-thin-hours` for an MME under 25 hours — the two six-hour single-day MMEs in the corpus
  were the reference case, and rule 5 (prestige bias) did not catch them because a six-hour
  shadowing day is not a high-status type.

### Still open
- Apply the migration, seed, deploy the edge function. **Nothing from 10a-10c is live.**
- The AI path (`getAiNarrativeQuality`) still has no MME equivalent and no eval against the
  anchors. Both scorers are heuristics; the anchors would test the AI too, given a deployment
  and a test account.
- MME held-out bias is +4.7 — slightly generous, inside the ±8 gate but the direction to watch.
- AACOMAS: no corpus, no MME concept, 600-character limit. Entirely uncovered.

---

## Session 11 — landing page rewritten around the entry itself, and six new audit rules

Prompted by a third-party AMCAS Work & Activities guide (the JackWestin 2026-2027 piece). Nothing
from it is quoted or credited on the page, and none of its hour benchmarks were adopted — those
are advising aggregates, and this repo's rule is still that a claim has to trace to code. What was
taken is the *structure* it argues for, most of which turned out to be implementable as rules.

### The one idea worth stealing

"Applicants spend 80% of their characters on duties. Duties are the least interesting part."

That reframes the whole page. The old hero led with a score dial, which sells a number. The new
one leads with a single 653-character entry broken into its three blocks — Context / Impact /
Reflection — each labelled with its sentence count and its real character count, above a bar
showing the split. Every number on it is computed from the strings in `landingData.ts`
(`ANNOTATED_ENTRY`), so the counts cannot drift from the text they describe, and
`EntryAnatomy.tsx` derives its "what the box is for" bar from the same source rather than
hardcoding a second set of percentages.

### Six new red-flag rules (`services/redFlagService.ts`, now 14 total)

The valuable half of the guide is a list of failures that are only visible **across** entries.
Proofreading one box at a time cannot catch any of these, which is the argument for the audit:

| Rule | Fires when |
|---|---|
| `zero-hour-*` | Publications / Presentations / Honors / Conferences / Achievements carrying hours |
| `shadowing-split` | More than 2 shadowing entries — it belongs in one entry grouped by type of care |
| `category-mismatch-*` | A shadowing entry describing hands-on work ("drew blood", "took vitals") |
| `repeated-opening-*` | 3+ entries whose first two words match ("as a…", "during my…") |
| `recycled-language` | A run of 5 content words shared by 3+ entries |
| `thin-description-*` | An entry under 60% of the character limit |

`runRedFlagAudit()` takes a `descLimit` second argument now (defaulted to AMCAS 700) because the
thin-description floor moves for AACOMAS. Both call sites pass `DESC_LIMITS[appType]`.

**The cross-entry rules do not fire in the editor**, which calls the audit with a single activity.
That is correct, not a gap — three of them are meaningless on one entry.

### `scripts/audit-red-flags.ts`

15 fixtures, each check pinned to a case that must trip it and a case that must not, plus an
assertion that the seeded `DEMO_ACTIVITIES` do not trip any of the new cross-entry rules.

    node --experimental-transform-types scripts/audit-red-flags.ts

The `--experimental-transform-types` flag is needed here and not in `audit-exemplars.ts` because
this one reaches `types.ts`, which has enums that strip-only mode rejects.

Two false positives were caught by the harness, both in the fixtures rather than the rules, and
both worth knowing about if you extend it:
1. Identical filler padding across three fixture entries *is* recycled language. The check was right.
2. The audit tokenises on letters, so `word4x0` becomes `word x` — every entry padded that way
   shares a run. Fixture padding has to be alphabetic and distinct.

### Two import fixes made on the way

- `redFlagService` imported `calcDurationMonths` from **`components/MissionFitRadar.tsx`**, pulling
  a React chart component into a pure service. It lives in `utils/missionFit.ts`; it now imports it
  from there. This is also what makes the service runnable under Node.
- Explicit `.ts` extensions on that chain (`redFlagService`, `utils/missionFit`), matching what
  `narrativeQualityService` already did. Vite did not care; Node's ESM resolver does.

### App prose (deliberately narrow)

- **`FourStepWriter`** now states the sentence budget per block (2 / 3 / 3) and renders the live
  character split under the draft preview, with a warning when Context passes 50% of the entry.
  This is the only place the landing page's "shows you the split as you type" claim is cashed.
- **`MMEPanel`** carries the H-CART shape (Hook / Challenge / Action / Reflection / Tie forward)
  as a five-item strip above the two inputs. The inputs and the data model are unchanged — no
  migration, no new fields — only the framing and the placeholder copy.

### Claims corrected on the landing page

| Was | Now |
|---|---|
| "AMCAS & TMDSAS" in the hero capability row | **AMCAS & AACOMAS.** TMDSAS is a filter value in the school recommender; the writing side has only ever supported the two systems in `DESC_LIMITS`. |
| "Six checks run on your portfolio" | Fourteen. It was already wrong at eight before this session. |

### Design

Canvas moved from the mint (`brand.light`) to warm paper (`brand.paper` `#FAF8F3`), with the mint
kept as an accent band behind the Most Meaningful section. New tokens: `paper`, `paper-deep`,
`rule` (the hairline), `ink`. Headings are Lora throughout via one `SectionHeader` motif (hairline
+ small-caps eyebrow + serif heading) rather than each section inventing its own. Inter 800 and
Lora 700 were added to the font link — `font-black` was being faux-bolded from 700.

New sections: `EntryAnatomy` (the 2-3-3 budget), `MostMeaningful` (H-CART), `Checklist` (the
pre-submission pass, **editorial only — nothing in the app tracks those boxes**, and the copy says
so). `AnnotatedEntry` is the hero visual.

### Verification
`tsc --noEmit` clean. Playwright at 390 and 1440: no horizontal overflow, no console errors, demo
tab arrow-keys still work after the restyle. `FourStepWriter` and `MMEPanel` were checked through
the temporary `preview.html` pattern documented above, then deleted.

### The build was broken, and it was rollup

`npm run build` had been failing on every commit since rollup 4.63.1 arrived transitively.
Nothing in this repo asked for a source phase import; 4.63.1's parser reads the
`ImportDeclaration` `phase` field from the wrong offset in the AST buffer and invents one:

    parseAst('import "x";')        -> phase: "source"
    parseAst('import a from "x";') -> phase: "let"

Rollup then rejects the import at `fetchStaticDependencies`, because a source-phase import has to
resolve to an external module. Vite emits a bare `import "vite/modulepreload-polyfill"` into the
generated HTML entry module whenever `build.modulePreload.polyfill` is on, so this broke **any**
vite build on that version, not just this one.

Pinned to 4.63.0 via `overrides` in `package.json` — the newest good release, and 4.63.1 is still
the latest published, so a range would buy nothing. **Drop the override once rollup ships the
fix**, and re-run `parseAst('import "x";')` to confirm the phase is `undefined` before you do.

### Still open
- The seeded `DEMO_ACTIVITIES` now trip `thin-description` twice on a first load, because their
  descriptions really are ~160 characters. Accurate, and arguably a good first lesson, but if it
  reads as noise the fix is to lengthen the demo entries rather than to soften the rule.
- The checklist is static. Wiring it to per-entry state (ten boxes per activity, persisted) is the
  obvious next feature and the one thing from the guide that was left on the table.

---

## Session 12 — the Most Meaningful coach: advice, not ghostwriting

The Most Meaningful panel had a button, "Synthesize Essay with AI", that wrote a full 1,325-character
essay into the field with no confirmation (and wrote the error string there when the call failed).
The AMCAS certification allows AI only "for brainstorming, proofreading, or editing", and the AAMC's
*Anatomy of an Applicant* (© 2026) goes further: descriptions "should not be the product of
artificial intelligence." The button is gone. In its place is a workshop that runs the process paid
consultants sell for MMEs (selection, brainstorm, plan, draft, content feedback, final check), where
every output is a question, a note on the applicant's own sentence, or a check.

**Build order A (this session) is rule-based, needed no edge deploy, and is live on production**
(merged to `main` at `7216fbc`). Build order B, the AI
coaching (follow-up questions, a reader's-notes review with rounds, a set review), is not built yet.
The `mme-synthesis` edge action still exists; nothing calls it. Remove it in the same deploy that
adds the B actions.

### What was built

- `services/mmeCoachService.ts` — pure. `canMarkMostMeaningful`, `candidateNotes`, `setNotes`,
  `planNotes`, `draftNotes`, `finalCheck`, `workshopProgress`. Every note is `{ level, title, body,
  question?, quote?, source? }`. No function returns replacement text.
- `services/mmeQuestionBank.ts` — the brainstorm questions per H-CART beat, the four self-check
  questions, and every source with its URL. **Only AAMC wording checked against the live page is in
  quotation marks**; consultant and advising-office advice is paraphrased and credited.
- `components/Activity/mme/*` — `MmeCard` (inline in the editor, replaces `MMEPanel`) and a
  full-screen `MmeWorkshop` with five steps: Is it one of your three? / Find the moment / Plan /
  Write / Final check. Steps are suggested, not enforced.
- `components/Dashboard/MmePlanner.tsx` — "Your Most Meaningful three", opened from the activity list
  header. Set-level checks, a self-check on any entry (marked or not), mark/unmark.
- `PsSummaryField` — an optional one-line personal statement summary on the profile, used only to warn
  when an MME retells the same scene or lesson.

### Two bugs that were live

1. **The 3-MME cap was never enforced.** `App.handleToggleMME` checked it, but `Dashboard` received
   `onToggleMME` and never called it; the only way to mark an MME was the editor checkbox, which
   called `handleChange` directly. Both paths now go through `canMarkMostMeaningful`.
2. **Anticipated experiences could be marked Most Meaningful.** AMCAS forbids it ("An anticipated
   experience cannot be a most meaningful experience", 2027 W&A Guide). Blocked when every date range
   is anticipated; completed hours plus anticipated hours is allowed.

### Data — migration applied 2026-09-17

`supabase/migrations/20260916120000_add_mme_workshop.sql` adds `activities.mme_workshop JSONB NOT
NULL DEFAULT '{}'` and `profiles.ps_summary TEXT`. Additive and idempotent.

Applied to production with `scripts/db/apply-migration.mjs` (version `20260916120000` recorded)
before the frontend merged. Verified afterwards: both columns present with the right types, RLS still
enabled on both tables, all 15 existing activity rows defaulted to `{}`, and PostgREST selects both
columns with the anon key (empty result under RLS, not a missing-column error).

`activityService.saveActivity` still catches PGRST204 naming `mme_workshop` and retries without the
column, keeping the workshop in memory. It no longer fires in production; it stays for any database
that has not had the migration (a fresh project, a restored backup).

`mmeAction` / `mmeResult` are still written, mirrored from the Action and Change notes, because
`utils/adcomScore.ts` and `utils/missionFit.ts` scan them. Old values seed those notes on first open.

### Calibration

`node --experimental-transform-types scripts/audit-mme-coach.ts` — 97 checks. Every draft check is
pinned to a fixture that must trip it and one that must not, then run over the 14 published MMEs:
strong essays average 0.58 cautions; the known rehash (`clinical-research-internship-neuro`, reader
distinctness 7/25) trips both "retells your entry" and "opens by announcing the meaning"; the two
six-hour counter-examples trip thin hours and over-limit.

`MME_OVERLAP_NOTICE` (0.12) moved from `MmeQualityBreakdown.tsx` into `narrativeQualityService.ts`
and was **not retuned**. `workbook-emra-coordinator` sits at 12.5% with a human distinctness of 20,
a mild false positive — but it is a holdout entry, and tuning on it would spend the holdout.

Helpers exported for reuse rather than copied: `REFLECTION_CATEGORIES`, `BOILERPLATE`,
`SCENE_MARKERS`, `MEANING_ASSERTIONS`, `countPhrases`, `sentences`, `distinctProperNouns`,
`quantifyingNumbers`, `contentWords` (narrativeQualityService); `MIN_CREDIBLE_MME_HOURS`,
`HIGH_STATUS_TYPES`, `AI_TELL_PHRASES`, `getActivityHours`, `contentShingles` (redFlagService).
`exportService.ts` imports gained `.ts` extensions and a `type` import so Node can load it.

### Verification

`tsc --noEmit` (only the pre-existing `temp_skills/` errors), `npm run build`, all three audit
harnesses. Playwright through the preview harness at 1440 and 390: 46 checks — every step renders
without horizontal overflow, self-check answers persist, legacy fields seed the notes, the expected
draft notes appear, "Show in draft" selects the quoted text, editing a flagged line clears its note,
the final step reaches done, the planner blocks an anticipated entry and saves a self-check, and the
editor refuses a fourth MME. Preview files deleted.

Two layout bugs the harness caught on mobile, both worth knowing:
- A single-column grid with no explicit `grid-cols` sizes its implicit column to content, so a strip
  of `whitespace-nowrap` tabs pushed the workshop 316px sideways. `grid-cols-[minmax(0,1fr)]`.
- `sr-only` spans are `position: absolute`. Inside a horizontally scrolling strip with no positioned
  ancestor they attach to the dialog and widen *its* scroll area (another 186px). `relative` on the
  tab buttons contains them.

### Still open

- **Authenticated smoke test not run.** `scripts/db/auth-smoke.mjs` needs `SUPABASE_SERVICE_ROLE_KEY`,
  which was not set. The workshop was verified in the preview harness, not against a logged-in session
  on the live database. First real check: mark an entry Most Meaningful on production, add notes,
  reload, and confirm they persist.
- **Build order B**: `mme-followups`, `mme-review` (anchored line notes; server drops any quote not in
  the draft and any novel 6+ word quoted span), `mme-set-review`, then remove `mme-synthesis`.
- The weak-verb suggestions in `staticAnalysisService.ts` recommend "facilitated, assisted" — the
  corporate phrasing advisors flag in AI-written entries. Not used by the MME checks; worth revisiting
  for the description editor.
- `landingData.ts`: the two strings that described the removed essay builder (the Most Meaningful
  feature card and the "Does it write my essays" FAQ) were corrected. The wider landing repositioning
  is planned separately and not applied.

---

## Session 12b — the AI read, in rounds (build order B, partial)

Live: `mme-review` is deployed (gemini-ai **version 39**) and merged. `mme-synthesis` was
removed in the same deploy. Still unbuilt from build order B: `mme-followups` (follow-up
questions on the brainstorm notes) and `mme-set-review` (a read across all three).

### The rule that shapes the feature

A model asked for feedback drifts into supplying wording, and one pasted sentence breaks the
product's whole claim. So the schema has no field that can hold replacement prose, and
everything the model returns goes through `services/mmeReviewFilter.ts`:

1. A line note must quote the applicant's own draft. The quote is **replaced with the exact
   span from the draft** (matching through case, curly quotes and run-together whitespace), so
   the UI can select it in the textarea.
2. Any note carrying a quoted run of **six or more words** found in neither the draft nor the
   applicant's own notes is dropped. That is the shape of a smuggled sentence; a six-word quote
   of their own writing is normal and stays.
3. Lengths and list sizes are capped, so a note cannot become a paragraph to copy.

The edge function repeats rule 1 before returning, cheaply and without shared code. The filter
is the authority and `scripts/audit-mme-coach.ts` is what proves it (13 checks, including
malformed output, which must not throw).

### Rounds

`MmeReview` stores the draft it was written against, scores computed **locally** by
`scoreMmeQuality` (never by the model), and a status per note. From that:

- A line note whose quoted sentence is no longer in the draft counts as acted on, ticked or not
  (`openReviewNotes`). Content notes stay until the applicant says otherwise.
- `isReviewStale` compares the stored draft to the current one, which drives the "you have
  edited since this read" banner and the `review` step going from done back to started.
- `appendReview` keeps the last `MAX_MME_REVIEWS` (5).
- Asking again on an **unchanged** draft passes `force`, skipping the cache; after an edit the
  payload differs, so the cache misses on its own. `mme-synthesis` left `UNCACHED_ACTIONS` with
  it, and `mme-review` is deliberately cached.

The final check counts open reader notes and flags a draft that has never been read, but a read
is **optional** — an unread draft can still be ready. That is deliberate: the rules are free and
the read is the part that becomes paid.

### Verification

`tsc --noEmit`, `npm run build`, both harnesses (111 fixture checks). 52 browser checks at 1440
and 390 through the preview harness: the round and verdict render, marking a note Done sticks
across steps, "Find in draft" selects the quoted sentence in the textarea, editing that sentence
marks the note changed and the round out of date, the logged-out path explains itself, and the
empty state names the model. The deployed function was checked for the auth guard only; a real
read has not been run against a logged-in session (still no `SUPABASE_SERVICE_ROLE_KEY`).

**The first real read is worth watching.** If the model starts writing sentences for the
applicant, the filter drops those notes silently and the round looks thin. The dropped counts go
to the console (`MME review: dropped items that broke the feedback-only rule`); if that fires
often, the prompt needs tightening rather than the filter loosening.

---

## Session 13 — residency, ties, and a "why this school" breakdown

Branch `feat/school-residency`. The plan (competitor workflows, risks, schema, the score) is in
`~/.claude/plans/context-objective-staged-pascal.md`. What shipped against it:

### The score, in one line

    priority = E · M · (0.9 + 0.1·Θ) · A

`M` is `computeMatch`, untouched; it is still the headline percentage and `calibrate-scoring.ts`
did not move. `Θ` is theme overlap: the same tag labels `derive-school-targets.ts` reads out of
mission statements, now read out of the applicant's entries (`utils/themes.ts`). `A` is residency
access from AAMC FACTS Table A-1 (`utils/residency.ts`). `E` is 0 only when a school policy,
checked on the school's own page, rules the applicant out. `utils/schoolFit.ts` composes them and
writes every reason the drawer shows; none of that text comes from a model.

`node scripts/audit-school-fit.ts` is the acceptance test (36 checks on synthetic schools, plus 4
in a real-data section that runs only where the gitignored AAMC files exist). It is in CI.

### The data, and where it deliberately is not

- **A-1 is read from AAMC's own .xlsx**, three cycles (2023-24 to 2025-26), by
  `scripts/data/read-aamc-a1.mjs`. Each file checks against its Total row: application and
  matriculant sums match exactly, and the weighted in-state share within 0.3 points.
- **The numbers are not in this repo.** A-1 is licensed "for educational, noncommercial purposes
  only" (the notice is in each file's page footer) and the repo is public. `data/sources/` is
  gitignored; `data/source-manifest.json` records each file's URL and sha256, and
  `scripts/db/seed-residency.mjs` refuses a file that does not match. Every A-1 row in
  `data_sources` is `commercial_use = 'restricted'`, so paid features can exclude it.
- **`data/school-registry.json`** gives all 175 rows a slug, state and country, plus every
  spelling A-1 uses ("Alabama-Heersink", and both names of schools renamed between cycles). It
  replaces name-matching through `utils/schoolStates.ts`, which had three schools as "Unknown".
- **Policies** (`data/school-policies.json`): only UW's WWAMI rule so far, read through the
  search index because uwmedicine.org refuses automated requests. Open the page once by hand.

### Found in the data

- **Two Texas A&M rows.** "Texas A&M University School of Medicine" carries a mission statement
  that reads as a model-written summary; "Texas A&M School of Medicine" carries the verbatim text
  and gets the A-1 data. The first is slugged `texas-and-m-duplicate-row`. Delete it once nothing
  references it (check `profiles.target_school_ids` first).
- **No University of Kentucky row.** A-1 has it; the original MSAR parse dropped it.
- **Texas public schools look ordinary out-of-state** (about 1 in 46 per application, national
  average about 1 in 45) even though state law caps non-residents at 10%. Few non-Texans apply, so
  the per-application rate hides the cap. This is why the UI puts the share of seats that went to
  residents (84–95% at Texas publics) next to the rates, and never calls either "your chances".
- **Bands are terciles** of the in-state advantage: 3.6× and 11.2× across 159 schools. A verified
  "prefers residents" policy triggers the ties warning even when the numbers alone would not: AAMC
  counts UW's four compact states as out-of-state, so UW's own figures look moderate.

### UI

- Onboarding has a fourth step (state of legal residence, ties, optional citizenship status);
  Settings has the same form for users who onboarded before it existed. Step 4's copy no longer
  claims North Star "biases school recommendations" — it never did.
- Recommender: sorts by priority by default (toggle for mission fit), chips the top tier of
  in-state-preferring schools, asks before targeting one with no tie, and hides Canadian schools
  unless "U.S. + Canada" or "Canada" is chosen. With no A-1 figures they ranked as if residency
  cost nothing, and they topped the list for a U.S. applicant.
- Scores no longer refetch all 175 schools whenever a pillar moves; they load once and rescore in
  `useMemo`.
- The activity editor has a State field for U.S. entries. That is how a tie becomes visible to a
  school, and the "your entries don't show this tie" warning reads it.

### Applying it (in this order)

    node scripts/db/apply-migration.mjs supabase/migrations/20260919000000_school_provenance_and_residency.sql 20260919000000
    node scripts/db/apply-migration.mjs supabase/migrations/20260919000500_school_registry_backfill.sql 20260919000500
    node scripts/db/apply-migration.mjs supabase/migrations/20260919010000_applicant_residency_and_ties.sql 20260919010000
    node scripts/db/seed-residency.mjs
    SUPABASE_SERVICE_ROLE_KEY=... node scripts/db/auth-smoke.mjs

The frontend degrades without them (missing columns are dropped and retried, a missing ties table
reads as empty, missing residency figures leave `A = 1`), but apply them before merging.

### Verification this session

`tsc --noEmit`, `npm run build`, every harness. Browser checks at 1440 and 390 through a
throwaway harness that stubbed the profile context and served residency rows from the local A-1
files (deleted afterwards): chips, drawer reasons and sources, the confirm on star, Idaho at UW
as regional, a Colorado tie with no Colorado entry, the no-state prompt, the wizard step, Settings,
no horizontal overflow, no console errors.

**Applied to production 2026-09-18**, all three migrations through `apply-migration.mjs` (versions
recorded), then the seed: 472 rows (156 / 157 / 159 by cycle). Verified afterwards: RLS on for all
new tables; anonymous reads of `school_residency_stats`, `applicant_ties` and `data_sources` return
`[]`; every `medical_schools` row has a slug and state; UW's policy is set with its source URL; all
three A-1 sources are `restricted`. `auth-smoke.mjs`: every new check passed (residency, ties, RLS
isolation, the cascade on user delete); the one failure was `draft-analysis`, below.

### Still open

- Add a University of Kentucky row (in A-1, missing from medical_schools).
- ~~Delete the Texas A&M duplicate~~ Done: `20260919020000_delete_texas_am_duplicate.sql`, applied
  2026-09-18 with the user's go-ahead. 174 schools. The registry builder now refuses to rewrite the
  applied `20260919000500`; later registry changes go in a new migration via `--out`.
- ~~Deploy `gemini-ai`~~ Done: v40, 2026-09-18. `auth-smoke.mjs` 32/32, and `draft-analysis` 3 for 3
  after the fix against 0 for 3 before it.
- Phase 2 in the plan: `applicant_school_list`, AAFP family-medicine outcomes and BRIMR funding
  ("says vs. does"), curriculum facts verified on school sites, DO schools, and removing
  `suggestedSentence` and its Copy button from School Targeting (pasteable text, against the
  coaching rule).
- A legal read on AAMC-derived data before billing ships.

### Found while verifying: draft-analysis was failing in production

`auth-smoke.mjs` failed `draft-analysis` with a 400, twice in a row: "Unterminated string in JSON
at position 966", then "at position 174". Unrelated to this session's work. The handler runs on
`gemini-2.5-flash` with `maxOutputTokens: 1200` (added in 6e90695, deployed in v38). 2.5 Flash
thinks by default and thinking tokens count against that cap, so a long think leaves the JSON cut
off; a truncation at 174 characters means about 1,150 of the 1,200 tokens went to thinking.
`mme-review` has the same setup (flash, cap 1,400).

Both now pass `thinkingConfig: { thinkingBudget: 0 }`. The edge function's SDK
(`@google/generative-ai` 0.24.1) sends `generationConfig` through `JSON.stringify` unchanged, so
the field reaches the API. `auth-smoke.mjs` now covers `mme-review` and prints the error text when
`draft-analysis` fails. Deployed as v40 on 2026-09-18. The aiCache version is not
bumped: failed calls were never cached, and earlier successful analyses are still valid.
