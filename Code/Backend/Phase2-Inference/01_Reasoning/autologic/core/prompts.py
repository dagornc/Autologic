# autologic/core/prompts.py
"""
Templates de prompts pour les différentes phases du cycle Self-Discover.
Centralise tous les prompts utilisés par le moteur AutoLogic.
"""

from typing import List, Dict, Any, Optional


class PromptTemplates:
    """Collection de templates de prompts pour le cycle Self-Discover."""

    @staticmethod
    def analyze_prompt(task: str) -> str:
        """
        PHASE 0: ANALYSE INITIALE
        Évalue la tâche, identifie les contraintes et les pré-requis.
        """
        return f"""Tu es un analyste expert. Analyse la tâche suivante pour identifier :
1. L'objectif principal
2. Les contraintes implicites et explicites
3. Les connaissances nécessaires
4. Les pièges potentiels (ex: hallucinations sur 'Antigravity')

TÂCHE :
{task}

RETOURNE UN JSON STRICT :
{{
  "analysis": "Analyse détaillée...",
  "constraints": ["c1", "c2"],
  "domain": "Domaine technique",
  "priority": "low|medium|high"
}}"""

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

BIBLIOTHÈQUE DE MODULES DE RAISONNEMENT (106 modules disponibles) :
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

RETOURNE UN JSON STRICT. TA RÉPONSE DOIT ÊTRE UNIQUEMENT UN OBJET JSON.
PAS DE COMMENTAIRES, PAS DE TEXTE D'ACCOMPAGNEMENT, PAS DE BLOCS MARKDOWN.

FORMAT ATTENDU :
{{
  "reasoning_plan": {{
    "steps": [
      {{
        "step_number": 1,
        "module_id": "ID_DU_MODULE",
        "module_name": "NOM_DU_MODULE",
        "action": "Description précise de l'action",
        "expected_output": "Résultat attendu"
      }}
    ],
    "estimated_complexity": "low|medium|high"
  }}
}}"""

    @staticmethod
    def verify_plan_prompt(plan_json: str, task: str) -> str:
        """
        PHASE 4: VÉRIFICATION DU PLAN
        Valide la cohérence logique du plan avant exécution.
        """
        return f"""Tu es un expert en audit de processus.
Vérifie si ce plan de raisonnement est complet et logique pour résoudre la tâche.

TÂCHE :
{task}

PLAN PROPOSÉ :
{plan_json}

Vérifie :
- Toutes les contraintes de la tâche sont-elles adressées ?
- L'ordre des étapes est-il optimal ?
- Manque-t-il une étape cruciale ?

RETOURNE UN JSON STRICT :
{{
  "is_valid": true|false,
  "feedback": "Feedback si invalide, sinon vide",
  "suggestions": ["s1", "s2"]
}}"""

    @staticmethod
    def restructure_prompt(old_plan_json: str, task: str, feedback: str) -> str:
        """
        PHASE 3b: RE-STRUCTURATION (Backtrack)
        Corrige le plan rejeté par le Critique.
        """
        return f"""Tu es un expert en planification stratégique.
ALERTE : Le plan précédent a été rejeté par l'Agent Critique.

TÂCHE :
{task}

ANCIEN PLAN (REJETÉ) :
{old_plan_json}

FEEDBACK DU CRITIQUE (À INTÉGRER IMPÉRATIVEMENT) :
"{feedback}"

INSTRUCTIONS :
Génère une NOUVELLE version du plan de raisonnement qui corrige ces défauts.
Sois précis et adresse directement les points soulevés dans le feedback.
Conserve le format strict attendu pour un plan de raisonnement.

RETOURNE UN JSON STRICT (objet 'reasoning_plan') :
{{
  "reasoning_plan": {{
    "steps": [
      {{
        "step_number": 1,
        "module_id": "...",
        "module_name": "...",
        "action": "...",
        "expected_output": "..."
      }}
    ],
    "estimated_complexity": "low|medium|high"
  }}
}}"""

    @staticmethod
    def execution_prompt(plan_json: str, task: str, previous_feedback: str = "") -> str:
        """
        Génère le prompt pour la phase d'exécution.

        Args:
            plan_json: Le plan de raisonnement en format JSON
            task: La tâche à résoudre
            previous_feedback: Feedback critique d'une tentative précédente (si applicable)

        Returns:
            Le prompt formaté pour l'exécution
        """
        base_prompt = f"""Tu es un agent d'exécution rigoureux.

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

        if previous_feedback:
            base_prompt += f"""

ALERTE - TENTATIVE DE CORRECTION :
Une tentative précédente a été rejetée par le Critique. Voici le feedback à intégrer IMPÉRATIVEMENT :
"{previous_feedback}"

Corrige ta réponse pour répondre exactement à ce feedback.
"""
        return base_prompt

    @staticmethod
    def synthesis_prompt(task: str, execution_output: str, analysis: Optional[Dict[str, Any]] = None) -> str:
        """
        PHASE 7: SYNTHÈSE FINALE
        Affine et polit la réponse finale pour une qualité premium en tenant compte des contraintes initiales.
        """
        constraints_str = ""
        if analysis and analysis.get("constraints"):
            constraints_str = "\nCONTRAINTES À RESPECTER IMPÉRATIVEMENT :\n- " + "\n- ".join(analysis["constraints"])

        return f"""Tu es un éditeur expert en communication technique.
Ta mission est de prendre le résultat brut de l'exécution et de le transformer en une réponse "Premium", claire et parfaitement structurée.

TÂCHE INITIALE :
{task}
{constraints_str}

RÉSULTAT BRUT DE RÉFÉRENCE :
{execution_output}

INSTRUCTIONS DE RÉDACTION :
1. **Structure Premium** : Utilise une hiérarchie Markdown claire (Titres, listes, gras).
2. **Fidélité & Précision** : Respecte scrupuleusement les contraintes mentionnées ci-dessus.
3. **Ton Professionnel** : Adopte un ton expert, concis et utile.
4. **Clean-up** : Supprime les répétitions d'étapes de raisonnement internes, ne garde que la substance de la réponse.
5. **Conclusion Logic** : Termine par une synthèse actionnable ou un résumé clair.

RETOURNE LA RÉPONSE FINALE FORMATÉE (Markdown)."""

    @staticmethod
    def audit_final_prompt(task: str, final_output: str, analysis: Optional[Dict[str, Any]] = None, previous_context: str = "") -> str:
        """
        PHASE 7.5: AUDIT FINAL (UNIVERSEL)
        Vérifie la suffisance structurelle (90%) et la loi du rendement décroissant.
        """
        constraints_str = ""
        if analysis and analysis.get("constraints"):
            constraints_str = "\n- " + "\n- ".join(analysis["constraints"])

        return f"""Tu es un auditeur système de production (Production Supervisor).
Ta mission est d'assurer l'efficacité : "Le mieux est l'ennemi du bien".

TÂCHE INITIALE : {task}
CONTRAINTES GLOBALES : {constraints_str}

CONTENU À AUDITER :
{final_output}

RÈGLES D'AUDIT (UNIVERSELLES) :
1. Suffisance Structurelle : Si 90% des instructions/contraintes sont respectées, VALIDE.
2. Rendement Décroissant : Si les seules améliorations possibles sont mineures (style, ponctuation, synonymes) ou subjectives, INTERDIS LA BOUCLE (Force Success).
3. Intégrité : La structure globale prime sur les détails.

RETOURNE UN JSON STRICT :
{{
  "structural_sufficiency_score": [0-100],
  "is_sufficient": true|false,
  "required_changes_type": "NONE|MINOR|MAJOR",
  "missing_critical_elements": ["element1", "element2"],
  "improvement_instructions": "Seulement si changements MAJEURS requis."
}}"""

    @staticmethod
    def critic_evaluation_prompt(input_task: str, autologic_plan: str, generated_response: str) -> str:
        """
        Génère le prompt pour l'Agent Critique H2 (Version Google Antigravity).
        """
        return f"""RÔLE :
Tu es l'Agent Critique H2 (Heuristic & Hypothesis Evaluator), un auditeur expert chargé de valider la fiabilité des réponses générées par un système d'IA. Ton rôle est de filtrer les hallucinations et de garantir que l'exécution suit strictement le plan de raisonnement établi.

CONTEXTE DE VÉRITÉ (Sujet : Google Antigravity) :
Attention, le terme "Google Antigravity" est piégeux et sujet aux hallucinations. Tu dois sanctionner toute réponse qui s'écarte des faits suivants :
1. Ce n'est PAS une technologie de propulsion ou de physique réelle développée par Google.
2. C'est un "Easter Egg" (projet artistique web) créé par Mr. Doob en 2009 utilisant le moteur physique Box2D.
3. Si le texte parle de recherche scientifique, il doit faire référence à "Google DeepMind" et à des simulations (ex: MuJoCo, AlphaFold) ou à l'optimisation de code (AlphaDev), mais jamais à de l'antigravité physique.

ENTRÉES :
1. [USER_TASK] : La demande de l'utilisateur.
2. [AUTOLOGIC_PLAN] : Le plan structuré généré par le module AutoLogic (étapes de raisonnement).
3. [CANDIDATE_RESPONSE] : La réponse à évaluer.

TACHE :
Évalue la [CANDIDATE_RESPONSE] et attribue un "score_h2" entre 0.0 et 1.0.
- Score < 0.8 : REJET (Déclenche un Backtrack).
- Score >= 0.8 : VALIDATION.

CRITÈRES DE NOTATION (FEW-SHOT LEARNING) :

--- Exemple 1 (Hallucination - REJET) ---
Task: "Comment utiliser l'API Google Antigravity pour des drones ?"
Plan: 1. Vérifier l'existence de l'API. 2. Analyser la documentation.
Response: "L'API Google Antigravity permet de moduler la masse des drones via le cloud. Utilisez la fonction `setGravity(0)`."
>> Sortie Attendue :
{{
  "score_h2": 0.1,
  "status": "REJET",
  "feedback": "Hallucination critique. Google ne possède pas de technologie d'antigravité. Il s'agit d'un Easter Egg JavaScript, pas d'une API physique. Corrigez en clarifiant la nature du projet."
}}

--- Exemple 2 (Non-respect du Plan - REJET) ---
Task: "Explique le fonctionnement technique de l'Easter Egg Google Gravity."
Plan: 1. Identifier le moteur physique (Box2D). 2. Expliquer l'injection dans le DOM. 3. Analyser la gestion des collisions.
Response: "C'est un site très amusant où tout tombe quand on bouge la souris. C'est une blague classique de Google."
>> Sortie Attendue :
{{
  "score_h2": 0.5,
  "status": "REJET",
  "feedback": "La réponse est factuellement vraie mais superficielle. Le plan AutoLogic demandait une analyse technique (Box2D, DOM, Collisions) qui est absente. Exécutez les étapes techniques du plan."
}}

--- Exemple 3 (Réussite - VALIDATION) ---
Task: "Quel est le lien entre Google et la gravité ?"
Plan: 1. Disambiguïser le terme (Easter Egg vs Recherche). 2. Citer les projets DeepMind pertinents.
Response: "Il faut distinguer deux choses. D'un côté, 'Google Gravity' est un projet web artistique de 2009. De l'autre, Google DeepMind utilise l'apprentissage par renforcement pour apprendre à des agents virtuels à marcher sous des contraintes de gravité simulée."
>> Sortie Attendue :
{{
  "score_h2": 0.95,
  "status": "VALID",
  "feedback": "Réponse nuancée, factuelle et conforme au plan."
}}

INSTRUCTIONS FINALES :
Analyse les entrées ci-dessous et génère UNIQUEMENT un objet JSON.

[USER_TASK] : {input_task}
[AUTOLOGIC_PLAN] : {autologic_plan}
[CANDIDATE_RESPONSE] : {generated_response}"""
