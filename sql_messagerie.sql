-- ===========================================================================
-- MESSAGERIE PROFESSEUR → ÉLÈVE
-- À injecter une seule fois dans Supabase (SQL Editor), avant le déploiement.
--
-- Principe : un professeur principal écrit à un élève qui lui a été attribué
-- nominativement par le CPE. L'élève ne répond pas ici — il répond via ECLAT.
-- Le CPE voit TOUS les messages : c'est annoncé aux professeurs comme aux
-- élèves, et c'est ce qui rend la messagerie acceptable.
--
-- Aucune donnée nominative : uniquement des codes publics (Rance-xxxx).
-- ===========================================================================

-- --- 1. Portée des sessions ------------------------------------------------
-- Une session « légère » est délivrée à la simple connexion (nom de page) :
-- elle permet à un élève de lire ses messages et de les marquer lus, et au CPE
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
  id           bigserial primary key,
  prof_public  text        not null,       -- Rance-0002 à Rance-0050, ou le CPE
  eleve_public text        not null,       -- Rance-xxxx
  texte        text        not null,
  cree_at      timestamptz not null default now(),
  lu_at        timestamptz,                -- l'élève a ouvert le message
  cpe_vu_at    timestamptz                 -- le CPE en a pris connaissance
);

create index if not exists pvs_messages_eleve_idx
  on pvs_messages (eleve_public, lu_at);
create index if not exists pvs_messages_prof_idx
  on pvs_messages (prof_public, cree_at desc);
create index if not exists pvs_messages_cpe_idx
  on pvs_messages (cpe_vu_at, cree_at desc);

-- --- 3. Verrouillage -------------------------------------------------------
-- Comme les autres tables du portail : RLS activé et AUCUNE politique. Seul
-- le Worker, qui détient la clé de service, peut lire et écrire. Une clé
-- publique posée dans une page ne verrait rien du tout.
alter table pvs_messages enable row level security;

-- --- 4. Contrôle -----------------------------------------------------------
select 'pvs_messages'  as table, count(*) as lignes from pvs_messages
union all
select 'pvs_sessions', count(*) from pvs_sessions;
