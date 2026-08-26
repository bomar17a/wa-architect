/**
 * End-to-end smoke test for the AUTHENTICATED paths — the surface no other test
 * covers, because every AI action and every RLS policy needs a real user JWT.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/db/auth-smoke.mjs [--keep]
 *
 * Creates a throwaway pre-confirmed user via the Auth Admin API (no confirmation
 * email is sent), exercises the real endpoints as that user, then deletes it.
 * Pass --keep to leave the user in place for manual UI testing.
 *
 * Never prints tokens, passwords, or the service-role key.
 */
import { readFileSync } from 'fs';

const env = Object.fromEntries(
    readFileSync('.env.local', 'utf8').split('\n')
        .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]; })
);
const BASE = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KEEP = process.argv.includes('--keep');

if (!BASE || !ANON) { console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'); process.exit(1); }
if (!SERVICE) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const stamp = Date.now();
const EMAIL = `claude-qa-${stamp}@wa-architect-qa.com`;
const PASSWORD = `Qa!${stamp}aA9`;

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
    if (ok) { pass++; console.log(`PASS  ${name}`); }
    else { fail++; console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
};

const req = async (path, { method = 'GET', body, token, key, headers = {} } = {}) => {
    const r = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            apikey: key || ANON,
            Authorization: `Bearer ${token || key || ANON}`,
            ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let json = null;
    try { json = await r.json(); } catch { }
    return { status: r.status, json };
};

let userId = null;
let token = null;

try {
    // ---- 1. create a pre-confirmed user (no email sent) ----
    const created = await req('/auth/v1/admin/users', {
        method: 'POST', key: SERVICE,
        body: { email: EMAIL, password: PASSWORD, email_confirm: true },
    });
    userId = created.json?.id;
    check('admin creates pre-confirmed user', created.status === 200 && !!userId,
        `status ${created.status} ${JSON.stringify(created.json)?.slice(0, 160)}`);
    if (!userId) throw new Error('cannot continue without a user');

    // ---- 2. sign in as that user ----
    const signin = await req('/auth/v1/token?grant_type=password', {
        method: 'POST', body: { email: EMAIL, password: PASSWORD },
    });
    token = signin.json?.access_token;
    check('sign in returns a session', signin.status === 200 && !!token, `status ${signin.status}`);
    if (!token) throw new Error('cannot continue without a token');

    // ---- 3. new user starts with no profile row ----
    const empty = await req('/rest/v1/profiles?select=*', { token });
    check('new user has no profile row yet', empty.status === 200 && Array.isArray(empty.json) && empty.json.length === 0,
        `status ${empty.status} rows ${empty.json?.length}`);

    // ---- 4. profile insert (what ProfileContext does on first load) ----
    const ins = await req('/rest/v1/profiles', {
        method: 'POST', token,
        headers: { Prefer: 'return=representation' },
        body: { id: userId, onboarded: false, application_type: 'AMCAS' },
    });
    check('can create own profile row', ins.status === 201, `status ${ins.status} ${JSON.stringify(ins.json)?.slice(0, 160)}`);

    // ---- 5. onboarding-style write (the wizard's finish()) ----
    const upd = await req(`/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH', token,
        headers: { Prefer: 'return=representation' },
        body: {
            onboarded: true, cycle_year: 2027, school_tier: 'MD Top 50',
            gpa_range: '3.8 - 4.0', mcat_range: '512+',
            north_star_archetypes: ['investigator'],
        },
    });
    const updRow = Array.isArray(upd.json) ? upd.json[0] : null;
    check('onboarding writes persist', upd.status === 200 && updRow?.onboarded === true && updRow?.cycle_year === 2027,
        `status ${upd.status} ${JSON.stringify(updRow)?.slice(0, 160)}`);
    check('north star persists as array', Array.isArray(updRow?.north_star_archetypes) && updRow.north_star_archetypes[0] === 'investigator');

    // ---- 6. target school persistence ----
    const schools = await req('/rest/v1/medical_schools?select=id,school_name,mission_statement,primary_category&limit=2', { token });
    const schoolIds = (schools.json || []).map(s => s.id);
    check('can read medical_schools', schools.status === 200 && schoolIds.length === 2, `status ${schools.status}`);

    const tgt = await req(`/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH', token,
        headers: { Prefer: 'return=representation' },
        body: { target_school_ids: schoolIds },
    });
    const tgtRow = Array.isArray(tgt.json) ? tgt.json[0] : null;
    check('target schools persist', tgt.status === 200 && tgtRow?.target_school_ids?.length === 2,
        `status ${tgt.status} ${JSON.stringify(tgtRow?.target_school_ids)}`);

    // ---- 7. RLS ISOLATION — the security-critical one ----
    const allProfiles = await req('/rest/v1/profiles?select=id', { token });
    check('RLS: sees ONLY own profile, not other users',
        allProfiles.status === 200 && allProfiles.json?.length === 1 && allProfiles.json[0].id === userId,
        `saw ${allProfiles.json?.length} rows`);

    const allActivities = await req('/rest/v1/activities?select=id', { token });
    check('RLS: sees no other users\' activities',
        allActivities.status === 200 && Array.isArray(allActivities.json) && allActivities.json.length === 0,
        `saw ${allActivities.json?.length} rows (production has 9 belonging to others)`);

    // ---- 8. activity create + sort_order round-trip ----
    const act = await req('/rest/v1/activities', {
        method: 'POST', token,
        headers: { Prefer: 'return=representation' },
        body: {
            user_id: userId, title: 'QA Activity', experience_type: 'Research/Lab',
            description: 'Ran assays and logged results for a cell signaling project over 12 months.',
            status: 'Draft', sort_order: 0, date_ranges: [],
        },
    });
    const actRow = Array.isArray(act.json) ? act.json[0] : null;
    check('can create own activity (sort_order accepted)', act.status === 201 && actRow?.sort_order === 0,
        `status ${act.status} ${JSON.stringify(act.json)?.slice(0, 160)}`);

    // ---- 9. AI edge function actions ----
    const ai = async (action, payload) => {
        const r = await fetch(`${BASE}/functions/v1/gemini-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON}`, 'x-user-token': token },
            body: JSON.stringify({ action, payload }),
        });
        let j = null; try { j = await r.json(); } catch { }
        return { status: r.status, json: j };
    };

    const DESC = 'I volunteered 180 hours in the emergency department, assisting nurses with patient turnover and comforting families during crises. It taught me that presence matters as much as procedure.';

    const dq = await ai('draft-analysis', { draft: DESC, limit: 700, experienceType: 'Community Service/Volunteer - Medical/Clinical' });
    check('AI: draft-analysis (pre-existing action)', dq.status === 200 && !!dq.json?.generalFeedback, `status ${dq.status}`);

    const iq = await ai('interview-questions', { title: 'ED Volunteer', organization: 'City General', experienceType: 'Community Service/Volunteer - Medical/Clinical', description: DESC, isMostMeaningful: true });
    check('AI: interview-questions returns 5', iq.status === 200 && iq.json?.questions?.length === 5,
        `status ${iq.status} got ${iq.json?.questions?.length}`);
    check('AI: interview questions include whyAsked', !!iq.json?.questions?.[0]?.whyAsked);

    const sa = await ai('story-analysis', { activities: [{ id: 1, title: 'ED Volunteer', experienceType: 'Community Service/Volunteer - Medical/Clinical', description: DESC, isMostMeaningful: true, totalHours: 180 }] });
    check('AI: story-analysis returns archetype + narrative',
        sa.status === 200 && !!sa.json?.applicationArchetype && !!sa.json?.coreNarrative, `status ${sa.status}`);

    const al = await ai('school-alignment', { description: DESC, experienceType: 'Community Service/Volunteer - Medical/Clinical', schools: (schools.json || []) });
    const firstAl = al.json?.alignments?.[0];
    check('AI: school-alignment returns per-school fit',
        al.status === 200 && al.json?.alignments?.length === 2 && ['strong', 'moderate', 'weak'].includes(firstAl?.fit),
        `status ${al.status} fit=${firstAl?.fit} n=${al.json?.alignments?.length}`);

    const nq = await ai('narrative-quality', { description: DESC, experienceType: 'Research/Lab', limit: 700 });
    const sum = ['specificity', 'quantification', 'reflection', 'voiceAuthenticity']
        .reduce((t, k) => t + (Number(nq.json?.[k]) || 0), 0);
    check('AI: narrative-quality returns 4 sub-scores in range',
        nq.status === 200 && sum > 0 && sum <= 100 && !!nq.json?.topFix,
        `status ${nq.status} total=${sum}`);

    // ---- 10. unauthenticated calls are still rejected ----
    const noAuth = await fetch(`${BASE}/functions/v1/gemini-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ action: 'narrative-quality', payload: { description: 'x' } }),
    });
    check('edge function rejects calls with no user token', noAuth.status === 401, `status ${noAuth.status}`);

} catch (e) {
    fail++;
    console.log('FAIL  harness error —', e.message);
} finally {
    if (userId && !KEEP) {
        const del = await req(`/auth/v1/admin/users/${userId}`, { method: 'DELETE', key: SERVICE });
        console.log(`\ncleanup: deleted test user (status ${del.status})`);
    } else if (userId) {
        console.log(`\ncleanup SKIPPED (--keep). Test user email: ${EMAIL}`);
    }
    console.log(`\nRESULT ${pass} passed, ${fail} failed`);
    process.exitCode = fail > 0 ? 1 : 0;
}
