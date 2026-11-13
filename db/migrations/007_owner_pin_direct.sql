begin;

alter table public.community_owner_pin
  alter column pin_hash drop not null,
  add column pin text check (pin ~ '^[0-9]{8,16}$'),
  add constraint community_owner_pin_one_credential check (num_nonnulls(pin, pin_hash) = 1);

create or replace function public.delete_community_format(format_id integer, owner_pin text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  credential public.community_owner_pin%rowtype;
  checked_at timestamptz;
  bcrypt_hash text;
  pin_matches boolean;
begin
  if format_id is null or format_id < 1 or owner_pin is null or owner_pin !~ '^[0-9]{8,16}$' then
    return 'invalid';
  end if;

  select * into credential from public.community_owner_pin where singleton for update;
  if not found then return 'unconfigured'; end if;

  checked_at := clock_timestamp();
  if credential.locked_until > checked_at then return 'locked'; end if;
  if credential.locked_until is not null then credential.failed_attempts := 0; end if;

  if credential.pin is not null then
    pin_matches := owner_pin collate "C" = credential.pin collate "C";
  else
    -- Preserve access for installations with a previously configured bcrypt PIN.
    bcrypt_hash := '$2a$' || substr(credential.pin_hash, 5);
    pin_matches := public.crypt(owner_pin, bcrypt_hash) = bcrypt_hash;
  end if;
  if pin_matches is distinct from true then
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

commit;
