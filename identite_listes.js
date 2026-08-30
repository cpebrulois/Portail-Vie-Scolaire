/**
 * identite_listes.js — Listes pour la composition du nom de page.
 *
 * L'élève choisit un animal et une qualité ; le système ajoute un nombre
 * ALÉATOIRE à 4 chiffres (jamais le rang d'inscription, qui serait devinable).
 *   → « Cigogne-Vaillante-4712 »
 *
 * RÈGLE DE COMPOSITION : aucun mot ne doit pouvoir se retourner en moquerie.
 * Sont donc écartés : le physique (baleine, hippopotame, éléphant, phoque…),
 * la bêtise (âne, dinde, oie, mouton), la lenteur (escargot, tortue, paresseux),
 * la saleté ou la nuisance (rat, cafard, limace, ver), et tout animal qui est
 * déjà une insulte en français (blaireau, fouine, belette, vipère, chameau,
 * morue, thon, vache, poule, pie, gorille, hyène, chacal, buse…).
 *
 * Le genre est porté par l'animal ; l'adjectif s'accorde. « Cigogne-Vaillante ».
 */

/* 100 animaux valorisés — [nom, genre] */
export const ANIMAUX = [
  // Rapaces et oiseaux de haut vol
  ["Aigle","m"],["Faucon","m"],["Épervier","m"],["Gerfaut","m"],["Milan","m"],
  ["Balbuzard","m"],["Harfang","m"],["Chouette","f"],["Crécerelle","f"],
  // Oiseaux d'eau et de rivage
  ["Héron","m"],["Grue","f"],["Cygne","m"],["Ibis","m"],["Cigogne","f"],
  ["Aigrette","f"],["Sterne","f"],["Macareux","m"],["Cormoran","m"],["Albatros","m"],
  // Oiseaux des bois et des jardins
  ["Hirondelle","f"],["Martinet","m"],["Rossignol","m"],["Mésange","f"],["Chardonneret","m"],
  ["Colibri","m"],["Huppe","f"],["Geai","m"],["Bouvreuil","m"],["Fauvette","f"],
  ["Alouette","f"],["Merle","m"],["Loriot","m"],
  // Oiseaux d'apparat
  ["Paon","m"],["Faisan","m"],["Calao","m"],["Ara","m"],["Toucan","m"],
  // Félins
  ["Lynx","m"],["Panthère","f"],["Guépard","m"],["Jaguar","m"],["Tigre","m"],
  ["Lion","m"],["Léopard","m"],["Puma","m"],["Caracal","m"],["Serval","m"],
  ["Ocelot","m"],["Once","f"],
  // Canidés et petits carnivores
  ["Loup","m"],["Renard","m"],["Fennec","m"],["Lycaon","m"],["Hermine","f"],
  ["Martre","f"],["Loutre","f"],["Zibeline","f"],
  // Herbivores de forêt et de montagne
  ["Cerf","m"],["Biche","f"],["Chevreuil","m"],["Élan","m"],["Renne","m"],
  ["Bouquetin","m"],["Chamois","m"],["Gazelle","f"],["Antilope","f"],["Oryx","m"],
  ["Impala","m"],["Zèbre","m"],["Okapi","m"],["Bison","m"],
  // Équidés
  ["Étalon","m"],["Mustang","m"],["Pur-sang","m"],["Poulain","m"],
  // Mer et rivières
  ["Dauphin","m"],["Orque","f"],["Narval","m"],["Espadon","m"],["Marlin","m"],
  ["Manta","f"],["Hippocampe","m"],["Béluga","m"],["Nautile","m"],["Otarie","f"],
  // Reptiles et amphibiens
  ["Iguane","m"],["Varan","m"],["Gecko","m"],["Caméléon","m"],["Salamandre","f"],
  // Petits mammifères
  ["Écureuil","m"],["Lièvre","m"],["Castor","m"],
  // Créatures de Valdurne
  ["Griffon","m"],["Phénix","m"],["Hippogriffe","m"],["Pégase","m"],["Licorne","f"],
  ["Dragon","m"],["Sphinx","m"]
];

/* 50 qualités — [masculin, féminin] */
export const QUALITES = [
  ["Vaillant","Vaillante"],   ["Loyal","Loyale"],         ["Vigilant","Vigilante"],
  ["Sage","Sage"],            ["Patient","Patiente"],     ["Brave","Brave"],
  ["Fidèle","Fidèle"],        ["Intrépide","Intrépide"],  ["Serein","Sereine"],
  ["Habile","Habile"],        ["Alerte","Alerte"],        ["Ardent","Ardente"],
  ["Attentif","Attentive"],   ["Audacieux","Audacieuse"], ["Bienveillant","Bienveillante"],
  ["Calme","Calme"],          ["Clairvoyant","Clairvoyante"], ["Constant","Constante"],
  ["Courageux","Courageuse"], ["Curieux","Curieuse"],     ["Déterminé","Déterminée"],
  ["Discret","Discrète"],     ["Droit","Droite"],         ["Éclairé","Éclairée"],
  ["Élégant","Élégante"],     ["Endurant","Endurante"],   ["Éveillé","Éveillée"],
  ["Ferme","Ferme"],          ["Fier","Fière"],           ["Franc","Franche"],
  ["Généreux","Généreuse"],   ["Gracieux","Gracieuse"],   ["Hardi","Hardie"],
  ["Ingénieux","Ingénieuse"], ["Inspiré","Inspirée"],     ["Juste","Juste"],
  ["Libre","Libre"],          ["Lucide","Lucide"],        ["Méthodique","Méthodique"],
  ["Noble","Noble"],          ["Paisible","Paisible"],    ["Perspicace","Perspicace"],
  ["Persévérant","Persévérante"], ["Précis","Précise"],   ["Prévoyant","Prévoyante"],
  ["Résolu","Résolue"],       ["Sagace","Sagace"],        ["Solidaire","Solidaire"],
  ["Tenace","Tenace"],        ["Vif","Vive"]
];

/** Accorde la qualité au genre de l'animal. */
export function accorde(qualite, genre) {
  return genre === "f" ? qualite[1] : qualite[0];
}

/** Nombre aléatoire à 4 chiffres (1000-9999), tiré cryptographiquement. */
export function suffixe() {
  var b = new Uint32Array(1);
  (self.crypto || window.crypto).getRandomValues(b);
  return 1000 + (b[0] % 9000);
}

/** Compose un code complet : « Cigogne-Vaillante-4712 ». */
export function composer(iAnimal, iQualite, nombre) {
  var a = ANIMAUX[iAnimal], q = QUALITES[iQualite];
  if (!a || !q) return "";
  return a[0] + "-" + accorde(q, a[1]) + "-" + (nombre || suffixe());
}

/** Combinaisons possibles : 100 × 50 × 9000 = 45 000 000. */
export const COMBINAISONS = ANIMAUX.length * QUALITES.length * 9000;
