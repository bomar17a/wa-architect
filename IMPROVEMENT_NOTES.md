# W&A Architect — Improvement Work: Notes & Backlog

This file tracks progress against the **"W&A Architect — Comprehensive Improvement Prompt"**
review doc (pasted into chat, not stored as a file in-repo). Picking this back up? Read this
file first, then re-open the todo list in the same conversation (or recreate it from the
"Remaining Backlog" section below) and continue in priority order.

Last updated: 2026-08-13.

---

## How this session worked

1. Read the full improvement doc (7 known bugs + a UI facelift spec + 10 AdCom-grounded
   feature priorities + a Week-by-week ship order).
2. Did an independent pass over the actual codebase (components, hooks, services, the
   Supabase edge function, DB migrations) to verify which claims in the doc still held —
   **the doc was written against an earlier snapshot of the app; some things it flagged were
   already fixed, and I found at least one significant gap it missed.**
3. Fixed everything that was quick/safe/verified, then stopped at a clean, building checkpoint
   to hand off.

## Important: reconcile doc claims against current code before acting on them further

- **Bug #7 in the doc ("Mobile navigation is broken — sidebar is `hidden md:flex`, no mobile
  nav at all") is already fixed.** `components/Dashboard.tsx` has a working fixed bottom tab
  bar (`<nav className="md:hidden fixed bottom-0...">`) with Dashboard/Radar/Schools/Settings/Sign-out.
  Don't redo this.
- **Bug #4 ("cards have no hover affordance, only `hover:border-brand-teal/30`") was mostly
  already fixed** — cards already had `cursor-pointer` and `hover:shadow-md`. I only added a
  lift (`hover:-translate-y-0.5`) on top.
- Archetype toggles are **6**, not 5 — doc's own bug list says so (bug #2), but then Priority 10
  and the AdCom-alignment notes elsewhere still say "5". Treat "6" (Investigator, Advocate,
  Practitioner, Innovator, Leader, Balanced) as ground truth — confirmed directly from
  `SCHOOL_ARCHETYPES` in `components/MissionFitRadar.tsx`.

## Independent finding not in the doc (the biggest one)

**The Most Meaningful Experience essay had no UI at all.** `Activity.mmeAction`, `mmeResult`,
`mmeEssay` existed in `types.ts`, were persisted end-to-end in `activityService.ts` /
Supabase, were scored by `MissionFitRadar.tsx` and `utils/scoring.tsx`, and
`geminiService.synthesizeMmeEssay()` / the edge function's `mme-synthesis` action existed to
write them — but **no component ever rendered an input for them.** A user could mark an
activity `isMostMeaningful` and there was simply no way to write the 1,325-character essay
AdCom actually reads. This effectively made "Priority 4: MME Coach" in the doc a from-scratch
build, not an enhancement. Fixed this session (see below) — treat Priority 4 as **done**, not
just started.

---

## Completed this session

All changes build clean (`npm run build` and `tsc --noEmit` both pass — note `tsc` alone will
show unrelated pre-existing errors under `temp_skills/`, an unrelated scaffolding folder not
part of the app; filter those out or just trust `npm run build`, which is what CI's
`.github/workflows/build-check.yml` actually runs).

1. **Float display bug** — `components/MissionFitRadar.tsx`: Gap Analysis now does
   `g.need.toFixed(1)` instead of rendering the raw float.
2. **Archetype copy mismatch** — same file: "our 5 major..." → "our 6 major...".
3. **Settings no-op** — was `onClick={() => {}}`. Built a real
   `components/Dashboard/SettingsModal.tsx` (account info, member-since, AMCAS/AACOMAS
   toggle, sign out). Wired into both the desktop sidebar `NavItem` and a new mobile bottom-nav
   icon. State lives in `useDashboardState.ts` (`isSettingsModalOpen`).
4. **Activity card hover** — added `hover:-translate-y-0.5` lift to dashboard activity rows.
5. **Empty-state CTA** — the "no activities" state was a bare text link; it's now a proper
   centered panel with icon, copy, and a real button (matches the visual weight of the
   non-empty "Add Activity Slot" button below it).
6. **Readiness progress bar had no % label** — added a `Progress` / `{score}%` row above the
   thin bar in the sidebar score widget.
7. **MME writer built from scratch** — new `components/Activity/MMEPanel.tsx`, rendered in
   `ActivityEditor.tsx` under the description editor, only when
   `appType === AMCAS && activity.isMostMeaningful`. Includes:
   - A static "Selection Advisor" checklist (3 reflective questions from the doc's Priority 4).
   - Two guided inputs bound to the *existing* `mmeAction` / `mmeResult` fields (kept the
     app's existing STAR-shaped data model — Situation comes from the activity's main
     `description`, then Action, then Result — because that's exactly what the already-built
     `mme-synthesis` edge function action expects. **I deliberately did not build the doc's
     literal "Part A (400 chars) / Part B (500 chars) / Part C (425 chars)" template** — it
     would have required either ignoring the existing backend contract or shipping a second,
     conflicting one. If you want the literal 3-part structure instead, that's a bigger change:
     new edge function action + payload shape.)
   - "Synthesize with AI" button wired to the already-existing
     `geminiService.synthesizeMmeEssay()` → `mme-synthesis` edge function action.
   - Final essay textarea with `CharacterCounter` (reused existing component) against
     `MME_LIMIT` (1325) plus a tri-color budget bar (green/amber/red).
   - Regular-entry vs MME character count side-by-side (doc's "MME vs Regular Entry
     Comparison" ask).

### Files touched
- `components/MissionFitRadar.tsx`
- `components/Dashboard.tsx`
- `components/ActivityEditor.tsx`
- `hooks/useDashboardState.ts`
- `components/Dashboard/SettingsModal.tsx` (new)
- `components/Activity/MMEPanel.tsx` (new)

---

## Remaining backlog (priority order, from the doc's own ship-order table + my adjustments)

Not started yet. Ordered roughly by the doc's Impact/Effort table, adjusted for what's
actually achievable without backend deploy access (see "Deployment constraint" below).

1. **UI facelift** — color tokens, hero score dial, premium activity card redesign.
   - Scoping decision already made: **do not** blindly swap the core brand hex values
     (`#2E6B6B` teal, `#FFC82C` gold, `#1C1C1C` dark) for the doc's proposed deeper palette
     (`#0D5C63` etc.). That's a global re-skin of a live app with real users — every inline SVG
     `stroke`/gradient hex (counted: 4 in `MissionFitRadar.tsx`, 2 in `LandingPage.tsx`, 3 in
     `Dashboard.tsx`) would need manual updates too since Tailwind config changes won't touch
     inline hex, and there'd be no way to visually QA every screen in this environment. Safer
     path: **add** the new semantic tokens (`brand-highlight` #3B82F6, `brand-danger` #DC2626,
     `brand-success` #059669, `brand-surface`, `brand-card`) to `tailwind.config.js`
     additively, and apply the "premium command center" feel through the dial-hero treatment,
     card redesign, and animations instead of a full recolor. Revisit the deep-teal re-skin
     as its own dedicated pass if the user wants it, with a browser-based visual QA step.
   - Score dial: promote to a hero panel at the top of the Dashboard overview tab (currently
     lives only in the sidebar widget), add tier badge + "what does this mean" popover.
   - Activity cards: colored left border by status, hours pill, MME star already exists
     (`Award` icon) — add compact char-count pill, drag-to-reorder is a bigger lift (would need
     a DnD lib — not installed; evaluate `@dnd-kit` vs a lightweight manual approach).
   - Stagger-in on dashboard load via Framer Motion (already a dependency, used elsewhere).

2. **Red Flag Audit panel** — pure client-side, no backend needed. Expand
   `services/staticAnalysisService.ts` (has weak-verb/cliché/passive-voice checks already) or
   add a new `services/redFlagService.ts` with: shadowing-overload check (note: MissionFitRadar
   already caps shadowing contribution client-side in `computeCompetencyScores`, but there's no
   user-facing *message* about it), short-term-pattern check (3+ activities under 3 months —
   `calcDurationMonths` helper already exists in `MissionFitRadar.tsx`, exported? check — reuse
   it), clinical-gap check, MME-selection-quality check, AI-prose detector (extend the existing
   weak-verb/cliché map in `staticAnalysisService.ts` with the AI-tell phrase list from the doc:
   "Furthermore", "Moreover", "It is important to note", "In conclusion"). Surface as dismissible
   cards on the Dashboard overview tab, near the existing "Clinical Insight Nudge" banner.

3. **Export to AMCAS Format** — pure client-side, no backend needed, doc rates it low-effort/
   high-impact. Plain-text export matching the doc's template, `.txt` download + copy-to-
   clipboard per activity. Must strip all formatting per the doc's own `[!IMPORTANT]` note
   (AMCAS strips bullets/bold/special chars) — enforce that on the *generated* text, not just
   visually.

4. **Deadline Tracker + Cycle Selector** — `Activity.dueDate` exists but is only edited in
   `ActivityEditor.tsx`, never surfaced as a list anywhere. Add a Dashboard mini-panel. Also:
   move the `daysToAmcas` calculation currently inline in `Dashboard.tsx` into
   `useDashboardState.ts`, add a persisted (localStorage, key pattern `wa-architect-*` like
   `appType` already does) cycle-year override, add to `SettingsModal.tsx`, and color-code the
   countdown text (green >180d / amber 90–180d / red <90d) plus the "~4 weeks to certify" note.

5. **Narrative Quality Score** — doc wants AI-scored (Gemini) 0–100 per activity across 4
   sub-scores. Can ship a client-side heuristic version now (reuse/extend
   `staticAnalysisService.ts` signals: length vs limit, presence of numbers/%, weak-verb count,
   reflection-keyword presence) without waiting on a deploy; the AI version needs a new edge
   function action (see below).

6. **Onboarding wizard** — 3-step, first-login only. Doc's Step 2 ("paste resume, AI
   pre-populates") can reuse the *existing* `parse-resume` action / `useResumeProcessor.ts` /
   `ResumeReviewModal.tsx` almost as-is. Needs a "has the user onboarded" flag — simplest: a
   localStorage flag, or (better, survives device switches) a new boolean column on whatever
   table represents the user profile — there isn't a profile table yet, only `activities` and
   `medical_schools` (see migrations). Would need a small migration.

7. **Interview Prep Mode**, **Narrative Thread / Story Analysis**, **School Targeting Mode** —
   all need new Gemini edge function actions (`interview-questions`, `narrative-quality`,
   `story-analysis`, school-alignment suggestion). Not started. See deployment constraint below
   before building these.

---

## Deployment constraint (read before adding new AI-backed features)

This dev environment has **no Supabase CLI installed and no linked project/access token**
(`which supabase` → not found). The existing edge function
(`supabase/functions/gemini-ai/index.ts`) already supports `draft-analysis`, `rewrite`,
`mme-synthesis`, `parse-resume`, `parse-msar`, `theme-analysis` — those are safe to build
against from the client since they're presumably already live (the first four are actively
used by already-working features). **Any new action added to that file will NOT go live on its
own** — someone with Supabase project access needs to run
`supabase functions deploy gemini-ai` (and `supabase db push` for any new migration under
`supabase/migrations/`) after such a change. If picking this backlog back up in an environment
that *does* have the CLI authenticated, this constraint goes away — check again with
`supabase projects list` before assuming it's still blocked.

## Small things noticed but not yet acted on (low priority / judgment calls)

- `useDashboardState.ts` exports a `scrollToTop` function that's never called from
  `Dashboard.tsx` — dead code, harmless, low priority to remove.
- `App.tsx`: switching `appType` to AACOMAS clears `isMostMeaningful` on all activities in
  local state (`setActivities` in the `useEffect`) but never persists that clear back to
  Supabase via `activityService.saveActivity`. Switching AMCAS → AACOMAS → AMCAS again could
  leave local state and DB briefly disagreeing about MME flags. Minor, but worth a real fix
  (persist the clear, or don't silently mutate and instead warn) before it bites someone.
- The auto-save status chip in `ActivityEditor.tsx` header is `hidden sm:flex` (invisible on
  mobile) — doc flags this too (Priority 7, item 4). Bundle the fix with the Deadline
  Tracker work above.
- `stats.html` at repo root is a tracked bundle-analyzer artifact (from
  `rollup-plugin-visualizer`) that's *not* in `.gitignore` even though `dist/` is. It'll churn
  on every build. Not touched this session — flagging in case it's worth gitignoring later
  (ask before removing it from tracking; it predates this session).
