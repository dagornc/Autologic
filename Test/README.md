# Tests AutoLogic

Ce répertoire centralise les tests automatisés du projet.

## Structure

```
Test/
├── conftest.py          # Fixtures partagées pytest
├── test_integration.py  # Tests d'intégration
└── data/                # Données de test (mocks)
```

## Exécution

```bash
# Depuis la racine du projet
./Cmd/run_tests.sh

# Ou directement
pytest Test/ -v
```

## Convention

- Un fichier `test_<module>.py` par module testé
- Fixtures dans `conftest.py`
- Couverture minimum: 80%
