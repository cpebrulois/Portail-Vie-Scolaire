# -*- coding: utf-8 -*-
"""Prépare, pour chaque module, de quoi faire produire une vidéo par NotebookLM.

NotebookLM ne connaît QUE les sources qu'on lui dépose. C'est sa qualité : il
n'ira pas chercher ailleurs. Mais c'est aussi ce qui commande la méthode —
tout ce qu'on veut voir dans la vidéo doit être dans la matière, et tout ce
qu'on refuse d'y voir doit y être écrit comme une interdiction.

Deux fichiers par module :

  source.md    la matière à déposer comme SOURCE. Elle contient le savoir, la
               pièce, son statut, et une section « ce qu'il ne faut pas dire ».
               Placer les interdits dans la source plutôt que dans la consigne
               est décisif : un modèle s'appuie sur ses sources, il se contente
               de tenir compte d'une consigne.

  consigne.md  le texte à coller dans la personnalisation de la génération.

Le piège connu de l'exercice : les voix de NotebookLM sont enjouées, elles
s'émerveillent, elles arrondissent. Un « rapporté » devient « on sait que »,
une hypothèse devient un fait. La source et la consigne travaillent toutes
les deux contre cette pente.

Usage :  python site/notebooklm.py
"""
import json, io, sys, os, re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
MODULES = os.path.join(ICI, 'modules')
SORTIE = os.path.join(RACINE, 'production-video')
SOURCES = os.path.join(RACINE, 'knowledge-base', 'sources', 'sources.jsonl')

LEXIQUE = "établi — probable — rapporté — possible — non acquis — réfuté — indéterminé"


def net(t):
    """Retire le balisage HTML : NotebookLM lit du texte, pas des balises."""
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', str(t or ''))).strip()


def registre_sources():
    d = {}
    for ligne in open(SOURCES, encoding='utf-8'):
        s = json.loads(ligne)
        d[s['id']] = s
    return d


def source_md(m, reg):
    p = (m.get('collision') or {}).get('piece') or {}
    src = reg.get(p.get('src'), {})
    t = m.get('transformation') or {}
    outil = (m.get('collision') or {}).get('outil') or {}
    residu = t.get('residu') or {}
    cible = m.get('cible') or {}

    L = []
    A = L.append
    A("# %s — %s" % (m['id'], m['titre']))
    A("")
    A("Matière destinée à la production d'une vidéo de cours.")
    A("Niveau %s. %s." % (m.get('niveau', ''), net(m.get('theme'))))
    A("")

    A("## Ce que la vidéo doit faire retenir")
    A("")
    A("> %s." % net(cible.get('enonce')))
    A("")
    A("**Ce que la pièce permet de conclure.** %s" % net(cible.get('permet')))
    A("")
    A("**Ce qu'elle ne permet PAS de conclure.** %s" % net(cible.get('nePermetPas')))
    A("")
    A("Cette seconde phrase est aussi importante que la première. Une vidéo qui")
    A("énonce le savoir sans sa limite a manqué l'essentiel du cours.")
    A("")

    A("## La pièce")
    A("")
    A("- **Nom** : %s" % p.get('nom', ''))
    A("- **Attribution** : %s" % p.get('attribution', ''))
    A("- **Où on la consulte** : %s" % p.get('ou', ''))
    if src.get('url'):
        A("- **Adresse** : %s" % src['url'])
    A("- **Statut probatoire** : « %s »" % p.get('statut', ''))
    A("- **Ce qu'elle contient** : %s" % net(p.get('contenu')))
    if src.get('notes'):
        A("- **Réserve portée au registre des sources** : %s" % src['notes'])
    A("")

    A("## Le verdict")
    A("")
    A("**Ce que la pièce établit.** %s" % net(t.get('etablit')))
    A("")
    A("**Ce qu'elle n'établit pas.** %s" % net(t.get('netablitPas')))
    A("")
    if t.get('bascule'):
        A(net(t.get('bascule')))
        A("")
    A("**Résidu, catégorie « %s ».** %s" % (residu.get('categorie', ''), net(residu.get('texte'))))
    A("")
    if t.get('garde'):
        A("**Règle à emporter.** %s" % net(t.get('garde')))
        A("")

    if outil:
        A("## L'outil de pensée")
        A("")
        A("**%s.** %s" % (outil.get('nom', ''), net(outil.get('texte'))))
        A("")
        A("Cet outil revient à l'identique dans d'autres cours. Son nom et sa")
        A("formulation ne doivent pas être modifiés.")
        A("")

    A("## Vocabulaire probatoire, fixe")
    A("")
    A("Les seuls mots admis pour qualifier ce qu'une source permet de conclure :")
    A("")
    A("%s" % LEXIQUE)
    A("")
    A("Ils ne se remplacent pas par des synonymes. « Rapporté » ne devient jamais")
    A("« avéré », « connu », ni « bien sûr que ».")
    A("")

    A("## Ce qu'il ne faut pas dire")
    A("")
    A("Cette section fait partie de la matière. Ce ne sont pas des préférences de")
    A("style : chaque interdit correspond à une erreur que le cours corrige.")
    A("")
    A("- Ne pas affirmer que la pièce établit plus que ce qui est écrit plus haut.")
    A("- Ne pas transformer le statut « %s » en certitude." % p.get('statut', ''))
    A("- Ne rien ajouter qui ne figure pas dans ce document : ni date, ni chiffre,")
    A("  ni proportion, ni nom d'auteur, ni anecdote. S'il en manque un, dire qu'il")
    A("  n'est pas établi ici plutôt que de l'inventer.")
    A("- Ne pas conclure de l'absence d'un groupe dans une source qu'il était absent")
    A("  du monde : c'est une information sur la source.")
    A("- Ne pas s'émerveiller, ne pas dramatiser, ne pas dire que c'est incroyable")
    A("  ou fascinant. Le ton est celui d'un adulte qui explique à un élève quelque")
    A("  chose qu'il trouve intéressant, pas celui d'une bande-annonce.")
    A("- Ne pas s'adresser à un public d'adultes cultivés : le destinataire a entre")
    A("  onze et quinze ans.")
    A("- Ne pas terminer sur une révélation. La fin, c'est la limite, puis la question.")
    A("")

    A("## Trace écrite du cours")
    A("")
    A(net(m.get('trace')))
    A("")
    return "\n".join(L)


def consigne_md(m):
    p = (m.get('collision') or {}).get('piece') or {}
    outil = (m.get('collision') or {}).get('outil') or {}
    cible = net((m.get('cible') or {}).get('enonce'))

    L = []
    A = L.append
    A("# Consigne de génération — %s" % m['id'])
    A("")
    A("À coller dans la personnalisation, au moment de lancer la génération.")
    A("Déposer d'abord `source.md` comme source unique du carnet.")
    A("")
    A("---")
    A("")
    A("Public : élèves de collège de %s, onze à quinze ans. Français simple," % m.get('niveau', ''))
    A("phrases courtes, aucun anglicisme.")
    A("")
    A("Durée visée : trois à cinq minutes.")
    A("")
    A("Objectif unique : faire retenir que %s." % cible)
    A("")
    A("Plan imposé, dans cet ordre :")
    A("1. une scène concrète qui pose le problème, sans donner la réponse ;")
    A("2. la pièce, nommée, avec son statut probatoire dit à voix haute ;")
    A("3. ce que la pièce établit ;")
    A("4. ce qu'elle n'établit pas — cette partie reçoit autant de temps que la précédente ;")
    if outil:
        A("5. l'outil « %s », énoncé exactement comme dans la source ;" % outil.get('nom', ''))
        A("6. une question posée à l'auditeur, laissée sans réponse.")
    else:
        A("5. une question posée à l'auditeur, laissée sans réponse.")
    A("")
    A("Interdits, repris de la source :")
    A("- ne rien ajouter qui n'y figure pas, aucune date ni aucun chiffre ;")
    A("- ne pas transformer le statut « %s » en certitude ;" % p.get('statut', ''))
    A("- pas d'émerveillement, pas de « incroyable », pas de « fascinant » ;")
    A("- ne pas conclure sur une révélation : la fin, c'est la limite, puis la question.")
    A("")
    A("Ton : un adulte qui explique à un élève quelque chose qu'il trouve")
    A("intéressant. Ni animateur, ni conférencier.")
    A("")
    A("---")
    A("")
    A("## Où placer la vidéo produite")
    A("")
    A("Emplacement `medias.transformation` du module %s — donc **après le verdict**." % m['id'])
    A("Une vidéo qui explique la réponse ne peut pas précéder la Collision : elle")
    A("donnerait le verdict avant que l'élève ait parié.")
    A("")
    A("Déposer le fichier dans `production-video/vidéo/`, puis :")
    A("")
    A("```")
    A("python site/videos.py            # propose, n'écrit rien")
    A("python site/videos.py --ecrire   # applique")
    A("```")
    A("")
    A("Le script associe le fichier au bon module et renseigne `url`, `source`")
    A("et `licence`. Il ne peut pas deviner la **transcription** : elle reste à")
    A("renseigner à la main dans `site/modules/%s.json`. NotebookLM fournit le" % m['id'])
    A("texte, elle n'a donc pas à être retapée — mais sans elle, le lecteur")
    A("affiche « transcription manquante », et il a raison de le faire.")
    A("")
    A("## À relire avant de publier")
    A("")
    A("- [ ] le statut de la pièce est dit, et il n'a pas été durci ;")
    A("- [ ] la limite occupe autant de temps que le savoir ;")
    A("- [ ] aucune date ni aucun chiffre absent de la source n'a été ajouté ;")
    A("- [ ] l'outil est énoncé mot pour mot comme dans les autres modules ;")
    A("- [ ] la vidéo se termine sur une question, pas sur une conclusion ;")
    A("- [ ] rien n'est présenté comme certain qui ne le soit pas.")
    A("")
    A("Si un seul point échoue, régénérer plutôt que corriger au montage : le")
    A("défaut vient de la matière ou de la consigne, pas de la voix.")
    A("")
    return "\n".join(L)


def lisez_moi():
    return """# Production des vidéos de cours

Un dossier par module. Chacun contient la matière à déposer dans NotebookLM
et la consigne à lui donner.

## Marche à suivre

1. Créer un carnet, et y déposer **`source.md` comme source unique**. Ne rien
   ajouter d'autre : tout ce qui entre dans le carnet peut ressortir dans la
   vidéo, y compris ce qu'on n'avait pas prévu.
2. Lancer une génération de synthèse — audio ou vidéo selon ce qui est
   disponible — et coller le contenu de `consigne.md` dans la personnalisation.
3. Relire la production avec la liste de contrôle qui termine `consigne.md`.
4. Déposer le fichier dans **`vidéo/`**, puis brancher (voir ci-dessous).

## Brancher une vidéo sur son module

```
python site/videos.py            # propose, n'écrit rien
python site/videos.py --ecrire   # applique
```

Le script associe chaque fichier au module dont il parle, par recouvrement de
mots pondéré. Il refuse de trancher quand deux modules sont proches, et le dit
plutôt que de deviner : préfixer le nom du fichier par l'identifiant du module
— `ST6-04 — Le signal.mp4` — lève l'hésitation une fois pour toutes.

Le site sert `vidéo/` tel quel, à travers une jonction `site/medias/video`.
Aucune copie n'est faite, et un fichier déposé est immédiatement disponible.
Si la jonction a disparu (dépôt recloné, dossier déplacé), la recréer :

```
New-Item -ItemType Junction -Path "site\\medias\\video" -Target "production-video\\vidéo"
```

Ces fichiers sont **exclus du dépôt Git** : vingt mégaoctets par vidéo n'ont
rien à y faire. Ils ne sont donc pas sauvegardés par le dépôt — la copie de
référence est celle de ce dossier. Pour la mise en ligne, ils devront être
hébergés à part : les assets d'un Worker ne sont pas faits pour cette taille.

## Pourquoi la source unique

NotebookLM ne se fonde que sur ce qu'on lui donne, et c'est précisément ce qui
rend la méthode utilisable en classe : la vidéo ne pourra pas inventer une
date ou durcir un statut, faute d'avoir de quoi. Ajouter un manuel, un article
ou une page encyclopédique dans le même carnet ruine cette garantie.

## Ce que ces fichiers ne peuvent pas garantir

Une génération reste une génération. Les voix ont une pente naturelle vers
l'enthousiasme et l'arrondi : elles transforment volontiers « rapporté » en
« on sait que ». La source et la consigne luttent contre cette pente ; elles
ne la suppriment pas. **Aucune vidéo ne se publie sans avoir été écoutée en
entier**, la liste de contrôle sous les yeux.

## Les fichiers sont produits, jamais écrits à la main

`python site/notebooklm.py` les régénère depuis les modules. Corriger un
module, puis relancer — ne pas retoucher `source.md`, qui serait écrasé.
"""


def main():
    reg = registre_sources()
    os.makedirs(SORTIE, exist_ok=True)
    open(os.path.join(SORTIE, 'LISEZ-MOI.md'), 'w', encoding='utf-8',
         newline='\n').write(lisez_moi())

    faits = 0
    for f in sorted(os.listdir(MODULES)):
        if not f.endswith('.json') or f == 'index.json':
            continue
        m = json.load(open(os.path.join(MODULES, f), encoding='utf-8'))
        d = os.path.join(SORTIE, m['id'])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'source.md'), 'w', encoding='utf-8', newline='\n').write(source_md(m, reg))
        open(os.path.join(d, 'consigne.md'), 'w', encoding='utf-8', newline='\n').write(consigne_md(m))
        faits += 1
        print("  %s : source.md %5d o · consigne.md %5d o"
              % (m['id'],
                 os.path.getsize(os.path.join(d, 'source.md')),
                 os.path.getsize(os.path.join(d, 'consigne.md'))))
    print("\n%d dossier(s) préparé(s) dans production-video/, plus LISEZ-MOI.md" % faits)


main()
