import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LiquidBackground } from './ui/LiquidBackground';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import type { SettingsConfig } from '../types/settings';
import SystemConfigurationPanel from './settings/SystemConfigurationPanel';
import { useModelCache } from '../hooks/useSettings';

// ============ TYPES ============
interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigChange: (config: SettingsConfig) => void;
    settings?: SettingsConfig;
}

// ============ CONSTANTS ============

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, onConfigChange, settings }) => {
    // --- State & Hooks ---
    const config = settings || DEFAULT_SETTINGS;
    const setConfig = onConfigChange;
    const loaded = true; // Settings are loaded by the parent
    const { models, loading: modelsLoading, fetchModels } = useModelCache();

    // --- Effects ---
    useEffect(() => {
        if (isOpen) {
            fetchModels();
        }
    }, [isOpen, fetchModels]);

    useEffect(() => {
        if (loaded) {
            // We propagate config changes immediately for live preview if needed, 
            // but usually we wait for save. The existing architecture propagated immediately.
            // onConfigChange(config); 
        }
    }, [config, loaded]);

    // --- Accessibility Effects ---
    useEffect(() => {
        if (!loaded) return;

        const root = document.documentElement;

        if (config.reducedMotion) {
            root.classList.add('reduced-motion');
        } else {
            root.classList.remove('reduced-motion');
        }

        if (config.dyslexicFont) {
            root.classList.add('dyslexic-font');
        } else {
            root.classList.remove('dyslexic-font');
        }

        if (config.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

    }, [config.reducedMotion, config.dyslexicFont, config.highContrast, loaded]);

    const handleClose = () => {
        onConfigChange(config);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-[1000px] h-full max-h-[85vh] bg-background border border-border rounded-[32px] shadow-modal overflow-hidden flex flex-col"
                    >
                        {/* Noise Texture Layer */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                        {/* Dynamic Background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
                            <LiquidBackground />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between px-10 py-8 border-b border-border bg-background/30 backdrop-blur-2xl">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-semibold text-foreground tracking-tight">System & Configuration</h2>
                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted border border-border">
                                    <span className="text-[11px] font-bold text-muted-foreground">v3.0.0</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-neon-emerald animate-pulse-neon shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    <span className="text-[11px] font-bold text-neon-emerald/80 tracking-wide uppercase">Liquid Glass</span>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="group p-2.5 rounded-full hover:bg-muted transition-all duration-300 hover:rotate-90 hover:scale-95 bg-muted/50 border border-border"
                            >
                                <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-10 py-8 scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent">
                            {loaded ? (
                                <SystemConfigurationPanel
                                    config={config}
                                    onConfigChange={setConfig}
                                    modelData={models}
                                    modelsLoading={modelsLoading}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Loading configuration...
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


export default SettingsDrawer;
