.. AutoLogic documentation master file

==============================================
AutoLogic - Self-Discovery Reasoning Framework
==============================================

.. image:: https://img.shields.io/badge/Python-3.11+-blue.svg
   :target: https://python.org
.. image:: https://img.shields.io/badge/FastAPI-0.109+-009688.svg
   :target: https://fastapi.tiangolo.com
.. image:: https://img.shields.io/badge/React-19+-61DAFB.svg
   :target: https://react.dev
.. image:: https://img.shields.io/badge/TailwindCSS-4-38B2AC.svg
   :target: https://tailwindcss.com
.. image:: https://img.shields.io/badge/Version-0.3.0-green.svg

**AutoLogic** est un moteur d'inférence cognitif avancé implémentant le Self-Discovery Reasoning Framework.
Il utilise une bibliothèque de **106 modules de raisonnement** pour résoudre automatiquement des problèmes complexes
via un cycle cognitif en 8 étapes et une architecture à triple agent.

Introduction
============

AutoLogic n'est pas un simple chatbot. C'est un **moteur de raisonnement autonome** conçu pour simuler 
un raisonnement humain de haut niveau.

Le système décompose les tâches complexes en **8 phases automatiques** :

1. **ANALYZE** (Phase 0) - Analyse l'intention utilisateur et extrait les contraintes
2. **SELECT** (Phase 1) - Sélection des modules pertinents parmi les 106 disponibles
3. **ADAPT** (Phase 2) - Adaptation des modules au contexte spécifique de la tâche
4. **STRUCTURE** (Phase 3) - Génération d'un plan de raisonnement ordonné
5. **VERIFY** (Phase 4) - Vérification logique du plan
6. **EXECUTE** (Phase 5) - Exécution du plan (Worker LLM)
7. **CRITIC** (Phase 6) - Évaluation critique avec validation H2 et Double-Backtrack
8. **SYNTHESIS/AUDIT** (Phase 7) - Synthèse finale avec boucle d'audit itérative

Fonctionnalités Clés
====================

Architecture Triple Agent
-------------------------

AutoLogic orchestre dynamiquement **3 agents spécialisés** :

* **Strategic Agent (Root)** - Planification et orchestration haut niveau
* **Worker Agent** - Exécution des étapes avec accès au contexte RAG
* **Audit Agent** - Validation et contrôle qualité des résultats

Utilisation des LLM par Phase
-----------------------------

Chaque phase du cycle Self-Discovery utilise un LLM spécifique :

.. list-table:: Mapping LLM par Phase
   :widths: 10 20 15 55
   :header-rows: 1

   * - Phase
     - Nom
     - LLM
     - Description
   * - 0
     - ANALYZE
     - 🧠 Root
     - Analyse intention utilisateur, extraction contraintes
   * - 1
     - SELECT
     - 🧠 Root
     - Sélection des modules parmi 106 disponibles
   * - 2
     - ADAPT
     - 🧠 Root
     - Adaptation des descriptions au contexte
   * - 3
     - STRUCTURE
     - 🧠 Root
     - Génération du plan d'exécution étape par étape
   * - 4
     - VERIFY
     - 🧠 Root
     - Vérification logique et cohérence du plan
   * - 5
     - EXECUTE
     - 🔨 Worker
     - Exécution avec accès RAG/contexte
   * - 6
     - CRITIC (H2)
     - 🧠 Root
     - Évaluation qualité (score < 0.8 → Double-Backtrack)
   * - 7
     - SYNTHESIS
     - 🧠 Root
     - Compilation finale, formatage réponse
   * - 7.5
     - AUDIT
     - ⚖️ Audit
     - Boucle d'audit itérative time-boxed
   * - 3b
     - RESTRUCTURE
     - 🧠 Root
     - Re-planification (Double-Backtrack depuis H2)

.. note::
   Le **CriticAgent** (Phase 6) utilise le modèle Root car il est initialisé dans le 
   constructeur de ``AutoLogicEngine`` avec ``CriticAgent(root_model)``. Cela garantit 
   une évaluation de haute qualité avant validation.

Récapitulatif par Modèle
^^^^^^^^^^^^^^^^^^^^^^^^

* **Root (Strategic)** : Phases 0, 1, 2, 3, 3b, 4, 6, 7 - Modèle puissant (GPT-4, Gemini Pro)
* **Worker (Execution)** : Phase 5 uniquement - Modèle rapide et économique (GPT-4o-mini, Llama 3)
* **Audit (Validation)** : Phase 7.5 uniquement - Modèle économique ou gratuit

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

* **Rate Limiting** - Token bucket configurable (défaut: 15 req/s)
* **Retry Automatique** - Backoff exponentiel sur erreurs 429/5xx
* **Fallback Intelligent** - Bascule automatique vers modèle alternatif
* **Timeout Adaptatif** - Gestion fine des délais par provider

Interface Moderne
-----------------

* Design **Glassmorphism / Liquid Glass** (2025)
* Thème sombre/clair adaptatif
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

Architecture Backend
--------------------

Le backend est structuré en modules sous ``autologic/`` :

Modules Core
^^^^^^^^^^^^

* ``engine.py`` - Moteur AutoLogicEngine avec cycle Self-Discovery 8 phases
* ``llm_provider.py`` - Implémentations des 5 providers LLM
* ``provider_factory.py`` - Factory pattern pour création dynamique
* ``model_registry.py`` - Registre centralisé des modèles et configurations
* ``resilience.py`` - Rate limiter, retry, fallback (architecture universelle)
* ``models.py`` - Modèles Pydantic (ReasoningModule, AdaptedModule, etc.)
* ``prompts.py`` - Templates de prompts pour chaque phase
* ``critic.py`` - Agent Critic pour validation H2

Routers FastAPI
^^^^^^^^^^^^^^^

* ``reasoning.py`` - Endpoints de raisonnement (``/reason/*``)
* ``models.py`` - Endpoints de configuration (``/api/*``)
* ``history.py`` - Gestion de l'historique des sessions
* ``prompts.py`` - Endpoints pour templates de prompts

Endpoints API - Raisonnement
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

* ``POST /reason/full`` - Cycle complet Self-Discover (synchrone)
* ``POST /reason/full/stream`` - Cycle complet avec progression SSE
* ``GET /reason/modules`` - Liste des 106 modules de raisonnement

Endpoints API - Configuration
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

* ``GET /api/models`` - Liste providers et modèles disponibles
* ``GET/PUT /api/providers/config`` - Configuration active (Root, Worker, Audit)
* ``GET /api/providers/status`` - Status des providers
* ``GET /api/providers/{p}/models`` - Modèles d'un provider
* ``POST /api/providers/verify`` - Test de connexion API Key
* ``GET/PUT /api/providers/{p}/resilience`` - Configuration résilience

Endpoints API - Système
^^^^^^^^^^^^^^^^^^^^^^^

* ``GET /health`` - Status détaillé du service
* ``GET /`` - Page d'accueil API

Architecture Frontend
---------------------

Le frontend React utilise :

* **React 19** - Framework UI
* **Vite 7** - Build tool
* **TailwindCSS 4** - Styling atomique
* **Framer Motion** - Animations
* **TypeScript 5.9** - Typage statique

Composants principaux :

* ``AutoLogicInterface.tsx`` - Layout principal
* ``SettingsDialog.tsx`` - Panneau de configuration complet
* ``FlowVisualization.tsx`` - Visualisation du flux 8 phases
* ``Sidebar.tsx`` - Navigation latérale
* ``ThemeProvider.tsx`` - Gestion du thème dark/light

Configuration
=============

Fichier ``Config/global.yaml``
------------------------------

.. code-block:: yaml

   app:
     name: "AutoLogic"
     version: "0.3.0"
     environment: "development"

   llm:
     active_provider: "openrouter"
     active_model: "google/gemini-2.0-flash-001"
     temperature: 0.5
     max_tokens: 2048
     timeout: 60
     
     resilience:
       rate_limit: 15.0
       retry_enabled: true
       max_retries: 3
       retry_base_delay: 2.0
       fallback_enabled: true

     providers:
       openrouter:
         enabled: true
         base_url: "https://openrouter.ai/api/v1"
       openai:
         enabled: true
       ollama:
         enabled: true
         auto_detect_models: true
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

Les 106 Modules de Raisonnement
===============================

AutoLogic dispose de **106 modules cognitifs** organisés en 15 catégories :

Catégories Principales
----------------------

.. list-table:: Modules de Raisonnement
   :widths: 20 50 30
   :header-rows: 1

   * - Catégorie
     - Description
     - Exemples
   * - **Décomposition**
     - Analyse granulaire du problème
     - Décomposer, Identifier contraintes, Clarifier objectifs
   * - **Pensée Critique**
     - Évaluation de la validité et des risques
     - Identifier hypothèses, Analyser biais, Évaluer
   * - **Pensée Créative**
     - Génération d'approches innovantes
     - Brainstorming, Pensée latérale, Pensée systémique
   * - **Pensée Analytique**
     - Logique et relation cause-effet
     - Analyse cause-effet, Pensée inductive/déductive
   * - **Pensée Systémique**
     - Vision d'ensemble et interconnexions
     - Parties prenantes, Dépendances, Effets de second ordre
   * - **Prise de Décision**
     - Analyse des choix et compromis
     - Peser alternatives, Compromis, Décision sous incertitude
   * - **Raisonnement Modal**
     - Analyse des possibles et nécessités
     - Nécessité modale, Analyse contrefactuelle, Logique temporelle
   * - **Raisonnement Abductif**
     - Inférence de la meilleure explication
     - Génération d'hypothèses, Transfert analogique, CBR
   * - **Multi-niveau**
     - Abstraction et propriétés émergentes
     - Abstraction hiérarchique, Analyse de Marr, Pensée holistique
   * - **Bayésien**
     - Probabilités et mise à jour des croyances
     - Intégration d'évidences, Réseau causal, Propagation incertitude
   * - **Métacognition**
     - Contrôle et optimisation du processus
     - Self-Monitoring, Gestion charge cognitive, Attention sélective
   * - **Symbolique**
     - Logique formelle et théorèmes
     - Logique 1er ordre, Satisfaction contraintes, Preuve automatique
   * - **Domaine-Spécifique**
     - Expertises ciblées
     - Modélisation physique, Diagnostic médical, Analyse juridique
   * - **Visuel/Multimodal**
     - Raisonnement spatial et visuel
     - Transformation spatiale, Raisonnement diagrammatique
   * - **Itératif/Réflexif**
     - Raffinement et boucles de feedback
     - Raffinement itératif, Ruminage profond, Backtracking

Fichier des modules : ``Code/Backend/Phase2-Inference/01_Reasoning/autologic/data/reasoning_modules_complete.json``

API Reference
=============

Core Modules
------------

.. automodule:: autologic.core.engine
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.core.llm_provider
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.core.provider_factory
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.core.resilience
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.core.critic
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.core.model_registry
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.core.models
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.core.prompts
   :members:
   :undoc-members:
   :show-inheritance:

Router Modules
--------------

.. automodule:: autologic.routers.reasoning
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.routers.models
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.routers.history
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: autologic.routers.prompts
   :members:
   :undoc-members:
   :show-inheritance:

Tests
=====

.. code-block:: bash

   # Activer l'environnement virtuel
   source .venv/bin/activate

   # Lancer tous les tests
   pytest Test/ -v

   # Avec couverture
   pytest Test/ --cov=autologic --cov-report=html

Scripts Utilitaires
===================

Le dossier ``Cmd/`` contient des scripts standalone :

.. list-table:: Scripts disponibles
   :widths: 20 60 20
   :header-rows: 1

   * - Script
     - Description
     - Usage
   * - ``start.sh``
     - Lance tout le système (backend + frontend)
     - ``./start.sh``
   * - ``start_backend.sh``
     - Lance uniquement le backend FastAPI
     - ``./Cmd/start_backend.sh``
   * - ``start_frontend.sh``
     - Lance uniquement le frontend React
     - ``./Cmd/start_frontend.sh``
   * - ``run_tests.sh``
     - Exécute la suite de tests pytest
     - ``./Cmd/run_tests.sh``
   * - ``lint.sh``
     - Vérifie la qualité du code
     - ``./Cmd/lint.sh``
   * - ``generate_docs.sh``
     - Génère cette documentation
     - ``./Cmd/generate_docs.sh``

Indices et Tables
=================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

---

*Version 0.3.0 - Février 2026*
