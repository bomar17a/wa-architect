import React from 'react';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, label, onClick, active }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${active ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' : 'text-slate-500 hover:bg-brand-light hover:text-brand-teal-hover'}`}
    >
        {React.cloneElement(icon as React.ReactElement<any>, { className: active ? 'text-white' : 'text-current', size: 20 })}
        <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
);
