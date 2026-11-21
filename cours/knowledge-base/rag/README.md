# RAG transparent

Cet index utilise BM25, une méthode de recherche lexicale explicable, afin d'éviter de faire croire qu'une similarité vectorielle équivaut à une preuve. Il est suffisant pour ce corpus initial et pourra recevoir, plus tard, un index sémantique en complément, jamais à la place du registre de provenance.

Exemples d'usage PowerShell :

    python knowledge-base/rag/retrieve.py "provenance archive critique" --domain histoire
    python knowledge-base/rag/retrieve.py "reproductibilité réplication" --domain sciences
    python knowledge-base/rag/validate.py

Le score mesure seulement une correspondance entre les mots de la requête et les passages. Il ne classe ni l'autorité de la source ni la force de l'inférence ; ces éléments sont conservés dans le registre et examinés par le protocole RLM.

Pour une requête non satisfaite, ajouter une entrée dans queries.jsonl avec les termes, la date, le résultat et l'action de suivi. Ne pas créer un passage sur la seule mémoire du modèle.
