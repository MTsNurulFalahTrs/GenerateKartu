create table public.community_formats (
  id integer generated always as identity primary key,
  definition jsonb not null unique,
  created_at timestamptz not null default now()
);

alter table public.community_formats enable row level security;
revoke all on public.community_formats from public, anon, authenticated;
grant select on public.community_formats to anon, authenticated;
create policy community_catalog_read on public.community_formats
  for select to anon, authenticated using (true);

create schema if not exists community_private;
revoke all on schema community_private from public;

create function community_private.publish_format(input jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed constant text[] := array['NoPeserta','NamaMurid','NISN','Kelas','Ruang','Sesi','Username','TglLahir','NamaSatdik'];
  fields text[];
  mono text[];
  name text;
  photo_key text;
  normalized jsonb;
  format_id integer;
begin
  if jsonb_typeof(input) is distinct from 'object' or octet_length(input::text) > 1024 or
     jsonb_typeof(input->'fields') is distinct from 'array' or
     jsonb_typeof(input->'mono') is distinct from 'array' or
     jsonb_typeof(input->'name') is distinct from 'string' or
     jsonb_typeof(input->'photoKey') is distinct from 'string' then
    raise exception using errcode = '22023', message = 'Invalid format';
  end if;

  name := btrim(input->>'name');
  photo_key := input->>'photoKey';
  fields := array(select jsonb_array_elements_text(input->'fields'));
  mono := array(select jsonb_array_elements_text(input->'mono'));
  if char_length(name) not between 1 and 60 or name ~ '[[:cntrl:]]' or
     cardinality(fields) not between 1 and 6 or not fields <@ allowed or
     cardinality(fields) <> (select count(distinct item) from unnest(fields) item) or
     not photo_key = any(fields) or not mono <@ fields or
     cardinality(mono) <> (select count(distinct item) from unnest(mono) item) then
    raise exception using errcode = '22023', message = 'Invalid format';
  end if;

  normalized := jsonb_build_object('name', name, 'fields', fields, 'photoKey', photo_key,
    'mono', array(select item from unnest(fields) with ordinality as f(item, pos)
      where item = any(mono) order by pos));

  perform pg_advisory_xact_lock(764209833);
  select id into format_id from public.community_formats where definition = normalized;
  if found then return format_id; end if;
  if (select count(*) from public.community_formats) >= 5000 or
     (select count(*) from public.community_formats where created_at >= now() - interval '1 minute') >= 20 then
    raise exception using errcode = 'PT429', message = 'Catalog limit reached';
  end if;
  insert into public.community_formats (definition) values (normalized) returning id into format_id;
  return format_id;
end;
$$;
revoke all on function community_private.publish_format(jsonb) from public;
grant usage on schema community_private to anon, authenticated;
grant execute on function community_private.publish_format(jsonb) to anon, authenticated;

create function public.publish_community_format(input jsonb)
returns integer
language sql
security invoker
set search_path = ''
as $$ select community_private.publish_format(input) $$;
revoke all on function public.publish_community_format(jsonb) from public;
grant execute on function public.publish_community_format(jsonb) to anon, authenticated;
