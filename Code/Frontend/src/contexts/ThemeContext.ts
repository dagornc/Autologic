/**
 * Contexte du thème - Séparé pour satisfaire react-refresh
 */

import { createContext } from 'react';

export type Theme = 'dark' | 'light' | 'system';

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: 'system',
    setTheme: () => null,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
