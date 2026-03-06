create table if not exists public.user_ai_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  summary_focus text,
  summary_length text not null default 'medium' check (summary_length in ('short', 'medium', 'long')),
  summary_style text not null default 'neutral' check (summary_style in ('neutral', 'easy', 'insight')),
  custom_prompt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_ai_preferences_updated_at
before update on public.user_ai_preferences
for each row
execute procedure public.set_updated_at();

alter table public.user_ai_preferences enable row level security;

drop policy if exists "user_ai_preferences_owner_all" on public.user_ai_preferences;
create policy "user_ai_preferences_owner_all"
on public.user_ai_preferences
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
