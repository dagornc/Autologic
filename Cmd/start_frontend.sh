#!/bin/bash
# Script pour démarrer le frontend AutoLogic

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/Code/Frontend"

echo "🎨 Starting AutoLogic Frontend..."

cd "$FRONTEND_DIR" || exit 1

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Lancer vite
npm run dev
