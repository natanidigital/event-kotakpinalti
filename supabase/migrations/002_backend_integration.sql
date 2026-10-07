-- Apply AFTER Backend Schema V1. No existing event/player data is removed.
begin;

-- The original definer RPC must never be callable using only a player UUID.
revoke all on function public.assign_player_to_team(uuid) from public, anon, authenticated;
alter function public.assign_player_to_team(uuid) set search_path = '';

create or replace function public.event_snapshot(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', e.id, 'name', e.name, 'code', e.code,
    'status', e.status, 'randomization_mode', e.randomization_mode,
    'teams', coalesce((select jsonb_agg(jsonb_build_object(
      'id', t.id, 'name', t.name, 'color', t.color, 'max_players', t.max_players,
      'assigned_players', (select count(*) from public.assignments a where a.team_id=t.id)
    ) order by t.sort_order, t.id) from public.teams t where t.event_id=e.id), '[]'::jsonb))
  from public.events e where e.code=p_code and e.status in ('open','closed');
$$;

create or replace function public.register_event_player(p_code text, p_name text, p_token uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_event public.events; v_player uuid;
begin
  select * into v_event from public.events where code=p_code;
  if v_event.id is null then raise exception 'EVENT_NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtext(v_event.id::text));
  select * into v_event from public.events where id=v_event.id for update;
  select id into v_player from public.players where event_id=v_event.id and session_token=p_token;
  if v_player is not null then return v_player; end if;
  if v_event.status <> 'open' then raise exception 'EVENT_NOT_OPEN'; end if;
  if p_token is null or length(btrim(p_name)) not between 1 and 80 then raise exception 'INVALID_PLAYER'; end if;
  if (select count(*) from public.assignments where event_id=v_event.id) >=
     (select coalesce(sum(max_players),0) from public.teams where event_id=v_event.id)
  then raise exception 'EVENT_FULL'; end if;
  insert into public.players(event_id,name,session_token) values(v_event.id,btrim(p_name),p_token) returning id into v_player;
  return v_player;
end;
$$;

create or replace function public.player_session(p_code text, p_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',p.id,'name',p.name,'result',
    (select jsonb_build_object('team_id',t.id,'team_name',t.name,'team_color',t.color)
     from public.assignments a join public.teams t on t.id=a.team_id where a.player_id=p.id))
  from public.players p join public.events e on e.id=p.event_id
  where e.code=p_code and p.session_token=p_token;
$$;

create or replace function public.spin_event_player(p_code text, p_token uuid)
returns table(assignment_id uuid,team_id uuid,team_name text,team_color text)
language plpgsql security definer set search_path = '' as $$
declare v_player uuid; v_event uuid;
begin
  select p.id,p.event_id into v_player,v_event from public.players p join public.events e on e.id=p.event_id
  where e.code=p_code and p.session_token=p_token;
  if v_player is null then raise exception 'PLAYER_NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtext(v_event::text));
  perform 1 from public.events where id=v_event for update;
  return query select * from public.assign_player_to_team(v_player);
end;
$$;

create or replace function public.create_event_with_teams(p_name text,p_code text,p_mode public.randomization_mode,p_teams jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_team jsonb; v_order integer := 0;
begin
  if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
  if length(btrim(p_name)) not between 1 and 120 or p_code !~ '^[a-z0-9-]{3,40}$'
    or jsonb_array_length(p_teams) not between 2 and 12 then raise exception 'INVALID_EVENT'; end if;
  insert into public.events(name,code,randomization_mode,created_by,status)
  values(btrim(p_name),p_code,p_mode,auth.uid(),'draft') returning id into v_id;
  for v_team in select value from jsonb_array_elements(p_teams) loop
    if length(btrim(v_team->>'name')) not between 1 and 80 or (v_team->>'color') !~ '^#[0-9a-fA-F]{6}$'
       or (v_team->>'max_players')::integer not between 1 and 500 then raise exception 'INVALID_TEAM'; end if;
    insert into public.teams(event_id,name,color,max_players,sort_order)
    values(v_id,btrim(v_team->>'name'),v_team->>'color',(v_team->>'max_players')::integer,v_order);
    v_order := v_order+1;
  end loop;
  return v_id;
end;
$$;

revoke all on function public.event_snapshot(text), public.register_event_player(text,text,uuid),
  public.player_session(text,uuid),public.spin_event_player(text,uuid),
  public.create_event_with_teams(text,text,public.randomization_mode,jsonb) from public;
grant execute on function public.event_snapshot(text),public.register_event_player(text,text,uuid),
  public.player_session(text,uuid),public.spin_event_player(text,uuid) to anon,authenticated;
grant execute on function public.create_event_with_teams(text,text,public.randomization_mode,jsonb) to authenticated;
grant insert,update,select on public.events,public.teams to authenticated;
grant select on public.players,public.assignments to authenticated;

-- Replace the old owner-bypassing availability view with a safe aggregate RPC.
revoke all on public.team_availability from anon,authenticated;
-- All assignment writes go through the serialized RPC, including admin clients.
drop policy if exists "Admin manage assignments" on public.assignments;
create policy "Admin read assignments" on public.assignments for select to authenticated
using(exists(select 1 from public.events e where e.id=assignments.event_id and e.created_by=auth.uid()));
revoke insert,update,delete on public.assignments from anon,authenticated;
commit;
