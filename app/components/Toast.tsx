'use client';

import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
    const timerRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            onClose();
        }, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [duration]); // ✅ إزالة onClose من الـ dependencies

    const getStyles = () => {
        switch (type) {
            case 'success': return 'bg-green-500 text-white';
            case 'error': return 'bg-red-500 text-white';
            case 'warning': return 'bg-yellow-500 text-black';
            default: return 'bg-gray-800 text-white';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return '🔔';
        }
    };

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-slideDown">
            <div className={`${getStyles()} px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}>
                <span className="text-xl">{getIcon()}</span>
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button onClick={onClose} className="opacity-80 hover:opacity-100">✕</button>
            </div>
        </div>
    );
}

// ToastContext (بدون تغيير)
interface ToastContextType {
    showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType; duration?: number }>>([]);

    const showToast = (message: string, type: ToastType, duration?: number) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] space-y-2">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}