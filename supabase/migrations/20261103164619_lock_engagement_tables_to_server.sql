-- Engagement data is accessed only through server routes using service_role.
-- Remove direct PostgREST access so table policies cannot expose private
-- reaction rows or permit cross-community writes through client JWTs.
revoke all privileges on table public.post_reactions, public.promotion_requests
  from anon, authenticated;

-- These policies are no longer part of the supported access path. Dropping
-- them keeps a later accidental GRANT from re-opening the unsafe direct API.
drop policy if exists "reactions_member_read" on public.post_reactions;
drop policy if exists "reactions_member_insert" on public.post_reactions;
drop policy if exists "reactions_author_delete" on public.post_reactions;
drop policy if exists "promotions_owner_read" on public.promotion_requests;
drop policy if exists "promotions_owner_insert" on public.promotion_requests;
drop policy if exists "promotions_moderator_all" on public.promotion_requests;
