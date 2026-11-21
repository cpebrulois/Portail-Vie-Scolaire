# Une voie adaptée pour les élèves qui cumulent TDAH et dyslexie

Rapport d'investigation et cahier des charges. Il justifie chaque décision de
conception de la voie **« Pas à pas »**, et il énonce ce que cette voie refuse
de faire.

---

## La question posée

Comment construire un parcours de français utilisable par un élève qui présente
**à la fois** un trouble de l'attention et un trouble de la lecture — non pas
l'un ou l'autre, les deux en même temps ?

La cooccurrence n'est pas marginale : les proportions rapportées vont de 15 à
40 % dans un sens et de 25 à 40 % dans l'autre, et l'association est plus forte
avec l'inattention qu'avec l'hyperactivité-impulsivité.
[CLM-BEP-004](../evidence/claims.jsonl) — statut `rapporté`, chiffres connus par
des sources secondaires.

Cette dernière précision oriente déjà la conception : **c'est l'attention qu'il
faut soutenir, pas l'agitation qu'il faut contenir.** Un dispositif conçu pour
faire tenir un enfant assis se tromperait de cible.

---

## Le résultat qui commande tout le reste

Une seule revue systématique porte sur la combinaison elle-même, et non sur
chacune des deux difficultés prise séparément. Elle recense 14 études à cas
unique. [SRC-BEP-001](../sources/sources.jsonl)

Ses conclusions, et l'ordre compte :

1. **L'enseignement de l'identification des mots améliore la lecture.**
2. **L'auto-observation et les interventions fondées sur la fonction du comportement améliorent le comportement.**
3. **Aucune des 14 études n'a mesuré d'effet croisé.**

[CLM-BEP-001](../evidence/claims.jsonl)

Le troisième point est le plus important, et c'est celui qu'on aimerait ne pas
lire. Il signifie que **rien n'autorise à espérer qu'en travaillant la lecture
on améliore l'attention par ricochet, ni l'inverse.** Un dispositif qui ne
soignerait que la présentation du texte laisserait l'attention où elle est ; un
dispositif qui ne soignerait que le découpage des tâches laisserait le décodage
où il est.

Il faut donc **deux leviers tenus en parallèle**, et l'honnêteté oblige à
préciser la nature de ce constat : une absence de mesure n'est pas une preuve
d'absence. Les auteurs la signalent comme une lacune de la littérature, pas
comme un résultat.

---

## Ce que les preuves refusent

Trois choses circulent largement et ne tiennent pas. Les écarter est une
décision de conception au même titre que le reste.

### Les polices « adaptées à la dyslexie »

Testées sur 317 enfants de 7 à 12 ans au total, elles n'améliorent ni la
vitesse ni l'exactitude de lecture. [SRC-BEP-003](../sources/sources.jsonl),
[CLM-BEP-003](../evidence/claims.jsonl)

Les bénéfices parfois observés ailleurs sont **rapportés** comme attribuables à
l'espacement plus large des caractères, non à la forme des lettres. Cette
attribution vient d'une source citée par les auteurs et non ouverte ici : elle
oriente une décision, elle ne la fonde pas.

**Décision :** la voie adaptée n'installe aucune police spéciale. Elle augmente
l'espacement, l'interligne et raccourcit les lignes — et l'interface dit
pourquoi, en une phrase, à qui veut la lire.

### Les styles d'apprentissage

Un élève « visuel » à qui l'on servirait des images n'apprend pas mieux pour
autant. [SRC-PED-020](../sources/sources.jsonl) L'invalidation est déjà actée
dans `AGENTS.md` et vaut ici comme partout : la voie adaptée ne demande jamais
à l'élève quel type d'apprenant il serait.

### Les filtres et calques colorés

Aucune source solide n'a été trouvée pour les soutenir, et aucune n'a été
enregistrée pour les réfuter : le sujet n'a pas été investigué ici. **Faute de
base, ils ne sont pas implémentés.** Ne pas confondre cette abstention avec une
réfutation.

---

## Les six mécanismes retenus

Chacun est rattaché à ce qui le fonde. Un mécanisme sans source ne rentre pas.

### 1. Un pas à la fois à l'écran

Une seule tâche visible, jamais un mur de texte. Ce qui suit attend derrière un
bouton.

*Fondement :* réduction de la charge extrinsèque
[SRC-PED-007](../sources/sources.jsonl), [SRC-PED-019](../sources/sources.jsonl).
La cible est l'inattention, pas la mémoire de travail seule — mais les deux
tirent dans le même sens ici.

### 2. La voix, à la demande

Chaque bloc de texte peut être lu à voix haute, sur commande de l'élève, jamais
automatiquement, avec réglage de vitesse. Le texte reste à l'écran pendant la
lecture.

*Fondement :* d = 0,35 sur la compréhension
[CLM-BEP-002](../evidence/claims.jsonl). **Avec sa réserve, qui doit être citée
avec l'effet** : le protocole est le seul modérateur significatif, et l'effet
tombe à 0,15 non significatif en intra-sujets.

*Et sa limite propre :* la synthèse vocale **contourne** le décodage, elle ne
l'enseigne pas. Elle donne accès au sens ; elle ne rend pas meilleur lecteur.
C'est exactement pourquoi le mécanisme 4 existe.

### 3. Le texte respire

Espacement des lettres et des mots augmenté, interligne large, lignes courtes,
alignement à gauche sans justification.

*Fondement :* [CLM-BEP-003](../evidence/claims.jsonl), statut `rapporté`. Aucune
valeur optimale n'est établie : les valeurs retenues sont un choix raisonnable,
pas un résultat. Elles sont réglables.

### 4. Les mots difficiles, avant le texte

Les mots que le module va demander de lire sont donnés avant, découpés en
syllabes, et lisibles à voix haute. Ce n'est pas un lexique : c'est un
entraînement au décodage, fait avant que le texte ne l'exige.

*Fondement :* c'est le premier levier de
[CLM-BEP-001](../evidence/claims.jsonl) — l'enseignement de l'identification des
mots est ce qui améliore la lecture. Le seul mécanisme de cette liste qui
**enseigne** au lieu d'accommoder.

### 5. Le compteur que l'élève tient lui-même

L'élève coche ses propres étapes et voit sa propre avancée. Personne d'autre ne
le voit. Rien n'est envoyé nulle part.

*Fondement :* c'est le second levier de
[CLM-BEP-001](../evidence/claims.jsonl) — l'auto-observation — et c'est aussi
l'une des deux familles d'intervention les mieux établies en classe pour le
TDAH. [CLM-BEP-005](../evidence/claims.jsonl)

*Ce que ce n'est pas :* un score, un classement, une série à ne pas rompre. La
charte du dépôt écarte ces ressorts, et l'auto-observation n'en a pas besoin —
son effet vient de l'acte d'observer, pas de la récompense.

### 6. La consigne reste affichée

La consigne ne disparaît jamais pendant qu'on y répond. Rien à retenir de tête.

*Fondement :* réduction de la charge en mémoire de travail
[SRC-PED-007](../sources/sources.jsonl). Mécanisme de bon sens, dont l'effet
propre n'a pas été isolé dans une source ouverte ici.

---

## Un choix, jamais une étiquette

`AGENTS.md` interdit qu'un profil d'élève soit nommé, écrit ou enregistré. La
voie adaptée doit donc être conçue de façon à ne pas devenir une étiquette
déguisée.

| Ce que c'est | Ce que ce n'est pas |
| --- | --- |
| Un bouton que n'importe qui peut appuyer | Un mode attribué à certains élèves |
| Réversible à tout instant, dans les deux sens | Un parcours dont on ne sort plus |
| Une préférence d'affichage, gardée dans le navigateur, comme le contraste | Une donnée sur l'élève, transmise ou conservée quelque part |
| Nommé par ce qu'il fait — « Pas à pas » | Nommé par ce qu'aurait l'élève — « mode dyslexie » |

Trois conséquences pratiques :

- **Rien n'est déduit.** Le site ne devine jamais qu'un élève « en aurait besoin » à partir de ses résultats. Il ne le propose pas non plus : il l'offre à tout le monde, tout le temps.
- **Le contenu ne change pas.** Même pièce, même pari, même verdict, même exigence. Ce qui change est la présentation et le rythme. Un élève qui passe d'une voie à l'autre ne perd rien et ne saute rien.
- **Aucun nom de trouble n'apparaît dans l'interface.** Ni dans les identifiants techniques que l'élève pourrait voir. Le nom du trouble appartient à l'élève et à sa famille, pas à un site web.

Cette conception a un effet secondaire heureux et assumé : un dispositif ouvert
à tous est utile bien au-delà de ceux pour qui il a été pensé — un élève
fatigué, un lecteur lent, un enfant qui découvre le français. C'est le principe
de la conception universelle. [SRC-PED-022](../sources/sources.jsonl)

---

## Le cadre français

Les aménagements pour un élève dont les difficultés durables ont pour origine
un trouble des apprentissages relèvent du **plan d'accompagnement personnalisé**,
dont la mise en place suppose un constat du médecin de l'Éducation nationale.
[CLM-BEP-006](../evidence/claims.jsonl)

Ce que cela implique pour ce site, et il faut être net :

**La voie « Pas à pas » n'est pas un PAP, ne le remplace pas, ne le déclenche
pas et ne le documente pas.** C'est un réglage d'affichage sur un site web. Un
enseignant peut la montrer à un élève ; il ne peut en tirer aucun constat, et le
site ne produit aucune trace qui pourrait servir à un dossier.

Un site ne diagnostique rien. Il n'en a ni le droit ni les moyens.

---

## Ce que nous ne savons pas

- **L'effet de l'ensemble n'est pas connu.** Chaque mécanisme est rattaché à une source ; leur combinaison n'a été évaluée nulle part. Six mesures dont chacune aide séparément peuvent s'annuler ou se gêner.
- **Les sources principales sont lues par leurs résumés.** Trois des cinq sources scientifiques sont sous abonnement : les tailles d'effet détaillées et les modérateurs n'ont pas été vérifiés dans les textes intégraux.
- **La base est étroite.** 14 études à cas unique pour la combinaison ; des effectifs faibles par construction.
- **Rien n'est établi pour le français langue de scolarisation.** Les sources sont anglophones. La transparence graphophonémique de l'anglais et du français diffère nettement, et l'apprentissage du décodage n'y pose pas les mêmes problèmes. **Aucune source française n'a été trouvée pour ce dossier** ; c'est la lacune la plus sérieuse de cette investigation.
- **Aucune valeur d'espacement, de longueur de ligne ou de découpage n'est fondée** sur une mesure. Ce sont des choix, faits pour être modifiés.

---

## Ce qui reste à faire

- Chercher des sources francophones, notamment sur le décodage en français et les aménagements en école élémentaire.
- Investiguer les calques et filtres colorés, pour pouvoir les refuser ou les retenir sur une base, et non par abstention.
- Vérifier les tailles d'effet de [SRC-BEP-002](../sources/sources.jsonl) et [SRC-BEP-004](../sources/sources.jsonl) dans les textes intégraux, via un accès institutionnel.
- Faire relire ce cahier des charges par une personne qui suit réellement des élèves concernés. Aucune revue de littérature ne remplace cela.
