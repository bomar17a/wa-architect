-- Per-school pillar targets derived from each school's published mission statement.
--
-- Until now every school in an archetype bucket produced the identical match
-- percentage, because nothing school-specific entered the calculation while the
-- mission statements sat unused in this same table. These columns hold a target
-- vector per school, derived by scripts/derive-school-targets.ts (a transparent
-- keyword lexicon, reviewed as school_targets.json before this file was written)
-- and shifted at most 1.5 points off the school's archetype baseline.
--
-- Safe to apply before the frontend ships: the app falls back to SCHOOL_ARCHETYPES
-- whenever these are null, so partial or absent data degrades rather than breaks.
-- Idempotent: re-running these UPDATEs is a no-op.
--
-- Generated 2026-09-08 from 175 schools by
-- scripts/build-school-targets-migration.mjs. Regenerate rather than hand-editing.

ALTER TABLE medical_schools
  ADD COLUMN IF NOT EXISTS target_inquiry  numeric(3,1),
  ADD COLUMN IF NOT EXISTS target_service  numeric(3,1),
  ADD COLUMN IF NOT EXISTS target_teamwork numeric(3,1),
  ADD COLUMN IF NOT EXISTS target_clinical numeric(3,1),
  ADD COLUMN IF NOT EXISTS emphasis_tags   text[];

UPDATE medical_schools SET
  target_inquiry = 5, target_service = 6.5,
  target_teamwork = 7, target_clinical = 8.5,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Albany Medical College';

UPDATE medical_schools SET
  target_inquiry = 9.4, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.6,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Albert Einstein College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4, target_service = 9.5,
  target_teamwork = 7.3, target_clinical = 6.6,
  emphasis_tags = ARRAY['rural health', 'underserved communities', 'entrepreneurship', 'whole-person care']::text[]
WHERE school_name = 'Alice L. Walton School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 7, target_service = 6,
  target_teamwork = 9, target_clinical = 6.5,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'Anne Burnett Marion School of Medicine at TCU';

UPDATE medical_schools SET
  target_inquiry = 7.3, target_service = 5.5,
  target_teamwork = 8.3, target_clinical = 7.3,
  emphasis_tags = ARRAY['entrepreneurship', 'translational research', 'research']::text[]
WHERE school_name = 'Arizona State University School of Medicine and Advanced Medical Engineering (SOMME)';

UPDATE medical_schools SET
  target_inquiry = 9.1, target_service = 5.5,
  target_teamwork = 5.8, target_clinical = 7.1,
  emphasis_tags = ARRAY['innovation']::text[]
WHERE school_name = 'Baylor College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.5, target_service = 7.1,
  target_teamwork = 6.2, target_clinical = 6.7,
  emphasis_tags = ARRAY['social justice', 'research']::text[]
WHERE school_name = 'Boston University Aram V. Chobanian & Edward Avedisian School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 3, target_service = 6.5,
  target_teamwork = 7, target_clinical = 10,
  emphasis_tags = ARRAY['primary care']::text[]
WHERE school_name = 'Brody School of Medicine at East Carolina University';

UPDATE medical_schools SET
  target_inquiry = 9.7, target_service = 5.8,
  target_teamwork = 5.5, target_clinical = 6.5,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'California Northstate University College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 10, target_service = 5,
  target_teamwork = 5.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'California University of Science and Medicine-School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.8, target_service = 5.8,
  target_teamwork = 8.6, target_clinical = 7.2,
  emphasis_tags = ARRAY['innovation', 'research']::text[]
WHERE school_name = 'Carle Illinois College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.1, target_service = 5.8,
  target_teamwork = 5.9, target_clinical = 6.8,
  emphasis_tags = ARRAY['underserved communities', 'community health', 'translational research', 'research', 'leadership']::text[]
WHERE school_name = 'Case Western Reserve University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 3.2, target_service = 7.4,
  target_teamwork = 7.2, target_clinical = 9.2,
  emphasis_tags = ARRAY['primary care', 'underserved communities', 'research']::text[]
WHERE school_name = 'Central Michigan University College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.5, target_service = 5.5,
  target_teamwork = 5.7, target_clinical = 6.7,
  emphasis_tags = ARRAY['translational research', 'research']::text[]
WHERE school_name = 'Charles E. Schmidt College of Medicine at Florida Atlantic University';

UPDATE medical_schools SET
  target_inquiry = 4.2, target_service = 9.8,
  target_teamwork = 6.9, target_clinical = 6.6,
  emphasis_tags = ARRAY['underserved communities', 'health disparities', 'research']::text[]
WHERE school_name = 'Charles R. Drew University of Medicine and Science College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.1, target_service = 5.3,
  target_teamwork = 6.2, target_clinical = 6.9,
  emphasis_tags = ARRAY['interprofessional care', 'leadership']::text[]
WHERE school_name = 'Chicago Medical School at Rosalind Franklin University of Medicine & Science';

UPDATE medical_schools SET
  target_inquiry = 5.5, target_service = 7.6,
  target_teamwork = 9, target_clinical = 7.4,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'Columbia University Vagelos College of Physicians and Surgeons';

UPDATE medical_schools SET
  target_inquiry = 7.4, target_service = 6.1,
  target_teamwork = 8.2, target_clinical = 6.9,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Cooper Medical School of Rowan University';

UPDATE medical_schools SET
  target_inquiry = 6.1, target_service = 7.1,
  target_teamwork = 6.2, target_clinical = 7.1,
  emphasis_tags = ARRAY['primary care', 'underserved communities', 'health disparities', 'social justice', 'public health']::text[]
WHERE school_name = 'Creighton University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4, target_service = 9.6,
  target_teamwork = 6.5, target_clinical = 7.4,
  emphasis_tags = ARRAY['primary care', 'underserved communities']::text[]
WHERE school_name = 'CUNY School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.6, target_service = 7,
  target_teamwork = 8.5, target_clinical = 7.4,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Dalhousie University Faculty of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.5, target_service = 5.5,
  target_teamwork = 10, target_clinical = 6.5,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'Donald and Barbara Zucker School of Medicine at Hofstra/Northwell';

UPDATE medical_schools SET
  target_inquiry = 6.3, target_service = 6.3,
  target_teamwork = 6.5, target_clinical = 7.3,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'Drexel University College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9, target_service = 5.5,
  target_teamwork = 5.5, target_clinical = 7.6,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Duke University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 3.7, target_service = 7.3,
  target_teamwork = 7, target_clinical = 9,
  emphasis_tags = ARRAY['primary care', 'rural health', 'underserved communities', 'research']::text[]
WHERE school_name = 'East Tennessee State University James H. Quillen College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.5, target_service = 7.5,
  target_teamwork = 8.5, target_clinical = 8.1,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Eastern Virginia Medical School';

UPDATE medical_schools SET
  target_inquiry = 9.1, target_service = 5.3,
  target_teamwork = 5.9, target_clinical = 7.3,
  emphasis_tags = ARRAY['public health', 'translational research', 'research']::text[]
WHERE school_name = 'Emory University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.6, target_service = 5.3,
  target_teamwork = 5.8, target_clinical = 6.7,
  emphasis_tags = ARRAY['innovation', 'translational research', 'research']::text[]
WHERE school_name = 'Florida International University Herbert Wertheim College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.1, target_service = 9.9,
  target_teamwork = 6.5, target_clinical = 7,
  emphasis_tags = ARRAY['rural health', 'underserved communities']::text[]
WHERE school_name = 'Florida State University College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.4, target_service = 8.9,
  target_teamwork = 7.1, target_clinical = 7.1,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'Frank H. Netter MD School of Medicine at Quinnipiac University';

UPDATE medical_schools SET
  target_inquiry = 9.4, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.6,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Frederick P. Whiddon College of Medicine at the University of South Alabama';

UPDATE medical_schools SET
  target_inquiry = 5.6, target_service = 7.3,
  target_teamwork = 9.3, target_clinical = 7.3,
  emphasis_tags = ARRAY['innovation', 'leadership']::text[]
WHERE school_name = 'Geisel School of Medicine at Dartmouth';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 9,
  target_teamwork = 7.1, target_clinical = 7,
  emphasis_tags = ARRAY['interprofessional care']::text[]
WHERE school_name = 'Geisinger Commonwealth School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.4, target_service = 9.3,
  target_teamwork = 7, target_clinical = 6.9,
  emphasis_tags = ARRAY['health disparities', 'translational research', 'research']::text[]
WHERE school_name = 'George Washington University School of Medicine & Health Sciences';

UPDATE medical_schools SET
  target_inquiry = 6.1, target_service = 7.5,
  target_teamwork = 6.1, target_clinical = 6.8,
  emphasis_tags = ARRAY['underserved communities', 'health equity', 'social justice']::text[]
WHERE school_name = 'Georgetown University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.1, target_service = 9.2,
  target_teamwork = 6.5, target_clinical = 6.6,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Hackensack Meridian School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.2, target_service = 5.6,
  target_teamwork = 6.3, target_clinical = 6.5,
  emphasis_tags = ARRAY['leadership']::text[]
WHERE school_name = 'Harvard Medical School';

UPDATE medical_schools SET
  target_inquiry = 4.5, target_service = 10,
  target_teamwork = 6.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'Howard University College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 8.8, target_service = 5.8,
  target_teamwork = 5.9, target_clinical = 7,
  emphasis_tags = ARRAY['health equity', 'innovation', 'research']::text[]
WHERE school_name = 'Icahn School of Medicine at Mount Sinai';

UPDATE medical_schools SET
  target_inquiry = 6.4, target_service = 6.6,
  target_teamwork = 6.2, target_clinical = 7.3,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Indiana University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.5, target_service = 7,
  target_teamwork = 9, target_clinical = 8.1,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Jacobs School of Medicine and Biomedical Sciences at the University at Buffalo';

UPDATE medical_schools SET
  target_inquiry = 9.8, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.3,
  emphasis_tags = ARRAY['basic science']::text[]
WHERE school_name = 'Johns Hopkins University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.5, target_service = 9,
  target_teamwork = 7, target_clinical = 7,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'Kaiser Permanente Bernard J. Tyson School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.6, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.4,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Keck School of Medicine of the University of Southern California';

UPDATE medical_schools SET
  target_inquiry = 4.4, target_service = 9.9,
  target_teamwork = 6.5, target_clinical = 6.7,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'Kirk Kerkorian School of Medicine at UNLV';

UPDATE medical_schools SET
  target_inquiry = 6.4, target_service = 7.3,
  target_teamwork = 6, target_clinical = 6.9,
  emphasis_tags = ARRAY['health equity', 'research']::text[]
WHERE school_name = 'Lewis Katz School of Medicine at Temple University';

UPDATE medical_schools SET
  target_inquiry = 3.8, target_service = 7,
  target_teamwork = 7, target_clinical = 9.3,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Loma Linda University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.5, target_service = 9,
  target_teamwork = 7, target_clinical = 7,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'Louisiana State University School of Medicine in New Orleans';

UPDATE medical_schools SET
  target_inquiry = 9.3, target_service = 5.2,
  target_teamwork = 5.8, target_clinical = 7.2,
  emphasis_tags = ARRAY['basic science', 'research']::text[]
WHERE school_name = 'Louisiana State University School of Medicine in Shreveport';

UPDATE medical_schools SET
  target_inquiry = 9.9, target_service = 5.6,
  target_teamwork = 5.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['innovation']::text[]
WHERE school_name = 'Loyola University Chicago Stritch School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 3.3, target_service = 7.3,
  target_teamwork = 7, target_clinical = 9.4,
  emphasis_tags = ARRAY['primary care', 'rural health', 'underserved communities', 'research']::text[]
WHERE school_name = 'Marshall University Joan C. Edwards School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.2, target_service = 6.1,
  target_teamwork = 5.5, target_clinical = 6.7,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Max Rady College of Medicine, Rady Faculty of Health Sciences, University of Manitoba';

UPDATE medical_schools SET
  target_inquiry = 5.8, target_service = 7.4,
  target_teamwork = 9, target_clinical = 7.3,
  emphasis_tags = ARRAY['health equity', 'innovation', 'translational research', 'basic science', 'research']::text[]
WHERE school_name = 'Mayo Clinic Alix School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.3, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.8,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'McGovern Medical School at the University of Texas Health Science Center at Houston';

UPDATE medical_schools SET
  target_inquiry = 10, target_service = 5,
  target_teamwork = 5.5, target_clinical = 6.5,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'McMaster University Michael G. DeGroote School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 9.4,
  target_teamwork = 6.8, target_clinical = 7,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'Medical College of Georgia at Augusta University';

UPDATE medical_schools SET
  target_inquiry = 5.1, target_service = 7,
  target_teamwork = 8.5, target_clinical = 8.9,
  emphasis_tags = ARRAY['primary care']::text[]
WHERE school_name = 'Medical College of Wisconsin';

UPDATE medical_schools SET
  target_inquiry = 3.7, target_service = 6.8,
  target_teamwork = 7.7, target_clinical = 8.8,
  emphasis_tags = ARRAY['interprofessional care']::text[]
WHERE school_name = 'Medical University of South Carolina College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.2, target_service = 9.5,
  target_teamwork = 7.2, target_clinical = 6.6,
  emphasis_tags = ARRAY['health equity', 'research', 'leadership']::text[]
WHERE school_name = 'Meharry Medical College';

UPDATE medical_schools SET
  target_inquiry = 6, target_service = 8.5,
  target_teamwork = 6.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Memorial University of Newfoundland Faculty of Medicine';

UPDATE medical_schools SET
  target_inquiry = 3, target_service = 8,
  target_teamwork = 7, target_clinical = 9,
  emphasis_tags = ARRAY['primary care', 'rural health', 'underserved communities']::text[]
WHERE school_name = 'Mercer University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4, target_service = 10,
  target_teamwork = 6.8, target_clinical = 6.6,
  emphasis_tags = ARRAY['health disparities']::text[]
WHERE school_name = 'Methodist University Cape Fear Valley Health School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.1, target_service = 10,
  target_teamwork = 6.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['underserved communities']::text[]
WHERE school_name = 'Michigan State University College of Human Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.6, target_service = 9.9,
  target_teamwork = 6.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['rural health', 'underserved communities', 'research']::text[]
WHERE school_name = 'Morehouse School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.4, target_service = 7.6,
  target_teamwork = 6, target_clinical = 6.5,
  emphasis_tags = ARRAY['public health', 'research']::text[]
WHERE school_name = 'New York Medical College';

UPDATE medical_schools SET
  target_inquiry = 3.4, target_service = 7.5,
  target_teamwork = 7, target_clinical = 9.1,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'Northeast Ohio Medical University';

UPDATE medical_schools SET
  target_inquiry = 4.4, target_service = 10,
  target_teamwork = 6.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['rural health', 'health equity', 'research']::text[]
WHERE school_name = 'Northern Ontario School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 8.9, target_service = 5.2,
  target_teamwork = 6.5, target_clinical = 6.9,
  emphasis_tags = ARRAY['innovation', 'leadership']::text[]
WHERE school_name = 'Northwestern University The Feinberg School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 7.3, target_service = 6,
  target_teamwork = 8, target_clinical = 7.3,
  emphasis_tags = ARRAY['innovation', 'research']::text[]
WHERE school_name = 'Nova Southeastern University Dr. Kiran C. Patel College of Allopathic Medicine';

UPDATE medical_schools SET
  target_inquiry = 3.3, target_service = 6.8,
  target_teamwork = 7.3, target_clinical = 9.6,
  emphasis_tags = ARRAY['primary care']::text[]
WHERE school_name = 'NYU Grossman Long Island School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.4, target_service = 7.4,
  target_teamwork = 8.9, target_clinical = 7.9,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'NYU Grossman School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.4, target_service = 7.3,
  target_teamwork = 6.4, target_clinical = 6.5,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Oakland University William Beaumont School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 7.2, target_service = 6.2,
  target_teamwork = 8, target_clinical = 7.2,
  emphasis_tags = ARRAY['innovation', 'research']::text[]
WHERE school_name = 'Ohio State University College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.3, target_service = 7.1,
  target_teamwork = 6, target_clinical = 7.1,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'Oregon Health & Science University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 10, target_service = 5,
  target_teamwork = 5.5, target_clinical = 6.9,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Pennsylvania State University College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.4, target_service = 5.4,
  target_teamwork = 5.5, target_clinical = 7.2,
  emphasis_tags = ARRAY['innovation', 'research']::text[]
WHERE school_name = 'Perelman School of Medicine at the University of Pennsylvania';

UPDATE medical_schools SET
  target_inquiry = 4.5, target_service = 10,
  target_teamwork = 6.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['health disparities', 'research']::text[]
WHERE school_name = 'Ponce Health Sciences University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5, target_service = 7.8,
  target_teamwork = 9.6, target_clinical = 7.1,
  emphasis_tags = ARRAY['health equity', 'interprofessional care']::text[]
WHERE school_name = 'Queen''s University Faculty of Health Sciences';

UPDATE medical_schools SET
  target_inquiry = 9.6, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.4,
  emphasis_tags = ARRAY['physician-scientist training', 'research']::text[]
WHERE school_name = 'Renaissance School of Medicine at Stony Brook University';

UPDATE medical_schools SET
  target_inquiry = 4.6, target_service = 9.4,
  target_teamwork = 6.6, target_clinical = 6.9,
  emphasis_tags = ARRAY['physician-scientist training', 'rural health', 'social justice', 'public health', 'research']::text[]
WHERE school_name = 'Robert Larner, M.D., College of Medicine at the University of Vermont';

UPDATE medical_schools SET
  target_inquiry = 4, target_service = 9.8,
  target_teamwork = 6.5, target_clinical = 7.2,
  emphasis_tags = ARRAY['health disparities']::text[]
WHERE school_name = 'Roseman University College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 8.9,
  target_teamwork = 7.2, target_clinical = 7.1,
  emphasis_tags = ARRAY['innovation', 'research', 'leadership']::text[]
WHERE school_name = 'Rush Medical College of Rush University Medical Center';

UPDATE medical_schools SET
  target_inquiry = 6.8, target_service = 6,
  target_teamwork = 8.6, target_clinical = 7,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Rutgers New Jersey Medical School';

UPDATE medical_schools SET
  target_inquiry = 6.9, target_service = 6.2,
  target_teamwork = 8.4, target_clinical = 7,
  emphasis_tags = ARRAY['primary care', 'health equity', 'entrepreneurship', 'innovation', 'research']::text[]
WHERE school_name = 'Rutgers, Robert Wood Johnson Medical School';

UPDATE medical_schools SET
  target_inquiry = 6.6, target_service = 6.8,
  target_teamwork = 6.4, target_clinical = 6.8,
  emphasis_tags = ARRAY['health equity', 'social justice', 'research']::text[]
WHERE school_name = 'Saint Louis University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.6, target_service = 9.8,
  target_teamwork = 6.5, target_clinical = 6.6,
  emphasis_tags = ARRAY['underserved communities', 'community health', 'translational research', 'research']::text[]
WHERE school_name = 'San Juan Bautista School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.4, target_service = 5.5,
  target_teamwork = 5.7, target_clinical = 7,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Sidney Kimmel Medical College at Thomas Jefferson University';

UPDATE medical_schools SET
  target_inquiry = 4.5, target_service = 9.3,
  target_teamwork = 6.5, target_clinical = 7.3,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Southern Illinois University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 9.8,
  target_teamwork = 6.5, target_clinical = 7,
  emphasis_tags = ARRAY['rural health', 'underserved communities', 'health disparities', 'community health', 'innovation']::text[]
WHERE school_name = 'Spencer Fox Eccles School of Medicine at the University of Utah';

UPDATE medical_schools SET
  target_inquiry = 9.5, target_service = 5,
  target_teamwork = 6, target_clinical = 6.9,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Stanford University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.6, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.4,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'State University of New York Upstate Medical University Alan and Marlene Norton College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.8, target_service = 5.7,
  target_teamwork = 5.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'SUNY Downstate Health Sciences University College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.9, target_service = 6.7,
  target_teamwork = 8.3, target_clinical = 6.7,
  emphasis_tags = ARRAY['rural health', 'health disparities', 'research']::text[]
WHERE school_name = 'Texas A&M School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 9.6,
  target_teamwork = 7.1, target_clinical = 6.5,
  emphasis_tags = ARRAY['rural health', 'underserved communities', 'research']::text[]
WHERE school_name = 'Texas A&M University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.8, target_service = 5.7,
  target_teamwork = 5.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['innovation', 'research']::text[]
WHERE school_name = 'Texas Tech University Health Sciences Center Paul L. Foster School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.5, target_service = 9.2,
  target_teamwork = 6.5, target_clinical = 7.3,
  emphasis_tags = ARRAY['rural health', 'research']::text[]
WHERE school_name = 'Texas Tech University Health Sciences Center School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.6, target_service = 9.4,
  target_teamwork = 6.8, target_clinical = 6.7,
  emphasis_tags = ARRAY['health disparities', 'translational research', 'research']::text[]
WHERE school_name = 'The University of Texas at Tyler School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.8, target_service = 6.5,
  target_teamwork = 7, target_clinical = 8.7,
  emphasis_tags = ARRAY['translational research', 'research']::text[]
WHERE school_name = 'The University of Texas Health Science Center at San Antonio Joe R. and Teresa Lozano Long School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 3.5, target_service = 6.5,
  target_teamwork = 7, target_clinical = 10,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'The University of Toledo College of Medicine and Life Sciences';

UPDATE medical_schools SET
  target_inquiry = 6, target_service = 7,
  target_teamwork = 9.5, target_clinical = 7,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'The University of Western Ontario - Schulich School of Medicine & Dentistry';

UPDATE medical_schools SET
  target_inquiry = 7, target_service = 5.8,
  target_teamwork = 8, target_clinical = 7.7,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'The Warren Alpert Medical School of Brown University';

UPDATE medical_schools SET
  target_inquiry = 3, target_service = 7.2,
  target_teamwork = 7.9, target_clinical = 8.9,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'Thomas F. Frist, Jr. College of Medicine at Belmont University';

UPDATE medical_schools SET
  target_inquiry = 4.2, target_service = 9.7,
  target_teamwork = 6.7, target_clinical = 7,
  emphasis_tags = ARRAY['primary care', 'underserved communities']::text[]
WHERE school_name = 'Toronto Metropolitan University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.4, target_service = 7.1,
  target_teamwork = 6.4, target_clinical = 6.6,
  emphasis_tags = ARRAY['underserved communities', 'health equity', 'social justice', 'public health', 'research']::text[]
WHERE school_name = 'Tufts University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.6, target_service = 7,
  target_teamwork = 8.8, target_clinical = 8.1,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'Tulane University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.3, target_service = 7.7,
  target_teamwork = 9.3, target_clinical = 7.2,
  emphasis_tags = ARRAY['public health', 'research', 'leadership']::text[]
WHERE school_name = 'Uniformed Services University of the Health Sciences F. Edward Hebert School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4, target_service = 10,
  target_teamwork = 6.5, target_clinical = 6.5,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'Universidad Central del Caribe School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 6.5,
  target_teamwork = 7, target_clinical = 9.2,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Universite de Montreal Faculty of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4, target_service = 7,
  target_teamwork = 7, target_clinical = 9,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Universite de Sherbrooke Faculty of Medicine';

UPDATE medical_schools SET
  target_inquiry = 8.9, target_service = 5.4,
  target_teamwork = 6.1, target_clinical = 7,
  emphasis_tags = ARRAY['physician-scientist training', 'primary care', 'rural health', 'underserved communities', 'innovation']::text[]
WHERE school_name = 'University of Alabama at Birmingham Marnix E. Heersink School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 8.5, target_service = 5,
  target_teamwork = 5.5, target_clinical = 8.5,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'University of Arizona College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.2, target_service = 7.5,
  target_teamwork = 9.6, target_clinical = 7.2,
  emphasis_tags = ARRAY['innovation', 'leadership']::text[]
WHERE school_name = 'University of Arizona College of Medicine - Phoenix';

UPDATE medical_schools SET
  target_inquiry = 8.9, target_service = 6,
  target_teamwork = 6, target_clinical = 6.8,
  emphasis_tags = ARRAY['health equity', 'research', 'leadership']::text[]
WHERE school_name = 'University of Arkansas for Medical Sciences College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4, target_service = 9.4,
  target_teamwork = 7.1, target_clinical = 7,
  emphasis_tags = ARRAY['rural health']::text[]
WHERE school_name = 'University of British Columbia Faculty of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.1, target_service = 9.6,
  target_teamwork = 6.8, target_clinical = 7,
  emphasis_tags = ARRAY['primary care', 'rural health', 'underserved communities', 'community health', 'research']::text[]
WHERE school_name = 'University of California, Davis, School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 10, target_service = 5,
  target_teamwork = 5.5, target_clinical = 6.5,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'University of California, Irvine, School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 8.8, target_service = 5.3,
  target_teamwork = 6.5, target_clinical = 7,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of California, Los Angeles David Geffen School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.4, target_service = 10,
  target_teamwork = 6.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'University of California, Riverside School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.5, target_service = 5.7,
  target_teamwork = 5.5, target_clinical = 6.8,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of California, San Diego School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.3, target_service = 5.7,
  target_teamwork = 5.8, target_clinical = 6.8,
  emphasis_tags = ARRAY['public health', 'research']::text[]
WHERE school_name = 'University of California, San Francisco, School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.8, target_service = 7.3,
  target_teamwork = 8.9, target_clinical = 7.6,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of Central Florida College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.1, target_service = 6,
  target_teamwork = 5.9, target_clinical = 6.6,
  emphasis_tags = ARRAY['underserved communities', 'health equity', 'community health', 'translational research', 'research']::text[]
WHERE school_name = 'University of Chicago Division of the Biological Sciences The Pritzker School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9, target_service = 5.5,
  target_teamwork = 5.9, target_clinical = 7.1,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of Cincinnati College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 8.9, target_service = 5.5,
  target_teamwork = 6, target_clinical = 7.2,
  emphasis_tags = ARRAY['health policy', 'research']::text[]
WHERE school_name = 'University of Colorado School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 7.4, target_service = 5.7,
  target_teamwork = 8, target_clinical = 7.3,
  emphasis_tags = ARRAY['innovation', 'research']::text[]
WHERE school_name = 'University of Connecticut School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.5, target_service = 7.3,
  target_teamwork = 9, target_clinical = 7.7,
  emphasis_tags = ARRAY['primary care', 'basic science', 'research', 'leadership']::text[]
WHERE school_name = 'University of Florida College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.2, target_service = 9,
  target_teamwork = 7.4, target_clinical = 7,
  emphasis_tags = ARRAY['primary care', 'rural health', 'research', 'leadership', 'global health']::text[]
WHERE school_name = 'University of Hawaii, John A. Burns School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 8.8,
  target_teamwork = 7.3, target_clinical = 7.1,
  emphasis_tags = ARRAY['primary care', 'interprofessional care', 'research']::text[]
WHERE school_name = 'University of Houston Tilman J. Fertitta Family College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.4, target_service = 9,
  target_teamwork = 7, target_clinical = 7,
  emphasis_tags = ARRAY['rural health', 'underserved communities', 'basic science', 'research', 'leadership']::text[]
WHERE school_name = 'University of Illinois College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6, target_service = 7.2,
  target_teamwork = 6.6, target_clinical = 6.7,
  emphasis_tags = ARRAY['rural health']::text[]
WHERE school_name = 'University of Iowa Roy J. and Lucille A. Carver College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 8.5, target_service = 5.5,
  target_teamwork = 8, target_clinical = 6.5,
  emphasis_tags = ARRAY['innovation', 'research']::text[]
WHERE school_name = 'University of Kansas School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 8.9, target_service = 5.4,
  target_teamwork = 6.3, target_clinical = 7,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of Louisville School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.8, target_service = 6.8,
  target_teamwork = 6, target_clinical = 6.9,
  emphasis_tags = ARRAY['health equity', 'research']::text[]
WHERE school_name = 'University of Maryland School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.2, target_service = 9.9,
  target_teamwork = 6.8, target_clinical = 6.6,
  emphasis_tags = ARRAY['rural health', 'health equity', 'community health', 'entrepreneurship', 'innovation']::text[]
WHERE school_name = 'University of Massachusetts T.H. Chan School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.6, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.4,
  emphasis_tags = ARRAY['translational research', 'research']::text[]
WHERE school_name = 'University of Miami Leonard M. Miller School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 7, target_service = 6.1,
  target_teamwork = 8.4, target_clinical = 7.1,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'University of Michigan Medical School';

UPDATE medical_schools SET
  target_inquiry = 6.5, target_service = 6.5,
  target_teamwork = 6.8, target_clinical = 6.7,
  emphasis_tags = ARRAY['rural health', 'innovation']::text[]
WHERE school_name = 'University of Minnesota Medical School';

UPDATE medical_schools SET
  target_inquiry = 3.4, target_service = 7.3,
  target_teamwork = 7, target_clinical = 9.4,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'University of Mississippi School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 3.8, target_service = 6.5,
  target_teamwork = 7, target_clinical = 9.8,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of Missouri-Columbia School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.2, target_service = 7.2,
  target_teamwork = 9.1, target_clinical = 7,
  emphasis_tags = ARRAY['research', 'leadership']::text[]
WHERE school_name = 'University of Missouri-Kansas City School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 3.8, target_service = 6.5,
  target_teamwork = 7, target_clinical = 9.8,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of Nebraska College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 9.4,
  target_teamwork = 6.5, target_clinical = 7.3,
  emphasis_tags = ARRAY['rural health', 'research']::text[]
WHERE school_name = 'University of Nevada, Reno School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.1, target_service = 10,
  target_teamwork = 6.7, target_clinical = 6.7,
  emphasis_tags = ARRAY['rural health', 'underserved communities', 'health equity']::text[]
WHERE school_name = 'University of New Mexico School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.6, target_service = 7.7,
  target_teamwork = 8.9, target_clinical = 7.4,
  emphasis_tags = ARRAY['physician-scientist training', 'primary care', 'rural health', 'underserved communities', 'social justice']::text[]
WHERE school_name = 'University of North Carolina at Chapel Hill School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5, target_service = 6.5,
  target_teamwork = 7, target_clinical = 8.5,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'University of North Dakota School of Medicine and Health Sciences';

UPDATE medical_schools SET
  target_inquiry = 5.4, target_service = 7.3,
  target_teamwork = 9.3, target_clinical = 7.6,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of Oklahoma College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5, target_service = 6.5,
  target_teamwork = 7, target_clinical = 8.5,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of Ottawa Faculty of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6, target_service = 7,
  target_teamwork = 9.5, target_clinical = 7,
  emphasis_tags = ARRAY['research', 'leadership']::text[]
WHERE school_name = 'University of Pittsburgh School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.6, target_service = 5.6,
  target_teamwork = 5.5, target_clinical = 6.8,
  emphasis_tags = ARRAY['translational research', 'research', 'global health']::text[]
WHERE school_name = 'University of Puerto Rico School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 7.2, target_service = 5.5,
  target_teamwork = 9.3, target_clinical = 6.5,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'University of Rochester School of Medicine and Dentistry';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 8.8,
  target_teamwork = 7.8, target_clinical = 6.8,
  emphasis_tags = ARRAY['research', 'leadership']::text[]
WHERE school_name = 'University of Saskatchewan College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 9.4,
  target_teamwork = 6.8, target_clinical = 6.9,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'University of South Carolina School of Medicine Columbia';

UPDATE medical_schools SET
  target_inquiry = 6.8, target_service = 5.5,
  target_teamwork = 9.3, target_clinical = 6.9,
  emphasis_tags = ARRAY['interprofessional care', 'research']::text[]
WHERE school_name = 'University of South Carolina School of Medicine Greenville';

UPDATE medical_schools SET
  target_inquiry = 3.4, target_service = 8.1,
  target_teamwork = 7, target_clinical = 8.5,
  emphasis_tags = ARRAY['underserved communities', 'research']::text[]
WHERE school_name = 'University of South Dakota, Sanford School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9, target_service = 5.2,
  target_teamwork = 6.1, target_clinical = 7.1,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of Tennessee Health Science Center College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 7.1, target_service = 5.8,
  target_teamwork = 8.7, target_clinical = 7,
  emphasis_tags = ARRAY['entrepreneurship', 'innovation', 'research']::text[]
WHERE school_name = 'University of Texas at Austin Dell Medical School';

UPDATE medical_schools SET
  target_inquiry = 9, target_service = 5.3,
  target_teamwork = 6, target_clinical = 7.2,
  emphasis_tags = ARRAY['leadership']::text[]
WHERE school_name = 'University of Texas Medical Branch John Sealy School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.8, target_service = 8.8,
  target_teamwork = 6.8, target_clinical = 7.1,
  emphasis_tags = ARRAY['entrepreneurship', 'research']::text[]
WHERE school_name = 'University of Texas Rio Grande Valley School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 10, target_service = 5,
  target_teamwork = 5.5, target_clinical = 6.5,
  emphasis_tags = ARRAY['innovation', 'research']::text[]
WHERE school_name = 'University of Texas Southwestern Medical School';

UPDATE medical_schools SET
  target_inquiry = 5.5, target_service = 7,
  target_teamwork = 9, target_clinical = 7.9,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'University of Virginia School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.7, target_service = 9.1,
  target_teamwork = 6.9, target_clinical = 6.8,
  emphasis_tags = ARRAY['primary care', 'underserved communities', 'research', 'leadership']::text[]
WHERE school_name = 'University of Washington School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.4, target_service = 7.6,
  target_teamwork = 6, target_clinical = 6.5,
  emphasis_tags = ARRAY['health equity', 'research']::text[]
WHERE school_name = 'University of Wisconsin School of Medicine and Public Health';

UPDATE medical_schools SET
  target_inquiry = 9.3, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.8,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'USF Health Morsani College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 8.9, target_service = 5.7,
  target_teamwork = 5.9, target_clinical = 7,
  emphasis_tags = ARRAY['health equity', 'innovation', 'leadership']::text[]
WHERE school_name = 'Vanderbilt University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9.6, target_service = 5,
  target_teamwork = 5.5, target_clinical = 7.4,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Virginia Commonwealth University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.6, target_service = 7,
  target_teamwork = 9.3, target_clinical = 7.5,
  emphasis_tags = ARRAY['interprofessional care', 'research']::text[]
WHERE school_name = 'Virginia Tech Carilion School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.5, target_service = 7,
  target_teamwork = 10, target_clinical = 7,
  emphasis_tags = ARRAY['innovation']::text[]
WHERE school_name = 'Wake Forest University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 9.8,
  target_teamwork = 6.9, target_clinical = 6.6,
  emphasis_tags = ARRAY['rural health', 'underserved communities', 'research']::text[]
WHERE school_name = 'Washington State University Elson S. Floyd College of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9, target_service = 5.9,
  target_teamwork = 5.8, target_clinical = 6.8,
  emphasis_tags = ARRAY['primary care', 'underserved communities', 'health disparities', 'social justice', 'innovation']::text[]
WHERE school_name = 'Washington University in St. Louis School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 6.3, target_service = 6.8,
  target_teamwork = 6.7, target_clinical = 6.7,
  emphasis_tags = ARRAY['public health', 'research']::text[]
WHERE school_name = 'Wayne State University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 9, target_service = 5,
  target_teamwork = 5.5, target_clinical = 8,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Weill Cornell Medicine';

UPDATE medical_schools SET
  target_inquiry = 3.5, target_service = 7,
  target_teamwork = 7.5, target_clinical = 9,
  emphasis_tags = '{}'::text[]
WHERE school_name = 'West Virginia University School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 9.4,
  target_teamwork = 6.9, target_clinical = 6.9,
  emphasis_tags = ARRAY['health equity', 'innovation', 'research']::text[]
WHERE school_name = 'Western Michigan University Homer Stryker M.D. School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 4.3, target_service = 9,
  target_teamwork = 7.1, target_clinical = 7.1,
  emphasis_tags = ARRAY['research']::text[]
WHERE school_name = 'Wright State University Boonshoft School of Medicine';

UPDATE medical_schools SET
  target_inquiry = 5.7, target_service = 7.5,
  target_teamwork = 9.2, target_clinical = 7,
  emphasis_tags = ARRAY['innovation']::text[]
WHERE school_name = 'Yale School of Medicine';
