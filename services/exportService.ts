import { Activity, ApplicationType } from '../types';
import { DESC_LIMITS, MME_LIMIT } from '../constants';

/**
 * AMCAS strips all formatting from pasted text. Scrub markdown artifacts and
 * smart typography that AI-assisted drafts commonly introduce, so what a user
 * copies out of here is genuinely plain text.
 */
export function sanitizeForAmcas(text: string): string {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')       // **bold**
        .replace(/\*(.*?)\*/g, '$1')           // *italic*
        .replace(/^[ \t]*[•●▪‣◦][ \t]*/gm, '') // bullet glyphs at line start
        .replace(/^[ \t]*[-*][ \t]+/gm, '')    // markdown "- " / "* " list markers
        .replace(/^[ \t]*\d+\.[ \t]+/gm, '')   // "1. " numbered list markers
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .replace(/[–—]/g, '-')
        .replace(/\r\n/g, '\n')
        .trim();
}

const formatDateRange = (r: Activity['dateRanges'][number]): string => {
    const start = [r.startDateMonth, r.startDateYear].filter(Boolean).join(' ') || 'TBD';
    const end = [r.endDateMonth, r.endDateYear].filter(Boolean).join(' ') || 'Present';
    const hours = r.hours ? `${r.hours} hours` : '0 hours';
    const tag = r.isAnticipated ? ' (Anticipated)' : '';
    return `${start} - ${end} | ${hours}${tag}`;
};

export function formatActivityForExport(activity: Activity, appType: ApplicationType): string {
    const descLimit = DESC_LIMITS[appType];
    const totalHours = activity.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0);
    const location = [activity.city, activity.country].filter(Boolean).join(', ');
    const contact = [activity.contactName, activity.contactTitle, activity.contactEmail, activity.contactPhone]
        .filter(Boolean).join(', ');
    const description = sanitizeForAmcas(activity.description);

    const lines: string[] = [];
    lines.push(`Activity: ${activity.title || 'Untitled Activity'}`);
    lines.push(`Organization: ${activity.organization || '[Organization Name]'}`);
    lines.push(`Type: ${activity.experienceType || '[Not Categorized]'}`);
    if (location) lines.push(`Location: ${location}`);
    lines.push('Dates:');
    activity.dateRanges.forEach(r => lines.push(`  ${formatDateRange(r)}`));
    lines.push(`Total Hours: ${totalHours}`);
    if (contact) lines.push(`Contact: ${contact}`);
    if (appType === ApplicationType.AMCAS && activity.isMostMeaningful) lines.push('Most Meaningful Experience: Yes');
    lines.push('');
    lines.push(`Description (${description.length}/${descLimit} chars):`);
    lines.push(description || '[No description written yet]');

    if (appType === ApplicationType.AMCAS && activity.isMostMeaningful && activity.mmeEssay) {
        const essay = sanitizeForAmcas(activity.mmeEssay);
        lines.push('');
        lines.push(`Most Meaningful Experience Essay (${essay.length}/${MME_LIMIT} chars):`);
        lines.push(essay);
    }

    return lines.join('\n');
}

export function formatAllActivitiesForExport(activities: Activity[], appType: ApplicationType): string {
    const filled = activities.filter(a => a.experienceType);
    const header = `W&A ARCHITECT — ${appType} EXPORT\nGenerated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n${filled.length} activities\n`;
    const divider = '\n' + '-'.repeat(40) + '\n\n';
    return header + divider + filled.map(a => formatActivityForExport(a, appType)).join(divider);
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, content: string) {
    downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename);
}

const csvEscape = (value: string): string => {
    const v = (value ?? '').replace(/\r\n/g, '\n');
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

/**
 * .csv opens natively in both Excel and Google Sheets — no charting/xlsx
 * library needed for a flat activity table. One row per activity.
 */
export function downloadAsCsv(activities: Activity[], appType: ApplicationType) {
    const filled = activities.filter(a => a.experienceType);
    const headers = ['Title', 'Organization', 'Type', 'Location', 'Date Ranges', 'Total Hours', 'Most Meaningful', 'Description', 'MME Essay'];

    const rows = filled.map(a => {
        const totalHours = a.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0);
        const dateRangesStr = a.dateRanges.map(formatDateRange).join('; ');
        const location = [a.city, a.country].filter(Boolean).join(', ');
        const isMme = appType === ApplicationType.AMCAS && a.isMostMeaningful;
        return [
            a.title || '',
            a.organization || '',
            a.experienceType || '',
            location,
            dateRangesStr,
            String(totalHours),
            isMme ? 'Yes' : 'No',
            sanitizeForAmcas(a.description),
            isMme ? sanitizeForAmcas(a.mmeEssay) : '',
        ];
    });

    // Leading BOM so Excel reliably detects UTF-8 instead of guessing Latin-1.
    const csv = '﻿' + [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `wa-architect-${appType.toLowerCase()}-export.csv`);
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

const escapeHtml = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Shared formatted-document HTML, reused by both the print-to-PDF view and
 * the Word/Google-Docs export (a plain HTML document saved with a .doc
 * extension opens directly in Word and imports cleanly into Google Docs —
 * no docx-generation dependency needed).
 */
function buildActivitiesHtmlDocument(activities: Activity[], appType: ApplicationType): string {
    const filled = activities.filter(a => a.experienceType);

    const sections = filled.map(a => {
        const totalHours = a.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0);
        const dateLines = a.dateRanges.map(r => escapeHtml(formatDateRange(r))).join('<br/>');
        const description = escapeHtml(sanitizeForAmcas(a.description));
        const mmeBlock = (appType === ApplicationType.AMCAS && a.isMostMeaningful && a.mmeEssay)
            ? `<h4>Most Meaningful Experience Essay</h4><p>${escapeHtml(sanitizeForAmcas(a.mmeEssay))}</p>`
            : '';
        return `
            <section>
                <h2>${escapeHtml(a.title || 'Untitled Activity')}${a.isMostMeaningful ? ' &#9733;' : ''}</h2>
                <table>
                    <tr><td>Organization</td><td>${escapeHtml(a.organization || '')}</td></tr>
                    <tr><td>Type</td><td>${escapeHtml(a.experienceType || '')}</td></tr>
                    <tr><td>Dates</td><td>${dateLines}</td></tr>
                    <tr><td>Total Hours</td><td>${totalHours}</td></tr>
                </table>
                <h4>Description</h4>
                <p>${description || '[No description written yet]'}</p>
                ${mmeBlock}
            </section>`;
    }).join('<hr/>');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>${appType} Work &amp; Activities Export</title>
            <style>
                body { font-family: Georgia, 'Times New Roman', serif; color: #1c1c1c; max-width: 720px; margin: 40px auto; line-height: 1.5; }
                h1 { font-size: 22px; border-bottom: 2px solid #1c1c1c; padding-bottom: 8px; }
                h2 { font-size: 16px; margin-bottom: 4px; }
                h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 4px; }
                p { font-size: 13px; white-space: pre-wrap; margin-top: 0; }
                table { font-size: 12px; margin-bottom: 12px; }
                td { padding: 1px 8px 1px 0; vertical-align: top; color: #444; }
                td:first-child { font-weight: bold; width: 110px; }
                hr { border: none; border-top: 1px solid #ccc; margin: 24px 0; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <h1>${appType} Work &amp; Activities Export</h1>
            <p style="font-size:11px;color:#777;">Generated ${escapeHtml(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))} &middot; ${filled.length} activities</p>
            ${sections}
        </body>
        </html>
    `;
}

/**
 * Opens a formatted, print-ready document in a new tab and triggers the
 * browser print dialog — the "Save as PDF" destination gives users a
 * clean PDF without adding a PDF-generation dependency to the bundle.
 */
export function printActivitiesAsPdf(activities: Activity[], appType: ApplicationType) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildActivitiesHtmlDocument(activities, appType));
    win.document.close();
    win.focus();
    win.print();
}

/**
 * Downloads the same formatted document as a .doc file. Word (and Google
 * Docs' file-upload importer) both open HTML content saved with a .doc
 * extension and application/msword type directly — a well-established
 * trick that avoids pulling in a full docx-generation library.
 */
export function downloadAsWordDoc(activities: Activity[], appType: ApplicationType) {
    const html = buildActivitiesHtmlDocument(activities, appType);
    downloadBlob(
        new Blob(['﻿', html], { type: 'application/msword;charset=utf-8' }),
        `wa-architect-${appType.toLowerCase()}-export.doc`
    );
}
