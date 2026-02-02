#!/bin/bash
# Script pour générer la documentation Sphinx complète
# Version: 0.3.0

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPHINX_DIR="$PROJECT_ROOT/Doc/sphinx"
VENV_DIR="$PROJECT_ROOT/.venv"
BACKEND_DIR="$PROJECT_ROOT/Code/Backend/Phase2-Inference/01_Reasoning"

echo "📚 AutoLogic - Génération de la Documentation Sphinx"
echo "======================================================"

# Vérifier l'environnement virtuel
if [ ! -d "$VENV_DIR" ]; then
    echo "❌ Environnement virtuel non trouvé. Créez-le d'abord avec: python3 -m venv .venv"
    exit 1
fi

# Activer l'environnement virtuel
echo "🔧 Activation de l'environnement virtuel..."
source "$VENV_DIR/bin/activate"

# Vérifier et installer les dépendances Sphinx
echo "📦 Vérification des dépendances Sphinx..."
pip install --quiet sphinx sphinx-rtd-theme 2>/dev/null || true

# Mettre à jour PYTHONPATH pour inclure le code source
export PYTHONPATH="$BACKEND_DIR:$PYTHONPATH"

cd "$SPHINX_DIR" || exit 1

# Nettoyer les builds précédents
echo "🧹 Nettoyage des builds précédents..."
make clean 2>/dev/null || rm -rf _build

# Générer la documentation HTML
echo "🔨 Génération de la documentation HTML..."
make html 2>&1 | grep -v "WARNING" || true

# Vérifier le succès
if [ -f "$SPHINX_DIR/_build/html/index.html" ]; then
    echo ""
    echo "✅ Documentation générée avec succès!"
    echo "📂 Chemin: $SPHINX_DIR/_build/html/index.html"
    echo ""
    
    # Ouvrir automatiquement sur macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        read -p "🌐 Ouvrir dans le navigateur? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$SPHINX_DIR/_build/html/index.html"
        fi
    else
        echo "💡 Pour visualiser: xdg-open $SPHINX_DIR/_build/html/index.html"
    fi
else
    echo "❌ Échec de la génération. Vérifiez les erreurs ci-dessus."
    exit 1
fi
