import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// V1 contract fixture. Supabase Auth is represented by request.jwt.claim.sub.
const db=new PGlite();
await db.exec(`
create role anon; create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;
create type public.event_status as enum('draft','open','closed');
create type public.randomization_mode as enum('balanced','pure');
create table events(id uuid primary key default gen_random_uuid(),name text not null,code text not null unique,randomization_mode randomization_mode not null default 'balanced',status event_status not null default 'draft',created_by uuid,created_at timestamptz default now());
create table teams(id uuid primary key default gen_random_uuid(),event_id uuid references events(id),name text not null,color text not null,max_players integer not null check(max_players>0),sort_order integer default 0,unique(event_id,name));
create table players(id uuid primary key default gen_random_uuid(),event_id uuid references events(id),name text not null,session_token uuid not null,unique(event_id,session_token));
create table assignments(id uuid primary key default gen_random_uuid(),event_id uuid references events(id),player_id uuid references players(id) unique,team_id uuid references teams(id));
create view team_availability as select id from teams;
alter table events enable row level security; alter table teams enable row level security; alter table players enable row level security; alter table assignments enable row level security;
create policy "Admin manage own events" on events for all to authenticated using(created_by=auth.uid()) with check(created_by=auth.uid());
create policy "Admin manage event teams" on teams for all to authenticated using(exists(select 1 from events e where e.id=teams.event_id and e.created_by=auth.uid())) with check(exists(select 1 from events e where e.id=teams.event_id and e.created_by=auth.uid()));
create policy "Admin read event players" on players for select to authenticated using(exists(select 1 from events e where e.id=players.event_id and e.created_by=auth.uid()));
create policy "Admin manage assignments" on assignments for all to authenticated using(exists(select 1 from events e where e.id=assignments.event_id and e.created_by=auth.uid()));
create function assign_player_to_team(p_player_id uuid)
returns table(assignment_id uuid,team_id uuid,team_name text,team_color text)
language plpgsql security definer set search_path=public as $$
declare v_event_id uuid; v_mode public.randomization_mode; v_team_id uuid; v_existing_team uuid;
begin
select p.event_id into v_event_id from public.players p where p.id=p_player_id;
if v_event_id is null then raise exception 'PLAYER_NOT_FOUND'; end if;
perform pg_advisory_xact_lock(hashtext(v_event_id::text));
select a.team_id into v_existing_team from public.assignments a where a.player_id=p_player_id;
if v_existing_team is not null then
return query select a.id,t.id,t.name,t.color from public.assignments a join public.teams t on t.id=a.team_id where a.player_id=p_player_id;return;
end if;
select e.randomization_mode into v_mode from public.events e where e.id=v_event_id and e.status='open';
if v_mode is null then raise exception 'EVENT_NOT_OPEN';end if;
if v_mode='balanced' then
select t.id into v_team_id from public.teams t left join public.assignments a on a.team_id=t.id where t.event_id=v_event_id group by t.id,t.max_players having count(a.id)<t.max_players order by count(a.id),random() limit 1;
else
select t.id into v_team_id from public.teams t left join public.assignments a on a.team_id=t.id where t.event_id=v_event_id group by t.id,t.max_players having count(a.id)<t.max_players order by random() limit 1;
end if;
if v_team_id is null then raise exception 'EVENT_FULL';end if;
insert into public.assignments(event_id,player_id,team_id) values(v_event_id,p_player_id,v_team_id);
return query select a.id,t.id,t.name,t.color from public.assignments a join public.teams t on t.id=a.team_id where a.player_id=p_player_id;
end;$$;
`);
await db.exec(await readFile(new URL('../supabase/migrations/002_backend_integration.sql',import.meta.url),'utf8'));
const owner=randomUUID(),other=randomUUID();
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
await db.exec('set role authenticated');
const teamConfig=JSON.stringify([{name:'Blue',color:'#2563eb',max_players:2},{name:'Orange',color:'#f97316',max_players:2}]);
const create=async(code,mode='balanced')=>(await db.query('select create_event_with_teams($1,$2,$3,$4::jsonb) id',['Test',code,mode,teamConfig])).rows[0].id;
const event=await create('test-draw');
await assert.rejects(()=>db.query('select create_event_with_teams($1,$2,$3,$4::jsonb)',['Broken','broken-draw','balanced',JSON.stringify([{name:'Blue',color:'#2563eb',max_players:2},{name:'Blue',color:'#f97316',max_players:2}])]),/unique/);
assert.equal((await db.query("select count(*)::int n from events where code='broken-draw'")).rows[0].n,0,'creation rolls back all event/team writes');
await db.query("update events set status='open' where id=$1",[event]);
await db.exec('set role anon');
const tokens=Array.from({length:5},()=>randomUUID());
const register=async(token,code='test-draw')=>(await db.query('select register_event_player($1,$2,$3) id',[code,'Player',token])).rows[0].id;
const ids=await Promise.all(tokens.map(t=>register(t)));
assert.equal(await register(tokens[0]),ids[0]);
await assert.rejects(()=>db.query('select * from assign_player_to_team($1)',[ids[0]]),/permission denied/);
await assert.rejects(()=>db.query('select * from spin_event_player($1,$2)',['test-draw',randomUUID()]),/PLAYER_NOT_FOUND/);
const spin=async(token,code='test-draw')=>(await db.query('select * from spin_event_player($1,$2)',[code,token])).rows[0];
const first=await spin(tokens[0]);
assert.deepEqual(await spin(tokens[0]),first,'repeated spin returns same persisted assignment');
const second=await spin(tokens[1]);assert.notEqual(second.team_id,first.team_id,'balanced prioritizes lowest count');
await Promise.all(tokens.slice(2,4).map(t=>spin(t)));
await assert.rejects(()=>spin(tokens[4]),/EVENT_FULL/);
await assert.rejects(()=>register(randomUUID()),/EVENT_FULL/);
const snapshot=(await db.query('select event_snapshot($1) data',['test-draw'])).rows[0].data;
assert(snapshot.teams.every(t=>t.assigned_players===2));
assert.equal((await db.query('select player_session($1,$2) data',['test-draw',tokens[0]])).rows[0].data.result.team_id,first.team_id);
assert.equal((await db.query('select player_session($1,$2) data',['test-draw',randomUUID()])).rows[0].data,null);
await assert.rejects(()=>db.query('select * from players'),/permission denied/);
await db.exec('set role authenticated');
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
assert.equal((await db.query('select * from assignments')).rows.length,0,'other owner cannot read roster');
assert.equal((await db.query('update events set status=\'closed\' where id=$1 returning id',[event])).rows.length,0);
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
await db.query("update events set status='closed' where id=$1",[event]);
await db.exec('set role anon');
assert.deepEqual(await spin(tokens[0]),first,'existing result remains available after close');
await assert.rejects(()=>spin(tokens[4]),/EVENT_NOT_OPEN/);
await assert.rejects(()=>register(randomUUID()),/EVENT_NOT_OPEN/);
await db.exec('set role authenticated');
await create('pure-draw','pure');await db.query("update events set status='open' where code='pure-draw'");
await db.exec('set role anon');
for(let i=0;i<4;i++){const token=randomUUID();await register(token,'pure-draw');await spin(token,'pure-draw');}
const pure=(await db.query("select event_snapshot('pure-draw') data")).rows[0].data;
assert(pure.teams.every(t=>t.assigned_players===2),'pure respects capacity');
await db.close();
console.log('PASS: migration, ownership/RLS, atomic creation rollback, token isolation, registration idempotency, repeated spin, balanced/pure capacity, closed-event behavior.');
