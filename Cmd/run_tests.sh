#!/bin/bash
# Script pour exécuter les tests AutoLogic

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$PROJECT_ROOT/.venv"

echo "🧪 Running AutoLogic Tests..."

# Activer l'environnement virtuel
source "$VENV_DIR/bin/activate"

# Exécuter pytest avec couverture
cd "$PROJECT_ROOT" || exit 1

python3 -m pytest Test/ Code/Backend/Phase2-Inference/01_Reasoning/tests/ \
    --cov=Code/Backend \
    --cov-report=html:Doc/coverage \
    --cov-report=term-missing \
    -v

echo "✅ Tests terminés. Rapport de couverture: Doc/coverage/index.html"
