import React, { useEffect, useState } from 'react';
import { useProfile } from '../../../contexts/ProfileContext';
import { useToast } from '../../../contexts/ToastContext';

/**
 * One optional line about the personal statement. Saved to the profile on blur rather
 * than per keystroke, because every profile save is a network round trip.
 */
export const PsSummaryField: React.FC<{ compact?: boolean }> = ({ compact }) => {
    const { profile, updateProfile } = useProfile();
    const { addToast } = useToast();
    const saved = profile?.psSummary ?? '';
    const [value, setValue] = useState(saved);

    useEffect(() => { setValue(saved); }, [saved]);

    const save = async () => {
        const next = value.trim();
        if (next === saved.trim()) return;
        try {
            await updateProfile({ psSummary: next || null });
        } catch {
            addToast('Could not save your personal statement line. Try again in a moment.', 'error');
        }
    };

    return (
        <div className={compact ? '' : 'bg-white border border-slate-200 rounded-xl p-4'}>
            <label htmlFor="ps-summary" className="block text-sm font-semibold text-slate-800">
                Your personal statement in one line <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <p className="text-xs text-slate-500 mt-1 mb-2 leading-relaxed">
                Used only to warn you when a Most Meaningful essay retells the same scene or lesson. Writing about the same activity is fine.
            </p>
            <input
                id="ps-summary"
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={save}
                maxLength={240}
                placeholder="e.g. Translating for my grandmother after her stroke"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-teal/40 text-slate-800 text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-4 focus:ring-brand-teal/10"
            />
        </div>
    );
};
