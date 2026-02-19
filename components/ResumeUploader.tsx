import React, { useRef, useState, useCallback } from 'react';
import { extractTextFromPdf, extractTextFromDocx } from '../utils/file-parsers';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext.tsx';

interface ResumeUploaderProps {
    onTextExtracted: (text: string) => void;
    isProcessing: boolean;
    compact?: boolean;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = React.memo(({ onTextExtracted, isProcessing, compact = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isReading, setIsReading] = useState(false);
    const { addToast } = useToast();

    const handleButtonClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("File selected:", file.name, file.type, file.size);
        setError(null);
        setIsReading(true);
        // Toast for immediate feedback
        addToast("Reading file...", "info");

        try {
            let text = '';
            if (file.type === 'application/pdf') {
                console.log("Starting PDF extraction...");
                text = await extractTextFromPdf(file);
                console.log("PDF extraction complete. Length:", text.length);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                console.log("Starting DOCX extraction...");
                text = await extractTextFromDocx(file);
                console.log("DOCX extraction complete. Length:", text.length);
            } else {
                throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
            }

            if (!text.trim()) {
                throw new Error('Could not extract text from this file. It might be an image-only PDF.');
            }

            console.log("Calling onTextExtracted...");
            onTextExtracted(text);
        } catch (err: any) {
            console.error("Extraction error:", err);
            const msg = err.message || 'Failed to read file';
            setError(msg);
            addToast(msg, 'error');
        } finally {
            setIsReading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [onTextExtracted, addToast]);

    return (
        <div className="w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx"
                className="hidden"
                aria-label="Upload Resume File"
                disabled={isProcessing}
            />

            <button
                onClick={handleButtonClick}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${compact
                    ? 'p-3 bg-brand-teal/5 text-brand-teal rounded-xl hover:bg-brand-teal hover:text-white font-bold text-sm border border-brand-teal/20'
                    : 'p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand-teal hover:bg-brand-teal/5'
                    }`}
                aria-busy={isProcessing}
                aria-label={isProcessing || isReading ? "Analyzing resume..." : "Upload Resume (PDF or DOCX)"}
            >
                {isProcessing || isReading ? (
                    <>
                        <Loader2 className={`animate-spin ${compact ? 'w-4 h-4' : 'w-5 h-5 text-brand-teal'}`} aria-hidden="true" />
                        <span className={`${compact ? '' : 'text-slate-500 font-medium'}`}>
                            {isReading ? 'Reading File...' : 'Analyzing...'}
                        </span>
                    </>
                ) : (
                    <>
                        <Upload className={`${compact ? 'w-4 h-4' : 'w-5 h-5 text-slate-400 group-hover:text-brand-teal'}`} aria-hidden="true" />
                        <span className={`${compact ? '' : 'text-slate-500 group-hover:text-brand-teal font-medium'}`}>
                            {compact ? 'Upload Resume' : 'Upload Resume (PDF/DOCX)'}
                        </span>
                    </>
                )}
            </button>

            {error && (
                <div role="alert" className="mt-2 flex items-center gap-2 text-rose-500 text-xs bg-rose-50 p-2 rounded">
                    <AlertCircle className="w-3 h-3" aria-hidden="true" />
                    <span>{error}</span>
                </div>
            )}

            {!compact && (
                <div className="mt-2 text-xs text-slate-400 text-center">
                    We analyze the text to draft activities. No files are stored.
                </div>
            )}
        </div>
    );
});

ResumeUploader.displayName = 'ResumeUploader';
