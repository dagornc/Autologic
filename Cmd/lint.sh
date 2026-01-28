#!/bin/bash
# Script de linting et vérification qualité du code

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$PROJECT_ROOT/.venv"

echo "🔍 Running Code Quality Checks..."

# Activer l'environnement virtuel
source "$VENV_DIR/bin/activate"

cd "$PROJECT_ROOT" || exit 1

echo "--- Black (Formatting) ---"
python3 -m black --check Code/Backend/

echo "--- Flake8 (Linting) ---"
python3 -m flake8 Code/Backend/ --max-line-length=120

echo "--- MyPy (Type Checking) ---"
python3 -m mypy Code/Backend/ --ignore-missing-imports

echo "✅ Quality checks terminés."
