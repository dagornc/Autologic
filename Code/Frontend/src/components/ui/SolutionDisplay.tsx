/**
 * Apple-style Solution Display Component
 *
 * Clean markdown rendering with Apple HIG typography, H2 radial gauge,
 * and export buttons (Markdown / PDF).
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Copy, Check, FileText, FileDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { H2ScoreGauge } from './H2ScoreGauge';

interface SolutionDisplayProps {
    output: string;
    h2Score?: number;
}

const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 20 } },
};

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ output, h2Score }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = React.useState(false);
    const [exported, setExported] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportMd = () => {
        const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `autologic-solution-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setExported(true);
        setTimeout(() => setExported(false), 2000);
    };

    const handleExportPdf = () => {
        // Use window.print for PDF export (browser native)
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>AutoLogic Solution</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; padding: 40px; color: #1d1d1f; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                        h1 { font-size: 28px; border-bottom: 1px solid #d2d2d7; padding-bottom: 12px; }
                        h2 { font-size: 22px; color: #1d1d1f; margin-top: 24px; }
                        h3 { font-size: 18px; }
                        code { background: #f5f5f7; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
                        pre { background: #f5f5f7; padding: 16px; border-radius: 12px; overflow-x: auto; }
                        pre code { background: none; padding: 0; }
                        blockquote { border-left: 3px solid #007aff; padding-left: 16px; color: #86868b; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #d2d2d7; padding: 8px 12px; text-align: left; }
                        th { background: #f5f5f7; }
                    </style>
                </head>
                <body>
                    <h1>AutoLogic Solution</h1>
                    ${document.querySelector('.solution-markdown-content')?.innerHTML || output}
                    ${h2Score !== undefined ? `<p style="color: #86868b; margin-top: 24px;">H2 Quality Score: ${(h2Score * 10).toFixed(1)} / 10</p>` : ''}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <motion.section variants={itemVariants} className="space-y-6 pb-20">
            {/* Section Header */}
            <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-apple-green/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-apple-green" />
                </div>
                <div>
                    <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                        {t('solution.title')}
                    </h2>
                    <p className="text-muted-foreground text-[14px]">
                        {t('solution.subtitle')}
                    </p>
                </div>
            </div>

            {/* H2 Score Gauge + Solution Card layout */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Score Gauge (sidebar on desktop) */}
                {h2Score !== undefined && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex-shrink-0 self-center md:self-start"
                    >
                        <div className="p-5 rounded-2xl bg-card border border-border shadow-apple-md">
                            <H2ScoreGauge score={h2Score} size={130} />
                        </div>
                    </motion.div>
                )}

                {/* Solution Card */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-apple-green/20 transition-all duration-300 shadow-apple-md"
                >
                    {/* Left Accent Bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-apple-green via-apple-green/50 to-transparent" />

                    <div className="p-6 md:p-8 pl-8 md:pl-10 space-y-5">
                        {/* Status + Actions Bar */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('solution.title')}</span>
                                <div className="w-1 h-1 rounded-full bg-apple-green" />
                                <span className="text-[11px] font-semibold text-apple-green uppercase tracking-wider">✓</span>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 text-[12px] font-medium min-h-[36px]"
                                    title={t('solution.copy')}
                                >
                                    {copied ? (
                                        <><Check className="w-3.5 h-3.5 text-apple-green" /><span className="text-apple-green">{t('solution.copied')}</span></>
                                    ) : (
                                        <><Copy className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t('solution.copy')}</span></>
                                    )}
                                </button>
                                <button
                                    onClick={handleExportMd}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 text-[12px] font-medium min-h-[36px]"
                                    title={t('solution.exportMd')}
                                >
                                    {exported ? (
                                        <><Check className="w-3.5 h-3.5 text-apple-green" /><span className="text-apple-green">{t('solution.exported')}</span></>
                                    ) : (
                                        <><FileText className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t('solution.exportMd')}</span></>
                                    )}
                                </button>
                                <button
                                    onClick={handleExportPdf}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 text-[12px] font-medium min-h-[36px]"
                                    title={t('solution.exportPdf')}
                                >
                                    <FileDown className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{t('solution.exportPdf')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Markdown Content */}
                        <div className="solution-markdown-content max-w-none text-foreground/90">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    h1: ({ children }) => (
                                        <h1 className="text-[28px] font-bold text-foreground mt-10 mb-5 border-b border-border pb-4">
                                            {children}
                                        </h1>
                                    ),
                                    h2: ({ children }) => (
                                        <h2 className="text-[22px] font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                                            <div className="w-1 h-5 bg-primary rounded-full" />
                                            {children}
                                        </h2>
                                    ),
                                    h3: ({ children }) => (
                                        <h3 className="text-[18px] font-semibold text-foreground mt-6 mb-3">
                                            {children}
                                        </h3>
                                    ),
                                    p: ({ children }) => (
                                        <p className="mb-4 leading-relaxed text-[16px] text-foreground/80">
                                            {children}
                                        </p>
                                    ),
                                    strong: ({ children }) => (
                                        <strong className="text-foreground font-semibold">{children}</strong>
                                    ),
                                    em: ({ children }) => (
                                        <em className="text-primary italic">{children}</em>
                                    ),
                                    ul: ({ children }) => (
                                        <ul className="space-y-2 mb-6 ml-1">{children}</ul>
                                    ),
                                    ol: ({ children }) => (
                                        <ol className="space-y-2 mb-6 ml-1 list-decimal list-inside marker:text-primary marker:font-semibold">{children}</ol>
                                    ),
                                    li: ({ children }) => (
                                        <li className="flex items-start gap-2.5 text-foreground/80 py-2 pl-3 border-l-2 border-border rounded-r-lg hover:bg-muted/20 transition-colors">
                                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                            <span className="leading-relaxed text-[15px]">{children}</span>
                                        </li>
                                    ),
                                    table: ({ children }) => (
                                        <div className="overflow-x-auto my-8 rounded-xl border border-border shadow-apple-sm bg-card">
                                            <table className="w-full text-sm text-left">{children}</table>
                                        </div>
                                    ),
                                    thead: ({ children }) => (
                                        <thead className="bg-muted/50 text-muted-foreground font-semibold text-[12px] uppercase tracking-wider border-b border-border">
                                            {children}
                                        </thead>
                                    ),
                                    th: ({ children }) => (
                                        <th className="px-5 py-4 whitespace-nowrap">{children}</th>
                                    ),
                                    tbody: ({ children }) => (
                                        <tbody className="divide-y divide-border">
                                            {children}
                                        </tbody>
                                    ),
                                    tr: ({ children }) => (
                                        <tr className="hover:bg-muted/20 transition-colors">{children}</tr>
                                    ),
                                    td: ({ children }) => (
                                        <td className="px-5 py-4 text-foreground/80 leading-relaxed font-mono text-[13px]">{children}</td>
                                    ),
                                    code: ({ className, children, ...props }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const isInline = !match && !String(children).includes('\n');

                                        if (isInline) {
                                            return (
                                                <code className="bg-primary/8 text-primary px-1.5 py-0.5 rounded-md font-mono text-[13px]">
                                                    {children}
                                                </code>
                                            );
                                        }

                                        return (
                                            <div className="relative group my-6">
                                                <div className="absolute top-0 right-0 px-3 py-1 bg-muted rounded-bl-lg rounded-tr-xl text-[11px] font-medium font-mono text-muted-foreground border-l border-b border-border uppercase tracking-wider">
                                                    {match?.[1] || 'text'}
                                                </div>
                                                <pre className="bg-muted/40 border border-border rounded-xl p-5 overflow-x-auto">
                                                    <code className={`font-mono text-[14px] text-foreground/85 leading-relaxed ${className}`} {...props}>
                                                        {children}
                                                    </code>
                                                </pre>
                                            </div>
                                        );
                                    },
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-3 border-primary/40 pl-5 py-2 my-8 text-foreground/60 bg-primary/4 rounded-r-xl">
                                            {children}
                                        </blockquote>
                                    ),
                                    a: ({ href, children }) => (
                                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/30 hover:decoration-primary/60 transition-all">
                                            {children}
                                        </a>
                                    ),
                                    hr: () => (
                                        <hr className="border-border my-8" />
                                    ),
                                }}
                            >
                                {output}
                            </ReactMarkdown>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.section>
    );
};
