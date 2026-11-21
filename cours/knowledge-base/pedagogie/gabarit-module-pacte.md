# Gabarit de module PACTE

**Usage :** structure obligatoire de tout module du cours interactif.
**Origine :** architecture PACTE de la charte Aethonyx v1.5, transposée au cadre scolaire.
**Appui :** `AUDIT_SCIENTIFIQUE_V1.5` — chaque étape s'appuie sur un mécanisme documenté, avec sa limite.
**Première application :** `cours/histoire/6e/modules/H6-04-cites-grecques.md`.

---

## 0. Avant d'écrire — l'unité-cible

> **Demain, l'élève doit pouvoir se rappeler que…**

Trois éléments, sans quoi le module n'est pas prêt :

1. la **pièce ou distinction centrale** ;
2. ce qu'elle **permet** de conclure ;
3. ce qu'elle **ne permet pas** de conclure.

Le troisième point est le plus souvent oublié, et c'est le plus formateur.
Un cours qui n'énonce pas sa limite apprend à conclure trop vite.

Renseigner ensuite l'ancrage réglementaire : niveau, thème et sous-thème du
programme applicable (`programmes-officiels/`), et l'identifiant de
l'affirmation correspondante dans `evidence/claims.jsonl`.

---

## P — Porte

**Rôle scolaire :** ouvrir un manque de savoir précis. Pas gagner un regard :
l'élève est déjà là.

- une scène, pas un sommaire : un lieu, une date, un objet, un geste ou une conséquence ;
- au plus **trois ancrages sensoriels**, tous issus des pièces ou explicitement étiquetés `RECONSTITUTION` ;
- une anomalie compréhensible sans connaissance préalable ;
- aucune introduction générique, aucun « aujourd'hui nous allons étudier ».

La porte peut faire rêver. Elle ne peut pas mentir sur le statut de ce qu'elle
montre.

---

## A — Anticipation

**Rôle :** obtenir une mise mentale **avant** la pièce.

Formes admises : question précise, alternative loyale, prédiction chiffrée,
règle conditionnelle, détail manquant dont la fonction est annoncée.

**Limite à connaître, et à respecter :** l'effet de préquestion est net sur
l'information *précisément* préquestionnée (`g = 0,54`) et quasi nul sur le
reste (`g = 0,04`, St Hilaire et al. 2024). Une grande question ne saupoudre
pas de mémoire sur tout le cours. **L'anticipation doit porter exactement sur
l'unité-cible.**

Si la prédiction appelle un chiffre que les sources n'établissent pas, ne pas
l'inventer : reformuler en alternative qualitative. Le dire à l'élève est
lui-même une leçon.

---

## C — Collision

**Rôle :** faire entrer la pièce, et son statut avec elle.

- nommer la pièce et donner sa provenance ;
- donner la date utile — celle qui sert au raisonnement ;
- afficher son **statut** dans le lexique canonique ;
- ménager un silence, une coupe ou un contraste avant elle ;
- ne jamais employer l'image, la musique ou la mise en page comme supplément de certitude.

La collision doit produire un écart réel entre l'attente et la pièce. Si la
pièce ne surprend pas, ne pas simuler la surprise.

---

## T — Transformation

**Rôle :** dire ce qui change, et ce qui ne change pas. **Double verdict
obligatoire.**

1. **verdict probatoire** — ce que la pièce autorise à conclure ;
2. **résidu**, classé : `probatoire`, `archivistique` ou `réflexif`.

Le résidu n'est jamais une porte de secours pour une hypothèse fermée. En
histoire, l'absence d'un groupe dans une source ne prouve pas son absence dans
le monde : discuter les silences, les biais de conservation et les conditions
de production.

La réserve doit recevoir un temps, une lisibilité et une diction **au moins
égaux** à l'affirmation qu'elle limite.

---

## E — Extraction

**Rôle :** obliger le souvenir à sortir. C'est l'étape qui pèse le plus lourd
en contexte scolaire, et la plus souvent bâclée.

- une micro-récupération **après** le verdict, jamais avant ;
- elle demande de reformuler la pièce, la portée ou la limite — pas un nom propre, pas une opinion, pas un camp ;
- la réponse correcte doit être disponible ;
- un **rappel différé est programmé** : indice à J+1, réactivation dans un module ultérieur, application à un cas nouveau.

Appui : le rappel actif surpasse la réétude à deux jours et à une semaine
(Roediger & Karpicke 2006), et l'espacement des reprises conditionne la
rétention (Cepeda et al. 2006). Répéter le même énoncé n'est pas espacer :
il faut **reconstruire** la réponse à partir d'un indice.

---

## Contrôles avant publication

Reprendre la checklist v1.5, section par section. Les points qui échouent le
plus souvent :

- [ ] l'unité-cible énonce une limite, pas seulement un savoir ;
- [ ] l'anticipation porte sur la cible, pas sur un décor spectaculaire ;
- [ ] le statut de chaque pièce est visible **au moment** où elle sert ;
- [ ] le résidu est classé, et n'est pas un mystère artificiellement rouvert ;
- [ ] la question d'extraction a une réponse disponible ;
- [ ] le rappel différé est réellement programmé dans un module nommé ;
- [ ] chaque image porte une étiquette et une fonction d'apprentissage ; les images décoratives sont retirées de la seconde d'encodage ;
- [ ] l'humour encode une distinction — *test du jambon* : si la blague survit intacte au retrait du fait, elle mange le budget cognitif ;
- [ ] aucune référence, page, citation ou chiffre n'a été inventé.

## Mesure — quatre tableaux séparés

| Dimension | Ce qu'on observe | Ce que cela ne prouve pas |
| --- | --- | --- |
| Attention | engagement, abandon, retours | la compréhension |
| Compréhension | réponse immédiate sur portée **et** limite | le souvenir durable |
| Mémoire | rappel indicé à J+1 et J+7 | le transfert |
| Transfert | application à un cas inédit | l'adhésion |

**Condition d'arrêt du moteur adaptatif.** Une hausse d'attention accompagnée
d'une baisse de compréhension n'est pas un succès : c'est le signe qu'on a
construit une machine à engagement. Le site doit alors reculer, pas amplifier.
