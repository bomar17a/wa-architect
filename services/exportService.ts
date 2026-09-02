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
        .replace(/^[ \t]*[\u2022\u25CF\u25AA\u2023\u25E6][ \t]*/gm, '') // bullet glyphs at line start
        .replace(/^[ \t]*[-*][ \t]+/gm, '')    // markdown "- " / "* " list markers
        .replace(/^[ \t]*\d+\.[ \t]+/gm, '')   // "1. " numbered list markers
        // Written as \u escapes on purpose. These two lines previously held literal
        // curly quotes, which were flattened to ASCII at some point, leaving
        // /["]/g replacing a straight quote with a straight quote. Silent no-ops,
        // so smart quotes have been reaching AMCAS exports this whole time.
        .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')  // curly + prime doubles
        .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")  // curly + prime singles
        .replace(/\u2026/g, '...')                          // ellipsis
        .replace(/[\u2013\u2014\u2212]/g, '-')              // en dash, em dash, minus
        .replace(/[\u00A0\u2007\u202F]/g, ' ')              // non-breaking spaces
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

const EXPORT_COLUMNS = [
    'Title', 'Organization', 'Type', 'Location', 'Date Ranges',
    'Total Hours', 'Most Meaningful', 'Description', 'MME Essay',
] as const;

/** One flat row per filled activity. Shared by the spreadsheet export. */
function buildExportRows(activities: Activity[], appType: ApplicationType): string[][] {
    return activities.filter(a => a.experienceType).map(a => {
        const totalHours = a.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0);
        const isMme = appType === ApplicationType.AMCAS && a.isMostMeaningful;
        return [
            a.title || '',
            a.organization || '',
            a.experienceType || '',
            [a.city, a.country].filter(Boolean).join(', '),
            a.dateRanges.map(formatDateRange).join('; '),
            String(totalHours),
            isMme ? 'Yes' : 'No',
            sanitizeForAmcas(a.description),
            isMme ? sanitizeForAmcas(a.mmeEssay) : '',
        ];
    });
}

/**
 * Real .xlsx (OOXML), not a renamed .csv. `write-excel-file` is imported
 * dynamically so it stays out of the main bundle and only loads when
 * someone actually exports.
 */
export async function downloadAsXlsx(activities: Activity[], appType: ApplicationType) {
    const { default: writeXlsxFile } = await import('write-excel-file/browser');
    const rows = buildExportRows(activities, appType);

    const sheet = [
        EXPORT_COLUMNS.map(value => ({
            value,
            fontWeight: 'bold' as const,
            backgroundColor: '#EBF5F5',
            borderBottomColor: '#2E6B6B',
            borderBottomStyle: 'thin' as const,
        })),
        ...rows.map(row => row.map((value, i) => ({
            value,
            type: String,
            // Description and MME essay are long prose - wrap instead of overflowing.
            wrap: i >= 7,
            alignVertical: 'top' as const,
        }))),
    ];

    // v4 returns { toBlob, toFile } rather than a Blob; use our own downloader
    // so the filename matches the other exports.
    const { toBlob } = await writeXlsxFile(sheet, {
        columns: [
            { width: 30 }, { width: 26 }, { width: 34 }, { width: 20 }, { width: 30 },
            { width: 12 }, { width: 16 }, { width: 70 }, { width: 70 },
        ],
        sheet: 'Work & Activities',
    });

    downloadBlob(await toBlob(), `wa-architect-${appType.toLowerCase()}-export.xlsx`);
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
 * Formatted document HTML for the print-to-PDF view. This used to double as the
 * Word export (HTML saved with a .doc extension); that path is now a real .docx,
 * so this serves printing only.
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
 * Real .docx (OOXML), not HTML with a .doc extension. Opens natively in Word,
 * Pages, LibreOffice and Google Docs. `docx` is imported dynamically so it
 * stays out of the main bundle.
 */
export async function downloadAsDocx(activities: Activity[], appType: ApplicationType) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    const filled = activities.filter(a => a.experienceType);

    const label = (text: string) => new Paragraph({
        spacing: { before: 160, after: 40 },
        children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, color: '555555' })],
    });
    const body = (text: string) => new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text, size: 22 })],
    });

    const children: InstanceType<typeof Paragraph>[] = [
        new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: `${appType} Work & Activities Export`, bold: true, size: 36 })],
        }),
        new Paragraph({
            spacing: { after: 320 },
            children: [new TextRun({
                text: `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - ${filled.length} activities`,
                size: 18,
                color: '777777',
            })],
        }),
    ];

    filled.forEach((a, i) => {
        const totalHours = a.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0);
        const isMme = appType === ApplicationType.AMCAS && a.isMostMeaningful;

        if (i > 0) children.push(new Paragraph({ text: '', border: { top: { style: 'single', size: 6, color: 'CCCCCC' } }, spacing: { before: 280, after: 200 } }));

        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 80 },
            children: [new TextRun({ text: `${a.title || 'Untitled Activity'}${isMme ? ' *' : ''}`, bold: true, size: 26 })],
        }));

        const meta = [
            `Organization: ${a.organization || '-'}`,
            `Type: ${a.experienceType || '-'}`,
            [a.city, a.country].filter(Boolean).join(', ') && `Location: ${[a.city, a.country].filter(Boolean).join(', ')}`,
            `Total Hours: ${totalHours}`,
            isMme && 'Most Meaningful Experience: Yes',
        ].filter(Boolean) as string[];

        meta.forEach(line => children.push(new Paragraph({
            spacing: { after: 20 },
            children: [new TextRun({ text: line, size: 20, color: '444444' })],
        })));

        a.dateRanges.forEach(r => children.push(new Paragraph({
            spacing: { after: 20 },
            children: [new TextRun({ text: formatDateRange(r), size: 20, color: '444444' })],
        })));

        children.push(label('Description'));
        children.push(body(sanitizeForAmcas(a.description) || '[No description written yet]'));

        if (isMme && a.mmeEssay) {
            children.push(label('Most Meaningful Experience Essay'));
            children.push(body(sanitizeForAmcas(a.mmeEssay)));
        }
    });

    const doc = new Document({
        creator: 'W&A Architect',
        title: `${appType} Work & Activities Export`,
        sections: [{ properties: {}, children }],
    });

    downloadBlob(
        await Packer.toBlob(doc),
        `wa-architect-${appType.toLowerCase()}-export.docx`
    );
}
