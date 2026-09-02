/**
 * filage_veilleur.js — Le Fil de Valdurne, niveau VEILLEUR (3e).
 *
 * Dernière année. Le danger n'est plus au-dehors : c'est de devenir ce qu'on
 * a combattu. Les douze modules du palier 09-10 y passent tous, et le fil se
 * referme sur la règle de l'Ordre — apprendre sa ronde à plus jeune que soi.
 */

export const NIVEAU = 3;
export const CHAPITRES = [

{
  n:1, titre:"Ce qui te tient", img:"filage_v01.jpg",
  cible:"On ne veille pas sur les autres si l'on a cédé sur soi.",
  b:[
   {t:'n',x:"Septembre. Kern t'attend, et pour la première fois il te serre la main au lieu de te faire signe."},
   {t:'k',x:"Dernière année. Je vais arrêter de te ménager."},
   {t:'k',x:"Cette année, l'adversaire n'est plus dehors. Ce n'est plus un harceleur, ni une autorité trop sûre d'elle. C'est toi — usé, pressé, persuadé d'avoir compris."},
   {t:'k',x:"Alors on commence par ce qui te tient debout, ou pas. Et il y a un sujet dont personne ne veut parler sérieusement à ton âge, parce qu'on préfère les slogans."},
   {t:'act',mod:'NEURO_09',href:'PIX_pHARe_Module_NEURO_09.html',ti:"Addiction & Cerveau Adolescent",n:'Module pHARe · NEURO 09'},
   {t:'k',x:"Je ne te ferai pas la morale : ce serait le plus sûr moyen que tu n'écoutes rien. Je te dis juste que ton cerveau est, en ce moment, au maximum de sa capacité à prendre un pli — dans les deux sens."},
   {t:'q',q:"Pourquoi je te parle de ça dans un fil sur le harcèlement ?",o:[
     {x:"Parce que ça touche à la santé.",
      r:"Ce n'est pas ma raison. Je ne suis pas ton infirmier."},
     {x:"Parce qu'un veilleur qui ne tient pas debout ne tient personne.",
      r:"Voilà. Tu ne pourras pas être disponible pour quelqu'un si tu es entièrement pris par autre chose. Ce n'est pas une question de vertu, c'est une question de place libre."},
     {x:"Parce que ceux qui vont mal sont plus exposés.",
      r:"Vrai aussi, et c'est important : les élèves isolés sont les plus vulnérables à tout ce qui promet un soulagement rapide. Tu en croiseras."}
   ]},
   {t:'k',x:"Deuxième chose. Tu as des données partout, et à quinze ans on croit que ça n'a pas d'importance. C'est l'âge exact où on se trompe le plus là-dessus."},
   {t:'act',mod:'JURIDIQUE_09',href:'PIX_pHARe_Module_JURIDIQUE_09.html',ti:"Vie Privée & Données",n:'Module pHARe · JURIDIQUE 09'},
   {t:'fin',mot:"Un veilleur qui ne tient pas debout ne tient personne."}
  ]
},

{
  n:2, titre:"Le groupe qui protège", img:"filage_v02.jpg",
  cible:"Un groupe peut détruire quelqu'un. Le même groupe peut le sauver. La différence tient à quelques personnes.",
  b:[
   {t:'n',x:"Kern t'a fait venir au réfectoire, à la table où il t'avait montré le cercle qui se ferme, il y a trois ans."},
   {t:'k',x:"Tu te souviens de cette table ?"},
   {t:'k',x:"Depuis, tu as passé trois ans à apprendre comment un groupe exclut. Aujourd'hui je te montre l'autre moitié — celle que presque personne n'enseigne."},
   {t:'k',x:"Le même mécanisme, retourné, protège. Un groupe qui a décidé que quelqu'un est des siens devient extraordinairement difficile à percer. Ce n'est pas de la gentillesse : c'est la même physique sociale, dans l'autre sens."},
   {t:'act',mod:'GROUPE_09',href:'PIX_pHARe_Module_GROUPE_09.html',ti:"Le Groupe Qui Protège",n:'Module pHARe · GROUPE 09'},
   {t:'k',x:"Et voilà pourquoi cette maison n'a jamais cherché à punir plus fort. Punir enlève quelqu'un du groupe. Nous, on essaie de faire l'inverse — y compris avec ceux qui ont fauté."},
   {t:'n',x:"Il regarde autour de lui, les tables vides, les bancs rentrés."},
   {t:'k',x:"Mais je ne veux pas te laisser croire que c'est simple, ni que ça marche toujours. Il faut que tu voies dans quel état est réellement l'école — la vraie, pas celle des brochures."},
   {t:'act',mod:'HISTOIRE_09',href:'PIX_pHARe_Module_HISTOIRE_09.html',ti:"L'École sous Pression",n:'Module pHARe · HISTOIRE 09'},
   {t:'k',x:"Des adultes fatigués, des moyens comptés, des injonctions contradictoires. Ce n'est pas une excuse pour ce qui ne fonctionne pas. C'est le terrain réel sur lequel tu vas travailler."},
   {t:'fin',mot:"Le même mécanisme qui exclut peut protéger. Il ne change pas de nature — il change de direction."}
  ]
},

{
  n:3, titre:"Des machines qui décident", img:"filage_v03.jpg",
  cible:"Une machine qui trie des gens hérite des préjugés de ceux qui l'ont nourrie.",
  b:[
   {t:'n',x:"Kern a l'air d'hésiter, ce qui ne lui ressemble pas."},
   {t:'k',x:"Aujourd'hui, un sujet sur lequel je ne suis pas tranquille. Des programmes décident déjà de choses qui te concernent : ce que tu vois, ce qu'on te propose, parfois ce à quoi tu as droit."},
   {t:'k',x:"On te dira qu'ils sont neutres, parce que ce sont des mathématiques. C'est faux, et c'est faux d'une façon précise : une machine apprend sur ce qu'on lui donne. Si on lui donne un passé injuste, elle apprend l'injustice — et la rend impeccablement objective."},
   {t:'act',mod:'NUMERIQUE_09',href:'PIX_pHARe_Module_NUMERIQUE_09.html',ti:"L'IA en Question",n:'Module pHARe · NUMÉRIQUE 09'},
   {t:'q',q:"Quel est, à ton avis, le plus grand danger de ces systèmes ?",o:[
     {x:"Qu'ils se trompent.",
      r:"Ils se trompent, oui, comme les humains. Ce n'est pas le pire."},
     {x:"Qu'on croie qu'ils ne se trompent pas.",
      r:"Voilà. Une décision humaine, on la conteste. Une décision de machine, on la subit — parce que personne n'ose dire que le calcul a tort, et souvent personne ne sait comment il a été fait."},
     {x:"Qu'ils remplacent les gens.",
      r:"C'est la peur la plus racontée, et pas la plus urgente. Le problème du moment n'est pas qu'ils remplacent : c'est qu'ils décident sans qu'on puisse leur demander pourquoi."}
   ]},
   {t:'k',x:"Retiens le mot « pourquoi ». C'est exactement ce que le serment de cette maison exige : le droit d'être entendu, c'est le droit de demander pourquoi et d'obtenir une réponse. Une machine qui ne peut pas répondre ne devrait pas décider seule."},
   {t:'k',x:"Assez de théorie. Cette année tu ne te contentes pas de comprendre : tu montes quelque chose."},
   {t:'act',mod:'VEA_09',href:'PIX_pHARe_Module_VEA_09.html',ti:"Le Projet Collectif",n:'Module pHARe · VEA 09'},
   {t:'fin',mot:"Une décision humaine se conteste. Une décision de machine se subit — c'est là qu'est le danger."}
  ]
},

{
  n:4, titre:"Plaider", img:"filage_v04.jpg",
  cible:"Défendre quelqu'un devant des adultes est une compétence — pas un talent.",
  b:[
   {t:'n',x:"Kern t'a installé face à lui, une table entre vous, comme un entretien."},
   {t:'k',x:"Mise en situation. Un élève est accusé. Tu penses qu'il est innocent, ou au moins qu'on va trop vite. Tu as trois minutes devant trois adultes pressés. Vas-y."},
   {t:'n',x:"Tu commences. Il te coupe au bout de vingt secondes."},
   {t:'k',x:"Non. Tu as commencé par ce que tu ressens. Personne ne va changer d'avis parce que tu trouves ça injuste."},
   {t:'q',q:"Par quoi fallait-il commencer ?",o:[
     {x:"Par les faits, dans l'ordre.",
      r:"Mieux, et c'est la base. Mais en trois minutes, tu n'auras pas fini."},
     {x:"Par ce qui manque au dossier.",
      r:"Voilà le meilleur angle. Tu ne prouves pas son innocence — tu montres qu'on ne peut pas encore conclure. C'est infiniment plus facile à obtenir, et ça suffit à arrêter une décision précipitée."},
     {x:"Par ce qu'on risque en se trompant.",
      r:"Excellent aussi, et à garder pour la fin. Rappeler le coût de l'erreur, c'est ce qui fait ralentir les gens pressés."}
   ]},
   {t:'act',mod:'JURIDIQUE_10',href:'PIX_pHARe_Module_JURIDIQUE_10.html',ti:"Plaider sa Cause",n:'Module pHARe · JURIDIQUE 10'},
   {t:'k',x:"Et pour tenir trois minutes devant trois adultes sans t'effondrer ni t'emporter, il te faut autre chose que des arguments."},
   {t:'act',mod:'NEURO_10',href:'PIX_pHARe_Module_NEURO_10.html',ti:"La Pleine Conscience en Action",n:'Module pHARe · NEURO 10'},
   {t:'k',x:"Respirer avant de parler, ça a l'air ridicule. C'est pourtant la différence entre quelqu'un qu'on écoute et quelqu'un qu'on calme."},
   {t:'fin',mot:"Tu n'as pas à prouver l'innocence. Il suffit de montrer qu'on ne peut pas encore conclure."}
  ]
},

{
  n:5, titre:"Servir avec ce qu'on sait", img:"filage_v05.jpg",
  cible:"Toute compétence peut servir ou nuire. Ce qui tranche, c'est ce qu'on refuse d'en faire.",
  b:[
   {t:'n',x:"Kern retourne son écran vers toi. Une console noire, des lignes qui défilent."},
   {t:'k',x:"Les mêmes connaissances servent à protéger un compte ou à le forcer. Exactement les mêmes. Ceux qui sécurisent le mieux sont ceux qui savent le mieux attaquer."},
   {t:'k',x:"Ça vaut pour toi bien au-delà des machines. Tout ce que tu as appris ici — repérer les vulnérables, comprendre les mécaniques de groupe, savoir à qui parler — un manipulateur en ferait un usage redoutable."},
   {t:'k',x:"Je te l'ai enseigné quand même. Tu sais pourquoi ?"},
   {t:'q',q:"Pourquoi ?",o:[
     {x:"Parce que tu me fais confiance.",
      r:"Oui, mais ce serait imprudent de fonder un enseignement là-dessus. J'ai eu tort de faire confiance, déjà."},
     {x:"Parce que ne pas l'enseigner ne protège personne.",
      r:"Voilà. Ceux qui manipulent n'ont pas besoin de cours : ils apprennent tout seuls, très vite. Ne rien enseigner, c'est laisser le savoir aux seuls qui en abusent."},
     {x:"Parce qu'il faut bien prendre le risque.",
      r:"C'est vrai, et je le prends à chaque fois. Ce n'est pas confortable."}
   ]},
   {t:'act',mod:'NUMERIQUE_10',href:'PIX_pHARe_Module_NUMERIQUE_10.html',ti:"Hacker pour le Bien",n:'Module pHARe · NUMÉRIQUE 10'},
   {t:'k',x:"Il y a une règle simple dans ce métier, et elle vaut pour toi : on ne teste jamais une serrure sans la permission du propriétaire. Le savoir ne donne aucun droit."},
   {t:'fin',mot:"Ne rien enseigner ne protège personne : ça laisse le savoir à ceux qui en abusent."}
  ]
},

{
  n:6, titre:"Écrire les règles", img:"filage_v06.jpg",
  cible:"Les normes d'un groupe ne tombent pas du ciel : quelqu'un les pose, et ce peut être toi.",
  b:[
   {t:'n',x:"Kern t'emmène dans une salle de classe vide et écrit trois mots au tableau : ICI, ON NE."},
   {t:'k',x:"Finis la phrase. Pour ta classe. Ce qui, chez vous, ne se fait pas — pas parce que c'est interdit, mais parce que personne ne le ferait."},
   {t:'n',x:"Tu cherches. Ce n'est pas si facile : les vraies normes d'un groupe sont invisibles tant qu'on ne les enfreint pas."},
   {t:'k',x:"Voilà ce qu'on appelle une norme. Pas une règle écrite : un accord tacite que personne n'a signé et que tout le monde respecte."},
   {t:'k',x:"Et le point important : ces normes ne sont pas naturelles. Quelqu'un les a posées, souvent sans le savoir, souvent en début d'année, souvent par un tout petit geste répété."},
   {t:'act',mod:'GROUPE_10',href:'PIX_pHARe_Module_GROUPE_10.html',ti:"Architecte de Normes",n:'Module pHARe · GROUPE 10'},
   {t:'q',q:"Quand se décident les normes d'une classe ?",o:[
     {x:"Progressivement, toute l'année.",
      r:"On le croit. En réalité l'essentiel se joue très tôt, et se durcit ensuite."},
     {x:"Dans les premières semaines.",
      r:"Oui, et c'est une information stratégique : à la rentrée, un groupe est encore mou. Ce qui s'y installe en septembre tiendra jusqu'en juin."},
     {x:"Quand un incident grave arrive.",
      r:"Un incident révèle les normes, il les crée rarement. Elles étaient déjà là, et c'est pour ça que l'incident a été possible."}
   ]},
   {t:'k',x:"Tu es en dernière année. Les plus jeunes te regardent, que tu le veuilles ou non. Ce que tu laisses passer devient la norme. Ce que tu reprends aussi."},
   {t:'fin',mot:"Ce que tu laisses passer devient la règle. Ce que tu reprends aussi."}
  ]
},

{
  n:7, titre:"Ce qu'on doit aux effacés", img:"filage_v07.jpg",
  cible:"On ne répare pas une exclusion en l'oubliant. On la répare en la nommant.",
  b:[
   {t:'n',x:"Kern t'emmène devant la Trame. Tu n'y étais pas revenu depuis le premier soir."},
   {t:'n',x:"Le trou est toujours là, au milieu de la phrase. Le mot arraché."},
   {t:'k',x:"Quatre ans que tu passes devant. Tu sais quel mot manque. Mais tu ne sais pas ce qu'il y a derrière la tapisserie."},
   {t:'k',x:"Des noms. Des centaines. Tous ceux que cette maison a retranchés en cent ans, un par un, toujours pour de bonnes raisons, toujours parce que c'était plus simple."},
   {t:'k',x:"Personne ne les a jamais relus. C'est ça, retrancher quelqu'un : ce n'est pas le punir, c'est faire qu'il n'ait jamais existé."},
   {t:'q',q:"Que faudrait-il faire de ces noms ?",o:[
     {x:"Les oublier. C'est du passé.",
      r:"C'est ce qu'on a fait pendant cent ans. Regarde le résultat : la liste s'est allongée, parce que personne ne savait qu'elle existait."},
     {x:"Les lire à voix haute.",
      r:"Oui. Nommer quelqu'un qu'on a effacé, c'est la seule réparation qui reste quand il est trop tard pour le reste. Ça ne lui rend rien — ça nous empêche de recommencer."},
     {x:"Les afficher pour faire honte à l'école.",
      r:"Attention. Une réparation qui sert surtout à accuser les vivants n'en est pas une : elle fabrique de nouveaux exclus. Ce n'est pas un tribunal, c'est une mémoire."}
   ]},
   {t:'act',mod:'HISTOIRE_10',href:'PIX_pHARe_Module_HISTOIRE_10.html',ti:"Écrire la Paix",n:'Module pHARe · HISTOIRE 10'},
   {t:'k',x:"Écrire la paix, ce n'est pas signer un traité. C'est décider de ce dont on se souviendra — et de la place qu'on laisse à ceux d'en face dans le récit."},
   {t:'fin',mot:"Retrancher quelqu'un, ce n'est pas le punir : c'est faire qu'il n'ait jamais existé."}
  ]
},

{
  n:8, titre:"L'Ordre des Veilleurs", img:"filage_v08.jpg",
  cible:"On ne finit pas veilleur en sachant tout : on finit veilleur en transmettant.",
  b:[
   {t:'n',x:"Dernier jour. Kern t'attend sur le chemin de ronde, celui du tout premier soir, quand tu n'étais qu'un page qui ne savait rien."},
   {t:'n',x:"En bas, la cour est pleine. Des sixièmes courent dans tous les sens. L'un d'eux, contre un pilier, tient un livre qu'il ne lit pas."},
   {t:'k',x:"Tu l'as vu tout de suite, hein."},
   {t:'k',x:"Il y a quatre ans, tu ne l'aurais même pas remarqué. C'est tout ce que je t'ai appris, et c'est irréversible."},
   {t:'n',x:"Il sort de sa poche un petit anneau de fer avec trois clefs. Celles de la réserve."},
   {t:'k',x:"Il me reste une chose à te donner, et une à te demander."},
   {t:'k',x:"Ce que je te donne, ce sont les clefs. Ce que je te demande, c'est plus difficile : descends dans la cour, et va parler à ce gamin contre son pilier."},
   {t:'k',x:"Pas pour le sauver. Pour qu'il sache que quelqu'un l'a vu. C'est tout. C'est immense."},
   {t:'q',q:"Une dernière question, la même qu'à la fin de ta première année. Qu'est-ce qu'un veilleur ?",o:[
     {x:"Quelqu'un qui ne regarde pas ailleurs.",
      r:"C'est ce que tu m'avais répondu en sixième, et c'était juste. Mais tu peux aller plus loin maintenant."},
     {x:"Quelqu'un qui apprend sa ronde à plus jeune que lui.",
      r:"Voilà. C'est la règle de l'Ordre, et c'est la seule qui compte à la fin. Ce que tu sais mourra avec toi si tu ne le passes pas. Un veilleur seul n'est qu'un homme qui regarde."},
     {x:"Quelqu'un qui ne retranche personne.",
      r:"C'est le serment, et tu l'as tenu. Mais un serment tenu par un seul finit avec lui. Il faut qu'il y ait quelqu'un après."}
   ]},
   {t:'k',x:"Alors voilà. Tu pars en seconde, et je ne serai plus là — je n'y ai jamais été, d'ailleurs, tu le sais bien. Mais ce que tu as appris ici, tu peux le donner à n'importe qui, n'importe où, sans moi et sans cette maison."},
   {t:'k',x:"Un dernier module. Le dernier de tous. Il ne t'apprendra rien de neuf : il te demandera ce que tu construis avec le reste."},
   {t:'act',mod:'VEA_10',href:'PIX_pHARe_Module_VEA_10.html',ti:"Architecte de Paix",n:'Module pHARe · VEA 10'},
   {t:'act',mod:'',href:'index_PIX_FRATERNITE.html',ti:"Le hub Fraternité",n:'Rubrique · Fraternité'},
   {t:'n',x:"Quand tu remontes, il n'est plus là. Sur le parapet, il a laissé l'anneau de fer et un papier plié."},
   {t:'k',x:"— Nul n'est retranché sans avoir été entendu. Le mot manque toujours sur la Trame, et il manquera encore quand tu seras parti. Ce n'est pas grave : c'est même le but. Un serment entier, on l'oublie. Un serment troué, on le récite tous les jours pour combler le trou."},
   {t:'k',x:"— Va parler au gamin du pilier. C'est la seule chose que je te demande. Kern."},
   {t:'fin',mot:"Veilleur de Valdurne. La clef descend à plus jeune que soi, et la porte reste ouverte.",sceau:true}
  ]
}
];
