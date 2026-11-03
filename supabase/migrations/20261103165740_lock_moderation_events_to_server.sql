-- The moderation worker and operator APIs access this queue through server
-- routes using service_role. Keep client JWTs out of the internal event table.
revoke all privileges on table public.moderation_events
  from anon, authenticated;
