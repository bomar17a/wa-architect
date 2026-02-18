import React, { useRef, useState } from 'react';
import { extractTextFromPdf, extractTextFromDocx } from '../utils/file-parsers';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';

interface ResumeUploaderProps {
    onTextExtracted: (text: string) => void;
    isProcessing: boolean;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onTextExtracted, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        try {
            let text = '';
            if (file.type === 'application/pdf') {
                text = await extractTextFromPdf(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                text = await extractTextFromDocx(file);
            } else {
                throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
            }

            if (!text.trim()) {
                throw new Error('Could not extract text from this file. It might be an image-only PDF.');
            }

            onTextExtracted(text);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to read file');
        } finally {
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx"
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand-teal hover:bg-brand-teal/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin text-brand-teal" />
                        <span className="text-slate-500 font-medium">Analyzing Resume...</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-brand-teal" />
                        <span className="text-slate-500 group-hover:text-brand-teal font-medium">Upload Resume (PDF/DOCX)</span>
                    </>
                )}
            </button>

            {error && (
                <div className="mt-2 flex items-center gap-2 text-rose-500 text-sm bg-rose-50 p-2 rounded">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            <div className="mt-2 text-xs text-slate-400 text-center">
                We analyze the text to draft activities. No files are stored.
            </div>
        </div>
    );
};
