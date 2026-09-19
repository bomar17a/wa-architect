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

    // ---- 8b. residency, ties, and the school fact tables (20260919*) ----
    const res = await req(`/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH', token,
        headers: { Prefer: 'return=representation' },
        body: { legal_residence_state: 'OH', residency_status: 'us_citizen_or_pr' },
    });
    const resRow = Array.isArray(res.json) ? res.json[0] : null;
    check('legal residence and status persist', res.status === 200 && resRow?.legal_residence_state === 'OH' && resRow?.residency_status === 'us_citizen_or_pr',
        `status ${res.status} ${JSON.stringify(res.json)?.slice(0, 160)}`);

    const badState = await req(`/rest/v1/profiles?id=eq.${userId}`, { method: 'PATCH', token, body: { legal_residence_state: 'Ohio' } });
    check('legal residence must be a two-letter code', badState.status >= 400, `status ${badState.status}`);

    const tie = await req('/rest/v1/applicant_ties', {
        method: 'POST', token, headers: { Prefer: 'return=representation' },
        body: { user_id: userId, state: 'WA', tie_type: 'undergrad' },
    });
    check('can add own tie', tie.status === 201, `status ${tie.status} ${JSON.stringify(tie.json)?.slice(0, 160)}`);
    const dupTie = await req('/rest/v1/applicant_ties', { method: 'POST', token, body: { user_id: userId, state: 'WA', tie_type: 'undergrad' } });
    check('duplicate tie is rejected', dupTie.status === 409, `status ${dupTie.status}`);
    const foreignTie = await req('/rest/v1/applicant_ties', {
        method: 'POST', token, body: { user_id: '00000000-0000-0000-0000-000000000000', state: 'WA', tie_type: 'family' },
    });
    check('RLS: cannot add a tie for another user', foreignTie.status >= 400, `status ${foreignTie.status}`);
    const myTies = await req('/rest/v1/applicant_ties?select=state,tie_type,user_id', { token });
    check('RLS: sees only own ties', myTies.status === 200 && myTies.json?.length === 1 && myTies.json[0].user_id === userId,
        `saw ${myTies.json?.length} rows`);

    const anonTies = await req('/rest/v1/applicant_ties?select=state');
    check('RLS: anonymous reads no ties', anonTies.status === 200 && Array.isArray(anonTies.json) && anonTies.json.length === 0,
        `status ${anonTies.status} rows ${anonTies.json?.length}`);
    const anonStats = await req('/rest/v1/school_residency_stats?select=school_id&limit=1');
    check('RLS: anonymous reads no residency figures', anonStats.status === 200 && Array.isArray(anonStats.json) && anonStats.json.length === 0,
        `status ${anonStats.status} rows ${anonStats.json?.length}`);
    const stats = await req('/rest/v1/school_residency_stats?select=school_id,cycle_year&limit=1', { token });
    check('signed-in user reads residency figures', stats.status === 200 && stats.json?.length === 1, `status ${stats.status} rows ${stats.json?.length}`);
    const sources = await req('/rest/v1/data_sources?select=slug,commercial_use', { token });
    check('A-1 sources are marked restricted',
        sources.status === 200 && sources.json?.length > 0 && sources.json.filter(s => s.slug.startsWith('aamc-')).every(s => s.commercial_use === 'restricted'),
        `status ${sources.status} ${JSON.stringify(sources.json)?.slice(0, 160)}`);

    if (actRow?.id) {
        const actState = await req(`/rest/v1/activities?id=eq.${actRow.id}`, {
            method: 'PATCH', token, headers: { Prefer: 'return=representation' }, body: { state: 'OH' },
        });
        check('activity state persists', actState.status === 200 && actState.json?.[0]?.state === 'OH', `status ${actState.status}`);
    }

    // ---- 8c. apply_tie_changes (20260920000000): one save, one transaction ----
    // Stored going in: WA/undergrad, from 8b.
    const tieRpc = (add, remove, opts = { token }) =>
        req('/rest/v1/rpc/apply_tie_changes', { method: 'POST', ...opts, body: { p_add: add, p_remove: remove } });
    const states = r => (Array.isArray(r.json) ? r.json.map(t => t.state).sort().join(',') : JSON.stringify(r.json)?.slice(0, 160));

    const rAdd = await tieRpc([{ state: 'ID', tie_type: 'family' }], []);
    check('ties RPC adds and returns what is stored', rAdd.status === 200 && states(rAdd) === 'ID,WA', `status ${rAdd.status} ${states(rAdd)}`);

    // What Settings sends when its ties failed to load: an empty baseline, plus a tie that
    // is already stored. Before this function, that save deleted every tie.
    const rStale = await tieRpc([{ state: 'WA', tie_type: 'undergrad' }, { state: 'OR', tie_type: 'work' }], []);
    check('ties RPC with an empty baseline removes nothing, and re-adding is not a 409',
        rStale.status === 200 && states(rStale) === 'ID,OR,WA', `status ${rStale.status} ${states(rStale)}`);

    const rRemove = await tieRpc([], [{ state: 'ID', tie_type: 'family' }, { state: 'OR', tie_type: 'work' }]);
    check('ties RPC removes only what was removed', rRemove.status === 200 && states(rRemove) === 'WA', `status ${rRemove.status} ${states(rRemove)}`);

    // A bad row fails the CHECK on state; the removal in the same call must roll back with it.
    const rBad = await tieRpc([{ state: 'Washington', tie_type: 'work' }], [{ state: 'WA', tie_type: 'undergrad' }]);
    const afterBad = await req('/rest/v1/applicant_ties?select=state', { token });
    check('ties RPC is atomic: a rejected add rolls back the remove',
        rBad.status >= 400 && states(afterBad) === 'WA', `status ${rBad.status}, stored ${states(afterBad)}`);

    const rAnon = await tieRpc([], [], {});
    check('ties RPC refuses anonymous callers', rAnon.status === 401 || rAnon.status === 403, `status ${rAnon.status}`);

    const delTie = await req('/rest/v1/applicant_ties?state=eq.WA&tie_type=eq.undergrad', { method: 'DELETE', token });
    const afterDel = await req('/rest/v1/applicant_ties?select=state', { token });
    check('can remove own tie', delTie.status === 204 && afterDel.json?.length === 0, `status ${delTie.status} left ${afterDel.json?.length}`);
    // Leave one tie behind so cleanup proves the cascade.
    await req('/rest/v1/applicant_ties', { method: 'POST', token, body: { user_id: userId, state: 'MT', tie_type: 'family' } });

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
    check('AI: draft-analysis (pre-existing action)', dq.status === 200 && !!dq.json?.generalFeedback,
        `status ${dq.status} ${dq.status !== 200 ? JSON.stringify(dq.json)?.slice(0, 160) : ''}`);

    const iq = await ai('interview-questions', { title: 'ED Volunteer', organization: 'City General', experienceType: 'Community Service/Volunteer - Medical/Clinical', description: DESC, isMostMeaningful: true });
    check('AI: interview-questions returns 5', iq.status === 200 && iq.json?.questions?.length === 5,
        `status ${iq.status} got ${iq.json?.questions?.length}`);
    check('AI: interview questions include whyAsked', !!iq.json?.questions?.[0]?.whyAsked);

    const sa = await ai('story-analysis', { activities: [{ id: 1, title: 'ED Volunteer', experienceType: 'Community Service/Volunteer - Medical/Clinical', description: DESC, isMostMeaningful: true, totalHours: 180 }] });
    check('AI: story-analysis returns archetype + narrative',
        sa.status === 200 && !!sa.json?.applicationArchetype && !!sa.json?.coreNarrative,
        `status ${sa.status} ${sa.status !== 200 ? JSON.stringify(sa.json)?.slice(0, 160) : ''}`);

    const al = await ai('school-alignment', { description: DESC, experienceType: 'Community Service/Volunteer - Medical/Clinical', schools: (schools.json || []) });
    const firstAl = al.json?.alignments?.[0];
    check('AI: school-alignment returns per-school fit',
        al.status === 200 && al.json?.alignments?.length === 2 && ['strong', 'moderate', 'weak'].includes(firstAl?.fit),
        `status ${al.status} fit=${firstAl?.fit} n=${al.json?.alignments?.length}`);

    // Runs on flash with an output cap, the same setup that truncated draft-analysis.
    const MME = 'The night a patient\'s daughter asked me whether her father would wake up, I had no answer and no role that allowed one. I stayed with her until the nurse came. Over the next months I learned to notice who in a waiting room was alone, and to sit with them before they asked. It changed what I think a physician owes a family: attention before explanation.';
    const mr = await ai('mme-review', { essay: MME, description: DESC, experienceType: 'Community Service/Volunteer - Medical/Clinical', hours: 180, limit: 1325 });
    check('AI: mme-review returns a read', mr.status === 200 && !!mr.json?.strongest && Array.isArray(mr.json?.contentNotes),
        `status ${mr.status} ${mr.status !== 200 ? JSON.stringify(mr.json)?.slice(0, 160) : ''}`);

    const nq = await ai('narrative-quality', { description: DESC, experienceType: 'Research/Lab', limit: 700 });
    const sum = ['specificity', 'quantification', 'reflection', 'voiceAuthenticity']
        .reduce((t, k) => t + (Number(nq.json?.[k]) || 0), 0);
    check('AI: narrative-quality returns 4 sub-scores in range',
        nq.status === 200 && sum > 0 && sum <= 100 && !!nq.json?.topFix,
        `status ${nq.status} total=${sum}`);

    // ---- 9b. request checks and the daily AI quota (20260920000100) ----
    // Both refusals happen before the quota is counted, so neither costs anything.
    const big = await ai('narrative-quality', { description: 'x'.repeat(100_001), experienceType: 'Research/Lab', limit: 700 });
    check('AI: an oversized request is refused (413)', big.status === 413, `status ${big.status}`);
    const msar = await ai('parse-msar', { text: 'x' });
    check('AI: the removed parse-msar action is refused', msar.status === 400 && /Unknown action/.test(msar.json?.error ?? ''),
        `status ${msar.status} ${JSON.stringify(msar.json)?.slice(0, 160)}`);

    const usage = async () => (await req(`/rest/v1/ai_usage?select=calls&user_id=eq.${userId}`, { key: SERVICE })).json?.[0]?.calls ?? 0;
    const counted = await usage();
    check('quota counted the six model calls above, and not the refused ones', counted === 6, `calls ${counted}`);

    // No draft: the handler throws a TypeError before any model call. The user gets the
    // generic sentence and a 500, never "Cannot read properties of undefined".
    const broken = await ai('draft-analysis', {});
    check('AI: a server-side bug returns a plain sentence, not its internals',
        broken.status === 500 && /^Something went wrong on our end/.test(broken.json?.error ?? '') && !/undefined|TypeError/.test(broken.json?.error ?? ''),
        `status ${broken.status} ${JSON.stringify(broken.json)?.slice(0, 160)}`);

    const selfRpc = await req('/rest/v1/rpc/consume_ai_call', { method: 'POST', token, body: { p_user: userId, p_limit: 1000 } });
    check('users cannot call consume_ai_call', selfRpc.status === 401 || selfRpc.status === 403, `status ${selfRpc.status}`);
    const selfRead = await req('/rest/v1/ai_usage?select=calls', { token });
    check('users cannot read ai_usage', selfRead.status === 401 || selfRead.status === 403, `status ${selfRead.status}`);

    // Well past any DAILY_AI_CALLS, so this does not need to know the edge function's limit.
    await req(`/rest/v1/ai_usage?user_id=eq.${userId}`, { method: 'PATCH', key: SERVICE, body: { calls: 1_000_000 } });
    const capped = await ai('narrative-quality', { description: DESC, experienceType: 'Research/Lab', limit: 700 });
    const afterCap = await usage();
    check('AI: a user at the daily limit gets 429, and the count does not move',
        capped.status === 429 && /today's limit/.test(capped.json?.error ?? '') && afterCap === 1_000_000,
        `status ${capped.status} calls ${afterCap} ${JSON.stringify(capped.json)?.slice(0, 160)}`);

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
        // Account deletion must take the user's ties with it (ON DELETE CASCADE).
        const leftover = await req(`/rest/v1/applicant_ties?select=id&user_id=eq.${userId}`, { key: SERVICE });
        check('deleting the user removes their ties', leftover.status === 200 && leftover.json?.length === 0, `left ${leftover.json?.length}`);
        const leftoverUsage = await req(`/rest/v1/ai_usage?select=day&user_id=eq.${userId}`, { key: SERVICE });
        check('deleting the user removes their AI usage', leftoverUsage.status === 200 && leftoverUsage.json?.length === 0, `left ${leftoverUsage.json?.length}`);
    } else if (userId) {
        console.log(`\ncleanup SKIPPED (--keep). Test user email: ${EMAIL}`);
    }
    console.log(`\nRESULT ${pass} passed, ${fail} failed`);
    process.exitCode = fail > 0 ? 1 : 0;
}
