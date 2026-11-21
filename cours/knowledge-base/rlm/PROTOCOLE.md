# RLM — protocole de recherche et de raisonnement récursif

## Objet et limite

Le terme **RLM** désigne ici *Recursive Language Model*, au sens d'une stratégie où un corpus volumineux est exploré comme un environnement, segmenté en sous-problèmes puis recomposé. Cette procédure en transpose les principes à la production du cours. C'est un cadre de raisonnement et de traçabilité, non une promesse qu'un modèle possède un accès illimité au contexte ou qu'il peut vérifier une source sans l'ouvrir.

## Entrées obligatoires

- La question précise, le public et le format pédagogique attendu.
- La période, l'aire géographique et les sens possibles des termes.
- Les critères de réussite : expliquer, comparer, dater, évaluer une thèse, etc.
- Le corpus autorisé ou les classes de sources à rechercher.

Si l'une de ces bornes change, créer une nouvelle branche de recherche plutôt que de mélanger les conclusions.

## Boucle RLM

### 0. Inventorier avant d'interpréter

Lister les sources récupérées, leur type, leur date, leur langue, leur statut (primaire, secondaire, norme, jeu de données), leur accès et leurs manques. Pour l'histoire, indiquer aussi provenance, producteur, destinataire, finalité et chaîne de conservation si elles sont connues.

### 1. Décomposer la question

Découper en sous-questions qui peuvent être vérifiées séparément : définition, chronologie, mécanisme, acteurs, preuves, explications concurrentes et limites. Une sous-question doit avoir un périmètre et un critère de sortie observables.

Exemple : « Comment une archive permet-elle d'établir X ? » devient : quelle est l'origine de l'archive ; que dit-elle réellement ; quel est son but ; quelles voix ou traces manque-t-elle ; quelle autre source indépendante la confirme ou la nuance ; que peut-on conclure ?

### 2. Récupérer et lire

Interroger le RAG avec les termes de chaque sous-question, puis ouvrir les sources les mieux classées. Distinguer :

- **pertinence** : le document traite-t-il de la question ?
- **autorité** : qui le produit, dans quel cadre et avec quelle expertise ?
- **adéquation probatoire** : permet-il réellement d'étayer cette affirmation, pour cette période et ce périmètre ?
- **indépendance** : dépend-il du même témoignage, jeu de données ou intérêt qu'une autre source ?

### 3. Établir des fiches de preuve

Pour chaque micro-affirmation, consigner : `affirmation`, `source_id`, `passage/section`, `type de preuve`, `inférence autorisée`, `limite`, `confiance`. Ne jamais faire passer une interprétation pour une donnée observée.

### 4. Passe contradictoire

Chercher au moins une des possibilités suivantes : une source indépendante, une interprétation concurrente, une différence d'échelle ou de définition, un biais de sélection, une limite de mesure, une lacune archivistique ou un conflit d'intérêts. Une contradiction ne se résout pas à la majorité des résultats : comparer la méthode, le corpus, la date et le domaine de validité.

### 5. Réconcilier

Produire une conclusion calibrée :

- `établi dans le périmètre` si des preuves adaptées convergent ;
- `plausible / discuté` si l'inférence dépasse partiellement les preuves ou si des travaux divergent ;
- `non établi par le corpus` si la preuve manque, est inadaptée ou contradictoire.

Conserver les désaccords pertinents dans le contenu pédagogique : ils font partie de la manière dont le savoir se construit.

### 6. Rédiger et contrôler

Chaque phrase factuelle significative reçoit une source proche. La conclusion précise les bornes temporelles, géographiques et disciplinaires. Pour les sciences empiriques, indiquer quand c'est utile le design, la population, les variables, l'incertitude et l'état de réplication. Pour l'histoire, indiquer le statut et le contexte des sources.

### 7. Concevoir l'apprentissage sans dissocier le fond et la forme

Avant de rédiger une séquence de collège, vérifier dans `programmes-officiels/programmes-2026-2027.json` la référence applicable, le niveau et le statut de l'enseignement. Pour l'histoire, rattacher la séance à un thème et sous-thème de `programmes-officiels/histoire-2026-2027.md`.

Définir ensuite une chaîne pédagogique explicite :

1. une question historique bornée, avec ses repères et le vocabulaire indispensable ;
2. un court récit de situation qui rend visibles acteurs, contraintes et incertitudes, sans conclure à leur place ;
3. une enquête guidée sur des sources dont provenance, perspective et limites sont accessibles ;
4. une confrontation de preuves ou d'interprétations ;
5. une réponse argumentée, distincte de ses preuves et de ses limites ;
6. un rappel sans support, une correction utile et une réactivation ultérieure ;
7. une mise en perspective prudente vers le présent ou le futur, qui rende visibles les différences de contexte.

Le récit, le jeu ou la visualisation ne sont admis que s'ils servent une de ces opérations. Ne pas viser l'addiction, une « sécrétion dopaminergique », la compétition sociale, la récompense aléatoire ou un prolongement artificiel du temps d'usage. Les garde-fous se trouvent dans `pedagogie/narration-historique-ethique.md`.

## Seuil de sortie

La recherche peut s'arrêter lorsqu'il existe une source adéquate par affirmation centrale (ou une lacune explicitement signalée), qu'une passe contradictoire a été faite, que les sources ont été relues et que les liens internes sont validés. Ajouter de nombreuses sources redondantes n'augmente pas nécessairement la solidité de l'argument.

## Contrôle final (obligatoire)

- [ ] Question, termes et périmètre explicités.
- [ ] Chaque affirmation centrale a une source adaptée et ouverte.
- [ ] Source primaire / secondaire / norme distinguées.
- [ ] Inférence séparée de l'observation et de l'interprétation.
- [ ] Opposition, silence, biais ou incertitude examinés.
- [ ] Citations, dates et URL vérifiées.
- [ ] Niveau de confiance et limites rendus visibles au lecteur.
- [ ] Programme, niveau et thème officiel applicables vérifiés avant le cours.
- [ ] Chaque activité ludique, narrative ou numérique sert une opération d'apprentissage identifiable.
- [ ] Rappel, feedback et réactivation prévus ; autonomie soutenue sans abandon de structure.
- [ ] Aucun mécanisme de captation, d'addiction, de honte ou de concurrence coercitive.
