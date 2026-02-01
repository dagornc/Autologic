# Guide d'Installation et de Démarrage

Ce guide vous accompagne pas-à-pas pour installer, configurer et lancer AutoLogic.

---

## Prérequis Système

| Logiciel | Version Requise | Commande de Vérification |
|----------|-----------------|--------------------------|
| **Python** | 3.9+ | `python3 --version` |
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
1. ✅ Vérifier les prérequis
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
```

### Configuration Avancée (`Config/global.yaml`)

Pour une configuration fine des agents (Strategic, Worker, Audit) et de la résilience, privilégiez l'édition de `Config/global.yaml` ou passez par l'interface graphique (Settings Drawer).

```yaml
llm:
  # ...
  audit_provider: openrouter
  audit_model: qwen/qwen3-next-80b-a3b-instruct:free
  audit_temperature: 0.2
  audit_max_retries: 3
  
  worker_provider: openrouter
  worker_model: openrouter/auto
```

---

## Scripts Utilitaires

Le dossier `Cmd/` contient des scripts pour faciliter le développement :

| Script | Description | Usage |
|--------|-------------|-------|
| `start.sh` | **Recommandé**. Lance tout le système. | `./start.sh` |
| `Cmd/start_backend.sh` | Lance uniquement le backend. | `./Cmd/start_backend.sh` |
| `Cmd/start_frontend.sh` | Lance uniquement le frontend. | `./Cmd/start_frontend.sh` |
| `Cmd/run_tests.sh` | Exécute la suite de tests (pytest). | `./Cmd/run_tests.sh` |
| `Cmd/lint.sh` | Vérifie la qualité du code (black, flake8, mypy). | `./Cmd/lint.sh` |
| `Cmd/generate_docs.sh` | Génère la documentation Sphinx HTML. | `./Cmd/generate_docs.sh` |

---

## Dépannage

### Erreur "Module not found" (Python)
Assurez-vous que l'environnement virtuel est activé :
```bash
source .venv/bin/activate
```

### Timeout ou Erreur de Connexion LLM
Si vous utilisez un modèle gratuit ou lent, augmentez les paramètres de résilience dans `Config/global.yaml` ou passez par l'API de configuration :
- Augmentez `timeout`
- Activez `retry_enabled`

### Port déjà utilisé
Si le port 8000 ou 5173 est occupé :
1. Identifiez le processus : `lsof -i :8000`
2. Tuez-le : `kill -9 <PID>`
3. Ou modifiez les ports dans les scripts de lancement.
