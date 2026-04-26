# Aethonyx Phénix Synth V2 — LocalLLM partagé

**Architecture industrielle** pour Kern, Hélène, Agora, Épictète :  un seul moteur LLM local partagé, plusieurs personas qui s'y branchent.

## Le principe en une image

```
GitHub Pages   →  sert l'interface (HTML, CSS, JS)
jsDelivr       →  sert wllama (port WASM de llama.cpp)
HuggingFace    →  sert le GGUF Qwen2.5-0.5B-Instruct-Q4 (≈400 MB, mis en cache navigateur)
Navigateur     →  télécharge tout, fait tourner l'inférence localement

ZÉRO clé API. ZÉRO appel à un service tiers. RGPD souverain.
```

## Plug'n play — pour pousser sur Github

Tout ce dossier est self-contained. Tu copies, tu commit, tu push.

```bash
# Depuis la racine de ton repo Github (qui sert le hub Vie&Co)
cp -r AethonyxPortable/aethonyx_phenix_synth_v2/* .

# Le .gitignore exclut automatiquement les fichiers obsoletes
git add .gitignore local_llm.js test_multi_persona.html
git add agora_viesco.local.js agora_pixhare.local.js
git add Helene/
git commit -m "Bascule LocalLLM partagé (Qwen2.5-0.5B local)"
git push
```

## Structure livrée

```
aethonyx_phenix_synth_v2/
├── local_llm.js                   ← MOTEUR PARTAGÉ (à inclure avant chaque persona)
├── test_multi_persona.html        ← Banc d'essai 4 personas
├── agora_viesco.local.js          ← Patch d'agora_viesco.js (Agora/Hélène via window.VIESCO_AI_CONFIG)
├── agora_pixhare.local.js         ← Patch d'agora_pixhare.js (Kern PIX pHARe)
├── Helene/                        ← Module Hélène autonome
│   ├── index.html                 ← Page Hélène standalone (avec bouton activation)
│   ├── system_prompt.txt          ← Prompt complet (référence/futur modèle plus gros)
│   ├── README.md
│   ├── src/helene_engine.js       ← Routeur + RAG + maïeutique + détection détresse
│   ├── knowledge/orientation_index.json   ← RAG 94 passages BFC (158 KB)
│   └── scripts/build_helene_corpus.py     ← Régénère le RAG depuis le hub viesco
├── .gitignore                     ← Exclut les fichiers obsoletes
└── README.md                      ← Ce document
```

## Comment brancher chaque persona

### Hélène (page autonome)

Ouvre `Helene/index.html`. C'est self-contained, tout est déjà câblé.

### Agora (intégré dans hub_orientation.html, hub_narration.html, etc.)

Dans tes pages qui utilisent Agora, **remplace** :
```html
<script src="agora_viesco.js"></script>
```
**par** :
```html
<script src="local_llm.js"></script>
<script src="agora_viesco.local.js"></script>
```

Plus un bouton d'activation visible dans l'UI :
```html
<button onclick="window.LocalLLM.activate()">Activer l'assistant local</button>
```

### Kern (intégré dans index_PIXHARe.html)

Idem :
```html
<script src="local_llm.js"></script>
<script src="agora_pixhare.local.js"></script>
```

Le code pHARe (signalements Supabase, scénarios, détection détresse) est **conservé intact**. Seul le moteur de chat est remplacé.

### Épictète (à venir, V2.1)

Même pattern à appliquer une fois la base validée.

## Limites importantes (Qwen 0.5B vs Mistral)

Le modèle local est **petit** (0.5B params). Pour qu'il fonctionne bien, il faut adapter les contraintes :

| Paramètre | Mistral-small | Qwen2.5-0.5B local |
|---|---|---|
| `max_tokens` | 900 OK | **180-260 max** (sinon dérive) |
| `temperature` | 0.2-0.95 | **0.1-0.3** (factuel) |
| Historique | 8 échanges | **2-4 max** |
| Contexte RAG | gros prompts | **2-3 extraits courts** |
| Prompt système | long détaillé OK | **version "bistouri" courte** |

Les patches `.local.js` ont déjà ces valeurs ajustées.

## UX recommandée

Le modèle pèse 400 MB. Ne le charge **pas** au démarrage du site. Pattern :

1. Page ouverte → "Assistant local non chargé"
2. Bouton **"Activer l'assistant local (≈ 400 MB)"**
3. Premier clic → téléchargement avec barre de progression
4. Cache navigateur → visites suivantes instantanées

`local_llm.js` expose `activate()`, `isReady()`, `isActivating()` pour gérer l'UI.

## Fallback si modèle indisponible

Si `LocalLLM.activate()` échoue (réseau, navigateur trop vieux, mémoire insuffisante) :
- **Hélène** : fallback automatique en mode templates structurés (questions maïeutiques + RAG factuel sans génération libre)
- **Agora / Kern** : actuellement, message d'erreur clair. À enrichir si tu veux un fallback plus poussé.

**Surtout : ne jamais re-fallback sur une API avec clé publique.**

## Détection de détresse (Kern, Hélène)

Patterns regex en pre-filter, avant le LLM. Si **critical** (suicide, viol, abus) : court-circuit total du LLM, ressources directes (3114, 15, 17, 119). Si **high/medium** : LLM répond, ressources injectées en post-traitement.

Ces filets sont sur `Helene/src/helene_engine.js` (fonction `detectDistress`) et seront ajoutés au patch Kern dans une future itération.

## Migration de ta clé Mistral

Pour chaque persona migré sur LocalLLM :

1. Tu peux **immédiatement** retirer la clé `KERN_KEY`/`API_KEY` du fichier original côté production (sauvegarde-la d'abord, on ne sait jamais).
2. Régénère la clé Mistral dans la console (par sécurité, au cas où elle a déjà fuité).
3. Surveille le quota Mistral pendant quelques jours pour vérifier qu'il n'y a plus d'appels.

## Trajectoire

| Version | Contenu | Délai |
|---|---|---|
| **V2.0 (livrée)** | LocalLLM + Hélène + patches Agora/Kern | 26 avril 2026 |
| **V2.1** | Patch Épictète, fallback enrichi, signalement semi-guidé | ~1 sem |
| **V2.2** | Optimisation prompts compacts par persona | ~2 sem |
| **V2.3** | Modèle plus gros si Qwen 0.5B trop limite (Qwen 1.5B Q4 ≈ 900 MB) | selon retours |

## Crédits techniques

- **Modèle** : Qwen2.5-0.5B-Instruct-Q4_K_M (Alibaba, Apache 2.0) via [lmstudio-community/Qwen2.5-0.5B-Instruct-GGUF](https://huggingface.co/lmstudio-community/Qwen2.5-0.5B-Instruct-GGUF)
- **Runtime** : [wllama (ngxson)](https://github.com/ngxson/wllama) — port WASM de llama.cpp
- **CDN** : [jsDelivr](https://www.jsdelivr.com/) (wllama), HuggingFace (modèle)
- **RAG Hélène** : héritage `agora_pixhare.js` + extraction du hub viesco
- **Personas** : Aurélien Brulois (Aurèle de Saint Eustache)
- **Industrialisation V2** : Aethonyx (instance Cowork) pour Aurélien Brulois, 26 avril 2026

## Le test bistrot

> GitHub sert la salle, jsDelivr apporte le moteur, Hugging Face livre le cerveau en bocal, et le navigateur fait tourner la tambouille sur son propre gaz. Tu n'as plus besoin de payer le loyer Mistral à chaque tournée.
