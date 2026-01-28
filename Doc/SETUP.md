# Guide d'Installation et de Démarrage

Ce guide vous accompagne pas-à-pas pour installer et lancer AutoLogic sur votre machine.

---

## Prérequis Système

| Logiciel | Version Minimale | Vérification |
|----------|------------------|--------------|
| **Python** | 3.9+ | `python3 --version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 8+ | `npm --version` |
| **Git** | 2.x | `git --version` |

---

## Installation

### 1. Cloner le Projet

```bash
git clone <url-du-repo>
cd AutoLogic
```

### 2. Configuration des Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```bash
touch .env
```

Ajoutez vos clés API :

```env
# === REQUIS ===
# Clé API OpenRouter (obtenez-la sur https://openrouter.ai/)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# === OPTIONNEL ===
# Niveau de logging (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO

# Origines CORS autorisées (séparées par virgule)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# === PROVIDERS ALTERNATIFS (optionnel) ===
# OLLAMA_BASE_URL=http://localhost:11434
# OPENAI_API_KEY=sk-xxx
# ANTHROPIC_API_KEY=sk-ant-xxx
```

### 3. Installation Backend (Python)

```bash
# Créer l'environnement virtuel
python3 -m venv .venv

# Activer l'environnement
source .venv/bin/activate  # Linux/macOS
# ou
.\.venv\Scripts\activate   # Windows

# Installer les dépendances
pip install -r requirements.txt
```

### 4. Installation Frontend (React)

```bash
cd Code/Frontend
npm install
cd ../..
```

---

## Lancement

### Option 1 : Script Automatique (Recommandé)

Le script `start.sh` automatise tout le processus :

```bash
./start.sh
```

Ce script :
1. ✅ Vérifie les prérequis (Python, Node, npm)
2. ✅ Crée/active l'environnement virtuel
3. ✅ Installe les dépendances manquantes
4. ✅ Démarre le Backend sur `http://localhost:8000`
5. ✅ Démarre le Frontend sur `http://localhost:5173`
6. ✅ Ouvre automatiquement le navigateur

Pour arrêter : `Ctrl+C`

### Option 2 : Lancement Manuel

**Terminal 1 - Backend :**
```bash
source .venv/bin/activate
cd Code/Backend/Phase2-Inference/01_Reasoning
uvicorn autologic.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend :**
```bash
cd Code/Frontend
npm run dev
```

Accédez à l'application : **http://localhost:5173**

---

## Vérification de l'Installation

### Test du Backend

```bash
# Health check
curl http://localhost:8000/health

# Réponse attendue :
# {"status":"healthy","version":"0.2.0","service":"AutoLogic Engine"}
```

### Test de l'API

```bash
curl -X POST http://localhost:8000/reason/full \
  -H "Content-Type: application/json" \
  -d '{"task": "Explique comment fonctionne le système solaire"}'
```

---

## Configuration Avancée

### Fichier `Config/global.yaml`

```yaml
app:
  name: "AutoLogic"
  version: "0.1.0"
  environment: "development"  # development | production
  debug: true

llm:
  default_provider: "openrouter"   # openrouter | ollama | openai
  default_model: "google/gemini-2.0-flash-exp:free"
  fallback_model: "openai/gpt-3.5-turbo"
  temperature: 0.7        # 0.0 = déterministe, 1.0 = créatif
  max_tokens: 4096

vector_store:
  provider: "chromadb"
  path: "./data/chroma"

logging:
  level: "INFO"
  file: "Log/backend_app.log"
```

### Changer de Provider LLM

**OpenRouter (défaut) :**
```env
OPENROUTER_API_KEY=sk-or-v1-xxx
```

**Ollama (local) :**
```env
OLLAMA_BASE_URL=http://localhost:11434
```
Dans `global.yaml` :
```yaml
llm:
  default_provider: "ollama"
  default_model: "llama3"
```

---

## Dépannage

### Le Backend ne démarre pas

1. Vérifiez que l'environnement virtuel est activé
2. Vérifiez que toutes les dépendances sont installées :
   ```bash
   pip install -r requirements.txt
   ```
3. Vérifiez le fichier `.env` et la clé API

### Erreur CORS

Ajoutez l'origine de votre frontend dans `.env` :
```env
CORS_ORIGINS=http://localhost:5173,http://votre-domaine.com
```

### Le Frontend affiche "Network Error"

1. Vérifiez que le Backend est bien lancé sur le port 8000
2. Vérifiez les logs : `cat Log/backend_app.log`

### Erreur "Module not found"

```bash
# Réinstallez les dépendances
pip install -r requirements.txt --force-reinstall
```

---

## Développement

### Lancer les tests

```bash
source .venv/bin/activate
pytest
```

### Vérifier la qualité du code

```bash
# Formatage
black .

# Linting
flake8

# Type checking
mypy .
```

### Générer la documentation Sphinx

```bash
cd Doc/sphinx
make html
# Ouvrir _build/html/index.html
```
