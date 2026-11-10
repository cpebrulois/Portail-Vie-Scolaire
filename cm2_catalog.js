// Shared deterministic activities: the Worker grades the same questions as the browser.
export const VERSION = '2026.11.10';
export const SOURCES = {
  francais:'https://www.education.gouv.fr/sites/default/files/programme-de-fran-ais-pour-le-cycle-3-439824.pdf',
  maths:'https://www.education.gouv.fr/sites/default/files/programme-de-math-matiques-pour-le-cycle-3-439827.pdf',
  cycle:'https://eduscol.education.gouv.fr/4356/enseigner-au-cycle-3'
};
export const ACTIVITIES = [
  ['lecture','Français','Lire les indices','Comprendre et justifier une inférence','La lettre de Maëlle','Maëlle prépare un départ. Aide Liam à comprendre ce que les mots laissent deviner.','livre'],
  ['ecriture','Français','Écrire et améliorer','Organiser et réviser un court texte','Le carnet de voyage','Liam veut transmettre une histoire claire à ceux qui prendront la route après lui.','plume'],
  ['langue','Français','Les accords en atelier','Accords, fonctions et plus-que-parfait','Les messages de la forge','Des messages sont arrivés à la forge. Préparons une version compréhensible par tous.','plume'],
  ['fractions','Mathématiques','Partager et repérer','Représenter une fraction et une quantité','Les provisions du voyage','Les voyageurs préparent leurs provisions. Observe les parts avant de calculer.','parts'],
  ['decimaux','Mathématiques','Comprendre les décimaux','Valeur des chiffres, comparaison et calcul','Les mesures de l’atelier','Une petite erreur de mesure peut changer une fabrication : vérifions nos repères.','regle'],
  ['calcul','Mathématiques','Calculer avec stratégie','Automatismes et calcul mental réfléchi','Le défi de Rémus','Plusieurs chemins conduisent à un résultat. Choisis une stratégie que tu peux expliquer.','calcul'],
  ['mesures','Mathématiques','Mesurer et convertir','Longueurs, masses et contenances','La commande de la forge','Liam rassemble juste ce qu’il faut pour une commande. Les unités comptent autant que les nombres.','regle'],
  ['durees','Mathématiques','Lire le temps du voyage','Durées et horaires','Les étapes de la route','Pour partir et arriver à temps, il faut compter les heures et les minutes sans les confondre.','horloge'],
  ['proportion','Mathématiques','Adapter une recette','Raisonner sur des grandeurs proportionnelles','Le repas partagé','Le nombre de convives change : explique comment adapter les quantités, sans produit en croix.','parts'],
  ['donnees','Mathématiques','Lire un relevé','Tableaux et représentations de données','Le registre du marché','Des nombres sont utiles seulement si on comprend ce qu’ils racontent.','graphique'],
  ['hasard','Mathématiques','Explorer le hasard','Exprimer des chances dans une situation simple','Les jetons du marchand','Le marchand mélange des jetons. Avant de tirer, cherchons ce qui est possible.','des'],
  ['histoire','Histoire-géographie','Les traces du passé','République, industrialisation, guerres et Europe','Les archives de la maison commune','L’univers de Liam est imaginaire. Ici, nous étudions de vrais repères historiques à partir de documents décrits.','archives'],
  ['geographie','Histoire-géographie','Habiter et se déplacer','Mobilités, Internet et mieux habiter','Un village relié au monde','Quittons un instant le récit pour observer les réseaux et les lieux de notre monde actuel.','carte'],
  ['anglais','Anglais','Écouter et comprendre','Consignes et échanges simples','Une rencontre sur la route','Écoute une phrase, puis choisis ce qu’elle veut dire. Tu peux la réécouter.','audio'],
  ['sciences','Sciences','Chercher une preuve','Hypothèse, expérience et conclusion','Le laboratoire du ruisseau','Une idée mérite d’être testée : change un seul facteur et observe les résultats.','science'],
  ['citoyennete','EMC et numérique','Agir avec les autres','Entraide, sources et protection des informations','Le conseil des voyageurs','Des situations fictives pour réfléchir ensemble, sans raconter sa vie personnelle.','groupe']
].map(([id,subject,title,skill,chapter,intro,icon])=>({id,subject,title,skill,chapter,intro,icon,minutes:10,source:SOURCES[subject==='Français'?'francais':subject==='Mathématiques'?'maths':'cycle']}));

export function activity(id){ return ACTIVITIES.find(a=>a.id===id); }
export function norm(s){return String(s??'').normalize('NFC').trim().toLocaleLowerCase('fr-FR').replace(/[’]/g,"'").replace(/\s+/g,' ');}
function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};}
function qcm(prompt,options,correct,explanation,extra={}){return {kind:'choice',prompt,options,expected:String(correct),explanation,...extra};}
function number(prompt,expected,explanation,extra={}){return {kind:'number',prompt,expected:String(expected),explanation,...extra};}
const READING = [
  ['Maëlle serre son billet. Elle regarde l’horloge une troisième fois, puis se rapproche de la porte.','Que peut-on raisonnablement comprendre ?',['Elle attend un départ ou une arrivée.','Elle a perdu son billet.','Elle sait que le train est annulé.'],0,'Le billet, l’horloge et la porte sont des indices d’attente. Le texte ne dit ni que le billet est perdu ni qu’un train est annulé.'],
  ['Liam pose son manteau près du poêle. Des gouttes tombent de ses manches sur le sol.','Quelle explication est la mieux soutenue ?',['Il vient probablement d’un endroit humide.','Il a forcément traversé une rivière.','Le poêle est cassé.'],0,'Les gouttes indiquent un manteau mouillé. On ne sait pas comment il a été mouillé : plusieurs causes restent possibles.'],
  ['« Tu peux emprunter mon carnet, mais rends-le-moi avant le départ », dit Rémus.','À quelle condition Liam peut-il garder le carnet ?',['Le rendre avant le départ.','Le rendre seulement s’il le souhaite.','Le rendre après le voyage.'],0,'Le mot « mais » introduit ici une condition explicite : rendre le carnet avant le départ.'],
  ['L’atelier ouvre à 9 h. Une affiche précise : « Retrait des commandes à partir de 10 h ».','Que peut faire Liam à 9 h 30 ?',['Entrer dans l’atelier, mais pas encore retirer sa commande.','Retirer forcément sa commande.','Conclure que l’atelier est fermé.'],0,'Il faut croiser deux informations : l’ouverture et l’horaire de retrait ne sont pas identiques.'],
  ['Rémus cherche sa clef. Il soulève un coussin, puis ouvre chaque tiroir. « Je l’avais pourtant posée ici ! »','Quel mot résume le mieux son activité ?',['Chercher.','Réparer.','Se reposer.'],0,'Les gestes successifs montrent une recherche. Le personnage lui-même dit qu’il ne retrouve pas sa clef.'],
  ['Maëlle avait prévu une promenade. Pourtant, elle reste à l’atelier pour aider son amie.','Que montre « pourtant » ?',['Une opposition entre le projet et l’action.','Une addition de quantités.','La date du départ.'],0,'« Pourtant » signale un contraste : l’action réalisée diffère de ce qui était prévu.']
];
const BANKS = {
  langue:[
    ['Complète : « Les voyageurs ___ leurs sacs. »',['préparent','prépare','prépares'],0,'Le sujet « les voyageurs » est au pluriel : ils préparent.'],
    ['Quel est le sujet dans « Près du pont arrivent les voyageurs » ?',['les voyageurs','le pont','arrivent'],0,'Le sujet est placé après le verbe : ce sont les voyageurs qui arrivent.'],
    ['« Liam avait fermé la porte. » À quel temps est le verbe ?',['Plus-que-parfait.','Passé composé.','Futur.'],0,'« Avait » est l’auxiliaire à l’imparfait, suivi de « fermé » : c’est le plus-que-parfait.'],
    ['Quelle phrase est correctement conjuguée ?',['Vous dites la vérité.','Vous disez la vérité.','Vous dit la vérité.'],0,'Au présent, on écrit « vous dites ». La terminaison de « vous » n’est donc pas toujours -ez.'],
    ['Dans « Maëlle semble attentive », « attentive » est :',['un attribut du sujet','un COD','un déterminant'],0,'Après le verbe « semble », l’adjectif exprime une caractéristique du sujet.'],
    ['Quelle phrase contient un COI ?',['Liam parle à Rémus.','Liam porte un sac.','Le sac est lourd.'],0,'« À Rémus » est introduit par une préposition et complète le verbe « parler ».']
  ],
  histoire:[
    ['Une photographie montre une école publique française à la fin du XIXe siècle. Quel contexte étudier ?',['L’installation de l’école de la République.','La conquête romaine.','La préhistoire.'],0,'Les lois scolaires des années 1880 et le développement de l’école publique font partie du temps de la République.'],
    ['Un document décrit l’usage du charbon pour actionner des machines au XIXe siècle. Quel thème éclaire-t-il ?',['L’industrialisation.','Les premières écritures.','L’invention d’Internet.'],0,'Les machines et les sources d’énergie transforment les modes de production pendant l’âge industriel.'],
    ['Quel ordre chronologique est correct ?',['Première Guerre mondiale, Seconde Guerre mondiale, construction européenne.','Construction européenne, Première Guerre mondiale, Seconde Guerre mondiale.','Seconde Guerre mondiale, Première Guerre mondiale, construction européenne.'],0,'Les deux conflits se déroulent en 1914–1918 et 1939–1945. La construction européenne étudiée ici se développe après 1945.'],
    ['Pour connaître le travail dans une usine ancienne, quelle démarche est la plus solide ?',['Comparer plusieurs sources datées et situées.','Prendre une image sans chercher sa date.','Se fier seulement à une histoire inventée.'],0,'Un document doit être identifié, contextualisé et confronté à d’autres sources. Une fiction n’est pas une preuve historique.'],
    ['Que désigne une république ?',['Une organisation politique où le pouvoir n’est pas détenu héréditairement par un monarque.','Un pays où tous les habitants pensent pareil.','Une ville sans règles.'],0,'On distingue la forme républicaine d’un régime et la question de son fonctionnement démocratique.'],
    ['Pourquoi étudier la construction européenne après les guerres mondiales ?',['Pour comprendre une coopération entre des pays auparavant en guerre.','Pour dire que les pays ont tous disparu.','Pour confondre Europe et un seul pays.'],0,'La coopération européenne est étudiée dans son contexte d’après-guerre, sans effacer les différences entre pays.']
  ],
  geographie:[
    ['Pour étudier les déplacements quotidiens, quelle information faut-il recueillir ?',['Les trajets, moyens de transport et besoins des habitants.','Seulement leur couleur préférée.','Seulement le nombre de fenêtres.'],0,'Les mobilités dépendent des lieux, des réseaux, des activités et des besoins.'],
    ['Internet fonctionne grâce :',['à des infrastructures matérielles, notamment des réseaux et des câbles.','uniquement à des idées dans les nuages.','sans énergie ni appareils.'],0,'Les échanges numériques s’appuient sur des équipements physiques et consomment des ressources.'],
    ['Un quartier ajoute des arbres et un chemin piéton. Quel objectif peut être étudié ?',['Améliorer le cadre de vie et les déplacements.','Supprimer toute présence humaine.','Prouver que tous les quartiers sont identiques.'],0,'« Mieux habiter » invite à étudier des choix d’aménagement et leurs effets.'],
    ['Pourquoi certains habitants accèdent-ils moins facilement à Internet ?',['La couverture, l’équipement, le coût et les usages peuvent différer.','Tous les habitants ont exactement le même accès.','Il suffit toujours de marcher plus vite.'],0,'Les inégalités d’accès sont territoriales, matérielles et sociales.'],
    ['Pour choisir entre bus et voiture sur un trajet, que comparer ?',['Les besoins, horaires, durées, accès et effets sur l’environnement.','Un seul critère imposé à tout le monde.','Seulement la couleur du véhicule.'],0,'Un choix de mobilité se raisonne dans une situation concrète.'],
    ['Quelle démarche aide à comprendre un aménagement ?',['Observer les lieux et écouter plusieurs usagers.','Imaginer que personne ne l’utilise.','Ne regarder que son nom.'],0,'On étudie les usages et les choix des acteurs, pas seulement l’apparence d’un lieu.']
  ],
  sciences:[
    ['Pour tester l’effet de la lumière sur une plante, que comparer ?',['Des plantes semblables avec le même arrosage et un éclairage différent.','Deux plantes avec tout qui change.','Une plante et une pierre sans autre observation.'],0,'Pour tester une hypothèse, on essaie de ne faire varier qu’un facteur.'],
    ['Que faire si une observation contredit notre hypothèse ?',['La noter et revoir l’explication.','Effacer l’observation.','Dire qu’elle ne compte jamais.'],0,'Une démarche scientifique accepte les résultats observés et les vérifie.'],
    ['Un mélange d’eau et de sable peut être séparé notamment par :',['décantation puis filtration.','disparition magique du sable.','ajout obligatoire de sucre.'],0,'On exploite des propriétés physiques des constituants. Cette expérience se fait avec un adulte et du matériel adapté.'],
    ['Pourquoi répéter une mesure ?',['Pour vérifier la régularité du résultat et repérer une erreur éventuelle.','Pour obtenir forcément le résultat souhaité.','Pour remplacer toute explication.'],0,'La répétition aide à juger la fiabilité ; elle ne doit pas servir à cacher un résultat.'],
    ['Dans une chaîne alimentaire, la flèche est souvent utilisée pour signifier :',['est mangé par.','est toujours plus gros que.','a la même couleur que.'],0,'Il faut lire la légende du schéma. La flèche de transfert alimentaire va de l’aliment vers celui qui le consomme.'],
    ['Quel compte rendu est le plus utile ?',['Une question, une méthode, des observations et une conclusion justifiée.','Seulement « ça marche ».','Une conclusion écrite avant toute observation.'],0,'Le lecteur doit pouvoir comprendre comment on passe des observations à la conclusion.']
  ],
  citoyennete:[
    ['Un message humiliant circule. Quelle action aide à protéger le camarade ?',['Ne pas le partager et prévenir un adulte de confiance.','Le transférer pour rire.','Exiger que le camarade se débrouille seul.'],0,'Ne pas amplifier le message et demander une aide adulte sont des actions de protection.'],
    ['Avant de croire une information trouvée en ligne, que vérifier ?',['L’auteur, la date, les preuves et d’autres sources.','Seulement le nombre de points d’exclamation.','Uniquement si elle me plaît.'],0,'Une présentation impressionnante ou très partagée ne suffit pas à prouver une information.'],
    ['Un camarade refuse d’être photographié. Que faire ?',['Respecter son refus.','Insister jusqu’à ce qu’il accepte.','Publier quand même sans le dire.'],0,'Le respect de l’autre inclut son image, ses choix et ses limites.'],
    ['Pour un désaccord ordinaire, comment commencer un échange ?',['Décrire les faits et écouter l’autre sans l’insulter.','Chercher immédiatement à humilier.','Faire circuler une rumeur.'],0,'On peut exprimer un désaccord et demander une aide. Le harcèlement nécessite une prise en charge protectrice, pas une simple médiation entre égaux.'],
    ['Un site demande une adresse personnelle pour gagner un cadeau. Que faire ?',['Demander l’avis d’un adulte avant de communiquer une donnée.','Répondre sans réfléchir.','Donner aussi l’adresse des amis.'],0,'Une promesse de récompense ne justifie pas de communiquer des informations personnelles.'],
    ['Un camarade ne comprend pas une consigne. Quelle aide est utile ?',['Lui expliquer autrement et vérifier ce qu’il a compris.','Faire tout son travail sans lui parler.','Le traiter de mauvais élève.'],0,'L’entraide vise la compréhension et l’autonomie, sans comparaison humiliante.']
  ]
};
const ENGLISH = [
  ['Open your book.',['Ouvre ton livre.','Ferme la porte.','Prends ton manteau.'],0],
  ['My name is Liam.',['Je m’appelle Liam.','Liam est absent.','Je cherche Liam.'],0],
  ['Can you help me, please?',['Peux-tu m’aider, s’il te plaît ?','Je refuse de t’aider.','As-tu un livre rouge ?'],0],
  ['The bag is under the table.',['Le sac est sous la table.','Le sac est sur la table.','La table est dans le sac.'],0],
  ['I have two brothers.',['J’ai deux frères.','J’ai trois sœurs.','J’ai un frère.'],0],
  ['Turn left at the bridge.',['Tourne à gauche au pont.','Tourne à droite au pont.','Arrête-toi avant la forêt.'],0]
];
export function question(id,index,seed=1,level=2){
  if(!activity(id)||!Number.isInteger(index)||index<0||index>5) throw new Error('Question inconnue');
  const r=rng((seed + index*104729)>>>0), n=(a,b)=>a+Math.floor(r()*(b-a+1));
  const row=(bank)=>bank[(index+(seed%bank.length))%bank.length];
  let q;
  if(id==='lecture'){const b=row(READING);q=qcm(b[1],b[2],b[3],b[4],{passage:b[0],hint:'Relève un indice précis. N’ajoute pas une information absente du texte.'});}
  else if(BANKS[id]){const b=row(BANKS[id]);q=qcm(...b);}
  else if(id==='anglais'){const b=row(ENGLISH);q=qcm('Écoute puis choisis le sens de la phrase.',b[1],b[2],'La phrase signifie : '+b[1][b[2]],{spoken:b[0],hint:'Tu peux réécouter et afficher la transcription.'});}
  else if(id==='ecriture'){
    const prompts=['Décris un lieu de passage en quatre phrases, avec au moins deux détails précis.','Raconte une rencontre en cinq phrases : début, événement, réaction et fin.','Explique comment préparer un sac de voyage. Écris les étapes dans l’ordre.','Réécris un petit récit en évitant de commencer toutes les phrases par « il ».','Rédige une invitation : indique qui invite, pour quoi, où et quand.','Relis un texte de ton choix : explique deux améliorations, puis écris sa nouvelle version.'];
    q={kind:'writing',prompt:prompts[index],expected:null,explanation:'Relis : ai-je répondu à la consigne ? Mes phrases s’enchaînent-elles ? Ai-je vérifié les accords ? Cette production est à relire avec un adulte, elle ne reçoit pas de note automatique.',hint:'Prépare trois idées au brouillon. Choisis l’ordre avant d’écrire.'};
  } else if(id==='fractions'){
    const d=[4,5,8,10][n(0,3)],a=n(1,level>=2&&index>=2?2*d-1:d-1);
    if(index%2===0)q=number(`Chaque unité est découpée en ${d} parts égales. Le modèle montre ${a} parts colorées. Quel est le numérateur de la fraction représentée ?`,a,`La quantité représentée est ${a}/${d}. Le numérateur compte les parts prises ; le dénominateur indique le partage d’une unité. La fraction peut dépasser 1.`,{visual:{type:'fraction',a,d},hint:'Compte les parts colorées ; elles ont toutes la même taille.'});
    else {const total=d*n(2,level===1?4:8);q=number(`Quelle quantité représente ${a}/${d} de ${total} provisions ?`,total/d*a,`Une part vaut ${total} ÷ ${d} = ${total/d}. ${a} parts valent ${total/d} × ${a} = ${total/d*a}.`,{visual:{type:'fraction',a,d},hint:'Calcule d’abord la valeur d’une seule part.'});}
  } else if(id==='decimaux'){
    const units=n(1,9),tenths=n(1,9),hundredths=n(1,9),thousandths=level>=2&&index>=3?n(1,9):0,v=units+tenths/10+hundredths/100+thousandths/1000;
    if(index%2)q=number(`Écris le nombre composé de ${units} unités, ${tenths} dixièmes, ${hundredths} centièmes${thousandths?' et '+thousandths+' millièmes':''}.`,v.toFixed(thousandths?3:2),`${units} + ${tenths}/10 + ${hundredths}/100${thousandths?' + '+thousandths+'/1000':''} = ${v.toFixed(thousandths?3:2).replace('.',',')}.`,{hint:'Après la virgule : dixièmes, centièmes, puis millièmes. Chaque rang a sa valeur.'});
    else q=qcm(`Quel nombre est plus grand que ${units},${tenths} ?`,[`${units},${tenths}5`,`${units},0${tenths}`,`${units-1},99`],0,`On peut écrire ${units},${tenths} comme ${units},${tenths}0. ${units},${tenths}5 est plus grand.`,{hint:'Écris les nombres avec le même nombre de chiffres après la virgule.'});
  } else if(id==='calcul'){
    const a=n(2,9),b=n(2,level===1?9:level===3?75:25),c=n(1,9);
    q=number(index%2?`${a} × ${b} = ?`:`${a*b} + ${c*10} = ?`,index%2?a*b:a*b+c*10,index%2?`Tu peux décomposer ${b} pour calculer ${a} × ${b}. Vérifie avec une autre stratégie.`:`Ajoute ${c} dizaines à ${a*b}.`,{hint:index%2?'Décompose le plus grand nombre en dizaines et unités.':'Compte d’abord les dizaines, puis les unités.'});
  } else if(id==='mesures'){
    const a=n(2,25), variants=[['m','cm',100],['kg','g',1000],['L','mL',1000]];const [from,to,k]=variants[index%3];
    if(level===3&&index%2){const small=a*k/10;q=number(`${small} ${to}, combien est-ce en ${from} ?`,a/10,`1 ${from} vaut ${k} ${to}. On divise donc ${small} par ${k} : ${a/10} ${from}.`,{hint:`On passe à une unité plus grande : combien de ${to} contient 1 ${from} ?`});}
    else q=number(`${a} ${from}, combien est-ce en ${to} ?`,a*k,`1 ${from} vaut ${k} ${to}. Donc ${a} ${from} = ${a} × ${k} = ${a*k} ${to}.`,{hint:`Commence par rappeler combien de ${to} contient 1 ${from}.`});
  } else if(id==='durees'){
    const h=n(8,15),m=n(0,4)*10,d=n(2,7)*15,end=h*60+m+d;
    q=number(`Liam part à ${h} h ${String(m).padStart(2,'0')} et arrive à ${Math.floor(end/60)} h ${String(end%60).padStart(2,'0')}. Combien de minutes dure le trajet ?`,d,`Compte les minutes jusqu’à l’heure suivante, puis jusqu’à l’arrivée : ${d} minutes au total. Une heure vaut 60 minutes.`,{hint:'Tu peux dessiner une ligne du temps et avancer par étapes.'});
  } else if(id==='proportion'){
    const a=n(2,5),k=n(2,4),amount=n(2,9)*a;
    if(level>=2&&index%2)q=number(`Une recette pour ${a*k} personnes utilise ${amount*k} g de farine. Même recette pour ${a} personnes : combien de grammes ?`,amount,`On prépare ${k} fois moins de portions. On divise la quantité de farine par ${k} : ${amount*k} ÷ ${k} = ${amount} g.`,{hint:'Repère le nombre de groupes identiques et adapte la quantité de la même manière.'});
    else q=number(`Une recette pour ${a} personnes utilise ${amount} g de farine. Même recette pour ${a*k} personnes : combien de grammes ?`,amount*k,`Il y a ${k} fois plus de personnes. Il faut ${k} fois plus de farine : ${amount} × ${k} = ${amount*k} g.`,{hint:'Combien de fois plus de personnes ? Explique la même transformation sur la farine.'});
  } else if(id==='donnees'){
    const a=n(5,15),b=n(16,25),c=n(2,9);
    q=number('Le registre indique les pains vendus : lundi '+a+', mardi '+b+', mercredi '+c+'. Combien ont été vendus lundi et mercredi ensemble ?',a+c,`On utilise les deux jours demandés : ${a} + ${c} = ${a+c}. Mardi n’intervient pas dans ce calcul.`,{table:{headers:['Jour','Pains vendus'],rows:[['Lundi',a],['Mardi',b],['Mercredi',c]]},hint:'Repère les jours de la question avant de choisir les nombres.'});
  } else if(id==='hasard'){
    const a=n(1,5),b=n(1,5);
    q=number(`Un sac contient ${a} jetons rouges et ${b} bleus, tous identiques au toucher. On mélange et tire un jeton au hasard. Il y a ${a} chances sur combien de tirer rouge ?`,a+b,`Il y a ${a+b} jetons possibles dont ${a} rouges : ${a} chances sur ${a+b}. Le tirage ne garantit pas une couleur.`,{hint:'Compte toutes les possibilités, pas seulement les jetons rouges.'});
  }
  if(!q)throw new Error('Activité non définie');
  // Shuffle without changing the correct response; avoid learning option positions.
  if(q.kind==='choice'){
    const order=q.options.map((text,i)=>({text,correct:i===Number(q.expected),sort:r()})).sort((a,b)=>a.sort-b.sort);
    q.options=order.map(o=>o.text);q.expected=String(order.findIndex(o=>o.correct));
  }
  return {id:`${id}:${index}`,index,...q,hint:q.hint||'Relis la consigne et explique ce qui permet d’écarter une réponse.',level};
}
export function grade(q,answer){
  if(q.kind==='writing')return {correct:null,review:true};
  if(q.kind==='number'){
    const clean=s=>String(s).trim().replace(/\s/g,'').replace(',','.');
    const s=clean(answer);
    return {correct:/^-?\d+(\.\d+)?$/.test(s)&&Number(s)===Number(q.expected),review:false};
  }
  return {correct:String(answer)===q.expected,review:false};
}
