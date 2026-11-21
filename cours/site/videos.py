# -*- coding: utf-8 -*-
"""Branche les vidéos produites sur les modules qui les attendent.

Usage :
    python site/videos.py            # propose, n'écrit rien
    python site/videos.py --ecrire   # écrit les URL dans les modules

Le dossier maître est `production-video/vidéo/`. Le site le voit à travers
une jonction `site/medias/video`, si bien qu'un fichier déposé dans le dossier
maître est immédiatement servi, sans copie et sans duplication sur le disque.

Association fichier → module, dans cet ordre :

  1. Le nom du fichier commence par un identifiant de module (« H6-04 … »).
     C'est explicite, c'est sans risque, et cela prime sur tout le reste.
  2. Sinon, recouvrement de mots entre le nom du fichier et le module, pondéré
     par la rareté de chaque mot dans l'ensemble des modules. Un mot présent
     partout ne départage rien ; un mot présent dans un seul module tranche.

Le script n'écrit une association que si le premier score dépasse nettement le
second. Une hésitation est signalée, jamais tranchée en silence : renommer le
fichier en le préfixant de l'identifiant du module règle définitivement le cas.
"""
import json, io, sys, os, re, glob, unicodedata
from urllib.parse import quote

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULES = os.path.join(RACINE, 'site', 'modules')
MAITRE = os.path.join(RACINE, 'production-video', 'vidéo')
URL_BASE = 'medias/video/'
EXTENSIONS = ('.mp4', '.webm', '.ogv', '.m4v')
ECART_MINIMAL = 1.6   # le premier doit valoir au moins 1,6 fois le second

# Mots trop fréquents pour départager quoi que ce soit.
VIDES = set("""a au aux avec ce ces dans de des du elle en et eux il ils je la
le les leur lui ma mais me meme mes moi mon ne nos notre nous on ou par pas
pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous
c d j l m n s t y est ete etre avoir sont etait quand comme plus tout tous
video videos partie chapitre cours module final v1 v2 mix""".split())


def mots(texte):
    t = unicodedata.normalize('NFD', (texte or '').lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    bruts = re.split(r'[^a-z0-9]+', t)
    sortie = set()
    for m in bruts:
        if len(m) < 3 or m in VIDES or m.isdigit():
            continue
        sortie.add(m)
        if m.endswith('s') and len(m) > 3:
            sortie.add(m[:-1])      # pluriels français les plus simples
    return sortie


def charger():
    mods = {}
    for f in sorted(glob.glob(os.path.join(MODULES, '*.json'))):
        if os.path.basename(f) == 'index.json':
            continue
        d = json.load(open(f, encoding='utf-8'))
        botte = ' '.join([
            d.get('titre', ''), d.get('theme', ''),
            (d.get('cible') or {}).get('enonce', ''),
            d.get('trace', ''),
            ((d.get('collision') or {}).get('outil') or {}).get('nom', ''),
            (d.get('porte') or {}).get('cartel', ''),
        ])
        mods[d['id']] = {'chemin': f, 'donnees': d, 'mots': mots(botte)}
    return mods


def poids(mods):
    """Rareté d'un mot : plus il est répandu, moins il départage."""
    n = len(mods) or 1
    freq = {}
    for m in mods.values():
        for w in m['mots']:
            freq[w] = freq.get(w, 0) + 1
    return {w: (n / float(c)) for w, c in freq.items()}


def associer(nom, mods, p):
    """Renvoie (identifiant, score, second_score, motif)."""
    base = os.path.splitext(nom)[0]
    explicite = re.match(r'^([A-Z]{1,3}\d-\d\d)\b', base.upper())
    if explicite and explicite.group(1) in mods:
        return explicite.group(1), None, None, 'préfixe explicite'

    q = mots(base)
    scores = []
    for i, m in mods.items():
        s = sum(p.get(w, 1.0) for w in (q & m['mots']))
        scores.append((s, i))
    scores.sort(reverse=True)
    if not scores or scores[0][0] <= 0:
        return None, 0, 0, 'aucun mot commun'
    premier, second = scores[0], (scores[1] if len(scores) > 1 else (0, None))
    if second[0] > 0 and premier[0] < second[0] * ECART_MINIMAL:
        return None, premier[0], second[0], 'hésitation entre %s et %s' % (premier[1], second[1])
    return premier[1], premier[0], second[0], 'recouvrement de mots'


def poser(d, nom):
    """Place l'URL dans le premier emplacement vidéo de la Transformation.
    Renvoie un état : 'posee', 'deja', 'occupee', 'cree'."""
    url = URL_BASE + quote(nom)
    medias = d.setdefault('medias', {})
    liste = medias.setdefault('transformation', [])
    for s in liste:
        if s.get('type') == 'video':
            if s.get('url') == url:
                return 'deja', url
            if s.get('url'):
                return 'occupee', s['url']
            s['url'] = url
            s.setdefault('alt', '')
            if not s.get('alt'):
                s['alt'] = "Vidéo de synthèse du module, à regarder après le verdict"
            s['source'] = s.get('source') or "Production interne du collège"
            s['licence'] = s.get('licence') or "Usage pédagogique interne"
            return 'posee', url
    liste.append({
        'url': url, 'type': 'video', 'etiquette': 'AMBIANCE',
        'alt': "Vidéo de synthèse du module, à regarder après le verdict",
        'source': "Production interne du collège", 'licence': "Usage pédagogique interne",
        'auteur': '', 'transcription': '',
        'operation': "entendre une explication d'ensemble, après avoir conclu soi-même",
        'brief': '', 'placement': "APRÈS le verdict.",
    })
    return 'cree', url


def poser_lien(ident, url, ecrire):
    """Associe une vidéo hébergée ailleurs — YouTube, Vimeo — à un module.

    C'est la voie recommandée dès qu'il y a plus de deux ou trois vidéos : le
    dépôt reste léger, la lecture s'adapte au débit du téléphone, et rien ne
    pèse sur l'hébergement du site. En contrepartie la vidéo ne nous appartient
    plus : le fichier maître reste dans production-video/vidéo/, qui est
    l'archive. Une plateforme est un canal de diffusion, pas une sauvegarde."""
    chemin = os.path.join(MODULES, ident + '.json')
    if not os.path.exists(chemin):
        print("  !  %s : module inconnu" % ident)
        return False
    d = json.load(open(chemin, encoding='utf-8'))
    liste = d.setdefault('medias', {}).setdefault('transformation', [])
    cible = next((s for s in liste if s.get('type') == 'video'), None)
    if cible is None:
        cible = {'type': 'video', 'etiquette': 'AMBIANCE', 'auteur': '', 'transcription': '',
                 'brief': '', 'placement': "APRÈS le verdict.",
                 'operation': "entendre une explication d'ensemble, après avoir conclu soi-même"}
        liste.append(cible)
    ancienne = cible.get('url', '')
    cible['url'] = url
    cible['alt'] = cible.get('alt') or "Vidéo de synthèse du module, à regarder après le verdict"
    cible['source'] = cible.get('source') or "Production interne du collège"
    cible['licence'] = cible.get('licence') or "Usage pédagogique interne"
    print("  -> %-9s %s%s" % (ident, url, ("   (remplace %s)" % ancienne) if ancienne else ""))
    if not cible.get('transcription'):
        print("       transcription à renseigner — le lecteur la signalera manquante")
    if ecrire:
        json.dump(d, open(chemin, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return True


def sonder(chemin):
    """Ce qu'un lecteur verra du fichier. Renvoie None si ffprobe est absent."""
    import subprocess
    try:
        r = subprocess.run(
            ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
             'stream=codec_name,profile,pix_fmt,width,height', '-of', 'json', chemin],
            capture_output=True, text=True, encoding='utf-8', timeout=30)
        if r.returncode != 0:
            return None
        f = json.loads(r.stdout).get('streams', [{}])[0]
        return {'codec': f.get('codec_name', '?'), 'profil': f.get('profile', '?'),
                'chroma': f.get('pix_fmt', '?'),
                'taille': '%sx%s' % (f.get('width', '?'), f.get('height', '?'))}
    except Exception:
        return None


def normaliser(ecrire):
    """Repère les fichiers qu'un navigateur ou Windows ne saura pas lire.

    Le piège vient de la chroma. Un exportateur d'avatar peut rendre en
    H.264 « High 4:4:4 Predictive », chroma yuv444p : le fichier est
    parfaitement valide, il s'ouvre dans VLC, et il reste noir partout
    ailleurs. Aucun message n'explique pourquoi, et on croit le
    téléchargement raté — on le refait trois fois pour rien.

    Le web ne lit en pratique qu'une chose : H.264 en yuv420p. On convertit
    donc vers ça, sans jamais toucher à l'original : le fichier corrigé est
    écrit à côté, et c'est vous qui décidez de remplacer.
    """
    import subprocess
    fichiers = sorted(f for f in os.listdir(MAITRE)
                      if os.path.splitext(f)[1].lower() in EXTENSIONS)
    if not fichiers:
        print("Aucune vidéo dans %s" % MAITRE)
        return 0
    if sonder(os.path.join(MAITRE, fichiers[0])) is None:
        print("ffprobe est introuvable : impossible de sonder les fichiers.\n"
              "  Installer FFmpeg, ou vérifier à la main que la chroma est yuv420p.")
        return 1

    a_corriger = []
    for nom in fichiers:
        d = sonder(os.path.join(MAITRE, nom))
        souci = d and (d['chroma'] != 'yuv420p' or d['codec'] != 'h264')
        print("  %s %-40s %s / %s / %s"
              % ('!!' if souci else 'ok', nom[:40], d['codec'], d['profil'], d['chroma']))
        if souci:
            a_corriger.append(nom)

    if not a_corriger:
        print("\nToutes les vidéos sont lisibles partout.")
        return 0

    print("\n%d fichier(s) qu'un navigateur ne lira pas : %s"
          % (len(a_corriger), ', '.join(a_corriger)))
    if not ecrire:
        print("Relancer avec --ecrire pour écrire une version corrigée à côté.")
        return 0

    for nom in a_corriger:
        base, ext = os.path.splitext(nom)
        sortie = os.path.join(MAITRE, base + ' (corrige)' + ext)
        print("  conversion de %s …" % nom)
        r = subprocess.run(
            ['ffmpeg', '-y', '-v', 'error', '-i', os.path.join(MAITRE, nom),
             '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
             '-preset', 'medium', '-crf', '20',
             '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', sortie],
            capture_output=True, text=True, encoding='utf-8')
        if r.returncode == 0:
            d = sonder(sortie)
            print("    -> %s   %s / %s / %s" % (os.path.basename(sortie),
                                                d['codec'], d['profil'], d['chroma']))
        else:
            print("    ÉCHEC : %s" % (r.stderr or '').strip()[:200])
    print("\nL'original n'a pas été touché. À vous de remplacer si le résultat convient.")
    return 0


def main():
    ecrire = '--ecrire' in sys.argv

    if '--normaliser' in sys.argv:
        return normaliser(ecrire)

    # Mode « lien » : python site/videos.py --lien H6-04=https://youtu.be/xxxx
    paires = []
    for i, a in enumerate(sys.argv[1:]):
        if a == '--lien' and i + 2 < len(sys.argv):
            v = sys.argv[i + 2]
            if '=' in v:
                paires.append(v.split('=', 1))
        elif a.startswith('--lien=') and '=' in a[7:]:
            paires.append(a[7:].split('=', 1))
    if paires:
        print("%d lien(s) à poser\n" % len(paires))
        n = sum(1 for ident, url in paires if poser_lien(ident.strip(), url.strip(), ecrire))
        print()
        print("%d module(s) %s. Relancer `python site/construire.py`."
              % (n, "mis à jour" if ecrire else "à mettre à jour — relancer avec --ecrire"))
        return 0
    if not os.path.isdir(MAITRE):
        print("Dossier maître introuvable : %s" % MAITRE)
        return 1
    jonction = os.path.join(RACINE, 'site', 'medias', 'video')
    if not os.path.exists(jonction):
        print("ATTENTION : %s n'existe pas.\n"
              "  Le site ne pourra pas servir les fichiers. À créer une fois pour toutes :\n"
              "  New-Item -ItemType Junction -Path \"%s\" -Target \"%s\"\n" % (jonction, jonction, MAITRE))

    mods = charger()
    p = poids(mods)
    fichiers = sorted(f for f in os.listdir(MAITRE)
                      if os.path.splitext(f)[1].lower() in EXTENSIONS)
    if not fichiers:
        print("Aucune vidéo dans %s" % MAITRE)
        return 0

    print("%d fichier(s), %d module(s)\n" % (len(fichiers), len(mods)))
    ecrits, suspens = 0, []
    for nom in fichiers:
        ident, s1, s2, motif = associer(nom, mods, p)
        taille = os.path.getsize(os.path.join(MAITRE, nom)) / 1048576.0
        if not ident:
            print("  ?  %-34s %6.1f Mo   %s" % (nom[:34], taille, motif))
            suspens.append(nom)
            continue
        d = mods[ident]['donnees']
        etat, url = poser(d, nom)
        marque = {'posee': '->', 'cree': '+>', 'deja': '==', 'occupee': '!!'}[etat]
        detail = motif if s1 is None else "%s, %.1f contre %.1f" % (motif, s1, s2)
        print("  %s %-8s %-34s %6.1f Mo   %s" % (marque, ident, nom[:34], taille, detail))
        if etat == 'occupee':
            print("       emplacement déjà pris par %s — rien touché" % url)
            continue
        if etat in ('posee', 'cree') and ecrire:
            json.dump(d, open(mods[ident]['chemin'], 'w', encoding='utf-8'),
                      ensure_ascii=False, indent=1)
            ecrits += 1
        elif etat in ('posee', 'cree'):
            ecrits += 1

    print()
    if suspens:
        print("Non associés : %s" % ', '.join(suspens))
        print("  Renommer le fichier en le préfixant de l'identifiant du module, "
              "par exemple « H6-04 - %s », lève l'hésitation.\n" % suspens[0])
    if ecrire:
        print("%d module(s) mis à jour. Relancer `python site/construire.py`." % ecrits)
    elif ecrits:
        print("%d association(s) proposée(s). Relancer avec --ecrire pour les appliquer." % ecrits)
    return 0


if __name__ == '__main__':
    sys.exit(main())
