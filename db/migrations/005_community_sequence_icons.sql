begin;

alter table public.community_formats add column icon_preset text not null default 'users'
  check (icon_preset in ('users','clipboard','calendar','document'));
alter table public.community_formats add column icon_ico bytea
  check (icon_ico is null or octet_length(icon_ico) between 10240 and 256000);

alter function public.publish_community_format(jsonb) rename to publish_community_format_definition;

create function public.community_excel_sequence(definition jsonb)
returns text[]
language sql immutable
set search_path = ''
as $$
  select array_agg(lower(btrim(coalesce(definition->'excelHeaders'->>field, field))) order by position)
  from jsonb_array_elements_text(case when jsonb_typeof(definition->'fields') = 'array' then definition->'fields' else '[]'::jsonb end) with ordinality as fields(field, position)
$$;

create function public.publish_community_format(input jsonb, preset text default 'users', ico bytea default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id integer;
  ordered_headers text[];
begin
  perform pg_advisory_xact_lock(764209833);
  ordered_headers := public.community_excel_sequence(input);
  if ordered_headers in (
    array['namamurid','kelas','sesi','username'],
    array['nopeserta','nisn','namamurid','kelas','ruang'],
    array['nopeserta','nisn','namamurid','kelas'],
    array['namamurid','tgllahir','nisn','nopeserta','ruang'],
    array['namamurid','tgllahir','nisn','nopeserta'],
    array['namamurid','tgllahir','nisn','nopeserta','ruang','namasatdik'],
    array['namamurid','tgllahir','nisn','nopeserta','namasatdik']
  ) or exists (
    select 1 from public.community_formats
    where public.community_excel_sequence(definition) = ordered_headers
  ) then
    raise exception using errcode = 'PT412', message = 'Excel column order already exists';
  end if;
  new_id := public.publish_community_format_definition(input);
  update public.community_formats set icon_preset = preset, icon_ico = ico where id = new_id;
  return new_id;
end;
$$;

revoke all on function public.publish_community_format(jsonb, text, bytea) from public;
commit;
