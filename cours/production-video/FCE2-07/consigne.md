# Consigne de génération — FCE2-07

À coller dans la personnalisation, au moment de lancer la génération.
Déposer d'abord `source.md` comme source unique du carnet.

---

Public : élèves de collège de CE2, onze à quinze ans. Français simple,
phrases courtes, aucun anglicisme.

Durée visée : trois à cinq minutes.

Objectif unique : faire retenir que le sujet n'est pas le premier mot : c'est celui qu'on trouve en demandant « qui est-ce qui… ? ».

Plan imposé, dans cet ordre :
1. une scène concrète qui pose le problème, sans donner la réponse ;
2. la pièce, nommée, avec son statut probatoire dit à voix haute ;
3. ce que la pièce établit ;
4. ce qu'elle n'établit pas — cette partie reçoit autant de temps que la précédente ;
5. l'outil « La manivelle », énoncé exactement comme dans la source ;
6. une question posée à l'auditeur, laissée sans réponse.

Interdits, repris de la source :
- ne rien ajouter qui n'y figure pas, aucune date ni aucun chiffre ;
- ne pas transformer le statut « texte de travail » en certitude ;
- pas d'émerveillement, pas de « incroyable », pas de « fascinant » ;
- ne pas conclure sur une révélation : la fin, c'est la limite, puis la question.

Ton : un adulte qui explique à un élève quelque chose qu'il trouve
intéressant. Ni animateur, ni conférencier.

---

## Où placer la vidéo produite

Emplacement `medias.transformation` du module FCE2-07 — donc **après le verdict**.
Une vidéo qui explique la réponse ne peut pas précéder la Collision : elle
donnerait le verdict avant que l'élève ait parié.

Déposer le fichier dans `production-video/vidéo/`, puis :

```
python site/videos.py            # propose, n'écrit rien
python site/videos.py --ecrire   # applique
```

Le script associe le fichier au bon module et renseigne `url`, `source`
et `licence`. Il ne peut pas deviner la **transcription** : elle reste à
renseigner à la main dans `site/modules/FCE2-07.json`. NotebookLM fournit le
texte, elle n'a donc pas à être retapée — mais sans elle, le lecteur
affiche « transcription manquante », et il a raison de le faire.

## À relire avant de publier

- [ ] le statut de la pièce est dit, et il n'a pas été durci ;
- [ ] la limite occupe autant de temps que le savoir ;
- [ ] aucune date ni aucun chiffre absent de la source n'a été ajouté ;
- [ ] l'outil est énoncé mot pour mot comme dans les autres modules ;
- [ ] la vidéo se termine sur une question, pas sur une conclusion ;
- [ ] rien n'est présenté comme certain qui ne le soit pas.

Si un seul point échoue, régénérer plutôt que corriger au montage : le
défaut vient de la matière ou de la consigne, pas de la voix.
