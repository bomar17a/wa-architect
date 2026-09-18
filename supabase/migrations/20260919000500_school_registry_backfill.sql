-- Identity and verified residency policy for every medical_schools row.
--
-- Generated 2026-09-18 from data/school-registry.json and
-- data/school-policies.json by scripts/data/build-registry-migration.mjs. Regenerate rather
-- than hand-editing.
--
-- Keys on school_name, like 20260908000000_add_school_target_vectors.sql. The check at the
-- end fails the migration if any row was missed, so a renamed school cannot slip through
-- with no slug.
--
-- Idempotent: re-running is a no-op.

UPDATE medical_schools SET slug = 'alabama-heersink', state = 'AL', country = 'US'
WHERE school_name = 'University of Alabama at Birmingham Marnix E. Heersink School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Alabama-Heersink', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'alabama-heersink'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'albany', state = 'NY', country = 'US'
WHERE school_name = 'Albany Medical College';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Albany', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'albany'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'arizona', state = 'AZ', country = 'US'
WHERE school_name = 'University of Arizona College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Arizona', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'arizona'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'arizona-phoenix', state = 'AZ', country = 'US'
WHERE school_name = 'University of Arizona College of Medicine - Phoenix';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Arizona Phoenix', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'arizona-phoenix'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'arizona-state-somme', state = 'AZ', country = 'US'
WHERE school_name = 'Arizona State University School of Medicine and Advanced Medical Engineering (SOMME)';

UPDATE medical_schools SET slug = 'arkansas', state = 'AR', country = 'US'
WHERE school_name = 'University of Arkansas for Medical Sciences College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Arkansas', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'arkansas'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'baylor', state = 'TX', country = 'US'
WHERE school_name = 'Baylor College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Baylor', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'baylor'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'belmont-frist', state = 'TN', country = 'US'
WHERE school_name = 'Thomas F. Frist, Jr. College of Medicine at Belmont University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Belmont-Frist', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'belmont-frist'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'british-columbia', state = 'BC', country = 'CA'
WHERE school_name = 'University of British Columbia Faculty of Medicine';

UPDATE medical_schools SET slug = 'brown-alpert', state = 'RI', country = 'US'
WHERE school_name = 'The Warren Alpert Medical School of Brown University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Brown-Alpert', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'brown-alpert'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'bu-chobanian-avedisian', state = 'MA', country = 'US'
WHERE school_name = 'Boston University Aram V. Chobanian & Edward Avedisian School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'BU-Chobanian Avedisian', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'bu-chobanian-avedisian'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'buffalo-jacobs', state = 'NY', country = 'US'
WHERE school_name = 'Jacobs School of Medicine and Biomedical Sciences at the University at Buffalo';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Buffalo-Jacobs', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'buffalo-jacobs'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'california', state = 'CA', country = 'US'
WHERE school_name = 'California University of Science and Medicine-School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'California', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'california'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'california-northstate', state = 'CA', country = 'US'
WHERE school_name = 'California Northstate University College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'California Northstate', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'california-northstate'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'caribe', state = 'PR', country = 'US'
WHERE school_name = 'Universidad Central del Caribe School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Caribe', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'caribe'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'carle-illinois', state = 'IL', country = 'US'
WHERE school_name = 'Carle Illinois College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Carle Illinois', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'carle-illinois'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'case-western-reserve', state = 'OH', country = 'US'
WHERE school_name = 'Case Western Reserve University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Case Western Reserve', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'case-western-reserve'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'central-michigan', state = 'MI', country = 'US'
WHERE school_name = 'Central Michigan University College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Central Michigan', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'central-michigan'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'chicago-med-franklin', state = 'IL', country = 'US'
WHERE school_name = 'Chicago Medical School at Rosalind Franklin University of Medicine & Science';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Chicago Med Franklin', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'chicago-med-franklin'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'chicago-pritzker', state = 'IL', country = 'US'
WHERE school_name = 'University of Chicago Division of the Biological Sciences The Pritzker School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Chicago-Pritzker', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'chicago-pritzker'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'cincinnati', state = 'OH', country = 'US'
WHERE school_name = 'University of Cincinnati College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Cincinnati', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'cincinnati'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'colorado', state = 'CO', country = 'US'
WHERE school_name = 'University of Colorado School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Colorado', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'colorado'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'columbia-vagelos', state = 'NY', country = 'US'
WHERE school_name = 'Columbia University Vagelos College of Physicians and Surgeons';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Columbia-Vagelos', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'columbia-vagelos'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'connecticut', state = 'CT', country = 'US'
WHERE school_name = 'University of Connecticut School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Connecticut', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'connecticut'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'cooper-rowan', state = 'NJ', country = 'US'
WHERE school_name = 'Cooper Medical School of Rowan University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Cooper Rowan', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'cooper-rowan'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'cornell-weill', state = 'NY', country = 'US'
WHERE school_name = 'Weill Cornell Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Cornell-Weill', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'cornell-weill'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'creighton', state = 'NE', country = 'US'
WHERE school_name = 'Creighton University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Creighton', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'creighton'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'cuny', state = 'NY', country = 'US'
WHERE school_name = 'CUNY School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'CUNY', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'cuny'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'dalhousie', state = 'NS', country = 'CA'
WHERE school_name = 'Dalhousie University Faculty of Medicine';

UPDATE medical_schools SET slug = 'dartmouth-geisel', state = 'NH', country = 'US'
WHERE school_name = 'Geisel School of Medicine at Dartmouth';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Dartmouth-Geisel', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'dartmouth-geisel'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'drew', state = 'CA', country = 'US'
WHERE school_name = 'Charles R. Drew University of Medicine and Science College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Drew', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'drew'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'drexel', state = 'PA', country = 'US'
WHERE school_name = 'Drexel University College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Drexel', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'drexel'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'duke', state = 'NC', country = 'US'
WHERE school_name = 'Duke University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Duke', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'duke'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'east-carolina-brody', state = 'NC', country = 'US'
WHERE school_name = 'Brody School of Medicine at East Carolina University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'East Carolina-Brody', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'east-carolina-brody'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'east-tennessee-quillen', state = 'TN', country = 'US'
WHERE school_name = 'East Tennessee State University James H. Quillen College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'East Tennessee-Quillen', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'east-tennessee-quillen'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'eastern-virginia-odu', state = 'VA', country = 'US'
WHERE school_name = 'Eastern Virginia Medical School';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Eastern Virginia', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'eastern-virginia-odu'
ON CONFLICT DO NOTHING;
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Eastern Virginia ODU', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'eastern-virginia-odu'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'einstein', state = 'NY', country = 'US'
WHERE school_name = 'Albert Einstein College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Einstein', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'einstein'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'emory', state = 'GA', country = 'US'
WHERE school_name = 'Emory University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Emory', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'emory'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'fiu-wertheim', state = 'FL', country = 'US'
WHERE school_name = 'Florida International University Herbert Wertheim College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'FIU-Wertheim', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'fiu-wertheim'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'florida', state = 'FL', country = 'US'
WHERE school_name = 'University of Florida College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Florida', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'florida'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'florida-atlantic-schmidt', state = 'FL', country = 'US'
WHERE school_name = 'Charles E. Schmidt College of Medicine at Florida Atlantic University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Florida Atlantic-Schmidt', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'florida-atlantic-schmidt'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'florida-state', state = 'FL', country = 'US'
WHERE school_name = 'Florida State University College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Florida State', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'florida-state'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'geisinger-commonwealth', state = 'PA', country = 'US'
WHERE school_name = 'Geisinger Commonwealth School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Geisinger Commonwealth', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'geisinger-commonwealth'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'george-washington', state = 'DC', country = 'US'
WHERE school_name = 'George Washington University School of Medicine & Health Sciences';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'George Washington', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'george-washington'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'georgetown', state = 'DC', country = 'US'
WHERE school_name = 'Georgetown University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Georgetown', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'georgetown'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'hackensack-meridian', state = 'NJ', country = 'US'
WHERE school_name = 'Hackensack Meridian School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Hackensack Meridian', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'hackensack-meridian'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'harvard', state = 'MA', country = 'US'
WHERE school_name = 'Harvard Medical School';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Harvard', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'harvard'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'hawaii-burns', state = 'HI', country = 'US'
WHERE school_name = 'University of Hawaii, John A. Burns School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Hawaii-Burns', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'hawaii-burns'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'houston-fertitta', state = 'TX', country = 'US'
WHERE school_name = 'University of Houston Tilman J. Fertitta Family College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Houston-Fertitta', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'houston-fertitta'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'howard', state = 'DC', country = 'US'
WHERE school_name = 'Howard University College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Howard', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'howard'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'illinois', state = 'IL', country = 'US'
WHERE school_name = 'University of Illinois College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Illinois', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'illinois'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'indiana', state = 'IN', country = 'US'
WHERE school_name = 'Indiana University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Indiana', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'indiana'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'iowa-carver', state = 'IA', country = 'US'
WHERE school_name = 'University of Iowa Roy J. and Lucille A. Carver College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Iowa-Carver', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'iowa-carver'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'jefferson-kimmel', state = 'PA', country = 'US'
WHERE school_name = 'Sidney Kimmel Medical College at Thomas Jefferson University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Jefferson-Kimmel', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'jefferson-kimmel'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'johns-hopkins', state = 'MD', country = 'US'
WHERE school_name = 'Johns Hopkins University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Johns Hopkins', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'johns-hopkins'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'kaiser-permanente-tyson', state = 'CA', country = 'US'
WHERE school_name = 'Kaiser Permanente Bernard J. Tyson School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Kaiser Permanente-Tyson', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'kaiser-permanente-tyson'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'kansas', state = 'KS', country = 'US'
WHERE school_name = 'University of Kansas School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Kansas', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'kansas'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'loma-linda', state = 'CA', country = 'US'
WHERE school_name = 'Loma Linda University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Loma Linda', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'loma-linda'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'louisville', state = 'KY', country = 'US'
WHERE school_name = 'University of Louisville School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Louisville', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'louisville'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'loyola-stritch', state = 'IL', country = 'US'
WHERE school_name = 'Loyola University Chicago Stritch School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Loyola-Stritch', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'loyola-stritch'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'lsu-new-orleans', state = 'LA', country = 'US'
WHERE school_name = 'Louisiana State University School of Medicine in New Orleans';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'LSU New Orleans', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'lsu-new-orleans'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'lsu-shreveport', state = 'LA', country = 'US'
WHERE school_name = 'Louisiana State University School of Medicine in Shreveport';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'LSU Shreveport', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'lsu-shreveport'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'manitoba-rady', state = 'MB', country = 'CA'
WHERE school_name = 'Max Rady College of Medicine, Rady Faculty of Health Sciences, University of Manitoba';

UPDATE medical_schools SET slug = 'marshall-edwards', state = 'WV', country = 'US'
WHERE school_name = 'Marshall University Joan C. Edwards School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Marshall-Edwards', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'marshall-edwards'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'maryland', state = 'MD', country = 'US'
WHERE school_name = 'University of Maryland School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Maryland', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'maryland'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'massachusetts-chan', state = 'MA', country = 'US'
WHERE school_name = 'University of Massachusetts T.H. Chan School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Massachusetts-Chan', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'massachusetts-chan'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'mayo-alix', state = 'MN', country = 'US'
WHERE school_name = 'Mayo Clinic Alix School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Mayo-Alix', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'mayo-alix'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'mc-georgia-augusta', state = 'GA', country = 'US'
WHERE school_name = 'Medical College of Georgia at Augusta University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'MC Georgia Augusta', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'mc-georgia-augusta'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'mc-wisconsin', state = 'WI', country = 'US'
WHERE school_name = 'Medical College of Wisconsin';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'MC Wisconsin', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'mc-wisconsin'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'mcmaster-degroote', state = 'ON', country = 'CA'
WHERE school_name = 'McMaster University Michael G. DeGroote School of Medicine';

UPDATE medical_schools SET slug = 'meharry', state = 'TN', country = 'US'
WHERE school_name = 'Meharry Medical College';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Meharry', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'meharry'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'memorial-newfoundland', state = 'NL', country = 'CA'
WHERE school_name = 'Memorial University of Newfoundland Faculty of Medicine';

UPDATE medical_schools SET slug = 'mercer', state = 'GA', country = 'US'
WHERE school_name = 'Mercer University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Mercer', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'mercer'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'methodist-cape-fear-valley', state = 'NC', country = 'US'
WHERE school_name = 'Methodist University Cape Fear Valley Health School of Medicine';

UPDATE medical_schools SET slug = 'miami-miller', state = 'FL', country = 'US'
WHERE school_name = 'University of Miami Leonard M. Miller School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Miami-Miller', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'miami-miller'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'michigan', state = 'MI', country = 'US'
WHERE school_name = 'University of Michigan Medical School';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Michigan', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'michigan'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'michigan-state', state = 'MI', country = 'US'
WHERE school_name = 'Michigan State University College of Human Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Michigan State', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'michigan-state'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'minnesota', state = 'MN', country = 'US'
WHERE school_name = 'University of Minnesota Medical School';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Minnesota', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'minnesota'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'mississippi', state = 'MS', country = 'US'
WHERE school_name = 'University of Mississippi School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Mississippi', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'mississippi'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'missouri-columbia', state = 'MO', country = 'US'
WHERE school_name = 'University of Missouri-Columbia School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Missouri Columbia', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'missouri-columbia'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'missouri-kansas-city', state = 'MO', country = 'US'
WHERE school_name = 'University of Missouri-Kansas City School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Missouri Kansas City', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'missouri-kansas-city'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'montreal', state = 'QC', country = 'CA'
WHERE school_name = 'Universite de Montreal Faculty of Medicine';

UPDATE medical_schools SET slug = 'morehouse', state = 'GA', country = 'US'
WHERE school_name = 'Morehouse School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Morehouse', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'morehouse'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'mount-sinai-icahn', state = 'NY', country = 'US'
WHERE school_name = 'Icahn School of Medicine at Mount Sinai';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Mount Sinai-Icahn', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'mount-sinai-icahn'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'mu-south-carolina', state = 'SC', country = 'US'
WHERE school_name = 'Medical University of South Carolina College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'MU South Carolina', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'mu-south-carolina'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'nebraska', state = 'NE', country = 'US'
WHERE school_name = 'University of Nebraska College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Nebraska', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'nebraska'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'nevada-reno', state = 'NV', country = 'US'
WHERE school_name = 'University of Nevada, Reno School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Nevada Reno', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'nevada-reno'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'new-mexico', state = 'NM', country = 'US'
WHERE school_name = 'University of New Mexico School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'New Mexico', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'new-mexico'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'new-york-medical', state = 'NY', country = 'US'
WHERE school_name = 'New York Medical College';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'New York Medical', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'new-york-medical'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'north-carolina', state = 'NC', country = 'US'
WHERE school_name = 'University of North Carolina at Chapel Hill School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'North Carolina', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'north-carolina'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'north-dakota', state = 'ND', country = 'US'
WHERE school_name = 'University of North Dakota School of Medicine and Health Sciences';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'North Dakota', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'north-dakota'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'northeast-ohio', state = 'OH', country = 'US'
WHERE school_name = 'Northeast Ohio Medical University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Northeast Ohio', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'northeast-ohio'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'northern-ontario', state = 'ON', country = 'CA'
WHERE school_name = 'Northern Ontario School of Medicine';

UPDATE medical_schools SET slug = 'northwestern-feinberg', state = 'IL', country = 'US'
WHERE school_name = 'Northwestern University The Feinberg School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Northwestern-Feinberg', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'northwestern-feinberg'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'nova-southeastern-patel', state = 'FL', country = 'US'
WHERE school_name = 'Nova Southeastern University Dr. Kiran C. Patel College of Allopathic Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Nova Southeastern-Patel', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'nova-southeastern-patel'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'nyu-grossman', state = 'NY', country = 'US'
WHERE school_name = 'NYU Grossman School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'NYU-Grossman', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'nyu-grossman'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'nyu-long-island-grossman', state = 'NY', country = 'US'
WHERE school_name = 'NYU Grossman Long Island School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'NYU Long Island-Grossman', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'nyu-long-island-grossman'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'oakland-beaumont', state = 'MI', country = 'US'
WHERE school_name = 'Oakland University William Beaumont School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Oakland Beaumont', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'oakland-beaumont'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ohio-state', state = 'OH', country = 'US'
WHERE school_name = 'Ohio State University College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Ohio State', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ohio-state'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'oklahoma', state = 'OK', country = 'US'
WHERE school_name = 'University of Oklahoma College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Oklahoma', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'oklahoma'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'oregon', state = 'OR', country = 'US'
WHERE school_name = 'Oregon Health & Science University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Oregon', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'oregon'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ottawa', state = 'ON', country = 'CA'
WHERE school_name = 'University of Ottawa Faculty of Medicine';

UPDATE medical_schools SET slug = 'penn-state', state = 'PA', country = 'US'
WHERE school_name = 'Pennsylvania State University College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Penn State', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'penn-state'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'pennsylvania-perelman', state = 'PA', country = 'US'
WHERE school_name = 'Perelman School of Medicine at the University of Pennsylvania';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Pennsylvania-Perelman', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'pennsylvania-perelman'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'pittsburgh', state = 'PA', country = 'US'
WHERE school_name = 'University of Pittsburgh School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Pittsburgh', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'pittsburgh'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ponce', state = 'PR', country = 'US'
WHERE school_name = 'Ponce Health Sciences University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Ponce', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ponce'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'puerto-rico', state = 'PR', country = 'US'
WHERE school_name = 'University of Puerto Rico School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Puerto Rico', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'puerto-rico'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'queens', state = 'ON', country = 'CA'
WHERE school_name = 'Queen''s University Faculty of Health Sciences';

UPDATE medical_schools SET slug = 'quinnipiac-netter', state = 'CT', country = 'US'
WHERE school_name = 'Frank H. Netter MD School of Medicine at Quinnipiac University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Quinnipiac-Netter', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'quinnipiac-netter'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'renaissance-stony-brook', state = 'NY', country = 'US'
WHERE school_name = 'Renaissance School of Medicine at Stony Brook University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Renaissance Stony Brook', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'renaissance-stony-brook'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'rochester', state = 'NY', country = 'US'
WHERE school_name = 'University of Rochester School of Medicine and Dentistry';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Rochester', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'rochester'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'roseman', state = 'NV', country = 'US'
WHERE school_name = 'Roseman University College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Roseman', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'roseman'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'rush', state = 'IL', country = 'US'
WHERE school_name = 'Rush Medical College of Rush University Medical Center';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Rush', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'rush'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'rutgers-new-jersey', state = 'NJ', country = 'US'
WHERE school_name = 'Rutgers New Jersey Medical School';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Rutgers New Jersey', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'rutgers-new-jersey'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'rutgers-rw-johnson', state = 'NJ', country = 'US'
WHERE school_name = 'Rutgers, Robert Wood Johnson Medical School';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Rutgers-RW Johnson', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'rutgers-rw-johnson'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'saint-louis', state = 'MO', country = 'US'
WHERE school_name = 'Saint Louis University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Saint Louis', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'saint-louis'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'san-juan-bautista', state = 'PR', country = 'US'
WHERE school_name = 'San Juan Bautista School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'San Juan Bautista', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'san-juan-bautista'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'saskatchewan', state = 'SK', country = 'CA'
WHERE school_name = 'University of Saskatchewan College of Medicine';

UPDATE medical_schools SET slug = 'sherbrooke', state = 'QC', country = 'CA'
WHERE school_name = 'Universite de Sherbrooke Faculty of Medicine';

UPDATE medical_schools SET slug = 'south-alabama-whiddon', state = 'AL', country = 'US'
WHERE school_name = 'Frederick P. Whiddon College of Medicine at the University of South Alabama';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'South Alabama-Whiddon', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'south-alabama-whiddon'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'south-carolina-columbia', state = 'SC', country = 'US'
WHERE school_name = 'University of South Carolina School of Medicine Columbia';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'South Carolina Columbia', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'south-carolina-columbia'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'south-carolina-greenville', state = 'SC', country = 'US'
WHERE school_name = 'University of South Carolina School of Medicine Greenville';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'South Carolina Greenville', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'south-carolina-greenville'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'south-dakota-sanford', state = 'SD', country = 'US'
WHERE school_name = 'University of South Dakota, Sanford School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'South Dakota-Sanford', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'south-dakota-sanford'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'southern-cal-keck', state = 'CA', country = 'US'
WHERE school_name = 'Keck School of Medicine of the University of Southern California';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Southern Cal-Keck', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'southern-cal-keck'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'southern-illinois', state = 'IL', country = 'US'
WHERE school_name = 'Southern Illinois University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Southern Illinois', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'southern-illinois'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'stanford', state = 'CA', country = 'US'
WHERE school_name = 'Stanford University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Stanford', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'stanford'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'suny-downstate', state = 'NY', country = 'US'
WHERE school_name = 'SUNY Downstate Health Sciences University College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'SUNY Downstate', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'suny-downstate'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'suny-upstate-norton', state = 'NY', country = 'US'
WHERE school_name = 'State University of New York Upstate Medical University Alan and Marlene Norton College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'SUNY Upstate-Norton', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'suny-upstate-norton'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'tcu-burnett', state = 'TX', country = 'US'
WHERE school_name = 'Anne Burnett Marion School of Medicine at TCU';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'TCU-Burnett', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'tcu-burnett'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'temple-katz', state = 'PA', country = 'US'
WHERE school_name = 'Lewis Katz School of Medicine at Temple University';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Temple-Katz', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'temple-katz'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'tennessee', state = 'TN', country = 'US'
WHERE school_name = 'University of Tennessee Health Science Center College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Tennessee', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'tennessee'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'texas-a-and-m-vashisht', state = 'TX', country = 'US'
WHERE school_name = 'Texas A&M School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Texas A&M', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'texas-a-and-m-vashisht'
ON CONFLICT DO NOTHING;
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Texas A&M-Vashisht', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'texas-a-and-m-vashisht'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'texas-and-m-duplicate-row', state = 'TX', country = 'US'
WHERE school_name = 'Texas A&M University School of Medicine';

UPDATE medical_schools SET slug = 'texas-tech', state = 'TX', country = 'US'
WHERE school_name = 'Texas Tech University Health Sciences Center School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Texas Tech', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'texas-tech'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'texas-tech-foster', state = 'TX', country = 'US'
WHERE school_name = 'Texas Tech University Health Sciences Center Paul L. Foster School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Texas Tech-Foster', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'texas-tech-foster'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'toledo', state = 'OH', country = 'US'
WHERE school_name = 'The University of Toledo College of Medicine and Life Sciences';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Toledo', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'toledo'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'toronto-metropolitan', state = 'ON', country = 'CA'
WHERE school_name = 'Toronto Metropolitan University School of Medicine';

UPDATE medical_schools SET slug = 'tufts', state = 'MA', country = 'US'
WHERE school_name = 'Tufts University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Tufts', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'tufts'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'tulane', state = 'LA', country = 'US'
WHERE school_name = 'Tulane University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Tulane', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'tulane'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'u-washington', state = 'WA', country = 'US'
WHERE school_name = 'University of Washington School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'U Washington', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'u-washington'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'uc-davis', state = 'CA', country = 'US'
WHERE school_name = 'University of California, Davis, School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UC Davis', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'uc-davis'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'uc-irvine', state = 'CA', country = 'US'
WHERE school_name = 'University of California, Irvine, School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UC Irvine', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'uc-irvine'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'uc-riverside', state = 'CA', country = 'US'
WHERE school_name = 'University of California, Riverside School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UC Riverside', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'uc-riverside'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'uc-san-diego', state = 'CA', country = 'US'
WHERE school_name = 'University of California, San Diego School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UC San Diego', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'uc-san-diego'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'uc-san-francisco', state = 'CA', country = 'US'
WHERE school_name = 'University of California, San Francisco, School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UC San Francisco', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'uc-san-francisco'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ucf', state = 'FL', country = 'US'
WHERE school_name = 'University of Central Florida College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UCF', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ucf'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ucla-geffen', state = 'CA', country = 'US'
WHERE school_name = 'University of California, Los Angeles David Geffen School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UCLA-Geffen', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ucla-geffen'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'uniformed-services-hebert', state = 'MD', country = 'US'
WHERE school_name = 'Uniformed Services University of the Health Sciences F. Edward Hebert School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Uniformed Services-Hebert', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'uniformed-services-hebert'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'unlv-kerkorian', state = 'NV', country = 'US'
WHERE school_name = 'Kirk Kerkorian School of Medicine at UNLV';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UNLV-Kerkorian', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'unlv-kerkorian'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'usf-morsani', state = 'FL', country = 'US'
WHERE school_name = 'USF Health Morsani College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'USF-Morsani', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'usf-morsani'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ut-austin-dell', state = 'TX', country = 'US'
WHERE school_name = 'University of Texas at Austin Dell Medical School';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UT Austin-Dell', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ut-austin-dell'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ut-medical-branch-sealy', state = 'TX', country = 'US'
WHERE school_name = 'University of Texas Medical Branch John Sealy School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UT Medical Branch-Sealy', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ut-medical-branch-sealy'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ut-rio-grande-valley', state = 'TX', country = 'US'
WHERE school_name = 'University of Texas Rio Grande Valley School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UT Rio Grande Valley', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ut-rio-grande-valley'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ut-san-antonio-long', state = 'TX', country = 'US'
WHERE school_name = 'The University of Texas Health Science Center at San Antonio Joe R. and Teresa Lozano Long School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UT San Antonio-Long', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ut-san-antonio-long'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ut-southwestern', state = 'TX', country = 'US'
WHERE school_name = 'University of Texas Southwestern Medical School';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UT Southwestern', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ut-southwestern'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'ut-tyler', state = 'TX', country = 'US'
WHERE school_name = 'The University of Texas at Tyler School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UT Tyler', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'ut-tyler'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'utah-eccles', state = 'UT', country = 'US'
WHERE school_name = 'Spencer Fox Eccles School of Medicine at the University of Utah';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Utah-Eccles', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'utah-eccles'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'uthealth-houston-mcgovern', state = 'TX', country = 'US'
WHERE school_name = 'McGovern Medical School at the University of Texas Health Science Center at Houston';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UT Houston-McGovern', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'uthealth-houston-mcgovern'
ON CONFLICT DO NOTHING;
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'UTHealth Houston-McGovern', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'uthealth-houston-mcgovern'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'vanderbilt', state = 'TN', country = 'US'
WHERE school_name = 'Vanderbilt University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Vanderbilt', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'vanderbilt'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'vermont-larner', state = 'VT', country = 'US'
WHERE school_name = 'Robert Larner, M.D., College of Medicine at the University of Vermont';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Vermont-Larner', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'vermont-larner'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'virginia', state = 'VA', country = 'US'
WHERE school_name = 'University of Virginia School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Virginia', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'virginia'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'virginia-commonwealth', state = 'VA', country = 'US'
WHERE school_name = 'Virginia Commonwealth University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Virginia Commonwealth', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'virginia-commonwealth'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'virginia-tech-carilion', state = 'VA', country = 'US'
WHERE school_name = 'Virginia Tech Carilion School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Virginia Tech Carilion', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'virginia-tech-carilion'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'wake-forest', state = 'NC', country = 'US'
WHERE school_name = 'Wake Forest University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Wake Forest', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'wake-forest'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'walton', state = 'AR', country = 'US'
WHERE school_name = 'Alice L. Walton School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Walton', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'walton'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'washington-state-floyd', state = 'WA', country = 'US'
WHERE school_name = 'Washington State University Elson S. Floyd College of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Washington State-Floyd', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'washington-state-floyd'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'washington-u-st-louis', state = 'MO', country = 'US'
WHERE school_name = 'Washington University in St. Louis School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Washington U St Louis', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'washington-u-st-louis'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'wayne-state', state = 'MI', country = 'US'
WHERE school_name = 'Wayne State University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Wayne State', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'wayne-state'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'west-virginia', state = 'WV', country = 'US'
WHERE school_name = 'West Virginia University School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'West Virginia', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'west-virginia'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'western-michigan-stryker', state = 'MI', country = 'US'
WHERE school_name = 'Western Michigan University Homer Stryker M.D. School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Western Michigan-Stryker', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'western-michigan-stryker'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'western-ontario-schulich', state = 'ON', country = 'CA'
WHERE school_name = 'The University of Western Ontario - Schulich School of Medicine & Dentistry';

UPDATE medical_schools SET slug = 'wisconsin', state = 'WI', country = 'US'
WHERE school_name = 'University of Wisconsin School of Medicine and Public Health';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Wisconsin', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'wisconsin'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'wright-state-boonshoft', state = 'OH', country = 'US'
WHERE school_name = 'Wright State University Boonshoft School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Wright State-Boonshoft', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'wright-state-boonshoft'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'yale', state = 'CT', country = 'US'
WHERE school_name = 'Yale School of Medicine';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Yale', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'yale'
ON CONFLICT DO NOTHING;

UPDATE medical_schools SET slug = 'zucker-hofstra-northwell', state = 'NY', country = 'US'
WHERE school_name = 'Donald and Barbara Zucker School of Medicine at Hofstra/Northwell';
INSERT INTO school_aliases (school_id, alias, source_slug)
SELECT id, 'Zucker Hofstra Northwell', 'aamc-facts-a1' FROM medical_schools WHERE slug = 'zucker-hofstra-northwell'
ON CONFLICT DO NOTHING;

-- u-washington: verified 2026-09-18. Read through the search index of that page. The page itself refuses automated requests, so open it by hand once to confirm.
UPDATE medical_schools SET
  residency_policy = 'prefers_in_state',
  regional_states = ARRAY['WA', 'WY', 'AK', 'MT', 'ID']::text[],
  accepts_international = 'unknown',
  policy_note = 'A five-state regional school: residents of Washington, Wyoming, Alaska, Montana and Idaho apply into their state''s cohort. Out-of-region applicants are considered only with ties to a WWAMI state and a disadvantaged background or a record of serving underserved communities.',
  policy_source_url = 'https://www.uwmedicine.org/school-of-medicine/md-program/admissions/state-eligibility'
WHERE slug = 'u-washington';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM medical_schools WHERE slug IS NULL OR state IS NULL) THEN
    RAISE EXCEPTION 'medical_schools rows left without slug/state: %',
      (SELECT string_agg(school_name, '; ') FROM medical_schools WHERE slug IS NULL OR state IS NULL);
  END IF;
END $$;
