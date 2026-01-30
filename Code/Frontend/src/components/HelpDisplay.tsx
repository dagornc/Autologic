/**
 * Composant d'affichage de l'aide (README.md) - Premium Layout
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Book, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface HelpDisplayProps {
    isVisible: boolean;
}

const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const HelpDisplay: React.FC<HelpDisplayProps> = ({ isVisible }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isVisible && !content) {
            fetchReadme();
        }
    }, [isVisible]);

    const fetchReadme = async () => {
        setLoading(true);
        setError(null);
        try {
            // Utiliser une URL relative si possible ou configurable, ici on garde localhost pour le dev
            const response = await fetch('http://localhost:8000/api/help/readme');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setContent(data.content);
        } catch (err) {
            console.error("Erreur fetchReadme:", err);
            setError(err instanceof Error ? err.message : "Impossible de charger le fichier d'aide.");
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-32 h-full overflow-y-auto custom-scrollbar pr-4 py-4"
        >
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <Book className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                        Documentation
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Guide d'utilisation et informations sur le projet
                    </p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-2xl glass-panel border border-border hover:border-indigo-500/30 transition-colors"
            >
                {/* Decoration Gradient Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div className="p-8 md:p-10">
                    {loading ? (
                        <div className="flex items-center justify-center p-12 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="ml-3">Chargement de la documentation...</span>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center p-12 text-red-400">
                            <AlertCircle className="w-6 h-6 mr-2" />
                            {error}
                        </div>
                    ) : (
                        <article className="prose prose-invert prose-indigo max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-code:text-indigo-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                            >
                                {content}
                            </ReactMarkdown>
                        </article>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
