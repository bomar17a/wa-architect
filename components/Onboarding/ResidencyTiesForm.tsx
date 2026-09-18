import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ApplicantTie, ResidencyStatus, TieType } from '../../types';
import { RESIDENCE_STATES, stateName } from '../../utils/schoolStates';
import { TIE_TYPES } from '../../utils/residency';

export interface ResidencyTiesValue {
    legalState: string | null;
    status: ResidencyStatus | null;
    ties: ApplicantTie[];
}

interface ResidencyTiesFormProps {
    value: ResidencyTiesValue;
    onChange: (value: ResidencyTiesValue) => void;
}

const STATUS_OPTIONS: { id: ResidencyStatus | null; label: string }[] = [
    { id: 'us_citizen_or_pr', label: 'U.S. citizen or permanent resident' },
    { id: 'daca', label: 'DACA' },
    { id: 'international', label: 'International' },
    { id: null, label: 'Prefer not to say' },
];

const STATE_OPTIONS = Object.entries(RESIDENCE_STATES).sort((a, b) => a[1].localeCompare(b[1]));

const labelClass = 'text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block';
const helpClass = 'text-xs text-slate-500 mb-3 leading-relaxed';
const selectClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-teal/20';

export const ResidencyTiesForm: React.FC<ResidencyTiesFormProps> = ({ value, onChange }) => {
    const [tieState, setTieState] = useState('');
    const [tieType, setTieType] = useState<TieType>('grew_up');

    const addTie = () => {
        if (!tieState) return;
        const exists = value.ties.some(t => t.state === tieState && t.tieType === tieType);
        if (!exists) onChange({ ...value, ties: [...value.ties, { state: tieState, tieType }] });
        setTieState('');
    };

    const removeTie = (tie: ApplicantTie) =>
        onChange({ ...value, ties: value.ties.filter(t => !(t.state === tie.state && t.tieType === tie.tieType)) });

    const tieLabel = (type: TieType) => TIE_TYPES.find(t => t.id === type)?.label ?? type;

    return (
        <div className="space-y-7">
            <div>
                <label htmlFor="legal-residence" className={labelClass}>State of legal residence</label>
                <p className={helpClass}>The state AMCAS will list as your legal residence.</p>
                <select
                    id="legal-residence"
                    value={value.legalState ?? ''}
                    onChange={e => onChange({ ...value, legalState: e.target.value || null })}
                    className={`w-full ${selectClass}`}
                >
                    <option value="">Not set</option>
                    {STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
            </div>

            <div>
                <span className={labelClass}>Other states you have ties to <span className="font-normal normal-case text-slate-400">(optional)</span></span>
                <p className={helpClass}>
                    Where you grew up, went to college, have family, or worked. Some schools count these for
                    out-of-state applicants: the University of Washington considers applicants from outside its
                    five-state region only if they have ties to it.
                </p>
                <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                    <select aria-label="State" value={tieState} onChange={e => setTieState(e.target.value)} className={selectClass}>
                        <option value="">Choose a state</option>
                        {STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                    </select>
                    <select aria-label="Kind of tie" value={tieType} onChange={e => setTieType(e.target.value as TieType)} className={selectClass}>
                        {TIE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <button
                        type="button"
                        onClick={addTie}
                        disabled={!tieState}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold bg-brand-dark text-white disabled:opacity-40 transition-opacity"
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>
                {value.ties.length > 0 && (
                    <ul className="flex flex-wrap gap-2 mt-3">
                        {value.ties.map(t => (
                            <li key={`${t.state}:${t.tieType}`} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg bg-brand-teal/10 text-brand-dark text-xs font-bold">
                                {stateName(t.state)} · {tieLabel(t.tieType)}
                                <button
                                    type="button"
                                    onClick={() => removeTie(t)}
                                    aria-label={`Remove ${stateName(t.state)}, ${tieLabel(t.tieType)}`}
                                    className="p-0.5 rounded hover:bg-brand-teal/20"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div>
                <span className={labelClass}>Citizenship status <span className="font-normal normal-case text-slate-400">(optional)</span></span>
                <p className={helpClass}>Only used to flag a school whose published policy excludes you. Nothing else reads it.</p>
                <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map(opt => (
                        <button
                            key={opt.label}
                            type="button"
                            onClick={() => onChange({ ...value, status: opt.id })}
                            aria-pressed={value.status === opt.id}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors ${value.status === opt.id ? 'bg-brand-teal text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
