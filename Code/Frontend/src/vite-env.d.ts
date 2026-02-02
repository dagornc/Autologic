/// <reference types="vite/client" />

/**
 * Définition des types pour les variables d'environnement Vite.
 * Ces variables sont automatiquement chargées depuis les fichiers .env
 */
interface ImportMetaEnv {
    /**
     * URL de base de l'API backend.
     * @example "http://127.0.0.1:8000" (développement)
     * @example "https://api.autologic.com" (production)
     */
    readonly VITE_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
