# Documentation des Tests

AutoLogic utilise **pytest** pour assurer la qualité et la robustesse du code backend.

---

## 🚀 Lancer les Tests

### Commande Rapide

Utilisez le script utilitaire fourni :

```bash
./Cmd/run_tests.sh
```

### Commande Manuelle

```bash
# Activer l'environnement virtuel
source .venv/bin/activate

# Lancer tous les tests
pytest

# Avec couverture de code (HTML Report)
pytest --cov=autologic --cov-report=html
```

---

## 📂 Structure des Tests (Repertoire `Test/`)

| Fichier | Description |
|---------|-------------|
| **`test_unit.py`** | Tests unitaires isolés (fonctions pures, logique métier) |
| **`test_provider_factory.py`** | Tests de la création dynamique de LLM (Pattern Factory) |
| **`test_resilience.py`** | Validation du Rate Limiter, Retry et Fallback |
| **`test_integration.py`** | Tests d'intégration (flux complet sans mock ou avec mock partiel) |
| **`conftest.py`** | Configuration Pytest, Fixtures partagées |
| **`verify_*.py`** | Scripts de vérification ad-hoc (connexion API, dynamic config) |

---

## 🛠️ Configuration des Tests

### Fixtures (`conftest.py`)

Nous utilisons des fixtures pour simuler (mock) les dépendances externes comme les APIs LLM, afin de ne pas consommer de crédits lors des tests unitaires.

### Variables d'Environnement

Pour les tests d'intégration réels (qui appellent vraiment les APIs), assurez-vous que votre fichier `.env` contient des clés valides.

---

## 🎯 Bonnes Pratiques

1. **Isolation** : Les tests unitaires ne doivent PAS faire d'appels réseau. Utilisez `unittest.mock` ou `respx`.
2. **Nommage** : `test_<module>_<fonctionnalité>.py`.
3. **Couverture** : Visez > 80% de couverture sur le code critique (`core/`, `routers/`).
