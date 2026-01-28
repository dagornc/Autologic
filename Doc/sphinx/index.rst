.. AutoLogic documentation master file

==============================================
AutoLogic - Self-Discovery Reasoning Framework
==============================================

.. image:: https://img.shields.io/badge/Python-3.9+-blue.svg
   :target: https://python.org
.. image:: https://img.shields.io/badge/FastAPI-0.109+-009688.svg
   :target: https://fastapi.tiangolo.com
.. image:: https://img.shields.io/badge/React-19+-61DAFB.svg
   :target: https://react.dev

**AutoLogic** est un système d'agent IA avancé implémentant le Self-Discovery Reasoning Framework.
Il utilise une bibliothèque de 39 modules de raisonnement pour résoudre automatiquement des problèmes complexes.

Introduction
============

AutoLogic décompose les tâches complexes en 4 phases automatiques :

1. **SELECT** - Sélection des modules de raisonnement pertinents
2. **ADAPT** - Adaptation des modules au contexte spécifique
3. **STRUCTURE** - Génération d'un plan de raisonnement ordonné
4. **EXECUTE** - Exécution du plan pour produire la solution

Documents
=========

.. toctree::
   :maxdepth: 2
   :caption: Guide Utilisateur

   modules

.. toctree::
   :maxdepth: 2
   :caption: Référence API

   modules

Démarrage Rapide
================

Installation
------------

.. code-block:: bash

   # Cloner le projet
   git clone <url-du-repo>
   cd AutoLogic

   # Configurer les variables d'environnement
   cp .env.example .env
   # Éditer .env avec votre clé API

   # Lancer
   ./start.sh

Utilisation de l'API
--------------------

.. code-block:: bash

   curl -X POST http://localhost:8000/reason/full \
     -H "Content-Type: application/json" \
     -d '{"task": "Votre tâche ici"}'

Architecture
============

Le projet est structuré comme suit :

* **Backend** : FastAPI + LangChain pour le moteur de raisonnement
* **Frontend** : React + TailwindCSS avec design Glassmorphism
* **Configuration** : YAML centralisé dans ``Config/global.yaml``

Pour plus de détails, consultez le fichier ``ARCHITECTURE.md``.

Indices et Tables
=================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
