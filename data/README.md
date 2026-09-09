# Exemplar corpus

`amcas-exemplars.json` — 47 published AMCAS Work & Activities entries, transcribed from two
Cracking Med School Admissions PDFs, normalised to this app's taxonomy, and annotated with why
each one works or fails.

It exists to **ground** the AI features, not to answer for them. Today `narrative-quality` tells
the model "a mediocre entry should score in the 40s, not the 80s" with nothing behind that
sentence — the model has never been shown what mediocre looks like at 700 characters. Eight of
these entries are hand-scored on the same 0-25 scale the app uses, so the instruction acquires a
reference. The model still does the judging.

## The three rules

**1. Never send an exemplar to the browser.** `public.wa_exemplars` has RLS enabled and no SELECT
policy, so clients read zero rows and only the edge function's service-role key can reach it.
That is not paranoia about scraping. Applicants who read exemplars write like exemplars, and text
that recurs across many applications is the kind of thing similarity screening is built to catch.
The person carrying that risk is the applicant, not us. It is also third-party published material
— holding it for internal grounding is a different act from serving it to users.

If a feature ever needs to show users examples, that needs a separate table of originally written
entries, not a loosened policy on this one.

**2. Never let the model quote one.** Every prompt that receives exemplars forbids quoting,
paraphrasing into feedback, or telling the applicant to write something because an example did.
Keepers and trimmers must come from the applicant's own draft.

**3. Retrieval must be optional.** `fetchExemplars()` returns `[]` on any failure and every
prompt degrades to exactly the text that shipped before grounding existed. The migration is not
applied yet and the app is correct either way.

## Curation rules

The source PDFs are not clean, which is the reason this is a curated corpus and not an import:

- Two entries are published under **"Community Health Advocacy"**, which is not one of the 18
  AMCAS experience types. Remapped, with `invalid_experience_type_in_source` in `defects`.
- One entry is titled **"Clinical Shadowing at Vibrant Health Clinic"** and describes tutoring for
  Varsity Tutors — a copy-paste error in the source. Loading it as-is would teach a classifier to
  map tutoring text to shadowing. Title corrected; `title_as_published` preserves the original.
- One entry's hours field reads **"3 years"**, not a number.
- **10 of 47 descriptions exceed the 700-character limit** and two MMEs exceed 1,325. They could
  not be submitted as written.

So: `experience_type` is always normalised, the published value is always kept alongside it, and
every deviation is declared in `defects`. `curator_note` is required on every row — an exemplar
nobody can explain is not a teaching case, and the note is what the model actually receives as
the reason an entry lands where it does.

`quality_band` is one of `exemplar` / `solid` / `weak` / `counter_example`. Weak and
counter-example rows are load-bearing: contrastive prompting needs a floor, and the two
six-hour entries designated Most Meaningful are more instructive than any strong entry.

## anchor_scores

Sixteen entries carry hand-assigned 0-25 scores, split into two sets by `anchor_set`:

- **`tune`** (8) — what `scoreNarrativeQuality()` was fitted against.
- **`holdout`** (8) — scored *before* the session-10b rewrite and not consulted during it.

Sixteen anchors against roughly a dozen weights is thin enough to overfit by accident, and a
scorer tuned into agreement with its own tuning set has demonstrated nothing. The harness scores
both sets separately and fails if held-out error exceeds tuning error by more than 6 points. If
you retune, **do not look at the held-out numbers while you work** — that is the only thing
keeping them meaningful. If you need a fresh holdout, score new entries before touching weights.

**Score against the `description` field only** — that is the sole input the scorer receives
(`Dashboard.tsx:424`, `NarrativeQualityBreakdown.tsx:46`). Scoring the MME or the hours into an
anchor makes the harness measure the curator instead of the scorer; the first run of this corpus
made exactly that mistake and reported a 33-point error that was partly mine.

Both sets deliberately include lopsided entries rather than uniformly good or bad ones —
`sorority-philanthropy-coordinator` scores 22/25 on quantification and 2/25 on reflection —
because the four dimensions have to move independently.

## Working on it

```bash
# Always before seeding. Fails on taxonomy errors, undeclared over-limit entries,
# missing curator notes, and calibration drift.
node --experimental-transform-types scripts/audit-exemplars.ts

node scripts/db/seed-exemplars.mjs --dry-run
SUPABASE_DB_PASSWORD=... node scripts/db/seed-exemplars.mjs
```

The seeder upserts on `slug` and deletes rows no longer in the JSON, so the file is the source of
truth and the table is a projection of it. Edit the JSON, never the table.

## Known gaps

Six AMCAS types have no exemplar: Artistic Endeavors, Conferences Attended, Intercollegiate
Athletics, Military Service, Other, Publications. Retrieval falls back to other types for those,
which is worse than a same-type match — a research reader and a shadowing reader reward different
things. Presentations/Posters has only one.

Everything here comes from two documents by one admissions consultancy, and their house style is
baked in. Treating band labels as ground truth about what admissions committees reward would be
overreading them; they are one experienced reader's opinion, transcribed and annotated. A second
source with a different house style would be the highest-value addition.
