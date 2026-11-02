-- Pilot community seed. Apply after 0001_harmonise_core.sql.
-- Member counts stay unset here: the UI shows truthful empty states until
-- real membership rows exist.

insert into public.communities (id, name, description, visibility) values
  ('rebuilding', 'Rebuilding after separation',
   'For separation, divorce, breakup, co-parenting, identity change, and starting over.', 'member'),
  ('legal-clarity', 'Separation: practical clarity',
   'For preparing questions before speaking with a qualified legal professional. Peer discussion only.', 'member'),
  ('steady-ground', 'Finding steady ground',
   'For uncertainty, grief, loneliness, family pressure, anxiety, and disrupted routines.', 'member')
on conflict (id) do update set name = excluded.name, description = excluded.description;
