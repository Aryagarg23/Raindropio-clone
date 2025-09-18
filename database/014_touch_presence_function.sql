-- Drop the old function signatures first to avoid conflicts
DROP FUNCTION IF EXISTS public.touch_presence(uuid, uuid, boolean);
DROP FUNCTION IF EXISTS public.touch_presence(boolean, uuid, uuid);
DROP FUNCTION IF EXISTS public.touch_presence(team_uuid uuid, user_uuid uuid);

-- Create a server-side RPC to upsert presence with the correct parameter names
create or replace function public.touch_presence(team uuid, userid uuid)
returns void as $$
begin
  -- Upsert into presence table using server-side now() for last_seen
  insert into public.presence (team_id, user_id, last_seen)
  values (team, userid, now())
  on conflict (team_id, user_id) do update
  set last_seen = now()
  -- Only update if the last_seen timestamp is older than 30 seconds to prevent event storms
  where public.presence.last_seen < (now() - interval '30 seconds');
end;
$$ language plpgsql volatile;

-- Grant execute on the new function signature
grant execute on function public.touch_presence(uuid, uuid) to authenticated;
