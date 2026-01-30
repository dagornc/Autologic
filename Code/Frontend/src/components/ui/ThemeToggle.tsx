import React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { ThemeProviderContext } from '../../contexts/ThemeContext';

export function ThemeToggle() {
    const { theme, setTheme } = React.useContext(ThemeProviderContext);

    return (
        <div className="flex items-center p-1 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
            <button
                onClick={() => setTheme('light')}
                className={`flex-1 p-2 rounded-lg transition-all ${theme === 'light'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                title="Light Mode"
            >
                <Sun className="w-4 h-4 mx-auto" />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`flex-1 p-2 rounded-lg transition-all ${theme === 'system'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                title="System Mode"
            >
                <Laptop className="w-4 h-4 mx-auto" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`flex-1 p-2 rounded-lg transition-all ${theme === 'dark'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                title="Dark Mode"
            >
                <Moon className="w-4 h-4 mx-auto" />
            </button>
        </div>
    );
}
