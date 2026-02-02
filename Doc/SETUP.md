# Guide d'Installation et de Démarrage

Ce guide vous accompagne pas-à-pas pour installer, configurer et lancer AutoLogic.

---

## Prérequis Système

| Logiciel | Version Requise | Commande de Vérification |
|----------|-----------------|--------------------------| 
| **Python** | 3.11+ | `python3 --version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 8+ | `npm --version` |
| **Git** | 2.x | `git --version` |

---

## Installation Rapide (Recommandé)

Le projet inclut un script d'orchestration `start.sh` qui gère l'installation des dépendances et le lancement des services.

### 1. Cloner le Projet

```bash
git clone <url-du-repo>
cd AutoLogic
```

### 2. Configuration Rapide

```bash
# Copier le template de configuration
cp .env.example .env

# Éditer le fichier pour ajouter votre clé API (ex: OpenRouter)
nano .env
```

### 3. Lancement

```bash
./start.sh
```

Ce script va automatiquement :
1. ✅ Vérifier les prérequis (Python 3.11+, Node.js 18+)
2. ✅ Créer l'environnement virtuel Python (`.venv`)
3. ✅ Installer les dépendances Backend (`requirements.txt`) et Frontend (`package.json`)
4. ✅ Lancer le Backend (Port 8000) et le Frontend (Port 5173)
5. ✅ Ouvrir votre navigateur sur `http://localhost:5173`

---

## Installation Manuelle

Si vous préférez installer les composants séparément :

### 1. Backend (Python)

```bash
# Création de l'environnement virtuel
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .\.venv\Scripts\activate  # Windows

# Installation des dépendances
pip install -r requirements.txt

# Lancement du serveur API
./Cmd/start_backend.sh
# Ou manuellement :
# cd Code/Backend/Phase2-Inference/01_Reasoning
# uvicorn autologic.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (React/Vite)

```bash
cd Code/Frontend

# Installation
npm install

# Lancement
npm run dev
# Le frontend sera accessible sur http://localhost:5173
```

---

## Configuration Détaillée (.env)

Le fichier `.env` configure les clés API, les providers LLM et les paramètres système.

### Providers LLM

#### OpenRouter (Recommandé)
```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

#### OpenAI
```env
OPENAI_API_KEY=sk-xxxxx
```

#### HuggingFace
```env
HUGGINGFACE_API_KEY=hf_xxxxx
```

#### Locaux (Ollama / vLLM)
```env
OLLAMA_HOST=http://localhost:11434
VLLM_HOST=http://localhost:8000
```

### Paramètres Système

```env
# Niveau de log (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO

# Sécurité API
SECRET_KEY=votre_cle_secrete_ici
ALGORITHM=HS256

# CORS (séparés par virgules)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Configuration Avancée (`Config/global.yaml`)

Pour une configuration fine des agents (Strategic, Worker, Audit) et de la résilience, éditez `Config/global.yaml` ou passez par l'interface graphique (Settings Dialog).

```yaml
app:
  name: AutoLogic
  version: 0.3.0
  environment: development

llm:
  # Agent Strategic (Root) - Planification
  active_provider: openrouter
  active_model: google/gemini-2.0-flash-001
  temperature: 0.5
  max_tokens: 2048
  timeout: 60
  
  # Agent Worker - Exécution
  worker_provider: openrouter
  worker_model: openrouter/auto
  
  # Agent Audit - Validation
  audit_provider: openrouter
  audit_model: qwen/qwen3-80b-a3b-instruct:free
  audit_temperature: 0.2
  audit_max_retries: 3
  
  # Résilience universelle
  resilience:
    rate_limit: 15.0         # requêtes/seconde
    retry_enabled: true
    max_retries: 3
    retry_base_delay: 2.0    # secondes
    fallback_enabled: true
    
  # Filtre modèles gratuits
  free_only: true
```

---

## Scripts Utilitaires

Le dossier `Cmd/` contient des scripts pour faciliter le développement :

| Script | Description | Usage |
|--------|-------------|-------|
| `start.sh` | **Recommandé**. Lance tout le système. | `./start.sh` |
| `Cmd/start_backend.sh` | Lance uniquement le backend FastAPI. | `./Cmd/start_backend.sh` |
| `Cmd/start_frontend.sh` | Lance uniquement le frontend React/Vite. | `./Cmd/start_frontend.sh` |
| `Cmd/run_tests.sh` | Exécute la suite de tests (pytest). | `./Cmd/run_tests.sh` |
| `Cmd/lint.sh` | Vérifie la qualité du code (black, flake8, mypy). | `./Cmd/lint.sh` |
| `Cmd/generate_docs.sh` | Génère la documentation Sphinx HTML. | `./Cmd/generate_docs.sh` |

---

## Vérification de l'Installation

### 1. Tester le Backend

```bash
# Vérifier que le backend répond
curl http://localhost:8000/health

# Réponse attendue:
# {"status":"healthy","version":"0.3.0","providers":{...}}
```

### 2. Tester les Providers LLM

```bash
# Vérifier la connexion OpenRouter
curl -X POST http://localhost:8000/api/providers/verify \
  -H "Content-Type: application/json" \
  -d '{"provider": "openrouter"}'
```

### 3. Tester le Cycle de Raisonnement

```bash
curl -X POST http://localhost:8000/reason/full \
  -H "Content-Type: application/json" \
  -d '{"task": "Quel est le sens de la vie?"}'
```

---

## Dépannage

### Erreur "Module not found" (Python)

Assurez-vous que l'environnement virtuel est activé :
```bash
source .venv/bin/activate
```

Vérifiez que vous êtes dans le bon répertoire pour uvicorn :
```bash
cd Code/Backend/Phase2-Inference/01_Reasoning
python -c "import autologic; print('OK')"
```

### Timeout ou Erreur de Connexion LLM

1. **Vérifiez votre clé API** dans `.env`
2. **Augmentez les paramètres de résilience** dans `Config/global.yaml` :
   - Augmentez `timeout` (ex: 120 secondes)
   - Activez `retry_enabled: true`
   - Augmentez `max_retries: 5`

3. **Utilisez un modèle gratuit** pour les tests :
   ```yaml
   llm:
     active_model: "google/gemini-2.0-flash-exp:free"
     free_only: true
   ```

### Erreur "Data Policy" OpenRouter

Si vous obtenez une erreur 404 "data policy", vous devez configurer vos paramètres de confidentialité sur OpenRouter :
1. Connectez-vous à [openrouter.ai](https://openrouter.ai)
2. Allez dans Settings > Privacy
3. Autorisez "Allow training on my data" pour les modèles gratuits

### Port déjà utilisé

Si le port 8000 ou 5173 est occupé :
1. Identifiez le processus : `lsof -i :8000`
2. Tuez-le : `kill -9 <PID>`
3. Ou modifiez les ports dans les scripts de lancement

### Erreur Frontend "Cannot find module"

```bash
cd Code/Frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Génération de la Documentation

```bash
# Activer l'environnement virtuel
source .venv/bin/activate

# Installer les dépendances sphinx
pip install sphinx sphinx-rtd-theme

# Générer la documentation
./Cmd/generate_docs.sh

# Ou manuellement :
cd Doc/sphinx
make html

# Ouvrir dans le navigateur
open _build/html/index.html  # macOS
# xdg-open _build/html/index.html  # Linux
```

---

## Structure des Logs

Les logs sont stockés dans `Log/` :

| Fichier | Contenu |
|---------|---------|
| `backend_app.log` | Logs du serveur FastAPI |
| `autologic.log` | Logs du moteur de raisonnement |

Configurez le niveau de log dans `.env` :
```env
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR
```

---

*Documentation mise à jour - Version 0.3.0 - Février 2026*
