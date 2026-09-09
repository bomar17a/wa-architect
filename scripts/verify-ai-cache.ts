// Correctness checks for the AI result cache.
//
//   node scripts/verify-ai-cache.ts
//
// A bug here is expensive in one of two directions: too eager and users get
// stale analysis of text they have since rewritten; too shy and every repeat
// view is a paid call again. Both are silent, hence this.

// Minimal localStorage stand-in — Node has no DOM.
class MemStorage {
    private map = new Map<string, string>();
    get length() { return this.map.size; }
    key(i: number) { return [...this.map.keys()][i] ?? null; }
    getItem(k: string) { return this.map.get(k) ?? null; }
    setItem(k: string, v: string) { this.map.set(k, v); }
    removeItem(k: string) { this.map.delete(k); }
    clear() { this.map.clear(); }
}
(globalThis as any).localStorage = new MemStorage();

const { readCache, writeCache, invalidate, clearAiCache, UNCACHED_ACTIONS } =
    await import('../services/aiCache.ts');

let failures = 0;
const check = (label: string, ok: boolean, detail = '') => {
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
};

const USER = 'user-a';
const OTHER = 'user-b';
const payload = { draft: 'I volunteered at a clinic.', limit: 700, experienceType: 'Research/Lab' };

console.log('Round trip');
check('miss before write', readCache('draft-analysis', payload, USER) === null);
writeCache('draft-analysis', payload, USER, { feedback: 'ok' });
check('hit after write', (readCache<any>('draft-analysis', payload, USER))?.feedback === 'ok');

console.log('\nKey sensitivity');
// Key order must not matter, or the same payload would miss its own entry.
const reordered = { experienceType: 'Research/Lab', limit: 700, draft: 'I volunteered at a clinic.' };
check('key order irrelevant', (readCache<any>('draft-analysis', reordered, USER))?.feedback === 'ok');
check('different draft misses', readCache('draft-analysis', { ...payload, draft: 'Rewritten.' }, USER) === null);
check('different limit misses', readCache('draft-analysis', { ...payload, limit: 600 }, USER) === null);
check('different action misses', readCache('narrative-quality', payload, USER) === null);
check('different user misses', readCache('draft-analysis', payload, OTHER) === null,
    'results must never cross accounts on a shared browser');

console.log('\nGenerative actions stay uncached');
for (const action of UNCACHED_ACTIONS) {
    writeCache(action, { sentence: 'x' }, USER, ['a variant']);
    check(`${action} never stores`, readCache(action, { sentence: 'x' }, USER) === null,
        'repeat clicks must produce fresh variety');
}

console.log('\nInvalidation');
invalidate('draft-analysis', payload, USER);
check('invalidate clears one entry', readCache('draft-analysis', payload, USER) === null);

writeCache('story-analysis', { a: 1 }, USER, { archetype: 'x' });
writeCache('story-analysis', { a: 2 }, OTHER, { archetype: 'y' });
clearAiCache();
check('clearAiCache empties all', readCache('story-analysis', { a: 1 }, USER) === null
    && readCache('story-analysis', { a: 2 }, OTHER) === null);

console.log('\nExpiry and eviction');
// Hand-plant an entry older than the 30-day TTL.
writeCache('story-analysis', { a: 3 }, USER, { archetype: 'old' });
const staleKey = [...Array((globalThis as any).localStorage.length).keys()]
    .map(i => (globalThis as any).localStorage.key(i))
    .find((k: string) => k.includes('story-analysis'))!;
const entry = JSON.parse((globalThis as any).localStorage.getItem(staleKey));
entry.at = Date.now() - 31 * 24 * 60 * 60 * 1000;
(globalThis as any).localStorage.setItem(staleKey, JSON.stringify(entry));
check('expired entry misses', readCache('story-analysis', { a: 3 }, USER) === null);

clearAiCache();
for (let i = 0; i < 75; i++) writeCache('story-analysis', { n: i }, USER, { i });
const count = [...Array((globalThis as any).localStorage.length).keys()]
    .map(i => (globalThis as any).localStorage.key(i))
    .filter((k: string) => k.startsWith('wa-ai-cache:')).length;
check('evicts past the cap', count <= 60, `${count} entries retained`);
check('newest survives eviction', readCache('story-analysis', { n: 74 }, USER) !== null);

console.log('\nHostile storage');
// Private-browsing modes throw on access; a cache miss must be survivable.
(globalThis as any).localStorage = {
    get length(): number { throw new Error('blocked'); },
    key() { throw new Error('blocked'); },
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
};
let threw = false;
try {
    writeCache('story-analysis', { a: 9 }, USER, { x: 1 });
    check('read returns null when storage throws', readCache('story-analysis', { a: 9 }, USER) === null);
    clearAiCache();
} catch {
    threw = true;
}
check('never throws to the caller', !threw);

console.log(`\n${failures === 0 ? 'Cache verified. All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
