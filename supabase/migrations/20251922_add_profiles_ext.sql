-- PROFILES TABLE (extended) -----------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  age int check (age between 10 and 60),
  phone text,
  email text not null unique,
  gestational_age_weeks int,
  trimester text check (trimester in ('I','II','III')),
  education text,
  occupation text,
  role text not null default 'mother' check (role in ('mother','midwife','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add columns idempotently (for existing tables)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='age'
  ) then
    alter table public.profiles add column age int check (age between 10 and 60);
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='phone'
  ) then
    alter table public.profiles add column phone text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='gestational_age_weeks'
  ) then
    alter table public.profiles add column gestational_age_weeks int;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='trimester'
  ) then
    alter table public.profiles add column trimester text check (trimester in ('I','II','III'));
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='education'
  ) then
    alter table public.profiles add column education text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='occupation'
  ) then
    alter table public.profiles add column occupation text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='role'
  ) then
    alter table public.profiles add column role text not null default 'mother' check (role in ('mother','midwife','admin'));
  end if;
end $$;

-- Indexes
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);

-- Trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- RLS ----------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Allow owner (service role) everything by default via superuser bypass.
-- Policies for authenticated users:
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Profiles select own'
  ) then
    create policy "Profiles select own"
      on public.profiles
      for select
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Profiles insert self'
  ) then
    create policy "Profiles insert self"
      on public.profiles
      for insert
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Profiles update own'
  ) then
    create policy "Profiles update own"
      on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;
