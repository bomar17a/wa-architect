import React, { useState } from 'react';
import { X, Download, Printer, Copy, Check, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Activity, ApplicationType } from '../../types';
import {
    formatActivityForExport,
    formatAllActivitiesForExport,
    downloadTextFile,
    downloadAsXlsx,
    downloadAsDocx,
    copyToClipboard,
    printActivitiesAsPdf,
} from '../../services/exportService';

interface ExportModalProps {
    activities: Activity[];
    appType: ApplicationType;
    onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ activities, appType, onClose }) => {
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);
    const filled = activities.filter(a => a.experienceType);

    const handleCopyOne = async (activity: Activity) => {
        const ok = await copyToClipboard(formatActivityForExport(activity, appType));
        if (ok) {
            setCopiedId(activity.id);
            setTimeout(() => setCopiedId(null), 1800);
        }
    };

    const handleCopyAll = async () => {
        const ok = await copyToClipboard(formatAllActivitiesForExport(activities, appType));
        if (ok) {
            setCopiedAll(true);
            setTimeout(() => setCopiedAll(false), 1800);
        }
    };

    const handleDownload = () => {
        downloadTextFile(
            `wa-architect-${appType.toLowerCase()}-export.txt`,
            formatAllActivitiesForExport(activities, appType)
        );
    };

    const handlePrint = () => printActivitiesAsPdf(activities, appType);
    const handleXlsx = () => { void downloadAsXlsx(activities, appType); };
    const handleDocx = () => { void downloadAsDocx(activities, appType); };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-teal/10 p-2 rounded-xl">
                            <FileDown className="w-5 h-5 text-brand-teal" />
                        </div>
                        <div>
                            <h2 className="text-lg font-serif font-bold text-brand-dark leading-none">Export to {appType} Format</h2>
                            <p className="text-slate-500 font-medium text-[10px] mt-1 uppercase tracking-wide">{filled.length} activities · plain text, no formatting</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">For pasting into AMCAS</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2.5 bg-brand-dark hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" /> Download .txt
                            </button>
                            <button
                                onClick={handleCopyAll}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                            >
                                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedAll ? 'Copied!' : 'Copy All'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">For sharing with advisors</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleXlsx}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel / Sheets (.xlsx)
                            </button>
                            <button
                                onClick={handleDocx}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                            >
                                <FileText className="w-3.5 h-3.5 text-blue-600" /> Word / Docs (.docx)
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
                    {filled.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-8">No activities to export yet.</p>
                    ) : (
                        filled.map(activity => (
                            <div key={activity.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{activity.title || 'Untitled Activity'}</h4>
                                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide truncate">{activity.experienceType || 'Uncategorized'}</p>
                                </div>
                                <button
                                    onClick={() => handleCopyOne(activity)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-brand-light text-slate-600 hover:text-brand-teal text-xs font-bold rounded-lg transition-colors shrink-0"
                                >
                                    {copiedId === activity.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedId === activity.id ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-6 py-3 border-t border-slate-100 bg-white">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        AMCAS strips all formatting from pasted text — this export removes bullets, bold, and smart quotes automatically. Always paste into AMCAS and re-check the character count before submitting.
                    </p>
                </div>
            </div>
        </div>
    );
};
