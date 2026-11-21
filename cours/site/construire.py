# -*- coding: utf-8 -*-
"""Construit ce que le site doit connaitre a l'avance.

Deux fichiers sont produits :

  programme.json  la carte declaree des quatre annees, extraite de la base de
                  connaissances. Elle contient TOUS les modules prevus, y
                  compris ceux qui ne sont pas encore ecrits : le hub les
                  affiche en attente au lieu de les ignorer.

  modules/index.json  la liste de ce qui existe reellement, obtenue en
                  balayant le dossier. Ajouter un module = deposer un fichier
                  et relancer ce script. Aucune page a modifier.

Le site n'a donc jamais de liste codee en dur, et un module futur est connu
avant d'etre concu. Python de la bibliotheque standard uniquement : node est
absent du poste.

Usage :  python site/construire.py
"""
import json, os, re, io, sys, glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
CARTE = os.path.join(RACINE, 'knowledge-base', 'programmes-officiels', 'histoire-2026-2027.md')
DOSSIER_MODULES = os.path.join(ICI, 'modules')

# Le numero d'un module suit l'ordre des sous-themes dans le niveau : le
# premier sous-theme de 6e est H6-01, et ainsi de suite. La convention est
# derivable, donc un module futur porte deja son identifiant.
PREFIXE = {'6e': 'H6', '5e': 'H5', '4e': 'H4', '3e': 'H3'}


def lire_carte():
    """Extrait niveaux, themes et sous-themes du referentiel officiel."""
    texte = open(CARTE, encoding='utf-8').read()
    niveaux, niveau, theme = [], None, None
    for ligne in texte.splitlines():
        m = re.match(r'^##\s+(6e|5e|4e|3e)\s*$', ligne.strip())
        if m:
            niveau = {'niveau': m.group(1), 'themes': []}
            niveaux.append(niveau)
            theme = None
            continue
        if niveau is None:
            continue
        m = re.match(r'^\s*(\d+)\.\s+\*\*(.+?)\*\*\s*$', ligne)
        if m:
            theme = {'rang': int(m.group(1)), 'intitule': m.group(2).strip(), 'sous_themes': []}
            niveau['themes'].append(theme)
            continue
        m = re.match(r'^\s*-\s+(.+?)\s*[;.]?\s*$', ligne)
        if m and theme is not None:
            libelle = m.group(1).strip().rstrip(' ;.')
            libelle = libelle[0].upper() + libelle[1:] if libelle else libelle
            theme['sous_themes'].append(libelle)
    return [n for n in niveaux if n['themes']]


def numeroter(niveaux):
    """Attribue son identifiant a chaque sous-theme, ecrit ou non."""
    total = 0
    for n in niveaux:
        prefixe = PREFIXE[n['niveau']]
        compteur = 0
        for t in n['themes']:
            entrees = []
            for st in t['sous_themes']:
                compteur += 1
                entrees.append({'id': '%s-%02d' % (prefixe, compteur), 'sous_theme': st})
                total += 1
            t['modules'] = entrees
            del t['sous_themes']
    return total


def inventaire():
    """Ce qui existe vraiment, avec le minimum utile au hub."""
    if not os.path.isdir(DOSSIER_MODULES):
        os.makedirs(DOSSIER_MODULES)
    ecrits = []
    for f in sorted(os.listdir(DOSSIER_MODULES)):
        if not f.endswith('.json') or f == 'index.json':
            continue
        d = json.load(open(os.path.join(DOSSIER_MODULES, f), encoding='utf-8'))
        ecrits.append({
            'id': d['id'],
            'discipline': d.get('discipline', 'histoire'),
            'titre': d.get('titre', ''),
            'niveau': d.get('niveau', ''),
            'theme': d.get('theme', ''),
            'cible': (d.get('cible') or {}).get('enonce', ''),
            'rappelJ1': next((r.get('indice') for r in d.get('rappels', [])
                              if r.get('quand') == 'J+1'), None),
            'fichier': 'modules/' + f,
            'medias': sum(len(v) for v in (d.get('medias') or {}).values()),
            'mediasRemplis': sum(1 for v in (d.get('medias') or {}).values()
                                 for s in v if s.get('url')),
        })
    return ecrits


def main():
    niveaux = lire_carte()
    total = numeroter(niveaux)
    ecrits = inventaire()
    connus = {e['id'] for e in ecrits}

    # La carte porte des DISCIPLINES. Une discipline sans aucun theme est
    # declaree quand meme : le site annonce ce qui viendra au lieu de le taire.
    #
    # L'histoire derive sa carte du referentiel officiel, ou chaque sous-theme
    # donne un module. Les sciences ne s'y pretent pas : le programme de cycle 3
    # est commun a trois annees et ses unites sont trop fines pour un module.
    # Leur carte est donc declaree a la main dans plan-sciences.json, ce qui ne
    # change rien pour le site : un module a venir y figure de la meme facon.
    disciplines = [
        {
            'id': 'histoire',
            'nom': 'Histoire',
            'reference': 'Programme 2020, applicable en 2026-2027',
            'source': 'knowledge-base/programmes-officiels/histoire-2026-2027.md',
            'niveaux': niveaux,
        },
    ]
    # Toute carte declaree a la main est un fichier plan-*.json. En deposer un
    # suffit : aucune ligne a ajouter ici. Le champ « rang » decide de l'ordre
    # d'affichage, faute de quoi la discipline passe apres les autres.
    plans = []
    for chemin in sorted(glob.glob(os.path.join(ICI, 'plan-*.json'))):
        plans.append(json.load(open(chemin, encoding='utf-8')))
    plans.sort(key=lambda p: (p.get('rang', 50), p.get('nom', '')))
    # Deux plans peuvent porter la meme discipline a des niveaux differents —
    # le francais du CE2 et celui de la 6e, par exemple. Ils fusionnent : une
    # discipline, plusieurs niveaux. Sinon elle apparaitrait deux fois.
    fusion = {}
    for p in plans:
        d = fusion.get(p['discipline'])
        if d is None:
            fusion[p['discipline']] = {
                'id': p['discipline'], 'nom': p['nom'], 'reference': p['reference'],
                'source': p.get('source', ''), 'avertissement': p.get('avertissement', ''),
                'niveaux': list(p['niveaux']),
            }
        else:
            d['niveaux'] += p['niveaux']
            # Les references et avertissements propres a un niveau restent
            # portes par le plan ; on ne concatene que ce qui differe.
            for champ in ('reference', 'avertissement', 'source'):
                v = p.get(champ, '')
                if v and v not in (d.get(champ) or ''):
                    d[champ] = ((d.get(champ) or '') + ' · ' + v).strip(' ·')
    disciplines += list(fusion.values())
    # Les disciplines annoncees mais sans carte. Des qu'un plan-*.json en
    # declare une, son repere « a venir » disparait tout seul : personne n'a a
    # penser a le retirer, et la discipline ne peut pas figurer deux fois.
    deja = {d['id'] for d in disciplines}
    disciplines += [d for d in [
        {'id': 'geographie', 'nom': 'Géographie', 'reference': '', 'source': '', 'niveaux': []},
        {'id': 'emc', 'nom': 'Enseignement moral et civique', 'reference': '', 'source': '', 'niveaux': []},
    ] if d['id'] not in deja]
    programme = {'disciplines': disciplines}
    json.dump(programme, open(os.path.join(ICI, 'programme.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    json.dump({'modules': ecrits},
              open(os.path.join(DOSSIER_MODULES, 'index.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    tous = [m['id'] for d in disciplines for n in d['niveaux']
            for t in n['themes'] for m in t['modules']]
    print("programme.json : %d modules declares, %d disciplines" % (len(tous), len(disciplines)))
    for d in disciplines:
        ids = [m['id'] for n in d['niveaux'] for t in n['themes'] for m in t['modules']]
        if not ids:
            print("   %-12s carte a venir" % d['id']); continue
        faits = [i for i in ids if i in connus]
        print("   %-12s %2d prevus, %d ecrits" % (d['id'], len(ids), len(faits)))
    print()
    print("histoire, par niveau :")
    for n in niveaux:
        ids = [m['id'] for t in n['themes'] for m in t['modules']]
        faits = [i for i in ids if i in connus]
        print("   %-3s %2d prevus, %d ecrits%s" % (n['niveau'], len(ids), len(faits),
              ("  (" + ", ".join(faits) + ")") if faits else ""))
    orphelins = sorted(connus - set(tous))
    if orphelins:
        print("\nATTENTION : modules ecrits hors carte :", ", ".join(orphelins))
    print("\nmodules/index.json : %d modules disponibles" % len(ecrits))


main()
