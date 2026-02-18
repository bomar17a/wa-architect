import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { RewriteType } from '../../types';
import * as geminiService from '../../services/geminiService';

interface CoPilotEditorProps {
    text: string;
    onTextChange: (newText: string) => void;
    placeholder?: string;
    className?: string;
}

export const CoPilotEditor: React.FC<CoPilotEditorProps> = ({ text, onTextChange, placeholder, className }) => {
    const [selectedText, setSelectedText] = useState('');
    const [rewriteSuggestions, setRewriteSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.style.height = 'auto';
            editorRef.current.style.height = `${editorRef.current.scrollHeight}px`;
        }
    }, [text]);

    const handleRewrite = async (type: RewriteType) => {
        if (!selectedText) return;
        setIsLoading(true); setShowSuggestions(true);
        try { const res = await geminiService.getRewriteSuggestions(selectedText, type); setRewriteSuggestions(res); }
        catch { setRewriteSuggestions(["Error."]); }
        finally { setIsLoading(false); }
    }

    return (
        <div className="relative w-full">
            <textarea
                ref={editorRef}
                value={text}
                onChange={e => onTextChange(e.target.value)}
                onSelect={(e) => { const start = e.currentTarget.selectionStart; const end = e.currentTarget.selectionEnd; if (end - start > 3) setSelectedText(text.substring(start, end)); else setSelectedText(''); }}
                className={`${className} relative z-10 bg-transparent resize-none focus:outline-none overflow-hidden`}
                placeholder={placeholder}
                rows={1}
                style={{ minHeight: '400px' }}
            />
            {selectedText && !showSuggestions && (
                <div className="absolute top-4 right-4 flex gap-1 bg-brand-dark text-white rounded-lg shadow-xl p-1 z-30 animate-fade-in">
                    <button onClick={() => handleRewrite('IMPACT')} className="px-3 py-1.5 hover:bg-slate-700 text-xs font-bold rounded-md">Boost Impact</button>
                    <button onClick={() => handleRewrite('CONCISE')} className="px-3 py-1.5 hover:bg-slate-700 text-xs font-bold rounded-md">Shorten</button>
                </div>
            )}
            {showSuggestions && (
                <div className="absolute top-14 right-4 w-72 bg-white shadow-2xl border border-slate-200 rounded-xl z-30 p-3 max-h-60 overflow-y-auto animate-slide-up">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b">
                        <span className="text-xs font-bold text-brand-teal">Draft Enhancements</span>
                        <button onClick={() => setShowSuggestions(false)}><X className="w-3 h-3" /></button>
                    </div>
                    {isLoading ? <div className="py-4 text-center"><div className="w-4 h-4 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div></div> :
                        rewriteSuggestions.map((s, i) => (
                            <div key={i} onClick={() => { onTextChange(text.replace(selectedText, s)); setShowSuggestions(false); }} className="text-xs p-3 hover:bg-brand-light cursor-pointer rounded-lg border border-transparent hover:border-brand-teal/20 mb-1 transition-all">{s}</div>
                        ))
                    }
                </div>
            )}
        </div>
    )
};
