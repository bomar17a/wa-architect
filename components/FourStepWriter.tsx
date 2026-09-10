import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ArrowLeft, Wand2, AlertCircle, ChevronDown, BookOpen, Trophy, Lightbulb } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import * as geminiService from '../services/geminiService';

interface FourStepWriterProps {
    charLimit: number;
    onApply: (text: string) => void;
    onCancel: () => void;
}

export const FourStepWriter: React.FC<FourStepWriterProps> = ({ charLimit, onApply, onCancel }) => {
    const [context, setContext] = useState('');
    const [impact, setImpact] = useState('');
    const [reflection, setReflection] = useState('');
    const [strengthen, setStrengthen] = useState('');
    const [copied, setCopied] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await geminiService.checkUserAuth();
            } catch (e: any) {
                if (e.message === 'AUTH_REQUIRED') {
                    addToast("You must be logged in to use the AI Wizard generator.", "error");
                    onCancel(); // push back to editor
                }
            }
        };
        checkAuth();
    }, [addToast, onCancel]);

    // Auto-assemble the draft
    const fullDraft = [context, impact, reflection, strengthen]
        .filter(section => section.trim().length > 0)
        .join(' '); // Using space to join. Users usually type punctuation, but this ensures separation.

    const charCount = fullDraft.length;
    const isOverLimit = charCount > charLimit;

    // Where the characters actually went. The common failure in an activity entry is
    // spending most of the box on duties — a reader already knows what the role does —
    // so the split is shown rather than described.
    const blocks = [
        { key: 'context', label: 'Context', chars: context.trim().length, tone: 'bg-slate-400' },
        { key: 'impact', label: 'Impact', chars: impact.trim().length, tone: 'bg-brand-teal' },
        { key: 'reflection', label: 'Reflection', chars: reflection.trim().length, tone: 'bg-brand-gold' },
        { key: 'strengthen', label: 'Recognition', chars: strengthen.trim().length, tone: 'bg-indigo-400' },
    ].filter(b => b.chars > 0);
    const blockTotal = blocks.reduce((sum, b) => sum + b.chars, 0);
    const contextShare = blockTotal > 0 ? (context.trim().length / blockTotal) : 0;
    // Two sentences of eight should land near a fifth of the box. Half is the point at
    // which the entry has become a job description.
    const contextHeavy = blockTotal > 200 && contextShare > 0.5;

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(fullDraft);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col bg-slate-50 rounded-xl">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm rounded-t-xl">
                <button
                    onClick={onCancel}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Editor
                </button>
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-md">
                        <Wand2 className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-slate-700">Description Wizard</span>
                </div>
                <div className="w-20"></div> {/* Spacer for centering */}
            </div>

            <div className="p-4 sm:p-8 space-y-8">
                <motion.div
                    className="max-w-3xl mx-auto space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >

                    {/* Step 1: Context & Role */}
                    <motion.div variants={itemVariants} className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm relative group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-visible">
                        <div className="absolute -left-3 top-6 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md z-10">1</div>
                        <div className="pl-4">
                            <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                Context & Role
                                <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider border border-slate-200 px-1.5 rounded">2 sentences</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                                <BookOpen className="w-3 h-3 text-indigo-400" />
                                Name the setting, your role, and who you served. Two sentences — the reader only needs to know where they are standing.
                            </p>
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                                rows={3}
                                placeholder="Example: Saturday clinic on the east side, uninsured patients, no appointments. I ran intake — vitals, history, and the paperwork nobody else had time for."
                            />
                        </div>
                    </motion.div>

                    {/* Step 2: Impact (Revealed when context has input) */}
                    <AnimatePresence>
                        {(context.length > 5 || impact.length > 0) && (
                            <motion.div
                                key="step-impact"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm relative pl-8 sm:pl-10 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-visible">
                                    <div className="absolute -left-3 top-6 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md z-10">2</div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                        Impact & Outcomes
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider border border-slate-200 px-1.5 rounded">3 sentences</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                                        <Lightbulb className="w-3 h-3 text-amber-400" />
                                        A problem you noticed, what you did about it, what moved. This is where the numbers go.
                                    </p>
                                    <textarea
                                        value={impact}
                                        onChange={(e) => setImpact(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                                        rows={3}
                                        placeholder="Example: Waits ran past two hours because vitals happened after registration. I flipped the order and trained four volunteers on it; the average wait fell from 84 minutes to 61."
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step 3: Reflection (Revealed when impact has input) */}
                    <AnimatePresence>
                        {(impact.length > 5 || reflection.length > 0) && (
                            <motion.div
                                key="step-reflection"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm relative pl-8 sm:pl-10 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-visible">
                                    <div className="absolute -left-3 top-6 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md z-10">3</div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                        Reflection & Growth
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider border border-slate-200 px-1.5 rounded">3 sentences</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                                        <BookOpen className="w-3 h-3 text-indigo-400" />
                                        What you understood afterward that you did not before. One honest line only you could have written beats a paragraph of competency vocabulary.
                                    </p>
                                    <textarea
                                        value={reflection}
                                        onChange={(e) => setReflection(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                                        rows={3}
                                        placeholder="Example: I had assumed the bottleneck was staffing. It was sequence. Access is not only whether a clinic is open, but whether someone can afford to wait for it."
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step 4: Strengthen (Revealed when reflection has input) */}
                    <AnimatePresence>
                        {(reflection.length > 5 || strengthen.length > 0) && (
                            <motion.div
                                key="step-strengthen"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm relative pl-8 sm:pl-10 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-visible">
                                    <div className="absolute -left-3 top-6 bg-slate-400 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md z-10">4</div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                        Awards & Recognition
                                        <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wider border border-slate-200 px-1.5 rounded bg-slate-100">Optional</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                                        <Trophy className="w-3 h-3 text-yellow-500" />
                                        Any formal recognition worth a line. Skip it if there is none — an empty sentence costs you characters that reflection could use.
                                    </p>
                                    <textarea
                                        value={strengthen}
                                        onChange={(e) => setStrengthen(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                                        rows={2}
                                        placeholder="Example: I was named 'Volunteer of the Month' in August 2023."
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </motion.div>
            </div>

            {/* Live Preview Footer */}
            <div className="bg-slate-900 text-slate-200 p-6 border-t border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sticky bottom-0 z-30 rounded-b-xl">
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                            <Wand2 className="w-3 h-3" />
                            Final Draft Preview
                        </h3>

                        <div className="flex items-center gap-4">
                            <div className={`text-xs font-mono font-medium px-2 py-1 rounded ${isOverLimit ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                                {charCount} / {charLimit}
                            </div>

                            <button
                                onClick={handleCopy}
                                className="text-xs hover:text-white flex items-center gap-1 transition-colors"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {blocks.length > 0 && (
                        <div className="mb-3">
                            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800 mb-2">
                                {blocks.map(b => (
                                    <div
                                        key={b.key}
                                        className={b.tone}
                                        style={{ width: `${(b.chars / blockTotal) * 100}%` }}
                                        title={`${b.label}: ${b.chars} characters`}
                                    />
                                ))}
                            </div>
                            <ul className="flex flex-wrap gap-x-4 gap-y-1">
                                {blocks.map(b => (
                                    <li key={b.key} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                        <span aria-hidden="true" className={`w-2 h-2 rounded-sm ${b.tone}`} />
                                        {b.label}
                                        <span className="tabular-nums text-slate-500">
                                            {Math.round((b.chars / blockTotal) * 100)}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {contextHeavy && (
                                <p className="mt-2 text-[11px] text-brand-gold leading-relaxed">
                                    Context is taking {Math.round(contextShare * 100)}% of the entry. A reader already
                                    knows what the role involves — the space is better spent on what changed and what
                                    you took from it.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <textarea
                            readOnly
                            value={fullDraft}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 focus:outline-none resize-none font-serif leading-relaxed"
                            rows={4}
                            placeholder="Complete the steps above to see your assembled draft here..."
                        />
                        {isOverLimit && (
                            <div className="absolute -top-12 left-0 right-0 mx-auto w-max max-w-full">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2"
                                >
                                    <AlertCircle className="w-3 h-3" />
                                    Over the limit. Cut from Context first — it is the block a reader needs least.
                                </motion.div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => onApply(fullDraft)}
                            disabled={fullDraft.length === 0}
                            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Apply to Activity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};