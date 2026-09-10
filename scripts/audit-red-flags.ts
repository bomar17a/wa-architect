// Fixture harness for services/redFlagService.ts.
//
//   node scripts/audit-red-flags.ts
//
// The audit is pure and deterministic, so every check can be pinned to a fixture that
// must trip it and a fixture that must not. The negative cases matter more than the
// positive ones: a false red flag on an honest entry costs the user real time, and the
// cross-entry checks (repeated openings, recycled phrasing) are the ones most likely to
// misfire. Node 24 strips the types natively — no build step.

import { runRedFlagAudit } from '../services/redFlagService.ts';
import { ActivityStatus, type Activity } from '../types.ts';
import { DESC_LIMITS } from '../constants.ts';

let failures = 0;

const activity = (over: Partial<Activity> & { id: number }): Activity => ({
    title: `Activity ${over.id}`,
    organization: 'Org',
    experienceType: 'Community Service/Volunteer - Medical/Clinical',
    city: '', country: '',
    dateRanges: [{
        id: `dr-${over.id}`,
        startDateMonth: 'January', startDateYear: '2023',
        endDateMonth: 'December', endDateYear: '2023',
        hours: '200',
    }],
    contactName: '', contactTitle: '', contactEmail: '', contactPhone: '',
    status: ActivityStatus.DRAFT,
    isMostMeaningful: false,
    description: 'x'.repeat(650),
    mmeAction: '', mmeResult: '', mmeEssay: '',
    competencies: [],
    ...over,
});

const check = (label: string, activities: Activity[], flagId: string, shouldFire: boolean) => {
    const ids = runRedFlagAudit(activities, DESC_LIMITS.AMCAS).map(f => f.id);
    const fired = ids.some(id => id === flagId || id.startsWith(`${flagId}-`));
    const ok = fired === shouldFire;
    if (!ok) failures++;
    console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${label}\n        expected ${flagId} ${shouldFire ? 'to fire' : 'not to fire'}; flags: [${ids.join(', ') || 'none'}]`,
    );
};

// Padding has to differ per entry, or the fixture's own filler becomes the shared phrase
// the recycled-language check is looking for. It has to be alphabetic too: the audit
// tokenises on letters, so "word4x0" comes back as "word x" and every entry padded that
// way shares the same run. Both mistakes were made here before this comment existed.
let padSeed = 0;
const base26 = (n: number): string => {
    let s = '';
    do { s += String.fromCharCode(97 + (n % 26)); n = Math.floor(n / 26); } while (n > 0);
    return s;
};
const longText = (opening: string) => {
    padSeed++;
    const words = Array.from({ length: 90 }, (_, i) => `zz${base26(padSeed)}yy${base26(i)}`);
    return `${opening} ${words.join(' ')}`;
};

console.log('\n— zero-hour categories ————————————————————————');
check('publication with 40 hours', [
    activity({ id: 1, experienceType: 'Publications', dateRanges: [{ id: 'a', startDateMonth: 'January', startDateYear: '2024', endDateMonth: 'January', endDateYear: '2024', hours: '40' }] }),
], 'zero-hour', true);
check('publication at zero hours', [
    activity({ id: 1, experienceType: 'Publications', dateRanges: [{ id: 'a', startDateMonth: 'January', startDateYear: '2024', endDateMonth: 'January', endDateYear: '2024', hours: '0' }] }),
], 'zero-hour', false);
check('research/lab with 400 hours is not a zero-hour category', [
    activity({ id: 1, experienceType: 'Research/Lab', dateRanges: [{ id: 'a', startDateMonth: 'January', startDateYear: '2023', endDateMonth: 'December', endDateYear: '2023', hours: '400' }] }),
], 'zero-hour', false);

console.log('\n— shadowing split across slots ————————————————');
const shadow = (id: number, desc = 'x'.repeat(650)) =>
    activity({ id, experienceType: 'Physician Shadowing/Clinical Observation', description: desc, dateRanges: [{ id: `s${id}`, startDateMonth: 'January', startDateYear: '2023', endDateMonth: 'June', endDateYear: '2023', hours: '20' }] });
check('three shadowing entries', [shadow(1), shadow(2), shadow(3)], 'shadowing-split', true);
check('two shadowing entries', [shadow(1), shadow(2)], 'shadowing-split', false);

console.log('\n— category mismatch ———————————————————————————');
check('shadowing entry describing drawn blood', [
    shadow(1, 'Followed the attending on rounds. I drew blood for the morning labs and charted the results.'),
], 'category-mismatch', true);
check('honest shadowing entry', [
    shadow(1, 'Followed the attending on rounds and observed how she framed a terminal diagnosis for a family.'),
], 'category-mismatch', false);

console.log('\n— repeated openings ———————————————————————————');
check('three entries opening "as a"', [
    activity({ id: 1, description: longText('As a volunteer I learned a great deal about the clinic.') }),
    activity({ id: 2, description: longText('As a tutor I learned a great deal about patience.') }),
    activity({ id: 3, description: longText('As a scribe I learned to keep up with an attending.') }),
], 'repeated-opening', true);
check('two entries opening "as a"', [
    activity({ id: 1, description: longText('As a volunteer I learned a great deal about the clinic.') }),
    activity({ id: 2, description: longText('As a tutor I learned a great deal about patience.') }),
    activity({ id: 3, description: longText('Saturday mornings at the food bank meant sorting donations before the doors opened.') }),
], 'repeated-opening', false);

console.log('\n— recycled language ———————————————————————————');
const recycledTail = 'this experience strengthened my communication teamwork and time management';
check('same reflection sentence in three entries', [
    activity({ id: 1, description: `Sorted donations at the food bank every Saturday morning before the doors opened. ${recycledTail}.` }),
    activity({ id: 2, description: `Tutored organic chemistry for first-generation students in a basement study room. ${recycledTail}.` }),
    activity({ id: 3, description: `Ran the intake desk at a free clinic on weekends through two winters. ${recycledTail}.` }),
], 'recycled-language', true);
check('three entries sharing only an organisation name', [
    activity({ id: 1, description: longText('Eastside Free Clinic intake, Saturdays, uninsured patients waiting since dawn.') }),
    activity({ id: 2, description: longText('Board service at Eastside Free Clinic meant arguing about a budget I did not write.') }),
    activity({ id: 3, description: longText('Interpreting at Eastside Free Clinic for Spanish-speaking families during flu season.') }),
], 'recycled-language', false);

console.log('\n— unused characters ———————————————————————————');
check('380 of 700 characters', [activity({ id: 1, description: 'x'.repeat(380) })], 'thin-description', true);
check('650 of 700 characters', [activity({ id: 1, description: 'x'.repeat(650) })], 'thin-description', false);
check('empty description is not a thin one', [activity({ id: 1, description: '' })], 'thin-description', false);

console.log('\n— the demo portfolio stays quiet ——————————————');
const { DEMO_ACTIVITIES } = await import('../constants.ts');
const demoFlags = runRedFlagAudit(DEMO_ACTIVITIES, DESC_LIMITS.AMCAS);
const newCheckIds = ['zero-hour', 'shadowing-split', 'category-mismatch', 'repeated-opening', 'recycled-language'];
const unexpected = demoFlags.filter(f => newCheckIds.some(id => f.id.startsWith(id)));
if (unexpected.length) {
    failures++;
    console.log(`FAIL  seeded demo activities trip: ${unexpected.map(f => f.id).join(', ')}`);
} else {
    console.log('PASS  no cross-entry check misfires on the seeded demo activities');
    console.log(`      (it does raise: ${demoFlags.map(f => f.id).join(', ') || 'nothing'})`);
}

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
