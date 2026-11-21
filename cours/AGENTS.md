# Protocole de recherche du cours interactif

Ce dépôt est conçu pour produire des contenus d'enseignement sourcés. Ces règles s'appliquent à toute création ou révision de contenu substantiel.

## Documents de référence extérieurs

Trois documents antérieurs, rédigés pour le débunkage Aethonyx, font autorité
ici et ne doivent pas être paraphrasés : les consulter directement.

| Document | Ce qu'il fournit |
| --- | --- |
| `C:/débunkage Aethonyx/éditorial/_CHARTES_ET_METHODE/_CHARTE_MORSURES_30S_AETHONYX_v1.5.md` | L'architecture PACTE, le lexique probatoire, les objets-mémoire, les étiquettes d'image, la règle de solidarité de l'humour. |
| `.../AUDIT_SCIENTIFIQUE_V1.5_ATTENTION_APPRENTISSAGE_MEMOIRE_2026-08-30.md` | L'appui expérimental de chaque mécanisme, **avec ses limites chiffrées**, et la hiérarchie des affirmations. |
| `.../CHECKLIST_PRODUCTION_V1.5_MERVEILLEUX_SOUS_SCELLES.md` | Les contrôles avant écriture, avant mise en ligne et après délai de rappel. |

Une précision qui a déjà causé une erreur dans ce fichier : l'audit ne
proscrit pas les ressorts psychologiques. Il proscrit une **explication
abusive** — « invoquer la dopamine pour expliquer un taux de rétention ». La
règle est épistémique, pas technique. Ne pas la retranscrire en interdiction
de procédé.

## Règle de travail

1. Lire `knowledge-base/README.md`, puis utiliser `knowledge-base/rag/retrieve.py` pour une première récupération locale.
2. Vérifier les sources retournées à l'URL d'origine ; un extrait du RAG oriente la recherche, il ne constitue jamais seul une preuve.
3. Pour les affirmations importantes, enregistrer ou réutiliser une entrée dans `sources/sources.jsonl` et une affirmation dans `evidence/claims.jsonl`. Ne pas présenter comme un fait ce qui est une interprétation, une hypothèse ou un point débattu.
4. Suivre le protocole récursif de `rlm/PROTOCOLE.md` dès que la question comporte plusieurs notions, périodes, disciplines ou sources. Pour une réponse courte, appliquer au minimum les contrôles de sortie décrits dans ce protocole.
5. Citer les sources au plus près des affirmations : auteur/institution, titre, date si connue, lien direct. Donner une limite lorsque la source ne permet pas de conclure.

## Ancrage dans les programmes officiels

Avant de créer un cours ou une évaluation de collège :

1. Ouvrir `knowledge-base/programmes-officiels/programmes-2026-2027.md` et vérifier le niveau, le statut de l'enseignement et l'arrêté effectivement applicable.
2. Pour l'histoire, rattacher le contenu à un thème et sous-thème de `knowledge-base/programmes-officiels/histoire-2026-2027.md` avant toute sélection de documents.
3. Ne jamais substituer un programme publié mais non encore applicable à la référence de l'année ; en 2026-2027, l'histoire-géographie relève du programme 2020 de la 6e à la 3e.
4. Distinguer le tronc commun à horaire propre, les enseignements transversaux obligatoires (HDA, EMI, EVARS) et les options ou langues conditionnelles. Ne pas présenter une option comme universelle.

## Conception pédagogique fondée sur les preuves

- Lire `knowledge-base/pedagogie/report-source.md` et utiliser `knowledge-base/pedagogie/gabarit-sequence-histoire.md` pour toute nouvelle séquence d'histoire.
- Prévoir une opération d'apprentissage observable : rappel sans support suivi d'un feedback, réactivation espacée, comparaison guidée, explication argumentée ou métacognition. Le ludisme doit servir cette opération, pas seulement embellir l'activité.
- Adapter le guidage, les documents et la charge de travail aux prérequis ; une enquête sans repères, vocabulaire, modèles ni retours n'est pas une enquête suffisamment étayée.
- Soutenir l'autonomie par des choix réels mais bornés, des raisons claires et des critères de réussite explicites. Ne pas interpréter la motivation comme une propriété fixe de l'élève.
- La narration doit respecter `knowledge-base/pedagogie/narration-historique-ethique.md` : question authentique, sources, contexte, incertitudes, conclusion et sortie finissable.

## Le critère de la capacité

Ce dépôt assume d'employer les ressorts psychologiques de la motivation. Les
refuser en bloc revient à laisser l'économie de l'attention seule à s'en servir,
pour des fins creuses, pendant que l'école s'interdit ce que la bonne pédagogie
a toujours fait — un professeur qui coupe son cours sur une énigme emploie un
ressort psycho-biologique.

La ligne de partage n'est donc pas morale. Elle est mécanique, et vérifiable :

> **Employer tout ressort qui augmente l'appétit et la capacité d'apprendre de
> l'élève EN DEHORS de la plateforme. Refuser ceux qui n'augmentent que le temps
> passé dedans.**

- **Ressorts qui construisent** — à employer sans réserve : écart de curiosité, tension narrative, mystère, sentiment de maîtrise qui progresse, rappel espacé, progression méritée et lisible, appartenance à un groupe, surprise, beauté d'une forme. Plus on s'en sert, plus l'élève devient capable d'apprendre, ailleurs et sans nous.
- **Ressorts qui consomment** — à refuser : récompense à ratio variable, décompte de série puni par la rupture, urgence artificielle, défilement sans fin, comparaison sociale décourageante. Ils fonctionnent, et ils dégradent précisément la capacité qu'ils exploitent : le problème d'un jeu de captation n'est pas d'être plaisant, c'est de rendre le reste du monde plus terne.
- **Un cours qui produirait cet effet aurait échoué selon son propre critère** : on obtiendrait de l'engagement dans l'application, et un élève qui n'ouvre plus un livre.
- **Un classement n'est pas interdit : il est à régler.** Normaliser par niveau pour qu'un débutant investi puisse dépasser un ancien, et qu'aucun élève ne soit installé à demeure dans la moitié basse. Ce qui est proscrit, c'est le classement qui décourage, pas la visibilité du mérite.
- **Deux dégâts documentés, à éviter nommément** : la rupture de série, qui fait décrocher l'élève au moment exact où il perd son compteur ; et l'effet de surjustification, où récompenser extrinsèquement une activité déjà intéressante finit par en détruire l'intérêt.
- En cas de doute sur un dispositif, poser la question du critère : *cet élève aura-t-il, après, plus envie d'apprendre en dehors d'ici ?* Si la réponse n'est pas oui, le dispositif ne sert que la plateforme.

## Architecture d'un module : PACTE

Tout module suit la structure `Porte — Anticipation — Collision — Transformation — Extraction`,
définie dans la charte v1.5. Le gabarit détaillé est dans
`knowledge-base/pedagogie/gabarit-module-pacte.md`, et `H6-04` en est la
première application.

Avant d'écrire une ligne, poser l'**unité-cible** :

> **Demain, l'élève doit pouvoir se rappeler que…**

Elle contient la pièce ou la distinction centrale, **ce qu'elle permet de
conclure**, et **ce qu'elle ne permet pas de conclure**. Tout ce qui ne sert ni
cette cible, ni sa compréhension, ni sa récupération est coupé ou déplacé.

**Transposition scolaire, à ne pas oublier.** La v1.5 s'adresse à un
spectateur qui peut balayer l'écran. Un élève ne le peut pas : il est déjà là,
le cours est obligatoire, il sera évalué. Deux conséquences :

- la *Porte* n'a plus à gagner un regard, elle doit ouvrir un manque de savoir précis ;
- l'*Extraction* pèse beaucoup plus lourd, parce qu'on peut réellement revenir à J+1 et J+7 — ce qu'une chaîne ne peut qu'espérer. Un module sans rappel différé programmé est incomplet.

## Lexique probatoire canonique

Les mêmes sept mots, de la 6e à la 3e, dans toutes les disciplines :

`établi — probable — rapporté — possible — non acquis — réfuté — indéterminé`

Ne pas les faire varier pour la prose : c'est une grille mentale, et c'est
probablement ce qu'un élève retiendra le plus longtemps de ce cours. Les
niveaux de confiance de `evidence/claims.jsonl` s'alignent sur ce lexique.

Le **double verdict** est obligatoire à la Transformation : ce que la pièce
autorise, puis le résidu, classé en `probatoire` (donnée inexpliquée et
documentée), `archivistique` (pièce existante mais inaccessible) ou `réflexif`
(le cas est expliqué, mais révèle une mécanique humaine ou institutionnelle).

## Objets-mémoire

Un objet visuel récurrent porte une règle, et une seule, stable d'un module à
l'autre — repris de la charte v1.5 :

`photocopieuse` récits dépendants · `balance` poids probatoire · `tampon` statut ·
`train` chronologie · `guichet` source unique ou exigence administrative.

**Chaque objet-mémoire est dessiné, une fois, dans `site/schemas-outils.json`,
et ce dessin est le seul qui existe.** Le module qui l'introduit l'affiche ;
celui qui le réactive affiche exactement le même. C'est ce que « revenir à
l'identique » veut dire : pas une variante, pas une redite — le même fichier.
Ne jamais redessiner un outil déjà dessiné.

## Les visuels : ce qui entre, ce qui ne rentre pas

Trois catégories, et une seule est sûre.

**Le schéma** rend visible une **relation** que le texte énonce déjà. C'est la
catégorie la plus solide, et la seule qui puisse être ajoutée sans hésiter.
Un schéma qui n'exprime aucune relation est un ornement déguisé.

**La pièce et la carte** portent une valeur probatoire. Elles servent le
raisonnement et elles doivent être créditées, datées, sourcées.

**L'image d'ambiance** plante la situation. C'est la catégorie fragile :
elle ne porte aucune relation, et elle est proche de ce que la recherche
appelle un détail séduisant — intéressant et hors sujet — dont l'effet mesuré
est négatif (g = −0,33, [CLM-TYP-003](knowledge-base/evidence/claims.jsonl)).
Elle n'est donc admise que si elle montre **exactement** la scène décrite,
sans rien de plus accrocheur. Une image plus intéressante que le cours nuit
au cours.

Réserve de périmètre, à ne pas escamoter : cette mesure porte sur le détail
séduisant, pas sur toute décoration, et elle ne dit rien du bénéfice d'un bon
schéma — cela relève d'une autre littérature
([CLM-TYP-004](knowledge-base/evidence/claims.jsonl)). On ne cumule pas les
deux pour se donner raison deux fois.

**Règles de fabrication d'un schéma**, sans exception :

- Il déclare `montre` **et** `neMontrePas`. Les deux s'affichent. Un schéma qui ne dit pas sa limite n'entre pas.
- Il ne quantifie **jamais** ce que sa source ne quantifie pas. Un camembert inventé a l'air pédagogique et trahit la méthode.
- Aucune couleur écrite en dur : uniquement les classes `trait`, `mince`, `plein`, `appui`, `appui-plein`, `alerte`, `alerte-plein`, `pointille`, et pour le texte `petit`, `cle`, `rouge`. Le dessin doit suivre le thème clair et sombre.
- `viewBox` obligatoire, `width`/`height` interdits — le dessin doit rester fluide.
- Un `<title>` relié par `aria-labelledby`. Un dessin muet pour un lecteur d'écran est un dessin qui exclut.
- Vingt libellés au maximum. Un schéma qui parle trop est redevenu du texte, en moins lisible.

## Conception multimodale et accessible

- Avant d'ajouter une image, un audio, une vidéo, une animation ou une manipulation, nommer l'opération d'apprentissage qu'il rend possible : localiser, observer, comparer, entendre une formulation, manipuler une relation, rappeler ou expliquer. Un média décoratif est retiré.
- Appliquer `knowledge-base/pedagogie/multimodalite-psc-et-preferences.md` et le gabarit enrichi avant toute mise en ligne : une modalité supplémentaire doit être pertinente, segmentée, contrôlable et accessible.

### Adaptation mécanique, jamais de profil

Le site doit s'adapter à l'élève. Deux façons de le faire existent, et une seule
tient debout.

- **Ce qui est invalidé** : demander à l'élève quel « type » d'apprenant il est — visuel, auditif, kinesthésique — puis lui servir le format correspondant. L'étiquette déclarée n'améliore pas les résultats. Ne jamais la demander, ne jamais l'écrire, ne jamais l'afficher.
- **Ce qui marche** : servir davantage des formats avec lesquels cet élève **réussit réellement**, mesuré sur ses résultats. C'est de l'enseignement adaptatif ordinaire, et c'est ce que fait un professeur attentif.
- **La préférence se recalcule, elle ne s'enregistre pas.** Les résultats par module sont déjà conservés ; le format est une propriété du module, jamais de l'élève. Le calcul se fait donc à la volée, à partir de données qui existent de toute façon : aucune donnée nouvelle n'est créée, aucune étiquette n'existe, rien ne peut être exporté ni fuiter.
- **Un profil enregistré enferme, un calcul se corrige.** Une étiquette écrite survit à l'élève qui a changé et continue de décider pour lui. Un calcul suit sa progression sans qu'on ait à le mettre à jour.
- **L'élève garde la main** : ce que le calcul propose en premier, il doit pouvoir en sortir d'un geste, et accéder à tous les formats. L'adaptation oriente, elle ne restreint pas.
- Pour tout média : alternatives textuelles pour les images ; sous-titres et transcription pour l'audio/vidéo ; audiodescription ou transcript descriptif si l'image apporte une information nécessaire ; lecture, pause et vitesse contrôlables. Aucune lecture automatique sonore, flash, minuterie coercitive ni animation décorative continue.
- Les préférences d'élèves sont des retours de conception, non un diagnostic ni une mesure d'apprentissage. Employer `knowledge-base/pedagogie/retour-eleves-modules-interactifs.md` de façon anonyme et minimale ; ne pas centraliser de données identifiantes, biométriques ou émotionnelles pour personnaliser un cours.

## Exigences renforcées pour l'histoire

- Distinguer la source primaire, le témoignage et le travail historiographique.
- Documenter l'origine, la date, l'auteur ou producteur, le destinataire, le but, la chaîne de conservation et les transformations numériques éventuelles.
- Ne pas inférer l'absence d'un phénomène de son absence dans les archives sans discuter les silences, biais de conservation et conditions de production.
- Croiser les sources indépendantes lorsqu'une affirmation est sensible, contestable ou centrale au cours.

## Interdits

- Ne pas inventer une référence, une page, une citation ou un résultat d'étude.
- Ne pas transformer un seul document en consensus disciplinaire.
- Ne pas confondre pertinence de recherche et fiabilité d'une preuve.
- Ne pas recopier longuement un texte sous droit ; rédiger des synthèses et conserver les liens vers l'original.
- Ne pas employer d'humiliation, de compétition coercitive, de récompense à ratio variable ni de série punie par sa rupture. Ce ne sont pas des interdits de convenance : ce sont les dispositifs qui consomment la capacité d'apprendre au lieu de la construire (voir *Le critère de la capacité*).
- Ne pas enregistrer d'étiquette de « profil d'apprentissage », ni centraliser de données identifiantes, biométriques ou émotionnelles pour personnaliser un cours.
