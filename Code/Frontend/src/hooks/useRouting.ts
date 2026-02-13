import { useState, useCallback } from 'react';

export type Section = 'home' | 'prompts' | 'history' | 'help';

interface UseRoutingReturn {
    activeSection: string;
    isSettingsOpen: boolean;
    navigateTo: (section: string) => void;
    openSettings: () => void;
    closeSettings: () => void;
    toggleSettings: () => void;
}

export function useRouting(defaultSection: string = 'home'): UseRoutingReturn {
    const [activeSection, setActiveSection] = useState(defaultSection);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const navigateTo = useCallback((section: string) => {
        if (section === 'settings') {
            setIsSettingsOpen(true);
        } else {
            setActiveSection(section);
        }
    }, []);

    const openSettings = useCallback(() => setIsSettingsOpen(true), []);
    const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
    const toggleSettings = useCallback(() => setIsSettingsOpen(prev => !prev), []);

    return {
        activeSection,
        isSettingsOpen,
        navigateTo,
        openSettings,
        closeSettings,
        toggleSettings
    };
}
