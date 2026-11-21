# Cours interactif

Des cours de collège qui se lisent comme une enquête : une porte, un pari, une
pièce, un verdict, et ce qu'on en retient. Ni score, ni classement, ni compteur
de série.

Le dépôt contient deux choses : le **site** que les élèves ouvrent, et la **base
de connaissances** qui sert à l'écrire — sources, affirmations, limites, et les
outils qui vérifient que l'un ne dit rien que l'autre n'établisse.

## Ce qui existe

| | |
| --- | --- |
| **Français CE2** | 10 modules, les cinq domaines du programme |
| **Français 6e** | 9 modules, dont les cinq entrées de culture littéraire |
| **Histoire 6e** | 9 modules, les trois thèmes du programme |
| **Géographie 6e** | 7 modules, les quatre thèmes du programme |
| **Sciences et technologie 6e** | 11 modules, les quatre thèmes du programme |
| **EMC 6e** | 6 modules, les trois parties du programme |
| Histoire 5e, 4e, 3e | 27 modules déclarés, non écrits |

**La classe de 6e est complète dans les cinq disciplines** — français, histoire,
géographie, sciences et technologie, EMC. 52 modules, 52 objets-mémoire dessinés,
plus les exercices générés de mathématiques.

Une **voie « Pas à pas »** double chaque module : un pas à la fois, texte plus
aéré, mots difficiles donnés avant, lecture à voix haute, et un suivi que
l'élève tient lui-même. Voir plus bas.

Les hubs connaissent les modules **avant** qu'ils soient écrits : la carte du
programme (`site/programme.json`) déclare tout, l'index (`site/modules/index.json`)
dit ce qui est disponible. Un module ajouté apparaît sans qu'on touche à une page.

## Démarrage

```bash
python -m http.server 8792 --directory site
```

Puis `http://localhost:8792`. Le site est en HTML, CSS et modules ES natifs :
aucune dépendance, aucune étape de construction.

Après avoir ajouté ou corrigé un module :

```bash
python site/construire.py
```

Il régénère la carte et l'index depuis les fichiers présents.

## Structure

| Chemin | Rôle |
| --- | --- |
| `site/` | Le site. `index.html` → `niveau.html` → `discipline.html` → `module.html`. |
| `site/modules/*.json` | Un module par fichier. C'est là qu'est le contenu. |
| `site/socle.js` | Progression, rappels différés, différenciation. Rien n'est envoyé nulle part. |
| `site/schemas-outils.json` | Les objets-mémoire dessinés, un par module. Un outil, un dessin, réaffiché à l'identique. |
| `site/exercices.js` | Générateurs d'exercices, seuils de maîtrise, point de départ. Un générateur sans source n'y entre pas. |
| `site/verifier.py` | Contrôle structurel des modules et des schémas. À relancer après toute retouche. |
| `site/worker.js` | Marge, la compagne conversationnelle. Non déployée. |
| `knowledge-base/sources/` | Registre bibliographique : autorité, périmètre, date de consultation. |
| `knowledge-base/evidence/` | Registre d'affirmations : preuve, inférence autorisée, limite, confiance. |
| `knowledge-base/rag/` | Index lexical en JSONL — versionnable et relisible, pas une base vectorielle opaque. |
| `knowledge-base/programmes-officiels/` | Ce qui est réellement applicable en 2026-2027, avec les limites de chaque lecture. |
| `AGENTS.md` | Les règles que suit quiconque écrit du contenu ici. À lire avant d'ajouter un module. |
| `site/plan-*.json` | Une carte de programme déclarée à la main. En déposer une suffit : rien à modifier ailleurs. |
| `production-video/` | Matière et consignes pour produire les vidéos. |

## Comment un module est fait

Cinq étapes, dans cet ordre, et l'ordre est le dispositif :

**Porte** — une affirmation ordinaire, qui a l'air juste.
**Anticipation** — l'élève parie avant de savoir. Le pari n'est ni ramassé ni noté.
**Collision** — une pièce authentique, et le travail dessus.
**Transformation** — ce que la pièce établit, ce qu'elle n'établit pas, et l'affirmation de départ réécrite.
**Extraction** — deux questions de mémoire, après le verdict.

Chaque module introduit **un objet-mémoire** : un outil concret qui pose une
question. Le tamis, le tampon, la balance en histoire ; le bocal, le repère, la
fenêtre en sciences. Chacun est réactivé plus tard, dans un autre module —
et certaines réactivations sont des **échecs délibérés** : l'outil ne convient
pas, et le module dit pourquoi. C'est voulu. Un outil qui s'applique partout
n'apprend rien.

Les statuts de preuve emploient un lexique fixe : *établi, probable, rapporté,
possible, non acquis, réfuté, indéterminé*. Le programme officiel de sciences
prescrit lui-même de « distinguer les savoirs scientifiques — qui reposent sur
des faits éprouvés — des croyances ou de la simple opinion » : le lexique n'est
pas un ajout, il répond à une demande du texte.

## Schémas, et typographie par cycle

**Chaque module a son objet-mémoire dessiné** — trente schémas, un par outil,
dans `site/schemas-outils.json`. Le module qui introduit l'outil affiche le
dessin ; celui qui le réactive affiche **exactement le même**. C'est ce que
« revenir à l'identique » veut dire, et c'était jusqu'ici une promesse sans
mise en œuvre.

Un schéma n'entre dans un module que s'il rend visible une **relation** que le
texte énonce. Chacun déclare ce qu'il montre **et ce qu'il ne montre pas** —
la seconde phrase n'est pas une précaution, c'est la moitié du travail. Celui
de ST6-10 porte des axes délibérément sans graduation, parce qu'aucun chiffre
de ce module n'est établi par une source ; celui de H6-04 enferme dans un cadre
en pointillé ce que le chapitre 43 ne permet pas d'établir.

La typographie suit le cycle : corps plus grand et lignes plus courtes à
l'école, réglage standard au collège. La direction vient de Katzir, Hershko &
Halamish (2013) — mais **aucune des valeurs n'est mesurée** : l'étude porte sur
90 enfants, en hébreu, et ne donne aucune valeur absolue. Ce sont des choix,
faits pour être modifiés, et le commentaire de `style.css` le dit à l'endroit
où quelqu'un les changera.

## Exercices générés et progression à la maîtrise

Le programme de mathématiques demande des « activités rituelles de calcul » et
**énumère nommément** les automatismes attendus en sixième. Une banque
d'exercices s'épuise ; un générateur non — et il permet la reprise espacée.

```bash
site/entrainement.html?d=mathematiques&n=6e   # s'entraîner
site/positionnement.html?d=mathematiques&n=6e # six questions, un point de départ
```

**Trois états, un seul chemin** : à travailler → *acquis* après cinq réussites
d'affilée → *confirmé* après une reprise le lendemain. La reprise différée
n'est pas un ornement : sans elle on mesure la mémoire de la minute, pas un
automatisme. Rien ne redescend tout seul.

**Le seuil est un choix, pas une mesure.** L'effet de l'apprentissage par
maîtrise dépend de la sévérité du critère retenu, et il **coûte du temps
d'enseignement** — les deux moitiés du résultat sont enregistrées
([CLM-PED-025](knowledge-base/evidence/claims.jsonl)). Les valeurs sont
regroupées en tête de `site/exercices.js` pour être discutées.

**Ni score, ni classement, ni série, ni chronomètre.** Le programme donne
lui-même le ressort : la maîtrise d'automatismes « produit souvent des progrès
rapides, ce qui engage les élèves dans un cercle vertueux ».

### Le positionnement n'est pas un profil

Six questions par dichotomie déposent l'élève au premier palier où il y a
quelque chose à travailler. C'est une **position dans une progression** : elle
se recalcule à chaque exercice, elle n'est jamais transmise, et **l'élève peut
la déplacer ou l'effacer lui-même**.

Ce que le test ne fait pas, et ne fera pas : mesurer des « aptitudes » pour
orienter vers un format supposé adapté. Apparier un enseignement à un style
déclaré n'améliore pas les résultats
([CLM-PED-026](knowledge-base/evidence/claims.jsonl)). Ce qui est recalculé,
c'est ce avec quoi l'élève réussit réellement.

## La voie « Pas à pas »

Un bouton, dans la barre du haut, sur toutes les pages. Il change six choses :
un pas à la fois à l'écran, la lecture à voix haute à la demande, un texte plus
espacé et des lignes plus courtes, les mots difficiles donnés et découpés
**avant** la lecture, un suivi que l'élève coche lui-même, et la consigne qui
ne disparaît jamais pendant qu'on y répond.

Chaque mécanisme est rattaché à une source, et trois choses très répandues sont
écartées faute de preuve — dont les polices dites adaptées à la dyslexie, qui
n'améliorent ni la vitesse ni l'exactitude de lecture. Le cahier des charges
complet, avec ce qu'on ne sait pas, est dans
[`knowledge-base/pedagogie/voie-adaptee-tdah-dyslexie.md`](knowledge-base/pedagogie/voie-adaptee-tdah-dyslexie.md).

Trois points de principe, qui ne sont pas négociables :

- **C'est un choix, pas une étiquette.** Le bouton est ouvert à tout le monde, réversible à tout instant. Le site ne devine jamais qui « en aurait besoin », ne le propose à personne en particulier, et ne conserve qu'une préférence d'affichage dans le navigateur — comme le contraste.
- **Le contenu ne change pas.** Même pièce, même pari, même verdict, même exigence. Ce qui change est la présentation et le rythme.
- **Aucun nom de trouble n'apparaît** — ni dans l'interface, ni dans le nom de la classe CSS, ni dans la clef de stockage. Ce n'est ni un diagnostic, ni un PAP, ni une trace qui pourrait servir à un dossier.

## Vidéos

`site/notebooklm.py` produit, pour chaque module, la **source unique** à déposer
dans NotebookLM et la consigne à lui donner. Source unique : ce qui n'entre pas
dans le carnet ne peut pas ressortir dans la vidéo.

Le fichier produit va dans `production-video/vidéo/`, puis :

```bash
python site/videos.py            # propose une association, n'écrit rien
python site/videos.py --ecrire   # applique
```

Pour une vidéo hébergée ailleurs — YouTube en non répertoriée, Vimeo :

```bash
python site/videos.py --lien=H6-04=https://youtu.be/xxxxxxxxxxx --ecrire
```

Les fichiers vidéo sont **hors du dépôt** — vingt mégaoctets pièce. Le site
sert les fichiers locaux par une jonction `site/medias/video`, et n'héberge
rien de ce qui est sur une plateforme. Le fichier maître reste dans
`production-video/vidéo/` : une plateforme est un canal de diffusion, jamais
une sauvegarde. Voir `production-video/LISEZ-MOI.md`.

Avant de brancher une vidéo, vérifier qu'elle est lisible ailleurs que dans VLC :

```bash
python site/videos.py --normaliser            # signale, ne touche à rien
python site/videos.py --normaliser --ecrire   # écrit une version corrigée à côté
```

Le piège vient de la **chroma**. Certains exportateurs d'avatar rendent en
H.264 « High 4:4:4 Predictive », chroma `yuv444p` : le fichier est parfaitement
valide, il s'ouvre dans VLC, et il reste noir dans un navigateur comme dans le
lecteur de Windows. Aucun message n'explique pourquoi. Le web ne lit en pratique
qu'une chose : **H.264 en yuv420p**.

**Aucune requête avant le clic.** Une intégration YouTube posée dans la page
contacte Google dès l'ouverture du module, avant que l'élève ait rien demandé.
Le site affiche donc une façade locale : rien ne part tant que personne n'a
cliqué, et l'adresse employée est `youtube-nocookie.com` avec `rel=0`. Cela
réduit le pistage ; cela ne l'annule pas, et aucune notice ne doit prétendre
le contraire.

## Vérifier la base de connaissances

```bash
python knowledge-base/rag/retrieve.py "critique des sources historiques" --domain histoire --top-k 5
python knowledge-base/rag/validate.py
```

La première récupère des passages avec leurs identifiants et leurs liens. La
seconde contrôle que l'index, le registre de sources et le registre
d'affirmations se renvoient bien les uns aux autres. Bibliothèque standard
uniquement.

**RAG** répond à « quels éléments faut-il relire ? ». **RLM** répond à « comment
raisonner sans perdre la provenance ni les désaccords ? » — protocole explicite
et vérifiable, pas des appels récursifs automatiques à un modèle.

## Ce que le dépôt ne contient pas

Aucune donnée d'élève, aucun nom, aucun résultat. La progression d'un élève vit
dans son navigateur et n'est envoyée nulle part ; le site ne conserve aucun
profil et recalcule l'adaptation à chaque affichage.

Aucune clé, aucun jeton. `MISTRAL_API_KEY` n'apparaît que comme nom de liaison ;
la valeur vit dans les Secrets chiffrés du Worker, jamais dans un fichier.

## Licence

**[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr)**
— identifiant SPDX `CC-BY-NC-SA-4.0`, texte intégral dans [`LICENSE`](LICENSE).

Vous pouvez reprendre, adapter et diffuser ces modules, à trois conditions :
en **citer la source**, ne pas en faire d'**usage commercial**, et partager vos
adaptations sous la **même licence**. Un collègue qui veut s'en servir en classe
n'a donc rien à demander.

GitHub affiche « Other » : les variantes non commerciales de Creative Commons
ne figurent pas dans sa liste de licences reconnues. La licence n'en est pas
moins celle-ci.

Deux réserves. Les **pièces citées** dans les modules — textes, images, vidéos —
restent la propriété de leurs auteurs, sont créditées à l'endroit où elles
servent, et ne sont pas couvertes par cette licence. Les **programmes officiels**
cités relèvent du régime des textes réglementaires français.
