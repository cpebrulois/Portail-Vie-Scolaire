# -*- coding: utf-8 -*-
"""Contrôle structurel des modules et des schémas.

    python site/verifier.py

Ce que le script vérifie :

  MODULES     JSON valide, champs PACTE obligatoires, rappel entrant qui
              pointe vers un module existant et annonce le bon outil, renvois
              de rappels vers des modules qui existent, tableaux d'outils
              citant des outils réels, accents non corrompus.

  SCHÉMAS     un dessin par outil et un seul, XML valide, viewBox sans
              width/height, <title> relié par aria-labelledby, aucune couleur
              écrite en dur, classes connues, « montre » et « neMontrePas »
              renseignés.

CE QUE CE SCRIPT NE PEUT PAS VÉRIFIER, et c'est le piège qui s'est refermé une
fois : **la largeur du texte rendu**. Un libellé peut tenir dans les
coordonnées et déborder le cadre une fois affiché, parce que sa largeur dépend
de la police. Seize schémas sur trente étaient dans ce cas sans qu'aucun
contrôle statique le voie. Il faut un navigateur pour le savoir :

    const b = svg.getBBox();   // comparer à svg.viewBox.baseVal

Un contrôle qui rassure sans mesurer la bonne chose est pire qu'aucun contrôle.
La ligne ci-dessus est donc à relancer après toute retouche d'un schéma.
"""
import json, io, sys, os, re, glob, unicodedata
import xml.etree.ElementTree as ET

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ICI = os.path.dirname(os.path.abspath(__file__))
MODULES = os.path.join(ICI, 'modules')
REGISTRE = os.path.join(ICI, 'schemas-outils.json')

OBLIGATOIRES = ['id', 'titre', 'discipline', 'niveau', 'theme', 'cible', 'porte',
                'anticipation', 'collision', 'transformation', 'extraction',
                'rappels', 'trace', 'reussite', 'differenciation']

CLASSES_SVG = {'trait', 'mince', 'plein', 'appui', 'appui-plein', 'alerte',
               'alerte-plein', 'pointille', 'petit', 'cle', 'rouge'}

erreurs, avertis = [], []


def norm(s):
    s = unicodedata.normalize('NFD', (s or '').lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r"^(les |le |la |l')", '', s).strip()


# ── Modules ──────────────────────────────────────────────────────────────────
mods = {}
for f in sorted(glob.glob(os.path.join(MODULES, '*.json'))):
    if os.path.basename(f) == 'index.json':
        continue
    try:
        d = json.load(open(f, encoding='utf-8'))
    except Exception as e:
        erreurs.append("%s : JSON invalide — %s" % (os.path.basename(f), e))
        continue
    mods[d.get('id', os.path.basename(f))] = d

outil_de = {i: ((d.get('collision') or {}).get('outil') or {}).get('nom', '')
            for i, d in mods.items()}
noms_outils = {norm(v) for v in outil_de.values() if v}

for i in sorted(mods):
    d = mods[i]
    for champ in OBLIGATOIRES:
        if champ not in d:
            erreurs.append("%s : champ « %s » manquant" % (i, champ))

    r = d.get('rappelEntrant')
    if r:
        cible = r.get('module')
        if cible not in mods:
            erreurs.append("%s : rappelEntrant vers %s, qui n'existe pas" % (i, cible))
        else:
            if norm(r.get('outil')) != norm(outil_de.get(cible, '')):
                erreurs.append("%s : rappelEntrant annonce « %s » mais %s introduit « %s »"
                               % (i, r.get('outil'), cible, outil_de.get(cible)))
            if mods[cible].get('discipline') != d.get('discipline'):
                avertis.append("%s : rappelEntrant traverse les disciplines (vers %s)" % (i, cible))
        for c in ('question', 'attendu', 'puis', 'echec', 'lecon'):
            if not r.get(c):
                erreurs.append("%s : rappelEntrant sans « %s »" % (i, c))

    for rap in d.get('rappels', []):
        for ref in re.findall(r'\b([A-Z]{1,3}[A-Z0-9]{0,3}-\d\d)\b', rap.get('quand', '')):
            if ref not in mods:
                erreurs.append("%s : rappel programmé sur %s, qui n'existe pas" % (i, ref))

    # module.html ne rend le tableau d'outils que dans la Transformation.
    if (d.get('collision') or {}).get('outils'):
        erreurs.append("%s : tableau d'outils dans la Collision — il ne sera jamais affiché" % i)
    tbl = (d.get('transformation') or {}).get('outils')
    if tbl:
        for l in tbl.get('lignes', []):
            if norm(l.get('outil')) not in noms_outils:
                avertis.append("%s : tableau d'outils cite « %s », introduit par aucun module"
                               % (i, l.get('outil')))

    brut = open(os.path.join(MODULES, i + '.json'), encoding='utf-8').read()
    if re.search(r'Ã.|â€.|ï¿½', brut):
        erreurs.append("%s : accents corrompus" % i)


# ── Schémas ──────────────────────────────────────────────────────────────────
reg = json.load(open(REGISTRE, encoding='utf-8')) if os.path.exists(REGISTRE) else {}

for i in sorted(mods):
    if i not in reg:
        erreurs.append("%s : aucun schéma d'objet-mémoire" % i)
    elif reg[i].get('nom') != outil_de[i]:
        erreurs.append("%s : le schéma dit « %s », le module « %s »"
                       % (i, reg[i].get('nom'), outil_de[i]))
for i in reg:
    if i not in mods:
        avertis.append("schéma orphelin : %s ne correspond à aucun module" % i)

for i in sorted(reg):
    o = reg[i]
    if not o.get('montre'):
        erreurs.append("%s : « montre » vide" % i)
    if not o.get('neMontrePas'):
        erreurs.append("%s : « neMontrePas » vide — un schéma sans limite n'entre pas" % i)
    svg = o.get('svg', '')
    try:
        racine = ET.fromstring(svg)
    except ET.ParseError as e:
        erreurs.append("%s : SVG invalide — %s" % (i, e))
        continue
    if not racine.get('viewBox'):
        erreurs.append("%s : pas de viewBox" % i)
    if racine.get('width') or racine.get('height'):
        erreurs.append("%s : width/height fixes — le dessin ne sera pas fluide" % i)

    lab = racine.get('aria-labelledby')
    titres = [e for e in racine.iter() if e.tag.endswith('title')]
    if not titres:
        erreurs.append("%s : pas de <title> — dessin muet pour un lecteur d'écran" % i)
    elif not lab or titres[0].get('id') != lab or not (titres[0].text or '').strip():
        erreurs.append("%s : <title> vide ou non relié par aria-labelledby" % i)

    for m in re.findall(r'(?:fill|stroke)\s*[=:]\s*["\']?(#[0-9a-fA-F]{3,8}|rgb[^"\';)]*\)'
                        r'|\b(?:red|blue|green|black|white|grey|gray|orange|yellow)\b)', svg):
        erreurs.append("%s : couleur en dur « %s » — le schéma ne suivra pas le thème" % (i, m))

    for c in re.findall(r'class="([^"]+)"', svg):
        for u in c.split():
            if u not in CLASSES_SVG:
                erreurs.append("%s : classe SVG « %s » inconnue" % (i, u))

    n = len(re.findall(r'<text', svg))
    if n > 20:
        avertis.append("%s : %d libellés — un schéma qui parle trop est redevenu du texte" % (i, n))


# ── Épreuves de fin de séquence ──────────────────────────────────────────────
# Le piège propre à ce fichier : le tableau de verdict liste TOUS les modules
# de la séquence. Un module sans aucune question y apparaîtrait donc comme
# « acquis » sans avoir jamais été interrogé. C'est un mensonge, pas un oubli
# d'affichage — d'où une erreur, et non un avertissement.
PALIERS = ['rappel', 'discrimination', 'transfert']
EPREUVES = os.path.join(ICI, 'epreuves.json')
eps = []
if os.path.exists(EPREUVES):
    try:
        banque = json.load(io.open(EPREUVES, encoding='utf-8'))
        eps = banque.get('epreuves', [])
        for p in PALIERS:
            if p not in banque.get('renvois', {}):
                erreurs.append("epreuves.json : aucun renvoi pour le palier « %s »" % p)
        vus = set()
        for ep in eps:
            i = ep.get('id', '?')
            if i in vus:
                erreurs.append("épreuve %s : identifiant en double" % i)
            vus.add(i)
            for mid in ep.get('modules', []):
                if mid not in mods:
                    erreurs.append("épreuve %s : module %s inexistant" % (i, mid))
                elif not [x for x in ep.get('items', []) if x.get('module') == mid]:
                    erreurs.append("épreuve %s : %s est dans la séquence sans aucune "
                                   "question — il serait déclaré acquis sans être vu" % (i, mid))
                else:
                    vus_p = set(x.get('palier') for x in ep.get('items', [])
                                if x.get('module') == mid)
                    if len(vus_p) < 2:
                        avertis.append("épreuve %s : %s n'est interrogé que sur « %s »"
                                       % (i, mid, ', '.join(sorted(vus_p))))
            for p in PALIERS:
                if not [x for x in ep.get('items', []) if x.get('palier') == p]:
                    erreurs.append("épreuve %s : aucune question au palier « %s »" % (i, p))
            for it in ep.get('items', []):
                j, opts = it.get('id', '?'), it.get('options', [])
                if it.get('palier') not in PALIERS:
                    erreurs.append("%s : palier « %s » inconnu" % (j, it.get('palier')))
                if it.get('module') not in ep.get('modules', []):
                    erreurs.append("%s : rattaché à %s, hors de la séquence" % (j, it.get('module')))
                if len(opts) < 3:
                    erreurs.append("%s : %d propositions — trop peu pour choisir" % (j, len(opts)))
                if len(set(opts)) != len(opts):
                    erreurs.append("%s : deux propositions identiques" % j)
                if not isinstance(it.get('juste'), int) or not 0 <= it['juste'] < len(opts):
                    erreurs.append("%s : « juste » hors des propositions" % j)
                if not it.get('pourquoi', '').strip():
                    erreurs.append("%s : sans « pourquoi » — la question ne rend rien" % j)
                mref = mods.get(it.get('module'), {}).get('affirmation', {}).get('ref')
                if mref and it.get('ref') != mref:
                    avertis.append("%s : référence %s alors que %s cite %s"
                                   % (j, it.get('ref'), it.get('module'), mref))
    except ValueError as e:
        erreurs.append("epreuves.json : JSON invalide — %s" % e)

# ── Micro-jeux de rôle ───────────────────────────────────────────────────────
# La garantie du dispositif est structurelle : un scénario ne contient AUCUNE
# question et AUCUNE réponse, seulement des identifiants d'items et des suites
# narratives. Un scénario ne peut donc pas énoncer un faux — il n'énonce rien.
# Ce contrôle sert à ce que cette garantie ne se perde pas en route.
INTERDITS = ['enonce', 'options', 'juste', 'pourquoi', 'reponse']
jdrs = 0
for ep in eps:
    if not ep.get('jdr'):
        continue
    chemin = os.path.join(ICI, ep['jdr'].replace('/', os.sep))
    if not os.path.exists(chemin):
        erreurs.append("épreuve %s : scénario %s introuvable" % (ep['id'], ep['jdr']))
        continue
    try:
        j = json.load(io.open(chemin, encoding='utf-8'))
    except ValueError as e:
        erreurs.append("%s : JSON invalide — %s" % (ep['jdr'], e))
        continue
    jdrs += 1
    n = j.get('id', ep['jdr'])
    if j.get('epreuve') != ep['id']:
        erreurs.append("%s : se dit rattaché à %s, alors que %s le désigne"
                       % (n, j.get('epreuve'), ep['id']))
    par_id = {x['id']: x for x in ep.get('items', [])}
    for s in j.get('scenes', []):
        moment = s.get('moment', '?')
        it = par_id.get(s.get('item'))
        if it is None:
            erreurs.append("%s / %s : item %s absent de l'épreuve"
                           % (n, moment, s.get('item')))
            continue
        for c in INTERDITS:
            if c in s:
                erreurs.append("%s / %s : champ « %s » écrit dans le scénario — "
                               "les questions et les réponses ne vivent que dans "
                               "l'index" % (n, moment, c))
        manquantes = [k for k in range(len(it['options'])) if str(k) not in s.get('suites', {})]
        if manquantes:
            erreurs.append("%s / %s : aucune suite pour la réponse %s — la scène "
                           "s'arrêterait net" % (n, moment, ', '.join(map(str, manquantes))))
        for k, v in s.get('suites', {}).items():
            if not str(v).strip():
                erreurs.append("%s / %s : suite vide pour la réponse %s" % (n, moment, k))
    for c in ['tenu', 'ecarts', 'apres']:
        if not j.get('issue', {}).get(c, '').strip():
            erreurs.append("%s : issue sans « %s »" % (n, c))
    if len(j.get('scenes', [])) > 6:
        avertis.append("%s : %d scènes — un micro-jeu qui s'allonge redevient du décor"
                       % (n, len(j['scenes'])))


couverts = set(m for ep in eps for m in ep.get('modules', []))
orphelins = [i for i in sorted(mods) if i not in couverts]
if orphelins:
    avertis.append("%d modules sans épreuve de fin de séquence : %s"
                   % (len(orphelins), ', '.join(orphelins)))


# ── Rapport ──────────────────────────────────────────────────────────────────
print("%d modules, %d schémas, %d épreuves (%d questions), %d situations\n"
      % (len(mods), len(reg), len(eps),
         sum(len(e.get('items', [])) for e in eps), jdrs))
disciplines = []
for i in sorted(mods):
    dd = mods[i].get('discipline', '?')
    if dd not in disciplines:
        disciplines.append(dd)
for disc in disciplines:
    ch = [i for i in sorted(mods) if mods[i].get('discipline') == disc]
    print("  %s (%s)" % (disc, mods[ch[0]].get('niveau', '')))
    for i in ch:
        r = mods[i].get('rappelEntrant')
        print("    %-9s %-19s %s" % (i, outil_de[i],
              ("← %s" % r['module']) if r else "(entrée)"))

if avertis:
    print("\nÀ signaler (%d) :" % len(avertis))
    for a in avertis:
        print("  · " + a)
if erreurs:
    print("\nERREURS (%d) :" % len(erreurs))
    for e in erreurs:
        print("  ! " + e)
    sys.exit(1)
print("\nAucune erreur.")
print("Rappel : la largeur du texte rendu n'est PAS vérifiable ici. Voir l'en-tête.")
