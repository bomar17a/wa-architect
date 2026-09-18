/**
 * Reads AAMC FACTS Table A-1 (applications and matriculants by school and state of
 * legal residence) from the .xlsx AAMC publishes, and checks it against its own
 * Total row.
 *
 * Deliberately not an LLM parse. These numbers end up in front of applicants, and the
 * one time this repo let a model read a PDF into the school table (msar_parser.ts) it
 * took a hand-written data migration to correct the result. A spreadsheet has cells;
 * read the cells.
 *
 * The layout has been stable across 2023-24, 2024-25 and 2025-26:
 *   A state (only on the first school of each state)   B school short name
 *   C applications   D % in state   E % out of state
 *   H matriculants   I % in state   J % out of state
 * and a row whose column A reads "Total".
 */
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

const XML_ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
const decode = s => s.replace(/&(amp|lt|gt|quot|apos);/g, m => XML_ENTITIES[m]);

function readSheet(file) {
  const zip = unzipSync(new Uint8Array(readFileSync(file)));
  const strings = [...strFromU8(zip['xl/sharedStrings.xml']).matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map(m => decode([...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(t => t[1]).join('')));
  const sheet = strFromU8(zip['xl/worksheets/sheet1.xml']);

  // The licence notice lives in the printed page footer, not in a cell.
  const notice = decode(sheet).match(/©\s*\d{4} Association of American Medical Colleges\.\s*This data may be reproduced[^<&]*/)?.[0]
    .replace(/\s+/g, ' ').trim() ?? null;

  const rows = [...sheet.matchAll(/<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map(([, rowNum, body]) => {
    const cells = {};
    for (const [, col, attrs, inner] of body.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const raw = inner?.match(/<v>([^<]*)<\/v>/)?.[1];
      if (raw === undefined) continue;
      cells[col] = /t="s"/.test(attrs) ? strings[Number(raw)] : decode(raw);
    }
    return { rowNum: Number(rowNum), cells };
  });
  return { rows, notice };
}

const int = v => (v === undefined || v === '' ? null : Math.round(Number(v)));
// Excel stores 2.3 as 2.2999999999999998; one decimal is what AAMC publishes.
const pct = v => (v === undefined || v === '' ? null : Math.round(Number(v) * 10) / 10);

/**
 * @returns {{ title: string, cycleYear: number, notice: string | null, rows: object[], total: object }}
 */
export function readA1(file) {
  const { rows, notice } = readSheet(file);
  const title = rows.find(r => /^Table A-1/.test(r.cells.A ?? ''))?.cells.A ?? '';
  const years = title.match(/(\d{4})-(\d{4})\s*$/);
  if (!years) throw new Error(`${file}: no "Table A-1 ... YYYY-YYYY" title row`);

  const out = [];
  let total = null;
  let state = null;
  for (const { rowNum, cells } of rows) {
    if (cells.A === 'Total') {
      total = { applications: int(cells.C), matriculants: int(cells.H), appsInStatePct: pct(cells.D), matInStatePct: pct(cells.I) };
      continue;
    }
    if (/^[A-Z]{2}$/.test(cells.A ?? '')) state = cells.A;
    if (!cells.B || !/^\d+$/.test(cells.C ?? '')) continue;
    out.push({
      rowNum,
      state,
      name: cells.B.trim(),
      applications: int(cells.C),
      appsInStatePct: pct(cells.D),
      appsOutOfStatePct: pct(cells.E),
      matriculants: int(cells.H),
      matInStatePct: pct(cells.I),
      matOutOfStatePct: pct(cells.J),
    });
  }
  if (!total) throw new Error(`${file}: no Total row`);
  return { title, cycleYear: Number(years[1]), notice, rows: out, total };
}

/**
 * Every way the parse could have gone quietly wrong, checked against the table itself.
 * Returns a list of problems; empty means the file reads the way AAMC wrote it.
 */
export function checkA1({ rows, total }) {
  const problems = [];
  const sum = key => rows.reduce((s, r) => s + (r[key] ?? 0), 0);

  if (sum('applications') !== total.applications) {
    problems.push(`applications sum ${sum('applications')} != Total ${total.applications}`);
  }
  if (sum('matriculants') !== total.matriculants) {
    problems.push(`matriculants sum ${sum('matriculants')} != Total ${total.matriculants}`);
  }

  // The Total row's in-state share is a weighted average of the rows above it. Each row
  // is rounded to 0.1, so allow a little drift, but a shifted column misses by far more.
  const weighted = (countKey, pctKey) =>
    rows.reduce((s, r) => s + (r[countKey] ?? 0) * (r[pctKey] ?? 0), 0) / sum(countKey);
  const appsIn = weighted('applications', 'appsInStatePct');
  const matIn = weighted('matriculants', 'matInStatePct');
  if (Math.abs(appsIn - total.appsInStatePct) > 0.3) {
    problems.push(`weighted applications in-state ${appsIn.toFixed(2)}% vs Total ${total.appsInStatePct}%`);
  }
  if (Math.abs(matIn - total.matInStatePct) > 0.3) {
    problems.push(`weighted matriculants in-state ${matIn.toFixed(2)}% vs Total ${total.matInStatePct}%`);
  }

  for (const r of rows) {
    if (!r.state) problems.push(`row ${r.rowNum} ${r.name}: no state`);
    for (const [a, b] of [['appsInStatePct', 'appsOutOfStatePct'], ['matInStatePct', 'matOutOfStatePct']]) {
      if (r[a] === null || r[b] === null) continue;
      if (Math.abs(r[a] + r[b] - 100) > 0.2) problems.push(`row ${r.rowNum} ${r.name}: ${a} + ${b} = ${r[a] + r[b]}`);
    }
  }
  return problems;
}
