# W&A Architect — Improvement Work: Notes & Backlog

This file tracks progress against the **"W&A Architect — Comprehensive Improvement Prompt"**
review doc (pasted into chat, not stored as a file in-repo). Picking this back up? Read this
file first, then re-open the todo list in the same conversation (or recreate it from the
"Remaining Backlog" section below) and continue in priority order.

Last updated: 2026-08-24 (session 2).

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

## Remaining backlog (priority order, adjusted for what's achievable without backend deploy access)

1. **Narrative Quality Score** — doc wants AI-scored (Gemini) 0–100 per activity across 4
   sub-scores (Specificity, Quantification, Reflection, Voice Authenticity). Ship a client-side
   heuristic version first (reuse/extend `services/staticAnalysisService.ts` signals: length vs.
   limit, presence of numbers/%, weak-verb density already detected there, reflection-keyword
   presence e.g. "learned"/"realized"/"taught me"). The full AI-scored version needs a new edge
   function action — see deployment constraint below.

2. **Onboarding wizard** — 3-step, first-login only (cycle/app-type/school-tier, quick activity
   inventory via paste-resume reusing the *existing* `parse-resume` action almost as-is, "north
   star" archetype pick). Needs a "has the user onboarded" flag. There's no user-profile table
   yet (only `activities` and `medical_schools` — see `supabase/migrations/`), so the simplest
   correct approach is localStorage for now, with a note that it won't survive a device switch;
   a real fix needs a small migration (new profile table or a column) which can't be deployed
   from this environment (see below).

3. **Interview Prep Mode**, **Narrative Thread / Story Analysis**, **School Targeting Mode** —
   all need new Gemini edge function actions (`interview-questions`, `narrative-quality`,
   `story-analysis`, school-alignment suggestion). Not started.

---

## Deployment constraint (read before adding new AI-backed features)

This dev environment has **no Supabase CLI installed and no linked project/access token**
(`which supabase` → not found, confirmed again this session). The existing edge function
(`supabase/functions/gemini-ai/index.ts`) already supports `draft-analysis`, `rewrite`,
`mme-synthesis`, `parse-resume`, `parse-msar`, `theme-analysis` — safe to build against from the
client since they're presumably already live (several are actively used by already-working
features). **Any new action added to that file will NOT go live on its own** — someone with
Supabase project access needs to run `supabase functions deploy gemini-ai` (and
`supabase db push` for any new migration) after such a change. If picking this backlog back up
in an environment that *does* have the CLI authenticated, check again with
`supabase projects list` before assuming it's still blocked — this constraint may not apply.

## Small things noticed but not yet acted on (low priority / judgment calls)

- `useDashboardState.ts` exports a `scrollToTop` function that's never called from
  `Dashboard.tsx` — dead code, harmless, low priority to remove.
- `App.tsx`: switching `appType` to AACOMAS clears `isMostMeaningful` on all activities in
  local state but never persists that clear back to Supabase via `activityService.saveActivity`.
  Switching AMCAS → AACOMAS → AMCAS again could leave local state and DB briefly disagreeing
  about MME flags. Minor, but worth a real fix (persist the clear, or don't silently mutate and
  instead warn) before it bites someone.
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
