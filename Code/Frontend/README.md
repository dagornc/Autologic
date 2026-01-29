# AutoLogic Frontend

Interface utilisateur React pour le moteur de raisonnement AutoLogic.

## Stack Technique

| Technologie | Version | Description |
|-------------|---------|-------------|
| **React** | 19 | Framework UI |
| **Vite** | 7 | Build tool ultra-rapide |
| **TypeScript** | 5.7+ | Typage strict |
| **TailwindCSS** | 4 | Styling utilitaire |
| **Framer Motion** | - | Animations fluides |
| **Lucide React** | - | Icônes modernes |

## Design

L'interface utilise un design **Glassmorphism / Liquid Glass** moderne :

- Effets de transparence et flou (`backdrop-blur`)
- Thème sombre par défaut
- Bordures subtiles translucides
- Animations fluides
- Responsive (mobile/desktop)

## Structure

```
src/
├── components/         # Composants UI
│   ├── ui/                 # Composants atomiques (Button, Input...)
│   ├── AutoLogicInterface.tsx  # Layout principal
│   ├── SettingsDrawer.tsx      # Panneau de configuration
│   ├── Sidebar.tsx             # Navigation latérale
│   └── ThemeProvider.tsx       # Gestion du thème
├── contexts/           # Contextes React
│   └── ThemeContext.tsx
├── hooks/              # Custom hooks
│   ├── useAutoLogic.ts
│   └── useLocalStorage.ts
├── services/           # Appels API
│   └── api.ts
├── types/              # Types TypeScript
│   └── index.ts
├── App.tsx             # Composant racine
├── main.tsx            # Point d'entrée
└── index.css           # Styles globaux
```

## Fonctionnalités

### Interface Principale
- Saisie de tâches avec validation
- Affichage du plan de raisonnement
- Affichage de la solution formatée
- Indicateurs de chargement

### Panneau Settings
- Sélection du provider LLM (5 providers)
- Recherche de modèles avec filtrage
- Gestion des clés API (stockage sécurisé)
- Paramètres avancés (temperature, max_tokens, top_p)
- Configuration de résilience
- Test de connexion en temps réel

### Sidebar
- Navigation
- Historique des conversations (future)
- Toggle thème dark/light

## Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview
```

## Configuration ESLint

Le projet utilise ESLint avec des règles TypeScript strictes :

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

## API Client

Le service `api.ts` centralise tous les appels backend :

```typescript
const apiClient = {
  // Raisonnement
  solveTask(task: string, config?: LLMConfig): Promise<AutoLogicResult>,
  getModules(): Promise<ReasoningModule[]>,
  
  // Configuration
  getProvidersConfig(): Promise<ProviderConfig>,
  updateProvidersConfig(config: ProviderConfig): Promise<void>,
  
  // Providers
  getProvidersStatus(): Promise<ProviderStatus[]>,
  getProviderModels(provider: string, apiKey?: string): Promise<string[]>,
  verifyConnection(provider: string, apiKey?: string): Promise<boolean>,
  
  // Résilience
  getResilienceConfig(provider: string): Promise<ResilienceConfig>,
  updateResilienceConfig(provider: string, config: ResilienceConfig): Promise<void>,
};
```

## Types Principaux

```typescript
interface LLMConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

interface AutoLogicResult {
  task: string;
  plan: ReasoningPlan;
  final_output: string;
}

interface ResilienceConfig {
  rateLimit: number;
  retryEnabled: boolean;
  maxRetries: number;
  fallbackEnabled: boolean;
}
```

## Scripts NPM

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement (port 5173) |
| `npm run build` | Build de production |
| `npm run preview` | Preview du build |
| `npm run lint` | Vérification ESLint |

---

*Version 0.2.0 - Janvier 2025*
