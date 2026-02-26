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
                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <div className="absolute -left-3 top-6 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md z-10">1</div>
                        <div className="pl-4">
                            <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                Context & Role
                                <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider border border-slate-200 px-1.5 rounded">The "What"</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                                <BookOpen className="w-3 h-3 text-indigo-400" />
                                Describe what you did and why you chose this activity.
                            </p>
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                                rows={3}
                                placeholder="Example: I volunteered as a scribe at the Downtown Clinic, assisting physicians with documentation for over 50 patients a week..."
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
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative pl-10 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                    <div className="absolute -left-3 top-6 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md z-10">2</div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                        Impact & Outcomes
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider border border-slate-200 px-1.5 rounded">The "Show"</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                                        <Lightbulb className="w-3 h-3 text-amber-400" />
                                        Use numbers and specific details. Show the difference you made.
                                    </p>
                                    <textarea
                                        value={impact}
                                        onChange={(e) => setImpact(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                                        rows={3}
                                        placeholder="Example: I reorganized the patient filing system, reducing retrieval time by 20%..."
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
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative pl-10 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                    <div className="absolute -left-3 top-6 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md z-10">3</div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                        Reflection & Growth
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider border border-slate-200 px-1.5 rounded">The "Tell"</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                                        <BookOpen className="w-3 h-3 text-indigo-400" />
                                        What did you learn? How did this shape your view of medicine?
                                    </p>
                                    <textarea
                                        value={reflection}
                                        onChange={(e) => setReflection(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                                        rows={3}
                                        placeholder="Example: This taught me the importance of efficiency in patient care and solidified my desire to serve underserved populations..."
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
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative pl-10 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                    <div className="absolute -left-3 top-6 bg-slate-400 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md z-10">4</div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                        Awards & Recognition
                                        <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wider border border-slate-200 px-1.5 rounded bg-slate-100">Optional</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                                        <Trophy className="w-3 h-3 text-yellow-500" />
                                        Did you receive any formal recognition?
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
                                    Over limit! Try shortening your 'Context' to make room for 'Reflection'.
                                </motion.div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => onApply(fullDraft)}
                            disabled={fullDraft.length === 0}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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