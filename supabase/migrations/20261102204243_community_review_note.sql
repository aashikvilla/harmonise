-- Reviewer note on community proposals (kind decline / redirect).
alter table public.communities
  add column if not exists review_note text not null default '';
