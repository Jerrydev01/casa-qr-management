create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff'))
);

alter table public.profiles enable row level security;

create table if not exists public.business_units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_units enable row level security;

create table if not exists public.destination_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.destination_types enable row level security;

insert into public.business_units (name, slug, description)
values (
  'General',
  'general',
  'Default business unit for shared QR codes and uncategorized records.'
)
on conflict (slug) do nothing;

insert into public.destination_types (name, slug, description)
values
  ('Menu', 'menu', 'QR codes that open internal or public menu experiences.'),
  ('Product', 'product', 'QR codes that open product pages, packaging details, or catalog entries.'),
  ('Staff Resource', 'staff_resource', 'QR codes that open internal staff resources or operational material.'),
  ('Campaign', 'campaign', 'QR codes used for campaigns, promotions, and activations.'),
  ('External Link', 'external_link', 'QR codes that redirect to a standalone external URL.')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description;

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled QR code',
  slug text not null unique,
  business_unit_id uuid references public.business_units(id),
  destination_type text not null default 'external_link' references public.destination_types(slug) on update cascade,
  destination_url text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  scan_count integer not null default 0,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.qr_codes enable row level security;

alter table public.qr_codes
  add column if not exists title text not null default 'Untitled QR code';

alter table public.qr_codes
  add column if not exists business_unit_id uuid references public.business_units(id);

alter table public.qr_codes
  add column if not exists destination_type text not null default 'external_link';

alter table public.qr_codes
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.qr_codes
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.qr_codes
set business_unit_id = (
  select id from public.business_units where slug = 'general' limit 1
)
where business_unit_id is null;

update public.qr_codes
set destination_type = 'external_link'
where destination_type is null
   or not exists (
     select 1
     from public.destination_types
     where public.destination_types.slug = public.qr_codes.destination_type
   );

alter table public.qr_codes
  alter column business_unit_id set not null;

alter table public.qr_codes
  drop constraint if exists qr_codes_destination_type_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'qr_codes_destination_type_fkey'
      and conrelid = 'public.qr_codes'::regclass
  ) then
    alter table public.qr_codes
      add constraint qr_codes_destination_type_fkey
      foreign key (destination_type)
      references public.destination_types(slug)
      on update cascade;
  end if;
end $$;

create index if not exists idx_qr_codes_created
  on public.qr_codes(created_at desc);

create index if not exists idx_qr_codes_slug_active
  on public.qr_codes(slug, is_active);

create index if not exists idx_qr_codes_business_unit
  on public.qr_codes(business_unit_id, created_at desc);

create index if not exists idx_qr_codes_destination_type
  on public.qr_codes(destination_type, created_at desc);

create index if not exists idx_business_units_created
  on public.business_units(created_at desc);

create index if not exists idx_destination_types_created
  on public.destination_types(created_at desc);

create table if not exists public.scan_events (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  scanned_at timestamptz not null default now()
);

alter table public.scan_events enable row level security;

create index if not exists idx_scan_events_scanned_at
  on public.scan_events(scanned_at desc);

create index if not exists idx_scan_events_qr_code_id
  on public.scan_events(qr_code_id, scanned_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.resolve_qr_code(input_slug text)
returns table (
  id uuid,
  slug text,
  destination_url text,
  scan_count integer,
  last_scanned_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_row public.qr_codes%rowtype;
begin
  update public.qr_codes
  set scan_count = public.qr_codes.scan_count + 1,
      last_scanned_at = now()
  where public.qr_codes.slug = input_slug
    and public.qr_codes.is_active = true
  returning * into resolved_row;

  if not found then
    return;
  end if;

  insert into public.scan_events (qr_code_id, scanned_at)
  values (resolved_row.id, now());

  return query
  select
    resolved_row.id,
    resolved_row.slug,
    resolved_row.destination_url,
    resolved_row.scan_count,
    resolved_row.last_scanned_at;
end;
$$;

grant execute on function public.resolve_qr_code(text) to anon, authenticated;

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admins full access profiles" on public.profiles;
drop policy if exists "Admins full access business_units" on public.business_units;
drop policy if exists "Staff read business_units" on public.business_units;
drop policy if exists "Admins full access destination_types" on public.destination_types;
drop policy if exists "Staff read destination_types" on public.destination_types;
drop policy if exists "Admins full access qr_codes" on public.qr_codes;
drop policy if exists "Staff read qr_codes" on public.qr_codes;
drop policy if exists "Admins full access scan_events" on public.scan_events;
drop policy if exists "Staff read scan_events" on public.scan_events;

create policy "Users read own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "Users update own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id and role = 'staff');

create policy "Admins full access profiles"
on public.profiles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins full access business_units"
on public.business_units for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Staff read business_units"
on public.business_units for select to authenticated
using (true);

create policy "Admins full access destination_types"
on public.destination_types for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Staff read destination_types"
on public.destination_types for select to authenticated
using (true);

create policy "Admins full access qr_codes"
on public.qr_codes for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Staff read qr_codes"
on public.qr_codes for select to authenticated
using (true);

create policy "Admins full access scan_events"
on public.scan_events for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Staff read scan_events"
on public.scan_events for select to authenticated
using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'staff'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_qr_codes on public.qr_codes;

drop trigger if exists set_updated_at_business_units on public.business_units;

drop trigger if exists set_updated_at_destination_types on public.destination_types;

create trigger set_updated_at_business_units
before update on public.business_units
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_destination_types
before update on public.destination_types
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_qr_codes
before update on public.qr_codes
for each row execute procedure public.handle_updated_at();