/**
 * filage_ecuyer.js — Le Fil de Valdurne, niveau ÉCUYER (5e).
 *
 * Année du Griffon : on ne regarde plus, on agit. Les dix-huit modules du
 * palier 04-06 y passent tous. Kern parle à quelqu'un qui sait déjà voir —
 * le ton est plus dur, les questions moins consolantes.
 */

export const NIVEAU = 1;
export const CHAPITRES = [

{
  n:1, titre:"Ce qu'on fait de ce qu'on sait", img:"filage_e01.jpg",
  cible:"Savoir sans agir est une position confortable — et c'est ce qui la rend dangereuse.",
  b:[
   {t:'n',x:"Septembre. Kern t'attend dans la galerie, et il ne prend pas de gants."},
   {t:'k',x:"L'an dernier, je t'ai appris à voir. Cette année, ça ne suffira plus."},
   {t:'k',x:"Parce qu'il y a une position très confortable, et beaucoup de gens s'y installent pour la vie : celle de celui qui a tout compris et qui ne fait rien. Il voit mieux que les autres. Il pourrait expliquer. Mais il ne bouge pas."},
   {t:'k',x:"Et il dort très bien, parce qu'il se dit qu'au moins, lui, il n'est pas dupe."},
   {t:'q',q:"Est-ce mieux que de ne rien voir ?",o:[
     {x:"Oui, au moins il ne participe pas.",
      r:"C'est ce qu'il se raconte. Mais celui qui subit, lui, ne fait aucune différence entre un aveugle et un lucide immobile. Le résultat est exactement le même."},
     {x:"Non, c'est même pire.",
      r:"Je le pense aussi, et je vais te dire pourquoi : celui qui n'a pas vu peut apprendre. Celui qui a vu et n'a rien fait a déjà décidé. Il devra recommencer à zéro."},
     {x:"Ça dépend de ce qu'il risque en agissant.",
      r:"Réponse honnête, et la seule qui tienne debout. Le courage n'est pas l'absence de calcul. Mais fais attention : « je risquerais trop » est aussi la phrase que se disent tous ceux qui ne feront jamais rien."}
   ]},
   {t:'k',x:"Alors commençons par le plus dur : parler. Vraiment parler, à quelqu'un qui ne veut pas t'entendre, sans le braquer et sans te renier."},
   {t:'act',mod:'VEA_04',href:'PIX_pHARe_Module_VEA_04.html',ti:"Dire ce que je pense sans blesser",n:'Module pHARe · VEA 04'},
   {t:'k',x:"Ce n'est pas de la politesse, c'est de la technique. La différence entre « t'es qu'un con » et « ce que tu viens de faire, je ne le trouve pas normal », c'est la différence entre une bagarre et un changement."},
   {t:'k',x:"Et il faut que tu saches une chose sur ce que subit celui qu'on exclut. Ce n'est pas une image. Ce n'est pas « il le vit mal ». C'est mesurable."},
   {t:'act',mod:'NEURO_04',href:'PIX_pHARe_Module_NEURO_04.html',ti:"La Douleur Sociale",n:'Module pHARe · NEURO 04'},
   {t:'k',x:"Le même circuit que la douleur physique. Quand on dit « ça fait mal », ce n'est pas une métaphore : le cerveau, lui, ne fait pas la différence."},
   {t:'fin',mot:"Voir ne suffit plus. Cette année, tu vas devoir répondre de ce que tu sais."}
  ]
},

{
  n:2, titre:"Briser le cycle", img:"filage_e02.jpg",
  cible:"Une situation de harcèlement se répète parce que rien ne l'interrompt — pas parce qu'elle est fatale.",
  b:[
   {t:'n',x:"Kern a étalé sur une table des feuilles couvertes de flèches, de cercles, de noms barrés. Une mécanique dessinée."},
   {t:'k',x:"Regarde. Ça, c'est ce qui se passe quand personne n'intervient. Ça tourne. Ça se renforce tout seul. Chaque tour rend le suivant plus facile pour l'agresseur et plus difficile pour la victime."},
   {t:'k',x:"Les gens croient que ces histoires « dégénèrent ». Elles ne dégénèrent pas : elles fonctionnent exactement comme prévu. Ce sont des machines, et une machine, ça s'arrête."},
   {t:'act',mod:'GROUPE_04',href:'PIX_pHARe_Module_GROUPE_04.html',ti:"Briser le Cycle",n:'Module pHARe · GROUPE 04'},
   {t:'k',x:"Retiens le point le plus contre-intuitif : plus on intervient tôt, moins il faut de force. Une semaine après le début, un mot suffit parfois. Six mois après, il faut trois adultes et une procédure."},
   {t:'n',x:"Il replie ses feuilles et t'en tend une autre, imprimée celle-là, avec un en-tête officiel."},
   {t:'k',x:"Et voilà l'outil que ton collège a réellement. Pas une bonne intention : un protocole, avec des étapes, des gens responsables, des délais."},
   {t:'k',x:"La plupart des élèves ne savent même pas qu'il existe. C'est comme avoir un extincteur derrière une porte que personne n'ouvre jamais."},
   {t:'act',mod:'JURIDIQUE_04',href:'PIX_pHARe_Module_JURIDIQUE_04.html',ti:"Le Protocole pHARe",n:'Module pHARe · JURIDIQUE 04'},
   {t:'q',q:"À ton avis, pourquoi si peu d'élèves le connaissent ?",o:[
     {x:"Parce qu'on ne leur explique pas assez.",
      r:"En partie. Mais on leur explique plus qu'ils ne croient — et ils oublient, parce que ça ne les concerne pas ce jour-là."},
     {x:"Parce qu'on ne s'y intéresse que quand il est trop tard.",
      r:"Voilà. On lit la notice quand la maison brûle. C'est humain, et c'est exactement ce que ton rôle sert à corriger : tu es celui qui sait AVANT."},
     {x:"Parce qu'ils n'y croient pas.",
      r:"Il y a de ça aussi. « Ça sert à rien, ils feront rien. » Parfois c'est vrai. Souvent c'est une excuse pour ne pas essayer."}
   ]},
   {t:'fin',mot:"Ce n'est pas une fatalité. C'est une machine — et tu sais maintenant où est le bouton."}
  ]
},

{
  n:3, titre:"Tes droits ne sont pas des faveurs", img:"filage_e03.jpg",
  cible:"Ce qui te protège aujourd'hui a été arraché par des gens qui ne te connaissaient pas.",
  b:[
   {t:'n',x:"La salle d'archives, encore. Kern semble y venir quand il veut dire des choses sérieuses."},
   {t:'k',x:"En ligne, tu as des droits. Pas des recommandations : des droits. Faire retirer une photo, exiger l'effacement de ce qui te concerne, porter plainte pour un message."},
   {t:'k',x:"Presque personne de ton âge ne le sait, et c'est très pratique pour ceux qui en profitent."},
   {t:'act',mod:'NUMERIQUE_04',href:'PIX_pHARe_Module_NUMERIQUE_04.html',ti:"Tes Droits, Ton Armure",n:'Module pHARe · NUMÉRIQUE 04'},
   {t:'k',x:"Maintenant, une chose qu'on ne dit jamais assez : rien de tout ça n'est tombé du ciel."},
   {t:'k',x:"Les dispositifs qui te protègent au collège ont été construits, souvent après des drames, par des gens qui se sont battus pour ça. Il y a trente ans, ils n'existaient pas."},
   {t:'act',mod:'HISTOIRE_04',href:'PIX_pHARe_Module_HISTOIRE_04.html',ti:"Les Dispositifs Modernes",n:'Module pHARe · HISTOIRE 04'},
   {t:'k',x:"Je te dis ça pour une raison précise, et ce n'est pas de la leçon d'histoire."},
   {t:'k',x:"Ce qui a été construit peut être détruit. Un dispositif qui ne sert à personne finit par disparaître — non par méchanceté, par abandon. Il faut des gens pour s'en servir, sinon il s'éteint."},
   {t:'k',x:"C'est aussi ça, être écuyer : faire vivre ce qu'on t'a laissé."},
   {t:'fin',mot:"Tes droits ne sont pas des faveurs. Ce sont des victoires que d'autres ont gagnées, et qu'il faut continuer d'utiliser."}
  ]
},

{
  n:4, titre:"Le poids d'un exemple", img:"filage_e04.jpg",
  cible:"On ne convainc pas un groupe par des discours : on l'entraîne par ce qu'on fait devant lui.",
  b:[
   {t:'n',x:"Cour de récréation. Kern désigne du menton un groupe de troisième."},
   {t:'k',x:"Tu vois celui du milieu ? Il ne dit presque rien. Et pourtant, quand il se lève, les cinq autres se lèvent."},
   {t:'k',x:"Il n'a aucun titre. Personne ne l'a élu. C'est juste que le groupe le suit — et c'est la forme de pouvoir la plus répandue et la moins comprise du collège."},
   {t:'q',q:"Ce pouvoir-là, c'est quoi ?",o:[
     {x:"Du charisme. On l'a ou on ne l'a pas.",
      r:"C'est ce qu'on croit, et c'est très pratique pour ceux qui ne veulent pas essayer. En vrai, ça s'apprend, et c'est même assez mécanique."},
     {x:"De la cohérence : il fait ce qu'il dit.",
      r:"Voilà l'essentiel. Un groupe ne suit pas les grands discours ; il suit ceux dont les actes ne trahissent pas les paroles. C'est lent à construire et ça se casse en une fois."},
     {x:"De la peur : on n'ose pas le contredire.",
      r:"Ça existe, et ça marche aussi. Mais ce pouvoir-là s'écroule dès qu'il n'est plus là. Ce n'est pas celui qu'on t'apprend ici."}
   ]},
   {t:'k',x:"Va apprendre comment on prend cette place sans écraser personne. Parce qu'elle sera prise, de toute façon — par toi ou par quelqu'un d'autre."},
   {t:'act',mod:'GROUPE_05',href:'PIX_pHARe_Module_GROUPE_05.html',ti:"Leader Positif [certification]",n:'Module pHARe · GROUPE 05'},
   {t:'k',x:"Et maintenant la partie que personne n'aime : passer de « je pourrais » à « j'ai fait »."},
   {t:'k',x:"Agir pour le groupe, ce n'est pas héroïque. C'est souvent minuscule et un peu ennuyeux : proposer, organiser, relancer, tenir quand les autres se lassent."},
   {t:'act',mod:'VEA_05',href:'PIX_pHARe_Module_VEA_05.html',ti:"Agir pour le groupe",n:'Module pHARe · VEA 05'},
   {t:'fin',mot:"Un groupe ne suit pas celui qui parle le mieux. Il suit celui dont les actes ne trahissent pas les mots."}
  ]
},

{
  n:5, titre:"Se tenir soi-même", img:"filage_e05.jpg",
  cible:"On ne protège personne si l'on est emporté par sa propre colère.",
  b:[
   {t:'n',x:"Kern est assis sur les marches, il ne se lève pas quand tu arrives."},
   {t:'k',x:"J'ai perdu mon sang-froid une fois, en écuyer. Une seule. Un type s'en prenait à un petit, je suis intervenu, et j'ai fini par hurler plus fort que lui."},
   {t:'k',x:"Résultat : deux élèves punis au lieu d'un, le petit encore plus mal qu'avant parce qu'il se sentait responsable, et moi convoqué. Le harceleur, lui, s'en est très bien sorti — il avait juste à montrer que j'étais violent."},
   {t:'k',x:"Ce jour-là j'ai compris que ma colère, aussi juste soit-elle, était son meilleur outil."},
   {t:'act',mod:'NEURO_05',href:'PIX_pHARe_Module_NEURO_05.html',ti:"S'auto-réguler [certification]",n:'Module pHARe · NEURO 05'},
   {t:'k',x:"Se réguler, ce n'est pas devenir froid. C'est garder la main. Tu peux être furieux et parler calmement — c'est même redoutablement efficace, et ça déstabilise beaucoup plus qu'un cri."},
   {t:'n',x:"Il sort son téléphone et le fait tourner entre ses doigts, ce tic qu'il a quand il change de sujet."},
   {t:'k',x:"Même travail, autre terrain. Ton fil d'actualité est réglé pour te maintenir dans un état précis : indigné, comparé, jamais tout à fait satisfait. Ce n'est pas un accident."},
   {t:'act',mod:'NUMERIQUE_05',href:'PIX_pHARe_Module_NUMERIQUE_05.html',ti:"Maître de ton Feed",n:'Module pHARe · NUMÉRIQUE 05'},
   {t:'k',x:"Reprendre la main sur son fil, c'est le même geste que reprendre la main sur sa colère. Dans les deux cas, quelqu'un d'autre tenait le volant."},
   {t:'fin',mot:"Ta colère peut être juste et servir quand même celui que tu combats."}
  ]
},

{
  n:6, titre:"Réparer plutôt que punir", img:"filage_e06.jpg",
  cible:"Punir soulage celui qui punit. Réparer sert celui qui a été blessé.",
  b:[
   {t:'n',x:"Kern t'emmène devant le bureau du CPE, sans entrer. Il s'assoit sur le banc en face."},
   {t:'k',x:"Question sérieuse. Quand quelqu'un a fait du mal à un autre, qu'est-ce qui doit se passer ?"},
   {t:'q',q:"Ta réponse ?",o:[
     {x:"Il doit être puni, sinon il recommencera.",
      r:"C'est l'intuition de tout le monde, et elle n'est pas absurde. Mais regarde ce qu'elle règle vraiment : elle solde le compte de l'institution. Elle ne rend rien à celui qui a subi."},
     {x:"Il doit réparer ce qu'il a cassé.",
      r:"Plus dur, et beaucoup plus efficace. Réparer oblige à regarder ce qu'on a fait — la punition permet au contraire de se sentir victime à son tour, et d'oublier."},
     {x:"Les deux.",
      r:"Souvent, oui. Mais si tu dois n'en garder qu'un, garde la réparation. Une sanction sans réparation laisse deux personnes en colère et rien de réglé."}
   ]},
   {t:'k',x:"Ce que je viens de te décrire porte un nom, et ce n'est pas une idée de doux rêveur : c'est une pratique, avec des règles, utilisée dans des tribunaux."},
   {t:'act',mod:'JURIDIQUE_05',href:'PIX_pHARe_Module_JURIDIQUE_05.html',ti:"Maître de l'Harmonie",n:'Module pHARe · JURIDIQUE 05'},
   {t:'k',x:"Et il y a une raison très concrète de préférer ça : ça marche mieux. On a compté. Les récidives baissent."},
   {t:'act',mod:'HISTOIRE_05',href:'PIX_pHARe_Module_HISTOIRE_05.html',ti:"Comprendre pour Prévenir [certification]",n:'Module pHARe · HISTOIRE 05'},
   {t:'k',x:"Tu remarqueras que cette maison entière repose là-dessus. On ne retranche personne. On répare. Ce n'est pas de la bonté — c'est ce qui fonctionne."},
   {t:'fin',mot:"Punir soulage celui qui punit. Réparer sert celui qui a été blessé. Ce n'est pas la même chose."}
  ]
},

{
  n:7, titre:"Une poignée suffit", img:"filage_e07.jpg",
  cible:"Il n'a jamais fallu la majorité pour changer un groupe. Il faut quelques-uns qui ne cèdent pas.",
  b:[
   {t:'n',x:"Kern t'attend avec deux autres élèves que tu ne connais pas. Ils ont l'air aussi surpris que toi."},
   {t:'k',x:"Vous êtes trois. Sur combien d'élèves dans ce collège ?"},
   {t:'n',x:"Le chiffre te paraît ridicule quand tu le dis à voix haute."},
   {t:'k',x:"Ridicule, oui. Et pourtant, historiquement, c'est à peu près toujours par là que ça commence."},
   {t:'k',x:"Une minorité qui ne cède pas, qui reste cohérente, qui répète la même chose sans s'énerver — elle finit par déplacer la majorité. Ça a été étudié, mesuré. Ce n'est pas de l'espoir : c'est un phénomène."},
   {t:'act',mod:'GROUPE_06',href:'PIX_pHARe_Module_GROUPE_06.html',ti:"La Minorité Active",n:'Module pHARe · GROUPE 06'},
   {t:'q',q:"Quelle est la condition principale pour qu'une minorité fasse bouger un groupe ?",o:[
     {x:"Qu'elle soit assez nombreuse.",
      r:"Non — c'est le plus surprenant. Trois personnes constantes pèsent plus que trente inconstantes."},
     {x:"Qu'elle ne se contredise jamais.",
      r:"Exactement. La cohérence dans le temps, c'est tout. Une minorité qui varie devient inaudible ; une minorité qui répète devient inévitable."},
     {x:"Qu'elle ait raison.",
      r:"Hélas, ça ne suffit jamais. Beaucoup de gens ont eu raison tout seuls et sont morts sans que ça change rien. La cohérence pèse plus que la justesse."}
   ]},
   {t:'k',x:"Alors cette année, vous n'êtes plus seulement des élèves qui savent. Vous êtes ceux qu'on regarde."},
   {t:'act',mod:'VEA_06',href:'PIX_pHARe_Module_VEA_06.html',ti:"Ambassadeur du Vivre Ensemble",n:'Module pHARe · VEA 06'},
   {t:'fin',mot:"Trois qui tiennent valent mieux que trente qui approuvent."}
  ]
},

{
  n:8, titre:"Le Serment du Griffon", img:"filage_e08.jpg",
  cible:"Tenir sans prendre : le pouvoir d'aider est aussi un pouvoir, et il se surveille.",
  b:[
   {t:'n',x:"Fin d'année. Kern t'emmène là où il ne t'avait jamais conduit : la petite réserve sous la tour est, celle dont tu as vu les trois clefs le premier soir. Cette fois, il ouvre."},
   {t:'n',x:"À l'intérieur, rien de spectaculaire. Une table, des bancs, un blason usé sur le mur : un griffon, l'œil de l'aigle et la serre du lion."},
   {t:'k',x:"Le griffon, c'est l'œil qui voit et la force qui protège. Tout le monde retient ça."},
   {t:'k',x:"Ce qu'on oublie, c'est le reste du serment : tenir sans prendre. La serre est faite pour saisir — et un griffon qui referme sa serre trop fort tue ce qu'il croyait sauver."},
   {t:'k',x:"J'ai vu des écuyers devenir insupportables en une année. Pas méchants : convaincus. Ils savaient ce qui était bien pour les autres, et ils le savaient mieux qu'eux."},
   {t:'q',q:"Comment on évite ça ?",o:[
     {x:"En restant modeste.",
      r:"Mot creux. Tout le monde se croit modeste, surtout ceux qui ne le sont pas."},
     {x:"En laissant quelqu'un avoir le droit de me dire non.",
      r:"Voilà. C'est le seul garde-fou qui fonctionne, parce qu'il ne dépend pas de ta lucidité — justement la chose qui te manque quand tu dérapes. Choisis cette personne, et écoute-la."},
     {x:"En ne décidant jamais seul.",
      r:"Bon principe, mais parfois impossible. Il y a des jours où personne n'est là. Ce qu'il faut, c'est quelqu'un devant qui tu devras rendre compte après."}
   ]},
   {t:'k',x:"Le cerveau peut changer. C'est vrai pour ceux que tu aides, et c'est vrai pour toi — dans les deux sens. On devient ce qu'on répète."},
   {t:'act',mod:'NEURO_06',href:'PIX_pHARe_Module_NEURO_06.html',ti:"Neuroplasticité",n:'Module pHARe · NEURO 06'},
   {t:'k',x:"Il te reste trois choses à voir avant l'été. Ce que tu vaux comme citoyen en ligne, ce qu'on doit à ceux qu'on a effacés, et comment on répare pour de bon."},
   {t:'act',mod:'NUMERIQUE_06',href:'PIX_pHARe_Module_NUMERIQUE_06.html',ti:"Citoyen Numérique Actif",n:'Module pHARe · NUMÉRIQUE 06'},
   {t:'act',mod:'HISTOIRE_06',href:'PIX_pHARe_Module_HISTOIRE_06.html',ti:"Mémoire et Réparation",n:'Module pHARe · HISTOIRE 06'},
   {t:'act',mod:'JURIDIQUE_06',href:'PIX_pHARe_Module_JURIDIQUE_06.html',ti:"Justice Restaurative",n:'Module pHARe · JURIDIQUE 06'},
   {t:'n',x:"Quand tu ressors, la lumière de juin est basse et jaune sur les pierres. Kern referme la porte et remet les clefs au clou."},
   {t:'k',x:"Écuyer, {nom}. Ça veut dire qu'on peut désormais compter sur toi — et que si tu te trompes, ça comptera aussi."},
   {t:'k',x:"L'an prochain, tu vas rencontrer quelque chose de plus difficile que tout ce qu'on a vu. Pas un harceleur : quelqu'un qui aura raison. Raison sur presque tout, et qui s'en servira pour te faire accepter l'inacceptable."},
   {t:'k',x:"Prépare-toi. Moi, je ne l'ai pas vu venir."},
   {t:'fin',mot:"Écuyer de Valdurne. L'œil, la serre — et la main qui ne se referme pas.",sceau:true}
  ]
}
];
