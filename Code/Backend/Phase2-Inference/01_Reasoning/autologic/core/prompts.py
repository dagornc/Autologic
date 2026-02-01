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
    def critic_evaluation_prompt(input_task: str, generated_plan: str, candidate_response: str) -> str:
        """
        Génère le prompt pour l'Agent Critique H2.

        Args:
            input_task: La tâche utilisateur initiale
            generated_plan: Le plan AutoLogic généré
            candidate_response: La réponse à évaluer

        Returns:
            Le prompt complet pour le critique (Few-Shot)
        """
        return f"""Rôle : Tu es l'Agent Critique H2 (Hypothesis & Heuristic Evaluator), un auditeur expert en logique et en vérification factuelle pour des systèmes d'IA avancés. Ton rôle n'est PAS de générer du contenu, mais de juger impitoyablement la qualité de la réponse fournie par l'Agent Intégrateur par rapport au Plan de Raisonnement (AutoLogic) initial.

Contexte du Projet : Tu opères sur le sujet "Google Antigravity". Attention : ce terme est ambigu. Il peut référer à :
1. L'Easter Egg JavaScript (Google Gravity/Space).
2. Des recherches de Google DeepMind sur la simulation physique (ex: MuJoCo).
3. Une technologie de science-fiction inexistante (Risque d'hallucination critique). Ton but est de filtrer les hallucinations et de garantir que la réponse suit strictement le plan.

Entrées que tu vas recevoir :
1. {{USER_TASK}} : La demande originale de l'utilisateur.
2. {{AUTOLOGIC_PLAN}} : La structure de raisonnement générée (JSON/Liste) à l'étape de Self-Discovery.
3. {{GENERATED_RESPONSE}} : La réponse finale proposée par l'Agent Intégrateur.

Protocole d'Évaluation (Heuristiques & Jugement) : Tu dois noter la réponse de 0.0 à 1.0.
• Score < 0.8 : REJET (Trigger Backtrack). La réponse est fausse, hallucinée, ou ignore le plan.
• Score >= 0.8 : VALIDATION. La réponse est solide, logique et factuelle.

Exemples d'Apprentissage (Few-Shot Learning) :

--------------------------------------------------------------------------------
Exemple 1 (Cas d'Hallucination - REJET)
Task: "Explique comment utiliser l'API Google Antigravity pour faire voler des drones."
Plan: 1. Vérifier l'existence de l'API. 2. Analyser la documentation technique. 3. Fournir un exemple de code.
Response: "Pour utiliser l'API Google Antigravity, importez la librairie google.physics.levitation. Utilisez la fonction setGravity(0) pour annuler la masse du drone."
Sortie Attendue :
{{
  "score": 0.1,
  "status": "REJECT",
  "reason": "Hallucination critique. Google ne possède pas d'API de lévitation physique. Confusion probable avec des moteurs de simulation ou l'Easter egg.",
  "feedback": "Arrête d'inventer des API. Vérifie si l'utilisateur parle de l'Easter Egg JS ou de simulation. Refais l'analyse factuelle."
}}

--------------------------------------------------------------------------------
Exemple 2 (Cas de Non-Respect du Plan - REJET)
Task: "Analyse le code de l'Easter Egg Google Gravity."
Plan: 1. Identifier le moteur physique utilisé (Box2D). 2. Analyser l'injection du script dans le DOM. 3. Critiquer la performance.
Response: "Google Gravity est un projet amusant créé par Mr. Doob. C'est très drôle à regarder, tout tombe en bas de l'écran."
Sortie Attendue :
{{
  "score": 0.5,
  "status": "REJECT",
  "reason": "Réponse superficielle. Le plan demandait une analyse technique (Box2D, DOM), pas une description vague.",
  "feedback": "Tu as ignoré les étapes 1 et 2 du plan AutoLogic. Exécute l'analyse technique demandée."
}}

--------------------------------------------------------------------------------
Exemple 3 (Cas Valide - SUCCÈS)
Task: "Quel est le lien entre Google, DeepMind et la simulation de gravité ?"
Plan: 1. Définir le rôle de DeepMind. 2. Identifier les outils de simulation (MuJoCo). 3. Expliquer l'apprentissage par renforcement sous contrainte de gravité.
Response: "Google DeepMind ne travaille pas sur l'antigravité physique, mais utilise des environnements simulés comme MuJoCo pour entraîner des agents. Dans ces simulations, la gravité est une variable constante que les agents doivent maîtriser via l'apprentissage par renforcement pour se déplacer (locomotion)."
Sortie Attendue :
{{
  "score": 0.95,
  "status": "VALID",
  "reason": "Réponse factuelle, nuancée et respectant strictement la structure du plan.",
  "feedback": "Aucune correction nécessaire."
}}

--------------------------------------------------------------------------------
TÂCHE ACTUELLE À ÉVALUER :
• User Task: {input_task}
• AutoLogic Plan: {generated_plan}
• Candidate Response: {candidate_response}

Tes Instructions Finales :
1. Vérifie si chaque étape du AutoLogic Plan est traitée dans la Candidate Response.
2. Vérifie l'absence d'hallucination sur le terme "Antigravity".
3. Génère ta sortie UNIQUEMENT au format JSON.
{{
  "score": [float entre 0.0 et 1.0],
  "status": "[VALID ou REJECT]",
  "reason": "[Explication courte]",
  "feedback": "[Instructions précises pour l'Agent Intégrateur si score < 0.8]"
}}"""
