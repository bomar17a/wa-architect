// Caches AI results so identical input is never paid for twice.
//
// Every AI call in the app funnels through invokeEdgeFunction() in
// geminiService.ts, so caching there covers all of them at once. The rule that
// makes this safe: these actions are deterministic from the caller's point of
// view — the same draft analyzed twice should give the same analysis, so
// returning the stored one costs nothing in quality and saves a paid call.
//
// Two actions are deliberately NOT cached (see UNCACHED_ACTIONS): rewrite and
// mme-synthesis are generative, and the user clicks them repeatedly *wanting*
// something different. Serving those from cache would read as a broken button.

const VERSION = 'v1';
const PREFIX = 'wa-ai-cache';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_ENTRIES = 60;

/** Generative actions where repeat clicks are the user asking for variety. */
export const UNCACHED_ACTIONS = new Set(['rewrite', 'mme-synthesis']);

interface Entry<T> {
    v: string;
    at: number;
    data: T;
}

/**
 * Stable stringify — key order must not change the hash, or the same payload
 * serialized differently would miss its own cache entry.
 */
function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify((value as any)[k])}`).join(',')}}`;
}

/** FNV-1a. Not cryptographic — this only needs to avoid collisions in a browser. */
function hash(input: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36) + input.length.toString(36);
}

function keyFor(action: string, payload: unknown, userId: string): string {
    return `${PREFIX}:${VERSION}:${userId}:${action}:${hash(stableStringify(payload))}`;
}

/** localStorage throws in some privacy modes; a cache miss is always survivable. */
function safeGet(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* quota or blocked: skip caching */ }
}
function safeRemove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* no-op */ }
}

/**
 * Enumerates via the Storage interface (length + key(i)) rather than
 * Object.keys(). Object.keys() only works because browsers expose entries as
 * properties; it is not part of the Storage contract, and it silently returns
 * nothing on implementations that don't — which would disable pruning and
 * expiry without any error to notice.
 *
 * Keys are collected before any removal, since removing shifts the indices.
 */
function ownKeys(): string[] {
    const keys: string[] = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(`${PREFIX}:`)) keys.push(k);
        }
    } catch {
        return [];
    }
    return keys;
}

/** Drops expired entries, anything from an older cache version, and the oldest overflow. */
function prune(): void {
    const keys = ownKeys();
    const live: { key: string; at: number }[] = [];

    for (const key of keys) {
        if (!key.startsWith(`${PREFIX}:${VERSION}:`)) { safeRemove(key); continue; }
        const raw = safeGet(key);
        if (!raw) continue;
        try {
            const entry = JSON.parse(raw) as Entry<unknown>;
            if (Date.now() - entry.at > TTL_MS) safeRemove(key);
            else live.push({ key, at: entry.at });
        } catch {
            safeRemove(key);
        }
    }

    if (live.length > MAX_ENTRIES) {
        live.sort((a, b) => a.at - b.at);
        live.slice(0, live.length - MAX_ENTRIES).forEach(e => safeRemove(e.key));
    }
}

export function readCache<T>(action: string, payload: unknown, userId: string): T | null {
    if (UNCACHED_ACTIONS.has(action)) return null;
    const raw = safeGet(keyFor(action, payload, userId));
    if (!raw) return null;
    try {
        const entry = JSON.parse(raw) as Entry<T>;
        if (entry.v !== VERSION || Date.now() - entry.at > TTL_MS) return null;
        return entry.data;
    } catch {
        return null;
    }
}

export function writeCache<T>(action: string, payload: unknown, userId: string, data: T): void {
    if (UNCACHED_ACTIONS.has(action)) return;
    const entry: Entry<T> = { v: VERSION, at: Date.now(), data };
    safeSet(keyFor(action, payload, userId), JSON.stringify(entry));
    prune();
}

/** Forces the next call for this action+payload to hit the API (the "re-analyze" path). */
export function invalidate(action: string, payload: unknown, userId: string): void {
    safeRemove(keyFor(action, payload, userId));
}

/** Clears every cached AI result. Used on sign-out so results aren't left on a shared browser. */
export function clearAiCache(): void {
    ownKeys().forEach(safeRemove);
}
