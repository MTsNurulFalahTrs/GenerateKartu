begin;

create extension if not exists pgcrypto with schema public;

create table public.community_owner_pin (
  singleton boolean primary key default true check (singleton),
  pin_hash text not null check (pin_hash ~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$'),
  failed_attempts integer not null default 0 check (failed_attempts between 0 and 5),
  locked_until timestamptz
);

revoke all on public.community_owner_pin from public;

create function public.delete_community_format(format_id integer, owner_pin text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  credential public.community_owner_pin%rowtype;
  checked_at timestamptz;
begin
  if format_id is null or format_id < 1 or owner_pin is null or owner_pin !~ '^[0-9]{8,16}$' then
    return 'invalid';
  end if;

  select * into credential from public.community_owner_pin where singleton for update;
  if not found then return 'unconfigured'; end if;

  checked_at := clock_timestamp();
  if credential.locked_until > checked_at then return 'locked'; end if;
  if credential.locked_until is not null then credential.failed_attempts := 0; end if;

  if public.crypt(owner_pin, credential.pin_hash) is distinct from credential.pin_hash then
    update public.community_owner_pin
      set failed_attempts = credential.failed_attempts + 1,
          locked_until = case when credential.failed_attempts = 4 then checked_at + interval '5 minutes' end
      where singleton;
    if credential.failed_attempts = 4 then return 'locked'; end if;
    return 'invalid';
  end if;

  update public.community_owner_pin set failed_attempts = 0, locked_until = null where singleton;
  delete from public.community_formats where id = format_id;
  if found then return 'deleted'; end if;
  return 'missing';
end;
$$;

revoke all on function public.delete_community_format(integer, text) from public;

commit;
