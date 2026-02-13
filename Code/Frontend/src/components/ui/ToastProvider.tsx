/**
 * Apple-style Toast Notification System
 *
 * System-wide toast notifications with slide-in/out animations,
 * browser Notification API support, and dynamic page title updates.
 * Apple HIG 2025: rounded 2xl, frosted glass, SF-style icons.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, type LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastVariant = 'success' | 'error' | 'info';

interface ToastData {
    id: string;
    variant: ToastVariant;
    title: string;
    message?: string;
    durationMs: number;
}

interface ToastContextValue {
    /** Show a toast notification */
    showToast: (variant: ToastVariant, title: string, message?: string, durationMs?: number) => void;
    /** Update the document title with progress info */
    setProgressTitle: (progress: string | null) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}

/* ------------------------------------------------------------------ */
/*  Variant config                                                     */
/* ------------------------------------------------------------------ */

const VARIANT_CONFIG: Record<ToastVariant, { icon: LucideIcon; color: string; bg: string; border: string }> = {
    success: {
        icon: CheckCircle2,
        color: 'text-apple-green',
        bg: 'bg-apple-green/8',
        border: 'border-apple-green/20',
    },
    error: {
        icon: AlertCircle,
        color: 'text-apple-red',
        bg: 'bg-apple-red/8',
        border: 'border-apple-red/20',
    },
    info: {
        icon: Info,
        color: 'text-apple-blue',
        bg: 'bg-apple-blue/8',
        border: 'border-apple-blue/20',
    },
};

/* ------------------------------------------------------------------ */
/*  Single Toast                                                       */
/* ------------------------------------------------------------------ */

const Toast: React.FC<{ toast: ToastData; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const cfg = VARIANT_CONFIG[toast.variant];
    const Icon = cfg.icon;

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), toast.durationMs);
        return () => clearTimeout(timer);
    }, [toast.id, toast.durationMs, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative flex items-start gap-3 max-w-sm w-full px-4 py-3.5 rounded-2xl backdrop-blur-2xl border shadow-apple-lg ${cfg.bg} ${cfg.border}`}
        >
            <div className="flex-shrink-0 mt-0.5">
                <Icon className={`w-5 h-5 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground leading-tight">{toast.title}</p>
                {toast.message && (
                    <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                aria-label="Dismiss"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
};

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

const ORIGINAL_TITLE = 'AutoLogic Framework';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const titleRef = useRef<string>(ORIGINAL_TITLE);

    const showToast = useCallback(
        (variant: ToastVariant, title: string, message?: string, durationMs = 4000) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setToasts((prev) => [...prev.slice(-4), { id, variant, title, message, durationMs }]);

            // Browser notification (if tab is hidden)
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body: message, icon: '/vite.svg' });
            }
        },
        [],
    );

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const setProgressTitle = useCallback((progress: string | null) => {
        if (progress) {
            document.title = progress;
        } else {
            document.title = titleRef.current;
        }
    }, []);

    // Request browser notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, setProgressTitle }}>
            {children}

            {/* Toast container — top-right, stacked */}
            <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto">
                            <Toast toast={toast} onDismiss={dismiss} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
