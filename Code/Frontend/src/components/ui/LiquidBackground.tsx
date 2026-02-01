import React from 'react';

interface LiquidBackgroundProps {
    className?: string;
}

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({ className = '' }) => {

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`} aria-hidden="true">
            {/* Gradient Orb 1 - Top Left */}
            <div
                className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-40 blur-[80px] animate-blob mix-blend-multiply dark:mix-blend-screen filter"
                style={{
                    background: 'var(--color-liquid-1)',
                    animationDelay: '0s'
                }}
            />

            {/* Gradient Orb 2 - Top Right */}
            <div
                className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-40 blur-[80px] animate-blob mix-blend-multiply dark:mix-blend-screen filter"
                style={{
                    background: 'var(--color-liquid-2)',
                    animationDelay: '2s'
                }}
            />

            {/* Gradient Orb 3 - Bottom Left */}
            <div
                className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-40 blur-[80px] animate-blob mix-blend-multiply dark:mix-blend-screen filter"
                style={{
                    background: 'var(--color-liquid-3)',
                    animationDelay: '4s'
                }}
            />

            {/* Gradient Orb 4 - Bottom Right */}
            <div
                className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-40 blur-[80px] animate-blob mix-blend-multiply dark:mix-blend-screen filter"
                style={{
                    background: 'var(--color-liquid-4)',
                    animationDelay: '6s'
                }}
            />
        </div>
    );
};
