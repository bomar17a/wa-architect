import React from 'react';
import { MONTHS } from '../../constants';

// We need to import getYears or just copy the logic/constant if it's small.
// The original file had `const YEARS = getYears();`
// Let's import getYears from constants.
import { getYears } from '../../constants';

const YEARS = getYears();

interface DateSelectProps {
    month?: string;
    year?: string;
    onChange: (m: string, y: string) => void;
    onYearChange?: (y: string) => void;
    label?: string;
}

export const DateSelect: React.FC<DateSelectProps> = ({ month, year, onChange, onYearChange, label }) => (
    <div className="flex flex-col relative">
        {label && <label className="absolute -top-3 left-0 text-[9px] font-bold text-slate-400 uppercase">{label}</label>}
        <div className="flex gap-1.5">
            <select value={month} onChange={e => onChange(e.target.value, year || '')} className="bg-slate-50 hover:bg-white border border-transparent rounded-md text-xs font-medium py-1.5 px-1 outline-none w-[85px]">
                <option value="">Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
            </select>
            <select value={year} onChange={e => onYearChange ? onYearChange(e.target.value) : onChange(month || '', e.target.value)} className="bg-slate-50 hover:bg-white border border-transparent rounded-md text-xs font-medium py-1.5 px-1 outline-none w-[60px]">
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
    </div>
);
