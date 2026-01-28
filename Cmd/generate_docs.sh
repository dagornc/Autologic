#!/bin/bash
# Script pour générer la documentation Sphinx

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPHINX_DIR="$PROJECT_ROOT/Doc/sphinx"
VENV_DIR="$PROJECT_ROOT/.venv"

echo "📚 Generating Sphinx Documentation..."

# Activer l'environnement virtuel
source "$VENV_DIR/bin/activate"

cd "$SPHINX_DIR" || exit 1

# Nettoyer et rebuild
make clean
make html

echo "✅ Documentation générée: $SPHINX_DIR/_build/html/index.html"
