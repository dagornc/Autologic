/**
 * Composant d'affichage de la solution finale - Premium Layout
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { CheckCircle2, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface SolutionDisplayProps {
    output: string;
    h2Score?: number;
}

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ output, h2Score }) => {
    return (
        <motion.section variants={itemVariants} className="space-y-8 pb-32">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-neon-emerald/10 flex items-center justify-center border border-neon-emerald/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-6 h-6 text-neon-emerald" />
                </div>
                <div>
                    <h2 className="text-[28px] font-extrabold text-foreground tracking-tight">
                        Final Solution
                    </h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Comprehensive output synthesized by the reasoning engine
                    </p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-[28px] bg-card backdrop-blur-3xl border border-border hover:border-neon-emerald/30 transition-all duration-500 shadow-modal"
            >
                {/* Decoration Gradient Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-neon-emerald via-neon-emerald/50 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                <div className="p-8 md:p-10 pl-10 md:pl-12 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-border">
                            <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">Solution</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-neon-emerald animate-pulse" />
                            <span className="text-[10px] font-bold text-neon-emerald uppercase tracking-wider">Verified_Result</span>
                            {h2Score !== undefined && (
                                <>
                                    <div className="w-[1px] h-3 bg-border mx-1" />
                                    <span className="text-[10px] font-bold text-muted-foreground tracking-wider">H2 SCORE:</span>
                                    <span className={`text-[10px] font-bold ${h2Score >= 0.8 ? 'text-neon-emerald' : 'text-orange-500'} font-mono`}>
                                        {h2Score.toFixed(2)}
                                    </span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => navigator.clipboard.writeText(output)}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-white/40 hover:text-white transition-all group/copy"
                        >
                            <Copy className="w-4 h-4 group-hover/copy:scale-110 transition-transform" />
                        </button>
                    </div>

                    <div className="max-w-none text-white/90 selection:bg-neon-emerald/20 selection:text-neon-emerald">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                // Headings
                                h1: ({ children }) => (
                                    <h1 className="text-[32px] font-extrabold text-foreground mt-12 mb-6 border-b border-border pb-4">
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children }) => (
                                    <h2 className="text-[24px] font-bold text-foreground mt-10 mb-5 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-neon-emerald rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children }) => (
                                    <h3 className="text-[20px] font-semibold text-foreground/90 mt-8 mb-4">
                                        {children}
                                    </h3>
                                ),
                                // Text
                                p: ({ children }) => (
                                    <p className="mb-5 leading-relaxed text-[16px] text-foreground/80">
                                        {children}
                                    </p>
                                ),
                                strong: ({ children }) => (
                                    <strong className="text-foreground font-bold">{children}</strong>
                                ),
                                em: ({ children }) => (
                                    <em className="text-neon-cyan/90 not-italic font-semibold">{children}</em>
                                ),
                                // Lists
                                ul: ({ children }) => (
                                    <ul className="space-y-3 mb-8 ml-2">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="space-y-3 mb-8 ml-2 list-decimal list-inside marker:text-neon-emerald marker:font-bold">{children}</ol>
                                ),
                                li: ({ children }) => (
                                    <li className="flex items-start gap-3 text-foreground/80 pl-4 py-3 border-l-2 border-border bg-secondary/20 rounded-r-2xl hover:bg-secondary/30 transition-colors group/li">
                                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-neon-emerald group-hover/li:scale-125 transition-transform flex-shrink-0 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                        <span className="leading-relaxed">{children}</span>
                                    </li>
                                ),
                                // Tables
                                table: ({ children }) => (
                                    <div className="overflow-x-auto my-10 rounded-[20px] border border-border shadow-2xl bg-card backdrop-blur-md">
                                        <table className="w-full text-sm text-left">{children}</table>
                                    </div>
                                ),
                                thead: ({ children }) => (
                                    <thead className="bg-secondary/50 text-muted-foreground uppercase font-bold text-[10px] tracking-widest border-b border-border">
                                        {children}
                                    </thead>
                                ),
                                th: ({ children }) => (
                                    <th className="px-6 py-5 whitespace-nowrap">{children}</th>
                                ),
                                tbody: ({ children }) => (
                                    <tbody className="divide-y divide-border">
                                        {children}
                                    </tbody>
                                ),
                                tr: ({ children }) => (
                                    <tr className="hover:bg-secondary/30 transition-colors">{children}</tr>
                                ),
                                td: ({ children }) => (
                                    <td className="px-6 py-5 text-foreground/80 leading-relaxed font-mono text-[13px]">{children}</td>
                                ),
                                // Code
                                code: ({ className, children, ...props }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isInline = !match && !String(children).includes('\n');

                                    if (isInline) {
                                        return (
                                            <code className="bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded-md font-mono text-[13px] border border-neon-cyan/20">
                                                {children}
                                            </code>
                                        );
                                    }

                                    return (
                                        <div className="relative group my-8">
                                            <div className="absolute top-0 right-0 px-4 py-1.5 bg-secondary rounded-bl-xl rounded-tr-xl text-[10px] font-bold font-mono text-muted-foreground border-l border-b border-border uppercase tracking-widest">
                                                {match?.[1] || 'text'}
                                            </div>
                                            <pre className="bg-background/80 border border-neon-cyan/10 rounded-2xl p-6 overflow-x-auto shadow-inner group-hover:border-neon-cyan/30 transition-colors">
                                                <code className={`font-mono text-[14px] text-foreground/90 leading-relaxed ${className}`} {...props}>
                                                    {children}
                                                </code>
                                            </pre>
                                        </div>
                                    );
                                },
                                blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-neon-cyan/50 pl-6 py-2 my-10 italic text-white/50 bg-neon-cyan/5 rounded-r-2xl font-medium">
                                        {children}
                                    </blockquote>
                                ),
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-white underline underline-offset-4 decoration-neon-cyan/30 hover:decoration-neon-cyan transition-all">
                                        {children}
                                    </a>
                                ),
                                hr: () => (
                                    <hr className="border-white/10 my-10" />
                                ),
                            }}
                        >
                            {output}
                        </ReactMarkdown>
                    </div>
                </div>
            </motion.div>
        </motion.section>
    );
};

