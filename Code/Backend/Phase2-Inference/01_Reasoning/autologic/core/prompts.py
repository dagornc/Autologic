# autologic/core/prompts.py
"""
Templates de prompts pour les différentes phases du cycle Self-Discover.
Centralise tous les prompts utilisés par le moteur AutoLogic.
"""


class PromptTemplates:
    """Collection de templates de prompts pour le cycle Self-Discover."""

    @staticmethod
    def selection_prompt(modules_json: str, task: str) -> str:
        """
        Génère le prompt pour la phase de sélection des modules.

        Args:
            modules_json: Les modules disponibles en format JSON
            task: La tâche à résoudre

        Returns:
            Le prompt formaté pour la sélection
        """
        return f"""Tu es un expert en métacognition et stratégies de raisonnement.

BIBLIOTHÈQUE DE MODULES DE RAISONNEMENT (39 modules disponibles) :
{modules_json}

TÂCHE À RÉSOUDRE :
{task}

INSTRUCTIONS :
Analyse cette tâche et sélectionne UNIQUEMENT les modules de raisonnement
qui sont pertinents et nécessaires pour la résoudre efficacement.

Critères de sélection :
- Pertinence : Le module apporte-t-il une valeur ajoutée réelle ?
- Complémentarité : Les modules sélectionnés se combinent-ils bien ?
- Parcimonie : Éviter la sur-ingénierie (max 7 modules recommandé)

RETOURNE UN JSON STRICT (pas de markdown) :
{{
  "selected_modules": ["id1", "id2", "id3"],
  "reasoning": "Explication concise du choix stratégique"
}}"""

    @staticmethod
    def adaptation_prompt(selected_json: str, task: str) -> str:
        """
        Génère le prompt pour la phase d'adaptation des modules.

        Args:
            selected_json: Les modules sélectionnés en format JSON
            task: La tâche à résoudre

        Returns:
            Le prompt formaté pour l'adaptation
        """
        return f"""Tu es un expert en adaptation de stratégies cognitives.

TÂCHE SPÉCIFIQUE :
{task}

MODULES SÉLECTIONNÉS (actuellement génériques) :
{selected_json}

INSTRUCTIONS :
Réécris et affine chaque module pour qu'il soit SPÉCIFIQUEMENT adapté
à cette tâche précise. Transforme-les de génériques à contextuels.

Exemple de transformation :
- Générique : "Simplifier le problème"
- Adapté pour "Résoudre équation du 2nd degré" :
  "Isoler d'abord le terme en x², puis factoriser ou utiliser le discriminant"

Pour chaque module :
1. Réécrire la description de manière contextualisée
2. Lister 2-3 actions spécifiques à effectuer

RETOURNE UN JSON STRICT :
{{
  "adapted_modules": [
    {{
      "id": "simplify",
      "adapted_description": "Description contextualisée et précise...",
      "specific_actions": [
        "Action concrète 1",
        "Action concrète 2"
      ]
    }},
    ...
  ]
}}"""

    @staticmethod
    def structuration_prompt(adapted_json: str, task: str) -> str:
        """
        Génère le prompt pour la phase de structuration du plan.

        Args:
            adapted_json: Les modules adaptés en format JSON
            task: La tâche à résoudre

        Returns:
            Le prompt formaté pour la structuration
        """
        return f"""Tu es un expert en planification stratégique et ordonnancement de tâches.

TÂCHE À RÉSOUDRE :
{task}

MODULES ADAPTÉS DISPONIBLES :
{adapted_json}

INSTRUCTIONS :
Assemble ces modules en un PLAN DE RAISONNEMENT cohérent, ordonné et
exécutable. Chaque étape doit être :
- Claire et actionnable
- Ordonnée logiquement (dépendances respectées)
- Associée à un output attendu

Principes de structuration :
- Commencer par les fondations (simplification, cadrage)
- Progresser vers l'analyse approfondie
- Terminer par validation et synthèse

RETOURNE UN JSON STRICT :
{{
  "reasoning_plan": {{
    "steps": [
      {{
        "step_number": 1,
        "module_id": "simplify",
        "module_name": "Simplification",
        "action": "Description précise et actionnable de l'étape",
        "expected_output": "Type de résultat attendu (ex: 'Liste de sous-problèmes')"
      }},
      ...
    ],
    "estimated_complexity": "low|medium|high"
  }}
}}"""

    @staticmethod
    def execution_prompt(plan_json: str, task: str) -> str:
        """
        Génère le prompt pour la phase d'exécution.

        Args:
            plan_json: Le plan de raisonnement en format JSON
            task: La tâche à résoudre

        Returns:
            Le prompt formaté pour l'exécution
        """
        return f"""Tu es un agent d'exécution rigoureux.

TÂCHE À RÉSOUDRE :
{task}

PLAN DE RAISONNEMENT À SUIVRE STRICTEMENT :
{plan_json}

INSTRUCTIONS :
Exécute chaque étape du plan globalement pour fournir une réponse finale complète.
Structure ta réponse en suivant les étapes du plan.

Pour chaque étape du plan:
1. Rappelle l'étape
2. Effectue le raisonnement/action
3. Donne le résultat

Termine par une CONCLUSION FINALE CLAIRE."""
