/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: "hsl(var(--card))",
                "card-foreground": "hsl(var(--card-foreground))",
                popover: "hsl(var(--popover))",
                "popover-foreground": "hsl(var(--popover-foreground))",
                primary: "hsl(var(--primary))",
                "primary-foreground": "hsl(var(--primary-foreground))",
                secondary: "hsl(var(--secondary))",
                "secondary-foreground": "hsl(var(--secondary-foreground))",
                muted: "hsl(var(--muted))",
                "muted-foreground": "hsl(var(--muted-foreground))",
                accent: "hsl(var(--accent))",
                "accent-foreground": "hsl(var(--accent-foreground))",
                destructive: "hsl(var(--destructive))",
                "destructive-foreground": "hsl(var(--destructive-foreground))",
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                // System v3.0 Colors
                sys: {
                    strategic: "var(--color-strategic)",
                    tactical: "var(--color-tactical)",
                    audit: "var(--color-audit)",
                    general: "var(--color-general)",
                }
            },
            transitionTimingFunction: {
                'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                'liquid': 'cubic-bezier(0.23, 1, 0.32, 1)',
                'snap': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            boxShadow: {
                'glass-1': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
                'glass-2': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
                'glass-3': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
                'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.2)',
                'neon-magenta': '0 0 10px rgba(255, 0, 110, 0.5), 0 0 20px rgba(255, 0, 110, 0.2)',
                'modal': '0 25px 50px -12px rgba(0,0,0,0.5)',
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                flow: {
                    '0%': { transform: 'translate(0, 0) scale(1)' },
                    '50%': { transform: 'translate(20px, -20px) scale(1.1)' },
                    '100%': { transform: 'translate(-10px, 10px) scale(0.9)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                pulse: {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: .5 },
                },
                'pulse-neon': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.2)', opacity: 0.7 },
                }
            },
            animation: {
                flow: 'flow 20s ease-in-out infinite alternate',
                'flow-reverse': 'flow 25s ease-in-out infinite alternate-reverse',
                float: 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
                blob: 'blob 10s infinite',
            },
        },
    },
    plugins: [],
}
