#!/bin/bash
# Script pour démarrer le backend AutoLogic

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/Code/Backend/Phase2-Inference/01_Reasoning"
VENV_DIR="$PROJECT_ROOT/.venv"

echo "🚀 Starting AutoLogic Backend..."

# Activer l'environnement virtuel
source "$VENV_DIR/bin/activate"

cd "$BACKEND_DIR" || exit 1

# Lancer uvicorn
python3 -m uvicorn autologic.main:app --reload --host 0.0.0.0 --port 8000
