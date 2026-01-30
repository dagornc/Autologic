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
}

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ output }) => {
    return (
        <motion.section variants={itemVariants} className="space-y-8 pb-32">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
                        Final Solution
                    </h2>
                    <p className="text-black dark:text-slate-400 text-sm">
                        Generated output based on the reasoning chain
                    </p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-2xl glass border border-white/5 hover:bg-white/10 transition-colors"
            >
                {/* Decoration Gradient Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-green-600 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div className="p-6 pl-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-black dark:text-slate-500 font-mono bg-black/5 dark:bg-black/20 px-3 py-1 rounded-full border border-black/5 dark:border-white/5">
                            <span className="uppercase opacity-50">OUTPUT</span>
                            <span className="text-black dark:text-emerald-300">FINAL_RESULT</span>
                        </div>
                        <button className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-w-none text-black dark:text-slate-300">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                // Headings
                                h1: ({ children }) => (
                                    <h1 className="text-3xl font-bold text-black dark:text-white mt-8 mb-4 border-b border-black/10 dark:border-white/10 pb-2">
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children }) => (
                                    <h2 className="text-2xl font-semibold text-black dark:text-emerald-100 mt-8 mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children }) => (
                                    <h3 className="text-xl font-medium text-black dark:text-emerald-200 mt-6 mb-3">
                                        {children}
                                    </h3>
                                ),
                                // Text
                                p: ({ children }) => (
                                    <p className="mb-4 leading-relaxed text-black dark:text-slate-300">
                                        {children}
                                    </p>
                                ),
                                strong: ({ children }) => (
                                    <strong className="text-black dark:text-white font-semibold">{children}</strong>
                                ),
                                em: ({ children }) => (
                                    <em className="text-black dark:text-indigo-200 not-italic font-medium">{children}</em>
                                ),
                                // Lists
                                ul: ({ children }) => (
                                    <ul className="space-y-2 mb-6 ml-1">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="space-y-2 mb-6 ml-1 list-decimal list-inside marker:text-emerald-500">{children}</ol>
                                ),
                                li: ({ children }) => (
                                    <li className="flex items-start gap-2 text-black dark:text-slate-300 pl-2 border-l-2 border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 rounded-r-lg p-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                        <span>{children}</span>
                                    </li>
                                ),
                                // Tables
                                table: ({ children }) => (
                                    <div className="overflow-x-auto my-8 rounded-xl border border-white/10 shadow-lg">
                                        <table className="w-full text-sm text-left">{children}</table>
                                    </div>
                                ),
                                thead: ({ children }) => (
                                    <thead className="bg-white/10 text-white uppercase font-semibold">
                                        {children}
                                    </thead>
                                ),
                                th: ({ children }) => (
                                    <th className="px-6 py-4 whitespace-nowrap">{children}</th>
                                ),
                                tbody: ({ children }) => (
                                    <tbody className="divide-y divide-white/5 bg-white/5">
                                        {children}
                                    </tbody>
                                ),
                                tr: ({ children }) => (
                                    <tr className="hover:bg-white/5 transition-colors">{children}</tr>
                                ),
                                td: ({ children }) => (
                                    <td className="px-6 py-4 whitespace-pre-wrap">{children}</td>
                                ),
                                // Code
                                code: ({ className, children, ...props }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isInline = !match && !String(children).includes('\n');

                                    if (isInline) {
                                        return (
                                            <code className="bg-indigo-500/10 dark:bg-indigo-500/20 text-black dark:text-indigo-200 px-1.5 py-0.5 rounded font-mono text-sm border border-indigo-500/20 dark:border-indigo-500/30">
                                                {children}
                                            </code>
                                        );
                                    }

                                    return (
                                        <div className="relative group my-6">
                                            <div className="absolute top-0 right-0 px-3 py-1 bg-white/10 rounded-bl-lg rounded-tr-lg text-xs font-mono text-slate-400 border-l border-b border-white/10">
                                                {match?.[1] || 'text'}
                                            </div>
                                            <pre className="bg-[#0a0a0f] border border-white/10 rounded-lg p-4 overflow-x-auto">
                                                <code className={`font-mono text-sm text-slate-300 ${className}`} {...props}>
                                                    {children}
                                                </code>
                                            </pre>
                                        </div>
                                    );
                                },
                                blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-6 italic text-black dark:text-slate-400 bg-black/5 dark:bg-indigo-500/5 rounded-r-lg">
                                        {children}
                                    </blockquote>
                                ),
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-400/30 hover:decoration-emerald-400 transition-all">
                                        {children}
                                    </a>
                                ),
                                hr: () => (
                                    <hr className="border-black/10 dark:border-white/10 my-8" />
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
