/**
 * Global Keyboard Shortcuts Hook
 *
 * Provides app-wide keyboard shortcuts following macOS conventions.
 * ⌘+Enter: submit task, ⌘+K: focus input, ⌘+,: settings,
 * ⌘+1-4: section nav, Escape: close modals.
 */

import { useEffect, useCallback } from 'react';

interface ShortcutActions {
    onSubmit?: () => void;
    onFocusInput?: () => void;
    onOpenSettings?: () => void;
    onCloseModal?: () => void;
    onNavigate?: (section: string) => void;
}

const SECTION_MAP: Record<string, string> = {
    '1': 'home',
    '2': 'prompts',
    '3': 'history',
    '4': 'help',
};

export function useKeyboardShortcuts(actions: ShortcutActions): void {
    const handler = useCallback(
        (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.ctrlKey;
            const target = e.target as HTMLElement;
            const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // ⌘+Enter: submit (works even in textareas)
            if (isMeta && e.key === 'Enter') {
                e.preventDefault();
                actions.onSubmit?.();
                return;
            }

            // ⌘+K: focus input  
            if (isMeta && e.key === 'k') {
                e.preventDefault();
                actions.onFocusInput?.();
                return;
            }

            // ⌘+,: open settings
            if (isMeta && e.key === ',') {
                e.preventDefault();
                actions.onOpenSettings?.();
                return;
            }

            // Escape: close modal
            if (e.key === 'Escape') {
                actions.onCloseModal?.();
                return;
            }

            // ⌘+1-4: navigate sections (only when not editing)
            if (isMeta && !isEditing && SECTION_MAP[e.key]) {
                e.preventDefault();
                actions.onNavigate?.(SECTION_MAP[e.key]);
                return;
            }
        },
        [actions],
    );

    useEffect(() => {
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handler]);
}
