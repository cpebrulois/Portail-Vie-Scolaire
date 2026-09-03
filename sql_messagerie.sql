-- ===========================================================================
-- MESSAGERIE PROFESSEUR → ÉLÈVE
-- À injecter une seule fois dans Supabase (SQL Editor), avant le déploiement.
--
-- PRINCIPE
-- Un professeur principal ne rédige rien : il choisit un motif dans une liste
-- fermée, tenue par le Worker. Le canal est donc structurellement incapable
-- de porter ce qui demanderait une modération. Ce qui demande des mots passe
-- par ECLAT, et le message le dit à l'élève.
-- L'élève ne répond pas ici. Le CPE voit tout, et chacun le sait.
--
-- MÉMOIRE ET CONSERVATION
-- Aucune action de l'API ne supprime ni ne modifie un message : une fois
-- écrit, il est acquis, ce qui est la condition pour qu'il serve en cas de
-- litige. En regard, on ne conserve pas indéfiniment : chaque ligne porte sa
-- date de péremption, fixée à l'écriture au 31 août de l'année scolaire
-- SUIVANTE (un message de mars 2027 relève de l'année 2026-2027 et disparaît
-- le 31 août 2028). La tâche planifiée du Worker fait le ménage. L'export CSV
-- du journal, lui, vit sur le poste du CPE et survit à la purge.
--
-- Aucune donnée nominative : uniquement des codes publics (Rance-xxxx).
-- ===========================================================================

-- --- 1. Portée des sessions ------------------------------------------------
-- Une session « légère » est délivrée à la simple connexion (nom de page) :
-- elle permet à un élève de marquer ses propres messages comme lus, et au CPE
-- de connaître le NOMBRE de messages qu'il n'a pas encore vus. Rien d'autre.
-- Une session « complète » exige en plus le mot de passe administrateur :
-- elle seule ouvre la console CPE et le contenu des messages.
-- La valeur par défaut est « complete » pour que les sessions déjà ouvertes
-- au moment de la migration continuent de fonctionner ; seules les sessions
-- créées à la connexion sont marquées « legere », explicitement.
alter table pvs_sessions
  add column if not exists portee text not null default 'complete';

-- --- 2. Les messages -------------------------------------------------------
create table if not exists pvs_messages (
  id           bigserial   primary key,
  prof_public  text        not null,   -- Rance-0002 à Rance-0050, ou le CPE
  eleve_public text        not null,   -- Rance-xxxx
  expediteur   text        not null default 'professeur',  -- ou 'viescolaire'
  motif        text        not null,   -- code du motif choisi (ENC_BRAVO, …)
  texte        text        not null,   -- la formule TELLE QU'ELLE A ÉTÉ LUE
  cree_at      timestamptz not null default now(),
  lu_at        timestamptz,            -- l'élève a ouvert le message
  cpe_vu_at    timestamptz,            -- le CPE en a pris connaissance
  purge_apres  timestamptz not null    -- 31 août de l'année scolaire suivante
);

-- « texte » est figé à l'écriture, et non recalculé à la lecture : si un
-- libellé de motif est réécrit un jour, les anciens messages conservent
-- exactement ce que l'élève a vu. Sans cela, la trace ne vaudrait rien.

create index if not exists pvs_messages_eleve_idx
  on pvs_messages (eleve_public, lu_at);
create index if not exists pvs_messages_prof_idx
  on pvs_messages (prof_public, cree_at desc);
create index if not exists pvs_messages_cpe_idx
  on pvs_messages (cpe_vu_at, cree_at desc);
create index if not exists pvs_messages_purge_idx
  on pvs_messages (purge_apres);

-- --- 2 bis. Messages à la classe, rédigés par Agora -----------------------
-- Le professeur ne rédige pas davantage ici : il dit à Agora ce qu'il veut
-- faire passer, Agora écrit un texte de 200 mots au plus, le professeur le
-- valide. Le brouillon est créé et conservé PAR LE SERVEUR : la validation ne
-- fait que publier un brouillon existant. Sans cela, une requête fabriquée à
-- la main enverrait n'importe quel texte et le passage par Agora ne
-- garantirait plus rien.
--
-- La consigne du professeur est enregistrée au même titre que le texte final.
-- C'est la symétrie qui manquait : les élèves savent que le CPE lit ce qu'ils
-- écrivent, les professeurs sont logés à la même enseigne. C'est là qu'est le
-- vrai garde-fou — pas dans la prudence supposée du modèle.
create table if not exists pvs_lots (
  id               bigserial   primary key,
  prof_public      text        not null,
  consigne         text        not null,   -- ce que le professeur a demandé
  texte            text        not null,   -- ce qu'Agora a rédigé
  etat             text        not null default 'brouillon', -- ou 'envoye'
  nb_destinataires integer     not null default 0,
  cree_at          timestamptz not null default now(),
  envoye_at        timestamptz,
  cpe_vu_at        timestamptz,
  purge_apres      timestamptz not null
);

create index if not exists pvs_lots_prof_idx on pvs_lots (prof_public, cree_at desc);
create index if not exists pvs_lots_purge_idx on pvs_lots (purge_apres);

-- Rattachement d'un message individuel au lot qui l'a produit.
alter table pvs_messages
  add column if not exists lot_id bigint;

alter table pvs_lots enable row level security;

-- --- 3. Verrouillage -------------------------------------------------------
-- Comme les autres tables du portail : RLS activé et AUCUNE politique. Seul
-- le Worker, qui détient la clé de service, peut lire et écrire. Une clé
-- publique posée dans une page ne verrait rien du tout.
alter table pvs_messages enable row level security;

-- --- 4. Contrôle -----------------------------------------------------------
select 'pvs_messages' as objet, count(*)::text as valeur from pvs_messages
union all
select 'colonne portee',
       coalesce((select 'présente' from information_schema.columns
                 where table_name = 'pvs_sessions' and column_name = 'portee'
                 limit 1), 'ABSENTE');
