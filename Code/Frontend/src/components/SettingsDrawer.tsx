/**
 * Apple HIG Settings Drawer
 *
 * Full-screen modal with frosted backdrop.
 * macOS System Settings-inspired layout with
 * responsive sidebar/segmented navigation.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import type { SettingsConfig } from '../types/settings';
import SystemConfigurationPanel from './settings/SystemConfigurationPanel';
import { useModelCache } from '../hooks/useSettings';

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigChange: (config: SettingsConfig) => void;
    settings?: SettingsConfig;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, onConfigChange, settings }) => {
    const { t } = useTranslation();
    const config = settings || DEFAULT_SETTINGS;
    const setConfig = onConfigChange;
    const loaded = true;
    const { models, loading: modelsLoading, fetchModels } = useModelCache();

    useEffect(() => {
        if (isOpen) {
            fetchModels();
        }
    }, [isOpen, fetchModels]);

    useEffect(() => {
        if (loaded) {
            // Config changes propagated by parent
        }
    }, [config, loaded]);

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

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
                    {/* Frosted Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 12 }}
                        transition={{ type: "spring", damping: 28, stiffness: 280 }}
                        className="relative w-full max-w-[960px] h-full max-h-[85vh] bg-background border border-border rounded-2xl shadow-apple-xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-border bg-card/80 backdrop-blur-xl shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-foreground tracking-tight">{t('settings.title')}</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="group w-8 h-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors duration-200"
                                aria-label="Close settings"
                            >
                                <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-8 py-6 custom-scrollbar">
                            {loaded ? (
                                <SystemConfigurationPanel
                                    config={config}
                                    onConfigChange={setConfig}
                                    modelData={models}
                                    modelsLoading={modelsLoading}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-[15px]">
                                    {t('common.loading')}
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
