# Mode d'emploi de la base de connaissances

## Architecture

```text
question de cours
  -> RAG : récupérer des passages et leurs sources
  -> examen de la source originale
  -> RLM : décomposer, comparer, contester, réconcilier
  -> affirmation sourcée + niveau de confiance + limite
  -> contenu pédagogique
```

Le modèle de provenance est volontairement proche de trois notions de W3C PROV : une **entité** (source, extrait, tableau), une **activité** (recherche, critique, synthèse) et un **agent** (auteur, institution, chercheur ou système). Il est allégé pour rester pratique dans un cours.

## Fichiers de données

- `sources/sources.jsonl` : une ligne par source ; chaque source a un identifiant stable `SRC-*`.
- `rag/chunks.jsonl` : une ligne par passage synthétique récupérable ; le champ `source_id` doit exister dans le registre.
- `evidence/claims.jsonl` : une ligne par affirmation vérifiable ; le tableau `source_ids` doit contenir des sources existantes.
- `rag/queries.jsonl` : journal d'exemples de requêtes et de lacunes ; à enrichir quand une recherche est menée.
- `programmes-officiels/programmes-2026-2027.json` : références réglementaires applicables par niveau, avec statut (tronc commun, transversal, conditionnel).
- `pedagogie/` : synthèse sourcée des pratiques d'apprentissage, garde-fous de narration et gabarit de séquence historique.
  - `pedagogie/multimodalite-psc-et-preferences.md` : transfert prudent du cadre PSC, règles multimédias, accessibilité et protocole d'évaluation locale des préférences.

Les textes des chunks sont des **paraphrases de travail**, pas des copies des publications. Les références pointent vers le texte original ou sa notice officielle.

## Ajouter une source ou une affirmation

1. Consulter le texte d'origine, relever la référence stable, son type, la date et son périmètre.
2. Ajouter la source à `sources/sources.jsonl`.
3. Ajouter un ou plusieurs chunks courts, factuels et attribués.
4. Ajouter une affirmation seulement si son soutien et sa limite sont explicites.
5. Lancer `python knowledge-base/rag/validate.py`.

Une source secondaire peut être utile pour situer un débat, mais la source primaire, une synthèse académique évaluée ou une norme institutionnelle doit soutenir les affirmations structurantes lorsque cela est possible.

## Niveaux de confiance

- `élevé` : source autoritative ou convergence de plusieurs sources adaptées ; limite documentée.
- `moyen` : source adaptée mais incomplète, ou débat sérieux non tranché.
- `faible` : piste, exemple isolé ou généralisation à confirmer. Ne pas l'enseigner comme un acquis.

La récupération n'est pas une validation. Une réponse peut être « non établi par le corpus actuel » : c'est un résultat valide.

## Ordre de récupération pour un futur cours d'histoire

1. Vérifier le niveau, le thème et le sous-thème dans `programmes-officiels/histoire-2026-2027.md`.
2. Rechercher les méthodes historiques et les connaissances du thème dans le RAG, puis ouvrir les sources originales.
3. Lire `pedagogie/report-source.md` et choisir une opération d'apprentissage vérifiable (rappel, enquête guidée, feedback, réactivation).
4. Appliquer le protocole RLM, notamment ses contrôles de programme, de preuve et d'éthique.
