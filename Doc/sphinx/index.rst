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
.. image:: https://img.shields.io/badge/Version-0.2.0-green.svg

**AutoLogic** est un système d'agent IA avancé implémentant le Self-Discovery Reasoning Framework.
Il utilise une bibliothèque de 39 modules de raisonnement pour résoudre automatiquement des problèmes complexes.

Introduction
============

AutoLogic décompose les tâches complexes en 4 phases automatiques :

1. **SELECT** - Sélection des modules de raisonnement pertinents parmi 39 disponibles
2. **ADAPT** - Adaptation des modules au contexte spécifique de la tâche
3. **STRUCTURE** - Génération d'un plan de raisonnement ordonné
4. **EXECUTE** - Exécution du plan pour produire la solution finale

Fonctionnalités Clés
====================

Multi-Provider LLM
------------------

AutoLogic supporte 5 providers LLM :

* **OpenRouter** - Agrégateur multi-providers (OpenAI, Anthropic, Google, Meta)
* **OpenAI** - Accès direct à GPT-4, GPT-4o, GPT-3.5
* **Ollama** - Modèles locaux (Llama 3, Mistral, Phi-3)
* **vLLM** - Serveur haute performance pour modèles personnalisés
* **HuggingFace** - Inference API pour modèles open-source

Résilience Intégrée
-------------------

Le système inclut des mécanismes de résilience avancés :

* **Rate Limiting** - Token bucket configurable (défaut: 5 req/s)
* **Retry Automatique** - Backoff exponentiel sur erreurs 429/5xx
* **Fallback Intelligent** - Bascule automatique vers modèle alternatif

Interface Moderne
-----------------

* Design **Glassmorphism / Liquid Glass**
* Thème sombre par défaut
* Panneau de configuration avancée
* Animations fluides (Framer Motion)

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
   # Éditer .env avec votre clé API (au minimum OPENROUTER_API_KEY)

   # Lancer
   ./start.sh

Configuration Minimale
----------------------

Créez un fichier ``.env`` avec au minimum :

.. code-block:: bash

   OPENROUTER_API_KEY=sk-or-v1-votre-clé

Utilisation de l'API
--------------------

.. code-block:: bash

   curl -X POST http://localhost:8000/reason/full \
     -H "Content-Type: application/json" \
     -d '{"task": "Votre tâche ici"}'

Avec paramètres optionnels :

.. code-block:: bash

   curl -X POST http://localhost:8000/reason/full \
     -H "Content-Type: application/json" \
     -d '{
       "task": "Analyser les tendances de vente",
       "parameters": {
         "provider": "openrouter",
         "model": "google/gemini-2.0-flash-exp:free",
         "temperature": 0.7,
         "max_tokens": 4096
       }
     }'

Architecture
============

Backend
-------

Le backend est structuré en modules :

* **autologic/core/** - Moteur principal, providers LLM, résilience
* **autologic/routers/** - Endpoints FastAPI
* **autologic/utils/** - Logging, helpers

Modules Core
^^^^^^^^^^^^

* ``engine.py`` - Moteur AutoLogicEngine avec cycle Self-Discovery
* ``llm_provider.py`` - Implémentations des 5 providers LLM
* ``provider_factory.py`` - Factory pattern pour création dynamique
* ``model_registry.py`` - Registre centralisé des modèles
* ``resilience.py`` - Rate limiter, retry, fallback (Universel)
* ``models.py`` - Modèles Pydantic
* ``prompts.py`` - Templates de prompts

Endpoints API - Raisonnement
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

* ``POST /reason/full`` - Cycle complet Self-Discover
* ``GET /reason/modules`` - Liste des 39 modules de raisonnement

Endpoints API - Configuration
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

* ``GET /api/models`` - Liste providers et modèles
* ``GET/PUT /api/providers/config`` - Configuration active
* ``GET /api/providers/status`` - Status des providers
* ``GET /api/providers/{p}/models`` - Modèles d'un provider
* ``POST /api/providers/verify`` - Test de connexion
* ``GET/PUT /api/providers/{p}/resilience`` - Configuration résilience

Frontend
--------

Le frontend React utilise :

* **React 19** - Framework UI
* **Vite 7** - Build tool
* **TailwindCSS 4** - Styling
* **Framer Motion** - Animations

Composants principaux :

* ``AutoLogicInterface.tsx`` - Layout principal
* ``SettingsDrawer.tsx`` - Panneau de configuration
* ``Sidebar.tsx`` - Navigation latérale
* ``ThemeProvider.tsx`` - Gestion du thème

Configuration
=============

Fichier ``Config/global.yaml``
------------------------------

.. code-block:: yaml

   app:
     name: "AutoLogic"
     version: "0.2.0"

   llm:
     active_provider: "openrouter"
     active_model: "google/gemini-2.0-flash-exp:free"
     temperature: 0.7
     max_tokens: 4096
     timeout: 180
     
     resilience:
       rate_limit: 5.0
       retry_enabled: true
       max_retries: 3
       fallback_enabled: true

     providers:
       openrouter:
         enabled: true
       openai:
         enabled: true
       ollama:
         enabled: true
       vllm:
         enabled: false
       huggingface:
         enabled: true

Variables d'Environnement
-------------------------

* ``OPENROUTER_API_KEY`` - Clé API OpenRouter
* ``OPENAI_API_KEY`` - Clé API OpenAI
* ``OLLAMA_HOST`` - URL serveur Ollama (défaut: localhost:11434)
* ``HUGGINGFACE_API_KEY`` - Clé API HuggingFace
* ``LOG_LEVEL`` - Niveau de log (défaut: INFO)
* ``CORS_ORIGINS`` - Origines CORS autorisées

Modules de Raisonnement
=======================

AutoLogic dispose de 39 modules de raisonnement organisés par catégorie :

* **Analyse (8 modules)** - Critical Thinking, Root Cause Analysis...
* **Décomposition (6 modules)** - Task Decomposition, Chunking...
* **Créativité (5 modules)** - Brainstorming, Lateral Thinking...
* **Vérification (5 modules)** - Fact Checking, Consistency Check...
* **Synthèse (5 modules)** - Summarization, Integration...
* **Planification (5 modules)** - Goal Setting, Resource Allocation...
* **Autres (5 modules)** - Analogical Reasoning, Pattern Recognition...

Tests
=====

.. code-block:: bash

   # Activer l'environnement virtuel
   source .venv/bin/activate

   # Lancer tous les tests
   pytest Test/ -v

   # Avec couverture
   pytest Test/ --cov=autologic --cov-report=html

Indices et Tables
=================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

---

*Version 0.2.0 - Janvier 2025*
