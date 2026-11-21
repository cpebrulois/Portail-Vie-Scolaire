# Parcours d'histoire — 6e, année 2026-2027

Ce dossier contient le **corpus annuel prêt à enseigner et à intégrer dans un hub interactif**. Il relève du programme d'histoire de 6e de l'arrêté de 2020, toujours applicable en 2026-2027 : voir [le cadrage officiel](../../../programmes-officiels/histoire-2026-2027.md) et le [BO du 30 juillet 2020](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm).

Chaque module est une séquence courte, conçue avec le [gabarit de séquence](../../../pedagogie/gabarit-sequence-histoire.md) et les règles de preuve du [RLM](../../../rlm/PROTOCOLE.md). Le format peut devenir une page, une activité de groupe, une mission de jeu de rôle ou un micro-défi numérique ; le savoir historique et son évaluation ne changent pas avec l'habillage.

## Les neuf modules

| ID | Sous-thème officiel | Question directrice | Production finale |
| --- | --- | --- | --- |
| H6-01 | Les débuts de l'humanité | Comment des traces très incomplètes permettent-elles de raconter des histoires humaines ? | Cartel de musée argumenté |
| H6-02 | La « révolution » néolithique | Pourquoi produire sa nourriture change-t-il des sociétés, sans tout changer partout de la même manière ? | Carte causale nuancée |
| H6-03 | Premiers États, premières écritures | Pourquoi certains pouvoirs ont-ils besoin d'enregistrer ? | Lecture critique d'une tablette |
| H6-04 | Le monde des cités grecques | Comment une cité organise-t-elle une vie commune, et qui en est écarté ? | Schéma de citoyenneté contextualisé |
| H6-05 | Rome du mythe à l'histoire | Que peut faire connaître un récit de fondation, et que ne peut-il pas prouver ? | Verdict de source : récit / fait établi / incertitude |
| H6-06 | Naissance du monothéisme juif | Comment étudier un texte et une croyance sans les confondre avec un simple « fait » ? | Fiche de source et frise contextualisée |
| H6-07 | Conquêtes, paix romaine et romanisation | Comment Rome gouverne-t-elle un empire immense sans fabriquer partout la même société ? | Plaidoyer nuancé depuis une province |
| H6-08 | Des chrétiens dans l'Empire | Comment la situation des chrétiens change-t-elle, et pourquoi faut-il éviter les récits trop simples ? | Frise à deux voix : pouvoir / communautés |
| H6-09 | Route de la soie et Chine des Han | Pourquoi parler de réseaux d'échanges plutôt que d'une seule route ? | Carte de réseau avec intermédiaires |

Les textes se trouvent dans [`modules/`](modules/). Le fichier [`modules.json`](modules.json) est l'index machine lisible pour le futur hub. Les références, le statut et les limites des sources sont dans [`sources.md`](sources.md).

Le plan des photos, audios, cartes et manipulations à sélectionner est dans [`media-plan.json`](media-plan.json). Aucun actif n'est encore intégré : chaque image et chaque son devra être choisi avec sa provenance, son droit d'usage et son alternative accessible.

## Grammaire commune des modules

Chaque module comprend les mêmes sept opérations. Elles permettent une navigation adaptative cohérente sans créer de filière d'élèves ni de classement.

1. **Question et hypothèse.** Une situation bornée ouvre un problème ; l'hypothèse initiale n'est pas notée.
2. **Repères.** Une frise, une carte, le vocabulaire et une démonstration de geste historien évitent une enquête opaque.
3. **Mission d'archives.** L'élève incarne un membre de l'atelier des sources, jamais une personne ancienne réelle ; il ou elle relie une réponse à un document et à sa limite.
4. **Micro-défis numériques.** Des réponses courtes demandent un choix justifié ou un rappel ; ils sont **inspirés des formats de parcours numériques**, sans se présenter comme une certification Pix.
5. **Formalisation.** L'élève répond à la question avec une affirmation, une preuve et une limite.
6. **Rappel et correction.** La réponse est cherchée sans support, corrigée avec un critère précis, puis révisable.
7. **Réactivation.** Une reprise minimale a lieu à la séance suivante et une seconde plus tard dans le parcours ; le calendrier est un point de départ à ajuster, pas une loi cognitive.

## Adaptation intégrée

Le même objectif est conservé pour tous. Le moteur peut proposer l'une de ces routes à partir des réponses précédentes, mais l'élève garde le droit de choisir une autre route.

- **Avec repères :** frise déjà remplie, glossaire au survol, une source annotée et une phrase-amorce ; pour installer les prérequis.
- **Enquête guidée :** deux sources à comparer, questions de provenance et indice sur le vocabulaire ; route par défaut.
- **Approfondissement :** troisième source, contradiction ou silence documentaire ; l'élève précise ce que l'on ne peut pas conclure.

Une mauvaise réponse ne déclenche ni pénalité, ni série à préserver, ni score public : elle déclenche une explication, un exemple travaillé puis une nouvelle tentative. Les indicateurs nécessaires à l'enseignant sont les connaissances à revoir et les aides activées, pas un rang.

## Principes de ludisme

Le fil rouge est **l'Atelier des sources** : une équipe doit rendre une réponse publique exacte, compréhensible et honnête. Une mission se termine lorsque la réponse argumentée est produite. Il n'y a ni récompense aléatoire, ni compte à rebours coercitif, ni boucle conçue pour prolonger l'usage.

Le plaisir visé est celui de comprendre, de progresser et de coopérer ; il ne repose pas sur une promesse de « dopamine » ou d'addiction. Cette limite est scientifique et éthique, particulièrement pour des mineurs : voir le [rapport pédagogique](../../../pedagogie/report-source.md) et la [charte de narration](../../../pedagogie/narration-historique-ethique.md).

## Évaluation commune

La réussite se lit avec quatre critères explicites, identiques dans les neuf modules :

- je situe approximativement dans le temps et l'espace ;
- je distingue ce que dit une source, ce que j'en déduis et ce qu'elle ne permet pas d'affirmer ;
- je réponds à la question avec au moins une preuve précise ;
- je corrige ou nuance mon premier raisonnement après retour.

La note, si l'enseignant choisit d'en attribuer une, doit rester distincte du suivi de progression. Le premier usage des micro-défis est formatif.
