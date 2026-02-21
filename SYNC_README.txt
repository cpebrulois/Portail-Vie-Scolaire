Synchronisation multi-postes - Portail Vie Scolaire
===================================================

1) Demarrer le serveur de sync (sur le poste qui centralise):
   python sync_server.py

   Option port:
   python sync_server.py 8765

2) Le hub utilise par defaut:
   http://127.0.0.1:8765

3) Si tu veux un autre endpoint:
   - Ouvre la console navigateur.
   - Lance:
     localStorage.setItem('pvs_sync_url','http://IP_DU_SERVEUR:8765')
   - Recharge la page.

4) Le hub fait ensuite:
   - Pull auto au demarrage et au retour de focus.
   - Push auto a chaque sauvegarde.

5) Fichier central de donnees:
   pvs_sync_store.json

