-- Create a server-side RPC to upsert presence and stamp last_seen with server time
-- Usage: select touch_presence('team-uuid'::uuid, 'user-uuid'::uuid, true);

create or replace function public.touch_presence(team uuid, userid uuid, is_online boolean)
returns void as $$
begin
  -- Upsert into presence table using server-side now() for last_seen
  insert into public.presence (team_id, user_id, is_online, last_seen)
  values (team, userid, is_online, now())
  on conflict (team_id, user_id) do update
  set is_online = excluded.is_online,
      last_seen = now();
end;
$$ language plpgsql volatile;

-- Grant execute to anon and authenticated roles if necessary
-- grant execute on function public.touch_presence(uuid, uuid, boolean) to authenticated;
-- grant execute on function public.touch_presence(uuid, uuid, boolean) to anon;
grant execute on function public.touch_presence(uuid, uuid, boolean) to authenticated;
