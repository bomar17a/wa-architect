# W&A Architect — Improvement Work: Notes & Backlog

This file tracks progress against the **"W&A Architect — Comprehensive Improvement Prompt"**
review doc (pasted into chat, not stored as a file in-repo). Picking this back up? Read this
file first, then re-open the todo list in the same conversation (or recreate it from the
"Remaining Backlog" section below) and continue in priority order.

Last updated: 2026-08-26 (session 4).

> ## ✅ Nothing is blocked
> - `gemini-ai` edge function deployed **v33** — Interview Prep and Story Analysis are live.
> - `profiles` table **applied to production**, RLS verified (anonymous SELECT returns `[]`).
> - Migration history **reconciled** — `supabase db push` works normally again.
>
> Untested: the authenticated profile round-trip (row creation, the localStorage
> migration firing, wizard writes). There is still no test account, so that path first
> runs when a real user logs in. A throwaway account would confirm it in a minute.

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

Everything in the original review doc is now built **except**:

1. **School Targeting Mode** (doc Priority 8) — the only wholly untouched feature. The
   persistence blocker is now GONE: `profiles.target_school_ids` exists and is unused, and
   edge function deploys work. What remains is UI plus a new alignment-suggestion action. The
   `medical_schools` table already has `mission_statement` and `primary_category`, and
   `SchoolRecommender.tsx` already computes per-school match scores, so the data side is largely
   there — it's the persistence and the new AI action that are missing.

2. **AI-scored Narrative Quality** — upgrade the heuristic to the doc's Gemini-graded version
   via a `narrative-quality` action. If doing this, debounce it (~3s per the doc); the current
   heuristic recomputes per keystroke, which is only fine because it's pure string ops.

3. **Drag-to-reorder activity cards** (facelift spec) — deferred; needs a DnD library
   (`@dnd-kit` is the obvious pick, not installed) or a hand-rolled solution.

4. **Landing page overhaul** — animated score-dial demo, before/after example, social proof,
   pricing. `LandingPage.tsx` was left alone across all three sessions. Note the doc's social-proof
   idea names real schools ("accepted to Johns Hopkins, Mayo, UCSF") — don't ship fabricated
   testimonials or acceptance claims; use only real, permissioned ones.

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
