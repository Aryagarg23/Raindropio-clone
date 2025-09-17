-- Drop is_online column and update touch_presence to use only last_seen
-- This migration simplifies presence to rely solely on server-stamped last_seen

-- First, drop the old function if it exists
drop function if exists public.touch_presence(uuid, uuid, boolean);

-- Create new simplified touch_presence function that only updates last_seen
create or replace function public.touch_presence(team uuid, userid uuid)
returns void as $$
begin
  -- Upsert into presence table using server-side now() for last_seen only
  insert into public.presence (team_id, user_id, last_seen)
  values (team, userid, now())
  on conflict (team_id, user_id) do update
  set last_seen = now();
end;
$$ language plpgsql volatile;

-- Grant execute to authenticated role
grant execute on function public.touch_presence(uuid, uuid) to authenticated;

-- Drop the is_online column (after function update to avoid dependency issues)
alter table public.presence drop column if exists is_online;

-- Add index for efficient recent presence queries
create index if not exists idx_presence_team_last_seen on public.presence (team_id, last_seen desc);