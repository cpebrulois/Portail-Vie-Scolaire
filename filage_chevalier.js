/**
 * filage_chevalier.js — Le Fil de Valdurne, niveau CHEVALIER (4e).
 *
 * Année de l'Épreuve des Piliers : l'adversaire n'est plus un harceleur, c'est
 * une autorité qui a raison sur presque tout. Les dix modules disponibles du
 * palier 07-08 y passent (HISTOIRE_07 et HISTOIRE_08 n'existent pas encore :
 * deux modules Égalité prennent leur place, sur le doute et les clichés).
 */

export const NIVEAU = 2;
export const CHAPITRES = [

{
  n:1, titre:"Celle qui a raison", img:"filage_c01.jpg",
  cible:"Le plus difficile à combattre n'est pas celui qui a tort : c'est celui qui a raison sur presque tout.",
  b:[
   {t:'n',x:"Kern t'attend adossé au mur du préau. Il a l'air fatigué, comme quelqu'un qui a préparé une conversation désagréable."},
   {t:'k',x:"Jusqu'ici, tes adversaires étaient faciles. Un type qui humilie un plus faible : tu sais que c'est mal, moi aussi, tout le monde aussi."},
   {t:'k',x:"Cette année, tu vas rencontrer autre chose. Quelqu'un de calme, d'intelligent, qui veut sincèrement le bien du collège — et qui aura raison sur presque tout."},
   {t:'k',x:"Il te dira que les procédures sont trop lentes. Il aura raison. Que pendant qu'on discute, des élèves souffrent. Il aura raison. Qu'il faut agir vite et fermement. Il aura raison."},
   {t:'k',x:"Et il en conclura qu'on peut se passer d'entendre l'accusé. Là, il aura tort. Mais tu ne sauras plus où le raisonnement a dérapé, parce que tout le début était juste."},
   {t:'q',q:"Comment repère-t-on ce moment-là ?",o:[
     {x:"En vérifiant chaque étape du raisonnement.",
      r:"C'est le bon réflexe, et c'est épuisant. Mais souvent tu n'auras pas le temps — il faut décider sur le moment, dans un couloir."},
     {x:"En regardant qui paie à la fin.",
      r:"Voilà le raccourci le plus fiable. Un raisonnement juste qui aboutit à sacrifier quelqu'un qui n'a pas pu se défendre a un vice quelque part, même si tu ne le trouves pas."},
     {x:"En se fiant à son malaise.",
      r:"Ne le méprise pas : ton malaise détecte souvent avant ta raison. Mais il se trompe aussi, et beaucoup de gens ont fait des saloperies avec la conscience tranquille. Le malaise alerte ; il ne juge pas."}
   ]},
   {t:'k',x:"Avant de continuer, deux choses sur ce qui te rend vulnérable à ce genre de discours. La première : quand un groupe entier se tait, tu crois être le seul à penser autrement. Tu te trompes presque toujours."},
   {t:'act',mod:'GROUPE_07',href:'PIX_pHARe_Module_GROUPE_07.html',ti:"La Spirale du Silence",n:'Module pHARe · GROUPE 07'},
   {t:'k',x:"La seconde est plus bête, et c'est celle qui t'aura le plus souvent : quand tu es fatigué, tu cèdes. Pas parce que tu es faible — parce qu'un cerveau qui manque de sommeil ne sait plus dire non."},
   {t:'act',mod:'NEURO_07',href:'PIX_pHARe_Module_NEURO_07.html',ti:"Le Sommeil, Bouclier du Cerveau",n:'Module pHARe · NEURO 07'},
   {t:'fin',mot:"Regarde qui paie à la fin. C'est le seul raccourci fiable quand le raisonnement est trop beau."}
  ]
},

{
  n:2, titre:"L'anatomie d'un mensonge", img:"filage_c02.jpg",
  cible:"Une rumeur efficace n'est jamais entièrement fausse — c'est ce qui la rend indémontable.",
  b:[
   {t:'n',x:"Kern pose son téléphone sur la table, écran vers le haut, sur une capture d'écran."},
   {t:'k',x:"Lis. Et dis-moi ce qui est faux là-dedans."},
   {t:'n',x:"Tu lis. Une phrase vraie. Une date exacte. Un nom réel. Et, glissée au milieu, une conclusion qui ne découle de rien."},
   {t:'k',x:"C'est ça, une bonne rumeur. Pas un mensonge : un assemblage de vérités qui pointe vers une fausseté. Impossible à démentir point par point, parce que chaque point est exact."},
   {t:'act',mod:'NUMERIQUE_07',href:'PIX_pHARe_Module_NUMERIQUE_07.html',ti:"Anatomie d'une Fake News",n:'Module pHARe · NUMÉRIQUE 07'},
   {t:'k',x:"Et maintenant, la partie qui te concerne directement."},
   {t:'k',x:"Ce genre de chose fonctionne surtout sur ceux qui ont besoin d'avoir raison. Si ton estime de toi dépend d'avoir eu le bon avis, tu défendras une bêtise jusqu'au bout plutôt que de te dédire."},
   {t:'act',mod:'VEA_07',href:'PIX_pHARe_Module_VEA_07.html',ti:"L'Estime de Soi en Action",n:'Module pHARe · VEA 07'},
   {t:'k',x:"Quelqu'un de solide peut dire « je me suis trompé » sans que ça lui coûte. C'est même le signe le plus fiable qu'on puisse lui faire confiance."},
   {t:'fin',mot:"Une rumeur efficace n'est pas fausse : elle est vraie en morceaux et fausse en entier."}
  ]
},

{
  n:3, titre:"Ce qu'on te doit", img:"filage_c03.jpg",
  cible:"Tes droits ne dépendent ni de ton mérite, ni de la bonne volonté des adultes.",
  b:[
   {t:'n',x:"Kern a apporté un texte imprimé, agrafé, corné. Il le pose devant toi sans commentaire."},
   {t:'k',x:"Cinquante-quatre articles. Signés par presque tous les pays du monde. Et il y a de fortes chances que tu n'en connaisses aucun."},
   {t:'q',q:"À ton avis, qu'est-ce qui change quand un droit est écrit dans un texte international ?",o:[
     {x:"Rien, en pratique. Les textes ne protègent personne.",
      r:"C'est une opinion très répandue, et elle est fausse — mais elle est utile à ceux qui préféreraient qu'on n'y pense pas. Un texte ne suffit jamais. Sans texte, on ne peut même pas commencer."},
     {x:"Ça donne un point d'appui : on peut l'invoquer.",
      r:"Exactement. Ce n'est pas magique : c'est un levier. Mais un levier, ça change ce qu'un enfant seul peut soulever."},
     {x:"Ça oblige les adultes.",
      r:"Ça les oblige, et c'est essentiel : tes droits ne dépendent plus de leur gentillesse. Un droit qui dépend du bon vouloir n'est pas un droit, c'est une faveur."}
   ]},
   {t:'act',mod:'JURIDIQUE_07',href:'PIX_pHARe_Module_JURIDIQUE_07.html',ti:"La Convention des Droits de l'Enfant",n:'Module pHARe · JURIDIQUE 07'},
   {t:'k',x:"Retiens l'article sur le droit d'être entendu. C'est exactement le mot arraché de la Trame, en langage juridique. Cette maison n'a pas inventé son serment : elle l'a recopié."},
   {t:'fin',mot:"Un droit qui dépend du bon vouloir n'est pas un droit. C'est une faveur."}
  ]
},

{
  n:4, titre:"Obéir", img:"filage_c04.jpg",
  cible:"La plupart des gens qui font du mal n'ont pas décidé de le faire : on le leur a demandé.",
  b:[
   {t:'n',x:"Kern ne dit rien pendant un long moment. Puis :"},
   {t:'k',x:"Question difficile. Combien de gens, selon toi, accepteraient de faire du mal à un inconnu si quelqu'un en blouse blanche le leur demandait poliment ?"},
   {t:'q',q:"Ta réponse ?",o:[
     {x:"Très peu. Quelques pourcents.",
      r:"C'est ce que répondent presque tous les gens à qui on pose la question — y compris des psychiatres, à qui on l'a réellement posée. Ils se sont tous trompés, et pas d'un peu."},
     {x:"Beaucoup plus qu'on ne croit.",
      r:"Oui. Et je ne te donnerai pas le chiffre : va le chercher toi-même, il vaut mieux le découvrir que se le faire raconter."},
     {x:"Ça dépend de qui donne l'ordre.",
      r:"Bonne nuance, et c'est précisément là-dessus que ça joue. L'autorité n'a même pas besoin d'être légitime : il suffit qu'elle en ait l'air."}
   ]},
   {t:'act',mod:'GROUPE_08',href:'PIX_pHARe_Module_GROUPE_08.html',ti:"Pouvoir & Obéissance",n:'Module pHARe · GROUPE 08'},
   {t:'k',x:"Ce chiffre-là devrait t'empêcher de dormir une nuit ou deux. Après quoi il te rendra service pour le reste de ta vie."},
   {t:'k',x:"Parce que la leçon n'est pas « les gens sont mauvais ». Elle est pire : les gens ordinaires, dans une situation bien construite, font des choses qu'ils désapprouvent — et se sentent en règle."},
   {t:'k',x:"Le seul remède connu, c'est de savoir que ça existe. Ceux qui ont refusé, dans ces expériences, avaient presque tous une chose en commun : ils avaient déjà eu l'occasion de dire non avant, sur quelque chose de plus petit."},
   {t:'act',mod:'NEURO_08',href:'PIX_pHARe_Module_NEURO_08.html',ti:"La Douleur Sociale",n:'Module pHARe · NEURO 08'},
   {t:'fin',mot:"On ne devient pas capable de dire non le jour où c'est grave. On le devient en le disant sur des choses qui ne le sont pas."}
  ]
},

{
  n:5, titre:"Qui tu es en ligne", img:"filage_c05.jpg",
  cible:"Ce que tu laisses te construit une réputation que tu ne contrôles plus.",
  b:[
   {t:'n',x:"Kern fait défiler quelque chose sur son écran et te le tend."},
   {t:'k',x:"Voilà ce qu'on trouve sur moi en cherchant mon nom. Trois pages. Rien de honteux — mais rien que j'aie choisi non plus."},
   {t:'k',x:"Une identité numérique, ce n'est pas ce que tu publies. C'est ce que d'autres ont publié sur toi, ce que les machines ont déduit, et ce qui reste quand tu as tout effacé."},
   {t:'act',mod:'NUMERIQUE_08',href:'PIX_pHARe_Module_NUMERIQUE_08.html',ti:"Mon Identité Numérique",n:'Module pHARe · NUMÉRIQUE 08'},
   {t:'k',x:"Et puisque tu vas passer ton année à parler à des gens qui ne veulent pas t'écouter, autant que tu aies de bons outils."},
   {t:'k',x:"L'an dernier tu as appris à dire ce que tu penses sans blesser. Cette année, plus difficile : entendre quelqu'un qui t'attaque, et répondre à ce qu'il a besoin de dire plutôt qu'à ce qu'il a dit."},
   {t:'act',mod:'VEA_08',href:'PIX_pHARe_Module_VEA_08.html',ti:"La CNV Niveau 2",n:'Module pHARe · VEA 08'},
   {t:'fin',mot:"Derrière une attaque, il y a presque toujours une demande. Répondre à l'attaque, c'est manquer la demande."}
  ]
},

{
  n:6, titre:"Ceux qui peuvent quelque chose", img:"filage_c06.jpg",
  cible:"Il existe des gens dont c'est le métier de te protéger. Encore faut-il savoir lesquels.",
  b:[
   {t:'n',x:"Kern déplie un plan du collège, puis, à côté, une feuille avec des noms et des numéros."},
   {t:'k',x:"Le CPE, l'infirmière, l'assistante sociale, le psychologue, le référent harcèlement, le 3018. Chacun peut des choses que les autres ne peuvent pas."},
   {t:'k',x:"Et la plupart des élèves qui vont mal se taisent parce qu'ils ne savent pas à qui parler — ou parce qu'ils croient que « ça va remonter partout »."},
   {t:'q',q:"Que se passe-t-il quand tu parles à l'infirmière ?",o:[
     {x:"Elle est obligée de tout répéter à la direction.",
      r:"Non. Elle a un secret professionnel, avec des limites précises — et ces limites, tu as le droit de les connaître avant de parler."},
     {x:"Ça dépend de la gravité.",
      r:"Voilà, et c'est ce qu'il faut comprendre : il y a des seuils. En dessous, elle t'écoute et ça reste entre vous. Au-dessus, elle doit agir — et c'est heureux."},
     {x:"Rien ne sort jamais.",
      r:"Faux aussi, et il vaut mieux le savoir : si tu es en danger, elle bougera. Ce n'est pas une trahison, c'est la raison même de son métier."}
   ]},
   {t:'act',mod:'JURIDIQUE_08',href:'PIX_pHARe_Module_JURIDIQUE_08.html',ti:"Les Institutions de Protection",n:'Module pHARe · JURIDIQUE 08'},
   {t:'k',x:"Apprends cette carte par cœur. Le jour où quelqu'un viendra te voir en pleurant, tu n'auras pas le temps de la chercher."},
   {t:'fin',mot:"Savoir à qui parler vaut mieux que savoir quoi dire."}
  ]
},

{
  n:7, titre:"D'où viennent tes évidences", img:"filage_c07.jpg",
  cible:"Les préjugés ne sont pas des opinions : ce sont des automatismes qu'on a appris sans le vouloir.",
  b:[
   {t:'n',x:"Kern s'est assis à l'envers sur une chaise, les bras sur le dossier."},
   {t:'k',x:"Cette année tu apprends à repérer les raisonnements truqués chez les autres. Aujourd'hui, on regarde les tiens."},
   {t:'k',x:"Tu as des évidences. Sur les filles, sur les garçons, sur ceux qui viennent d'ailleurs, sur ceux qui parlent mal. Tu ne les as pas choisies. Elles se sont installées pendant que tu regardais autre chose."},
   {t:'q',q:"Ça fait de toi quelqu'un de mauvais ?",o:[
     {x:"Oui, un préjugé c'est déjà une faute.",
      r:"Non, et cette idée fait plus de mal que de bien : si avoir un préjugé fait de toi un salaud, tu passeras ta vie à nier en avoir. Donc à ne jamais les corriger."},
     {x:"Non, mais les garder après les avoir vus, oui.",
      r:"Voilà la seule position tenable. Personne n'est responsable de ce qu'on lui a mis dans la tête. Tout le monde est responsable de ce qu'il en fait une fois qu'il l'a vu."},
     {x:"Non, tout le monde en a.",
      r:"Vrai, mais attention : « tout le monde en a » sert aussi d'excuse commode pour ne rien changer. C'est un constat, pas une absolution."}
   ]},
   {t:'act',mod:'',href:'PIX_EGALITE_PHILO_02.html',ti:"La Construction des Clichés",n:'Rubrique Égalité · Philo 02'},
   {t:'k',x:"Un cliché, ce n'est pas une bêtise : c'est un raccourci qui a marché assez souvent pour rester. Le problème, c'est qu'un raccourci appliqué à une personne se trompe presque toujours."},
   {t:'fin',mot:"Tu n'es pas responsable de ce qu'on t'a mis dans la tête. Tu l'es de ce que tu en fais une fois que tu l'as vu."}
  ]
},

{
  n:8, titre:"L'Épreuve du Pilier", img:"filage_c08.jpg",
  cible:"Un pilier ne se juge pas les beaux jours : il se juge la nuit où tout penche.",
  b:[
   {t:'n',x:"Juin. Kern t'emmène sous les arcades, là où les piliers portent la galerie depuis quatre cents ans."},
   {t:'k',x:"Un pilier, ça n'a rien d'héroïque. Ça ne bouge pas, ça ne parle pas, personne ne le regarde. On ne s'aperçoit de son existence que le jour où il cède."},
   {t:'k',x:"Cette année, tu as appris que l'adversaire peut avoir raison. Que l'obéissance fabrique des complices ordinaires. Que tes propres évidences sont des raccourcis. Ça fait beaucoup de sol qui se dérobe."},
   {t:'k',x:"Alors la question de fin d'année est celle-ci : sur quoi tu tiens, quand tu ne peux plus t'appuyer sur ta certitude d'avoir raison ?"},
   {t:'q',q:"Réponds franchement.",o:[
     {x:"Sur les règles. Elles, elles ne bougent pas.",
      r:"Elles bougent aussi, et parfois dans le mauvais sens. Des lois ont autorisé l'inacceptable. Les règles sont un appui, pas un socle."},
     {x:"Sur ce que je ne veux faire à personne.",
      r:"C'est le socle le plus solide que je connaisse. Il ne demande ni d'avoir raison, ni d'être le plus fort : juste de savoir ce que tu refuses de devenir."},
     {x:"Sur les gens en qui j'ai confiance.",
      r:"Bonne réponse aussi, et plus honnête que la mienne. À condition d'en avoir choisi qui te contredisent — sinon ce n'est plus un appui, c'est un miroir."}
   ]},
   {t:'k',x:"Il te reste une chose à voir. La plus abstraite, et celle dont tu auras le plus besoin l'an prochain : sur quoi repose l'idée même que deux personnes se valent."},
   {t:'act',mod:'',href:'PIX_EGALITE_PHILO_03.html',ti:"L'Éthique de l'Égalité",n:'Rubrique Égalité · Philo 03'},
   {t:'n',x:"Il pose la main sur la pierre du pilier, froide même en juin."},
   {t:'k',x:"Chevalier, {nom}. On ne te demandera plus si tu sais : on te demandera si tu tiens."},
   {t:'k',x:"L'an prochain, dernière année. Et le vrai danger ne sera plus quelqu'un qui a raison contre toi. Ce sera toi — devenu assez sûr de toi pour retrancher quelqu'un en croyant bien faire."},
   {t:'fin',mot:"Chevalier de Valdurne. Un pilier se juge la nuit où tout penche.",sceau:true}
  ]
}
];
