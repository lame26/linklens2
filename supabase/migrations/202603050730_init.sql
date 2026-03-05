create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), split_part(coalesce(new.email, ''), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create trigger trg_collections_updated_at
before update on public.collections
for each row
execute procedure public.set_updated_at();

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create trigger trg_tags_updated_at
before update on public.tags
for each row
execute procedure public.set_updated_at();

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text,
  note text,
  status text not null default 'unread' check (status in ('unread', 'reading', 'done', 'archived')),
  rating smallint check (rating is null or (rating between 1 and 5)),
  is_favorite boolean not null default false,
  category text,
  summary text,
  keywords text[] not null default '{}',
  collection_id uuid references public.collections(id) on delete set null,
  ai_state text not null default 'idle' check (ai_state in ('idle', 'pending', 'success', 'failed')),
  ai_error text,
  last_analyzed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_links_updated_at
before update on public.links
for each row
execute procedure public.set_updated_at();

create table if not exists public.link_tags (
  link_id uuid not null references public.links(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (link_id, tag_id)
);

create table if not exists public.ai_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  link_id uuid not null references public.links(id) on delete cascade,
  task_type text not null check (task_type in ('preview_title', 'analyze_link')),
  status text not null check (status in ('pending', 'success', 'failed')),
  input jsonb,
  output jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_ai_tasks_updated_at
before update on public.ai_tasks
for each row
execute procedure public.set_updated_at();

create index if not exists idx_links_user_deleted_created
  on public.links (user_id, deleted_at, created_at desc);

create index if not exists idx_links_user_status
  on public.links (user_id, status);

create index if not exists idx_links_user_collection
  on public.links (user_id, collection_id);

create index if not exists idx_tags_user_name
  on public.tags (user_id, name);

alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.tags enable row level security;
alter table public.links enable row level security;
alter table public.link_tags enable row level security;
alter table public.ai_tasks enable row level security;

create policy "profiles_owner_all"
on public.profiles
for all
using (id = auth.uid())
with check (id = auth.uid());

create policy "collections_owner_all"
on public.collections
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "tags_owner_all"
on public.tags
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "links_owner_all"
on public.links
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "link_tags_owner_all"
on public.link_tags
for all
using (
  exists (
    select 1
    from public.links l
    where l.id = link_tags.link_id
      and l.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.links l
    where l.id = link_tags.link_id
      and l.user_id = auth.uid()
  )
);

create policy "ai_tasks_owner_all"
on public.ai_tasks
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
