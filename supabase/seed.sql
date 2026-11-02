-- Pilot community seed. Apply after migrations 0001 through 0004.
-- Member counts stay unset here: the UI shows truthful empty states until
-- real membership rows exist.

insert into public.communities (id, name, description, visibility, topics, launch_status) values
  ('rebuilding', 'Rebuilding after separation',
   'For separation, divorce, breakup, co-parenting, identity change, and starting over.', 'member',
   array['separation', 'co-parenting', 'identity change', 'starting over'], 'approved'),
  ('legal-clarity', 'Separation: practical clarity',
   'For preparing questions before speaking with a qualified legal professional. Peer discussion only.', 'member',
   array['separation', 'legal questions', 'practical planning'], 'approved'),
  ('steady-ground', 'Finding steady ground',
   'For uncertainty, grief, loneliness, family pressure, anxiety, and disrupted routines.', 'member',
   array['uncertainty', 'grief', 'loneliness', 'family pressure'], 'approved')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  topics = excluded.topics,
  launch_status = 'approved';
