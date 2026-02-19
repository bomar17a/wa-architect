
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem: React.FC<Toast & { onClose: () => void }> = ({ message, type, onClose }) => {
    const styles = {
        success: 'bg-white border-emerald-500 text-emerald-700',
        error: 'bg-white border-rose-500 text-rose-700',
        info: 'bg-white border-blue-500 text-blue-700',
        warning: 'bg-white border-amber-500 text-amber-700',
    };

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-rose-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    };

    return (
        <div className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border-l-4 min-w-[300px] max-w-md animate-slide-in-right ${styles[type]}`}>
            {icons[type]}
            <p className="text-sm font-medium flex-1 text-slate-700">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
