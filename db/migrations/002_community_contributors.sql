-- Add optional public contributor attribution to the Neon community catalog.
-- Existing formats keep their original definition and become attributed to "Anonim".
-- Apply once after reviewing the migration on an isolated Neon branch.
begin;
alter table public.community_formats
  add column if not exists contributor_name text not null default 'Anonim';

create or replace function public.publish_community_format(input jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  allowed constant text[] := array['NoPeserta','NamaMurid','NISN','Kelas','Ruang','Sesi','Username','TglLahir','NamaSatdik','Custom1','Custom2','Custom3','Custom4','Custom5','Custom6'];
  fields text[];
  mono text[];
  name text;
  photo_key text;
  normalized jsonb;
  format_id integer;
  contributor_name text;
begin
  if jsonb_typeof(input) is distinct from 'object' or octet_length(input::text) > 4096 or
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

  if input ? 'labels' and (jsonb_typeof(input->'labels') is distinct from 'object' or exists (
       select 1 from jsonb_each_text(input->'labels') as m(key, val)
       where not m.key = any(fields) or char_length(btrim(m.val)) not between 1 and 60 or
             m.val ~ '[[:cntrl:]]'
     )) then
    raise exception using errcode = '22023', message = 'Invalid labels';
  end if;
  if input ? 'excelHeaders' and (jsonb_typeof(input->'excelHeaders') is distinct from 'object' or exists (
       select 1 from jsonb_each_text(input->'excelHeaders') as m(key, val)
       where not m.key = any(fields) or char_length(btrim(m.val)) not between 1 and 64 or
             lower(btrim(m.val)) = 'password' or m.val ~ '[[:cntrl:]]'
     )) then
    raise exception using errcode = '22023', message = 'Invalid headers';
  end if;
  if exists (select 1 from unnest(fields) as f(field) where field like 'Custom%' and
      (not coalesce(input->'labels' ? field, false) or
       not coalesce(input->'excelHeaders' ? field, false))) then
    raise exception using errcode = '22023', message = 'Custom fields require metadata';
  end if;
  if (select count(distinct lower(btrim(coalesce(input->'excelHeaders'->>field, field))))
      from unnest(fields) as f(field)) <> cardinality(fields) then
    raise exception using errcode = '22023', message = 'Duplicate Excel headers';
  end if;

  if input ? 'anonymous' and jsonb_typeof(input->'anonymous') is distinct from 'boolean' then
    raise exception using errcode = '22023', message = 'Invalid anonymous flag';
  end if;
  if coalesce(input->>'anonymous', 'true') = 'true' then
    contributor_name := 'Anonim';
  else
    if jsonb_typeof(input->'contributorName') is distinct from 'string' then
      raise exception using errcode = '22023', message = 'Invalid contributor';
    end if;
    contributor_name := btrim(input->>'contributorName');
    if char_length(contributor_name) not between 1 and 60 or contributor_name ~ '[[:cntrl:]]' then
      raise exception using errcode = '22023', message = 'Invalid contributor';
    end if;
  end if;

  normalized := jsonb_build_object('name', name, 'fields', fields, 'photoKey', photo_key,
    'mono', array(select item from unnest(fields) with ordinality as f(item, pos)
      where item = any(mono) order by pos)) ||
    (case when input ? 'labels' then jsonb_build_object('labels', input->'labels') else '{}'::jsonb end) ||
    (case when input ? 'excelHeaders' then jsonb_build_object('excelHeaders', input->'excelHeaders') else '{}'::jsonb end);

  perform pg_advisory_xact_lock(764209833);
  select id into format_id from public.community_formats where definition = normalized;
  if found then return format_id; end if;
  if (select count(*) from public.community_formats) >= 5000 or
     (select count(*) from public.community_formats where created_at >= now() - interval '1 minute') >= 20 then
    raise exception using errcode = 'PT429', message = 'Catalog limit reached';
  end if;
  insert into public.community_formats (definition, contributor_name) values (normalized, contributor_name) returning id into format_id;
  return format_id;
end;
$$;

revoke all on function public.publish_community_format(jsonb) from public;
commit;
