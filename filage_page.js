/**
 * filage_page.js — Le Fil de Valdurne, niveau PAGE (6e).
 *
 * Huit chapitres qui font parcourir TOUS les modules du palier 01-03.
 * Le chapitre 1 est le Seuil (seuil.html) : il n'est pas repris ici.
 *
 * Chaque bloc : t='n' narration · 'k' Kern · 'q' question à choix ·
 * 'act' module à réaliser · 'fin' clôture du chapitre.
 *
 * Kern est un ancien page de dernière année. Il tutoie. Il ne fait jamais la
 * morale : il raconte ce qu'il a raté lui-même, et laisse l'élève conclure.
 */

export const NIVEAU = 0;               // index de rang : 0 = Page
export const CHAPITRES = [

/* ════════════════════════════ 2 ════════════════════════════ */
{
  n: 2, titre: "Celui qui ne dit rien", img: "filage_p02.jpg",
  cible: "Ce qui n'a pas de nom ne se voit pas — et ce qui ne se voit pas continue.",
  b: [
   {t:'n',x:"Une semaine a passé depuis ton entrée. Kern t'attend sous le préau, adossé au mur, les mains dans les poches. Il ne dit pas bonjour."},
   {t:'k',x:"Regarde la cour. Prends ton temps. Et dis-moi ce que tu vois."},
   {t:'n',x:"Tu regardes. Des groupes. Des rires. Un ballon. Quelqu'un qui court. Une file devant la porte du réfectoire. Rien de particulier."},
   {t:'k',x:"C'est ça. Rien de particulier. C'est exactement ce que je voyais, moi aussi."},
   {t:'k',x:"Alors regarde encore. Pas les groupes : les bords. Pas ceux qui parlent : ceux qui attendent qu'on leur parle."},
   {t:'n',x:"Tu regardes autrement. Et cette fois, tu la vois. Une fille, contre le pilier, un livre ouvert qu'elle ne lit pas — la même page depuis dix minutes. Elle ne pleure pas. Elle ne fait rien de visible. Elle est simplement… à côté."},
   {t:'k',x:"Voilà. Tu viens de faire la seule chose difficile de ce métier."},
   {t:'q',q:"Que fais-tu ?",o:[
     {x:"J'y vais tout de suite lui demander si ça va.",
      r:"Ton instinct est bon, et je ne vais pas te dire qu'il est mauvais. Mais tu ne sais pas encore ce que tu regardes. « Ça va ? » à quelqu'un qui va mal, c'est une question à laquelle on répond « oui » dans quatre-vingt-dix pour cent des cas. On y reviendra — mais autrement."},
     {x:"J'observe encore, pour comprendre.",
      r:"C'est ce que je ferais. Pas par froideur : parce qu'une aide qui se trompe de problème fait parfois plus de mal que pas d'aide du tout."},
     {x:"Je préviens un adulte.",
      r:"Ce n'est jamais une faute. Retiens-le : ce n'est JAMAIS une faute. Mais aujourd'hui tu n'as rien à dire — « quelqu'un a l'air triste » n'est pas un signalement, c'est une impression. Apprenons d'abord à lire."}
   ]},
   {t:'k',x:"Avant d'aller vers quelqu'un, il faut savoir ce qui se passe dans une tête qui n'est pas la tienne. Ça s'apprend. Ce n'est pas de la magie, ni de la gentillesse : c'est de la mécanique."},
   {t:'act',mod:'NEURO_01',href:'PIX_pHARe_Module_NEURO_01.html',ti:"Comprendre l'Autre",n:'Module pHARe · NEURO 01'},
   {t:'k',x:"Voilà. Maintenant tu sais que comprendre quelqu'un, ce n'est pas deviner : c'est observer, et accepter de se tromper."},
   {t:'n',x:"Il se décolle du mur et te fait signe de le suivre vers la galerie."},
   {t:'k',x:"Deuxième chose, et celle-là va te surprendre."},
   {t:'k',x:"Ce que tu viens de voir dans la cour — cette fille contre son pilier — il y a cent ans, personne n'aurait su comment l'appeler."},
   {t:'k',x:"Pas parce que ça n'existait pas. Ça a toujours existé. Mais il n'y avait pas de mot. Et sans mot, il n'y a pas de problème : il n'y a que « des histoires d'enfants », « le caractère », « la vie ». On haussait les épaules."},
   {t:'k',x:"Tu te souviens de la Trame, le premier soir ? Le mot arraché ?"},
   {t:'k',x:"Un mot qui manque, ça ne coûte rien à personne — sauf à celui qu'on ne peut plus nommer."},
   {t:'act',mod:'HISTOIRE_01',href:'PIX_pHARe_Module_HISTOIRE_01.html',ti:"Avant le Mot",n:'Module pHARe · HISTOIRE 01'},
   {t:'k',x:"Alors retiens ceci, et je ne le répéterai pas : nommer une chose, c'est déjà commencer à la combattre."},
   {t:'k',x:"Ceux qui te diront « tu exagères, ça a toujours existé » ont raison sur les faits, et tort sur tout le reste. Le tonnerre aussi a toujours existé. On a quand même fini par inventer le paratonnerre."},
   {t:'fin',mot:"Tu sais voir. Tu sais nommer. C'est déjà plus que ce que j'avais après trois mois."}
  ]
},

/* ════════════════════════════ 3 ════════════════════════════ */
{
  n: 3, titre: "Ce que dit la loi", img: "filage_p03.jpg",
  cible: "La règle n'est pas là pour punir : elle est là pour protéger le plus faible.",
  b: [
   {t:'n',x:"Kern t'emmène dans une pièce que tu n'avais pas remarquée : une petite salle d'archives, sentant le papier et la poussière chaude. Des registres du sol au plafond."},
   {t:'k',x:"Beaucoup de gens croient que la loi sert à punir. C'est faux, et c'est même le contraire."},
   {t:'k',x:"La loi sert d'abord à protéger celui qui ne peut pas se défendre tout seul. Le fort n'a pas besoin de règles : il a sa force. Les règles, c'est ce qu'on invente pour que la force ne suffise plus."},
   {t:'q',q:"Kern te tend un registre. « À ton avis, à quoi ça sert que le harcèlement soit un délit ? »",o:[
     {x:"À mettre les harceleurs en prison.",
      r:"Presque jamais, en vrai — surtout chez des mineurs. Et ce n'est pas le but principal."},
     {x:"À ce que la victime ne soit plus seule face à l'agresseur.",
      r:"Exactement. Le jour où c'est écrit dans la loi, ce n'est plus toi contre lui : c'est lui contre la règle commune. Le rapport de force change complètement."},
     {x:"À faire peur pour que ça n'arrive pas.",
      r:"Un peu, mais c'est le plus faible des effets. Ce qui compte davantage, c'est ce que ça change pour celui qui subit."}
   ]},
   {t:'k',x:"Va voir ce que la loi dit exactement. Pas ce qu'on en raconte dans la cour : ce qu'elle dit."},
   {t:'act',mod:'JURIDIQUE_01',href:'PIX_pHARe_Module_JURIDIQUE_01.html',ti:"L'Armure Juridique",n:'Module pHARe · JURIDIQUE 01'},
   {t:'k',x:"Une armure. C'est le bon mot. Ça ne rend personne invincible, mais ça change ce qu'on peut te faire sans conséquence."},
   {t:'n',x:"Il repose le registre et te regarde en penchant la tête, l'air de peser quelque chose."},
   {t:'k',x:"Maintenant je vais te parler d'une autre force, moins visible, et qui te concerne bien plus directement."},
   {t:'k',x:"Tu as un téléphone. Ou tu en auras un. Et il y a, derrière l'écran, des gens très intelligents et très bien payés dont le métier est de te faire rester. Pas de t'informer, pas de t'amuser : de te faire RESTER."},
   {t:'k',x:"Ce n'est pas un complot. C'est un modèle économique. Ils gagnent de l'argent avec ton temps, donc ils ont conçu des machines qui prennent ton temps. C'est logique, et c'est pour ça que c'est efficace."},
   {t:'act',mod:'NUMERIQUE_01',href:'PIX_pHARe_Module_NUMERIQUE_01.html',ti:"La Machine à Attention",n:'Module pHARe · NUMÉRIQUE 01'},
   {t:'k',x:"Je ne vais pas te dire de tout éteindre : je ne le fais pas moi-même, et les gens qui donnent des conseils qu'ils ne suivent pas m'ennuient."},
   {t:'k',x:"Je te dis juste ceci : quand tu sais comment on te tire par la manche, tu peux encore décider d'y aller. Mais tu y vas. Tu n'es plus tiré."},
   {t:'fin',mot:"Une armure et un miroir. La loi te dit ce qu'on n'a pas le droit de te faire ; la machine te montre ce qu'on te fait sans te le dire."}
  ]
},

/* ════════════════════════════ 4 ════════════════════════════ */
{
  n: 4, titre: "Le cercle qui se ferme", img: "filage_p04.jpg",
  cible: "Un groupe peut exclure sans un seul mot plus haut que l'autre — et le témoin décide.",
  b: [
   {t:'n',x:"Réfectoire, midi. Kern pose son plateau en face du tien et parle sans lever les yeux."},
   {t:'k',x:"Table du fond, à ta droite. Ne te retourne pas d'un coup."},
   {t:'n',x:"Tu regardes en biais. Cinq élèves. Ils rient. Un sixième est assis au bout, un peu à l'écart — vingt centimètres, pas plus. Assez pour n'être pas tout à fait avec eux."},
   {t:'n',x:"Personne ne l'insulte. Personne ne le pousse. Quand il parle, on répond. Poliment. Puis la conversation reprend sans lui."},
   {t:'k',x:"Voilà ce que tu ne verras jamais dans un film : le harcèlement le plus efficace ne fait aucun bruit."},
   {t:'k',x:"Pas de coups, pas d'insultes, rien qu'un adulte pourrait sanctionner. Juste vingt centimètres, et une conversation qui reprend sans toi. Tous les jours. Pendant des mois."},
   {t:'q',q:"Qui, à cette table, pourrait tout changer ?",o:[
     {x:"Celui qui est mis à l'écart, s'il s'imposait.",
      r:"C'est ce qu'on lui dira : « défends-toi, impose-toi ». C'est le pire conseil du monde. On demande à celui qui a le moins de forces de faire le plus gros effort."},
     {x:"Le meneur, s'il changeait d'avis.",
      r:"Ce serait le plus rapide, oui. Mais tu ne peux pas compter dessus, et surtout : tu n'es pas lui."},
     {x:"N'importe lequel des quatre autres.",
      r:"Voilà. Les quatre qui ne font rien. Ils ne se croient pas concernés — ils se croient spectateurs. Or il n'y a pas de spectateurs à cette table : il n'y a que des gens qui n'ont pas encore choisi."}
   ]},
   {t:'k',x:"Ces quatre-là ont un pouvoir dont ils n'ont aucune idée. Va voir lequel."},
   {t:'act',mod:'GROUPE_02',href:'PIX_pHARe_Module_GROUPE_02.html',ti:"Le Pouvoir des Témoins",n:'Module pHARe · GROUPE 02'},
   {t:'k',x:"Un seul. Il suffit d'un seul qui bouge, et le cercle ne se referme plus pareil. Ce n'est pas de la morale, c'est de la physique sociale."},
   {t:'n',x:"Il pique une frite dans ton assiette sans demander, ce qui est sa façon de dire que le passage sérieux est fini."},
   {t:'k',x:"Mais il y a un obstacle, et il est en toi."},
   {t:'k',x:"Quand tu verras ça, tu sentiras quelque chose de désagréable. De la gêne. Une chaleur. L'envie de regarder ailleurs. Et ton corps te dira que c'est parce que la situation est gênante."},
   {t:'k',x:"Ton corps mentira. Cette gêne, c'est ta propre alarme. Encore faut-il savoir la lire au lieu de la fuir."},
   {t:'act',mod:'VEA_02',href:'PIX_pHARe_Module_VEA_02.html',ti:"Mes émotions, mes alliées",n:'Module pHARe · VEA 02'},
   {t:'k',x:"Les gens croient que le courage, c'est ne rien ressentir. C'est l'inverse : c'est sentir parfaitement la gêne, et avancer quand même."},
   {t:'fin',mot:"Tu sais maintenant que tu n'es jamais spectateur. Tu es seulement quelqu'un qui n'a pas encore choisi."}
  ]
},

/* ════════════════════════════ 5 ════════════════════════════ */
{
  n: 5, titre: "La colère des autres", img: "filage_p05.jpg",
  cible: "Sous une agressivité, il y a presque toujours autre chose — comprendre n'est pas excuser.",
  b: [
   {t:'n',x:"Un cri dans le couloir. Un claquement. Un garçon vient de balancer son sac contre un casier, si fort que le métal a sonné. Il tremble. Personne ne bouge."},
   {t:'n',x:"Kern ne bouge pas non plus."},
   {t:'k',x:"Regarde-le bien. Dans dix secondes, un adulte va arriver et il aura tort. Et l'adulte aura raison de dire qu'il a tort : on ne casse pas les casiers."},
   {t:'k',x:"Mais toi, je veux que tu voies autre chose."},
   {t:'q',q:"Que vois-tu ?",o:[
     {x:"Quelqu'un de violent.",
      r:"C'est ce qu'il montre. Et il sera traité comme ça, ce qui n'est pas totalement injuste. Mais si tu t'arrêtes là, tu ne comprendras jamais rien à ce collège."},
     {x:"Quelqu'un qui déborde.",
      r:"Oui. Une colère de cette taille, à ce moment-là, pour un sac : ce n'est jamais le sac. C'est ce qu'il y avait avant, et qui n'a pas trouvé d'autre sortie."},
     {x:"Quelqu'un qui cherche l'attention.",
      r:"Peut-être. Et alors ? « Chercher l'attention », ça veut dire manquer d'attention. On dit ça comme si c'était une accusation ; c'est une description."}
   ]},
   {t:'k',x:"Je vais être clair, parce que c'est là que beaucoup de gens se perdent : comprendre n'est pas excuser."},
   {t:'k',x:"Il devra réparer le casier. Il devra entendre que ça ne se fait pas. Comprendre pourquoi il a explosé ne lui enlève rien de sa responsabilité — ça nous dit seulement comment éviter la prochaine explosion."},
   {t:'k',x:"Et il y a une raison de plus, à votre âge, qui n'est pas une excuse mais un fait. Va la voir."},
   {t:'act',mod:'NEURO_02',href:'PIX_pHARe_Module_NEURO_02.html',ti:"Le Cerveau Ado en Chantier",n:'Module pHARe · NEURO 02'},
   {t:'k',x:"Un chantier. Voilà. Ça ne t'autorise rien, mais ça explique pourquoi c'est plus dur pour toi que pour un adulte — et pourquoi ça ira mieux."},
   {t:'n',x:"Le couloir s'est vidé. Kern ramasse un cahier tombé et le pose sur le casier cabossé."},
   {t:'k',x:"Dernière chose pour aujourd'hui, et elle est étrange. Ce qu'on vient de voir, un adulte d'il y a soixante ans l'aurait vu aussi. Mais il n'aurait rien eu pour y penser."},
   {t:'k',x:"Il aurait dit « mauvais caractère ». Fin de l'analyse. Ce n'est pas qu'il était bête : c'est qu'on ne lui avait rien donné pour comprendre."},
   {t:'act',mod:'HISTOIRE_02',href:'PIX_pHARe_Module_HISTOIRE_02.html',ti:"La Naissance Scientifique",n:'Module pHARe · HISTOIRE 02'},
   {t:'k',x:"Des gens ont passé leur vie à mesurer, compter, publier — pour transformer « les enfants sont méchants entre eux » en quelque chose qu'on peut enfin traiter. C'est ce que tu apprends ici. Ça a coûté cher à obtenir."},
   {t:'fin',mot:"Sous une colère, il y a presque toujours autre chose. Le chercher n'excuse rien : ça évite la fois suivante."}
  ]
},

/* ════════════════════════════ 6 ════════════════════════════ */
{
  n: 6, titre: "Signaler n'est pas trahir", img: "filage_p06.jpg",
  cible: "Dénoncer sert celui qui parle ; signaler protège celui qui subit. Tout est là.",
  b: [
   {t:'n',x:"Kern t'a donné rendez-vous au bout du couloir nord, là où personne ne passe. Il a l'air moins léger que d'habitude."},
   {t:'k',x:"Aujourd'hui, la chose que tout le collège comprend de travers. Y compris beaucoup d'adultes."},
   {t:'k',x:"« Balance ». « Cafteur ». « Rapporteur ». Tu connais ces mots, et tu sais la peur qu'ils font. Ce sont les mots les plus utiles au monde — pour ceux qui font du mal."},
   {t:'k',x:"Réfléchis une seconde : à qui profite cette règle du silence ? Pas à celui qui subit. Pas aux témoins, qui restent avec leur gêne. À une seule personne."},
   {t:'q',q:"Alors où est la différence ?",o:[
     {x:"Dénoncer, c'est dire du mal. Signaler, c'est dire la vérité.",
      r:"Pas tout à fait : on peut dénoncer avec des faits parfaitement vrais. La différence n'est pas là."},
     {x:"Dénoncer sert celui qui parle. Signaler protège celui qui subit.",
      r:"Voilà. C'est la seule question qui compte, et tu peux te la poser en trois secondes : est-ce que je parle pour aider quelqu'un, ou pour me servir ?"},
     {x:"Dénoncer se fait en cachette, signaler se fait ouvertement.",
      r:"Souvent, mais pas toujours — un signalement peut être anonyme et rester juste. Cherche du côté de l'intention."}
   ]},
   {t:'k',x:"Et il y a un cas où tu n'as même pas à te poser la question : quand quelqu'un est en danger. Là, on parle. Point. On s'excusera plus tard d'avoir eu tort — on ne se console jamais d'avoir eu raison trop tard."},
   {t:'act',mod:'JURIDIQUE_02',href:'PIX_pHARe_Module_JURIDIQUE_02.html',ti:"La Mécanique des Ombres",n:'Module pHARe · JURIDIQUE 02'},
   {t:'n',x:"Il sort son téléphone, le retourne dans sa main sans l'allumer."},
   {t:'k',x:"Et puis il y a ce qui se passe là-dedans, où la loi du silence est cent fois plus forte. Parce qu'on croit y être invisible."},
   {t:'k',x:"Ceux qui conçoivent ces espaces savent exactement ce qu'ils font : quels boutons appuyer, quelle indignation propage le plus vite, comment faire d'un groupe une meute sans que personne ne se sente responsable."},
   {t:'act',mod:'NUMERIQUE_02',href:'PIX_pHARe_Module_NUMERIQUE_02.html',ti:"Les Architectes de l'Ombre",n:'Module pHARe · NUMÉRIQUE 02'},
   {t:'k',x:"Retiens juste ça : dans un groupe en ligne, personne ne se sent l'auteur. Chacun n'a fait que transmettre, liker, ajouter un mot. Et pourtant, à la fin, quelqu'un ne veut plus venir au collège."},
   {t:'k',x:"Une centaine de gens qui n'ont « rien fait », et une personne détruite. C'est arithmétiquement impossible, et ça arrive tous les jours."},
   {t:'fin',mot:"Une seule question : est-ce que je parle pour aider quelqu'un, ou pour me servir ? Trois secondes suffisent."}
  ]
},

/* ════════════════════════════ 7 ════════════════════════════ */
{
  n: 7, titre: "La première ronde seul", img: "filage_p07.jpg",
  cible: "Ce qu'on sait ne vaut rien tant qu'on ne l'a pas fait sans témoin.",
  b: [
   {t:'n',x:"Un mot plié, glissé dans ton casier. L'écriture de Kern, penchée, pressée."},
   {t:'n',x:"« Je ne serai pas là aujourd'hui. Fais la ronde. Le préau, la galerie, le réfectoire, la cour du fond. Tu sais quoi regarder. — K. »"},
   {t:'n',x:"C'est la première fois que tu marches seul dans ces couloirs avec l'intention de voir."},
   {t:'n',x:"Et c'est étrangement difficile. Sans Kern à côté pour dire « regarde », tout redevient normal. Des groupes, des rires, un ballon. Il faut un effort constant pour ne pas laisser le décor se refermer."},
   {t:'q',q:"Au fond de la cour, deux élèves en bloquent un troisième contre le grillage. Ils rient. Le troisième aussi — mal.",o:[
     {x:"J'interviens directement.",
      r:"Tu peux. Ça marche parfois, et ça peut aussi te mettre en difficulté, ou empirer les choses pour lui après ton départ. Retiens surtout : tu n'es pas obligé d'être seul pour agir."},
     {x:"Je m'approche, sans rien dire, et je reste là.",
      r:"Peu de gens y pensent, et c'est souvent redoutablement efficace. Un témoin qui reste change la scène sans un mot. Le groupe perd son public complice."},
     {x:"Je vais chercher quelqu'un.",
      r:"Et c'est très bien. La garde n'a jamais été une histoire de héros solitaires — c'est même exactement ce qu'on évite ici."}
   ]},
   {t:'k',x:"(mot de Kern, au dos) — Quoi que tu aies choisi, tu as fait la seule chose qui compte : tu n'es pas passé à côté."},
   {t:'n',x:"Le soir, tu réalises que quelque chose a changé. Tu ne peux plus traverser une cour sans la lire. C'est fatigant. Et tu ne voudrais pas revenir en arrière."},
   {t:'k',x:"Ce que tu viens de découvrir, ça porte un nom : ton cerveau te ment en permanence pour t'économiser. Il range les gens en catégories, il confirme ce qu'il croit déjà, il ne voit que ce qu'il cherche."},
   {t:'act',mod:'GROUPE_03',href:'PIX_pHARe_Module_GROUPE_03.html',ti:"Les Pièges de l'Esprit",n:'Module pHARe · GROUPE 03'},
   {t:'k',x:"Ces pièges-là, on n'en sort jamais complètement. On apprend juste à s'en méfier — surtout quand on est très sûr de soi."},
   {t:'k',x:"Et puis il y a l'exercice le plus dur de tous. Pas voir l'autre : se mettre à sa place. Vraiment. Y compris quand on ne l'aime pas."},
   {t:'act',mod:'VEA_03',href:'PIX_pHARe_Module_VEA_03.html',ti:"Voir avec les yeux de l'autre",n:'Module pHARe · VEA 03'},
   {t:'n',x:"Il y a un dernier mot au dos du papier, ajouté d'une écriture plus lente."},
   {t:'k',x:"— Tout ce qu'on t'apprend ici finit par la même question : de quel droit ? De quel droit décide-t-on ce qui est juste ? Va voir du côté de la Liberté. Tu n'auras pas de réponse. Tu auras mieux : la question bien posée."},
   {t:'act',mod:'',href:'index_PIX_LIBERTE.html',ti:"Le hub Liberté",n:'Rubrique · Liberté'},
   {t:'fin',mot:"Tu as fait une ronde sans témoin. C'est la seule qui prouve quelque chose."}
  ]
},

/* ════════════════════════════ 8 ════════════════════════════ */
{
  n: 8, titre: "Page de Valdurne", img: "filage_p08.jpg",
  cible: "Mettre des mots, c'est ce qui sépare celui qui subit de celui qui agit.",
  b: [
   {t:'n',x:"Fin d'année. Le préau sent la craie et la poussière chaude. Kern t'attend devant la Trame, comme au premier soir. Il a l'air plus vieux qu'en septembre, ou c'est toi qui as changé."},
   {t:'k',x:"Dernier chapitre. Et il n'y aura pas de leçon : rien que des choses à finir."},
   {t:'k',x:"Tu as appris à voir, à nommer, à comprendre les colères, à distinguer signaler de dénoncer. Il te manque le plus intime — et curieusement le plus difficile."},
   {t:'k',x:"Mettre des mots sur ce que TU ressens. Pas sur ce que ressentent les autres : sur toi."},
   {t:'k',x:"Presque tous ceux qui craquent, ici, n'ont pas manqué de force. Ils ont manqué de vocabulaire. Ils sentaient quelque chose d'énorme et de sans nom, alors ça sortait par la colère, ou ça ne sortait pas du tout."},
   {t:'act',mod:'NEURO_03',href:'PIX_pHARe_Module_NEURO_03.html',ti:"Mettre des Mots sur ses Émotions",n:'Module pHARe · NEURO 03'},
   {t:'k',x:"Tu remarques ? On revient toujours au même endroit. Le mot arraché de la Trame, le mot qui manquait à l'histoire, les mots qui te manquent à toi. Cette maison n'a qu'un seul sujet."},
   {t:'n',x:"Il pose la main sur le verre fendu, à côté du trou."},
   {t:'k',x:"Reste deux choses. La première : comment ce qu'on t'a appris est devenu un droit — pas une gentillesse, un droit. Des gens se sont battus pour ça, et ils ont mis longtemps."},
   {t:'act',mod:'HISTOIRE_03',href:'PIX_pHARe_Module_HISTOIRE_03.html',ti:"La Reconnaissance Juridique",n:'Module pHARe · HISTOIRE 03'},
   {t:'k',x:"Et la seconde : ce que tu laisses derrière toi sans le savoir. Chaque message, chaque photo, chaque commentaire. Un spectre qui te suit, et qui suit aussi ceux dont tu parles."},
   {t:'act',mod:'JURIDIQUE_03',href:'PIX_pHARe_Module_JURIDIQUE_03.html',ti:"Le Spectre Numérique",n:'Module pHARe · JURIDIQUE 03'},
   {t:'act',mod:'NUMERIQUE_03',href:'PIX_pHARe_Module_NUMERIQUE_03.html',ti:"Bulles & Miroirs",n:'Module pHARe · NUMÉRIQUE 03'},
   {t:'n',x:"Quand tu reviens, la lumière a tourné. Kern n'a pas bougé."},
   {t:'k',x:"C'est fini. Tu es page de Valdurne — vraiment, cette fois, pas seulement sur le registre."},
   {t:'k',x:"Je ne vais pas te dire que tu es prêt. On n'est jamais prêt, et ceux qui le croient sont les plus dangereux. Je te dis autre chose."},
   {t:'k',x:"En septembre, tu as traversé cette cour sans rien voir. Aujourd'hui tu ne peux plus. C'est irréversible, et c'est le seul diplôme que je puisse te donner."},
   {t:'q',q:"Il te tend la main. « Une question, avant que tu partes en vacances. Qu'est-ce qu'un veilleur, au fond ? »",o:[
     {x:"Quelqu'un qui protège les autres.",
      r:"C'est ce qu'on croit en arrivant. Mais protéger, ça suppose d'être plus fort — et tu ne le seras pas toujours."},
     {x:"Quelqu'un qui ne regarde pas ailleurs.",
      r:"Voilà. Ce n'est ni du courage, ni de la force. C'est un refus, répété tous les jours, de laisser le décor se refermer. Le reste vient tout seul."},
     {x:"Quelqu'un qui connaît les règles.",
      r:"Utile, mais insuffisant. J'ai connu des gens qui connaissaient parfaitement les règles et qui passaient devant les tables sans rien voir."}
   ]},
   {t:'k',x:"L'an prochain, tu seras écuyer. Et là, ce ne sera plus moi qui te montrerai les choses : ce sera toi qui devras les montrer à quelqu'un de plus jeune."},
   {t:'k',x:"C'est la règle de l'Ordre. Avant de partir, on apprend sa ronde à plus jeune que soi."},
   {t:'k',x:"Bonnes vacances, {nom}. Regarde autour de toi, même là-bas. Surtout là-bas."},
   {t:'fin',mot:"Page de Valdurne. Le fil de ta première année est complet.",sceau:true}
  ]
}
];
