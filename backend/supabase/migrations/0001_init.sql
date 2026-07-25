-- Cloud schema per TRD 2.2: minimal sync data + billing state only.
-- Detailed posture stats stay local (see src/main/postureStore.ts).

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  status text not null default 'incomplete' check (status in ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_key on subscriptions (user_id);
create unique index if not exists subscriptions_stripe_customer_id_key on subscriptions (stripe_customer_id);

alter table profiles enable row level security;
alter table subscriptions enable row level security;

-- Each user may only ever see their own profile / subscription row.
-- Writes to `subscriptions` only ever happen server-side via the
-- service-role key (Stripe webhook), so no insert/update policy is
-- granted to authenticated users here.
create policy "profiles: read own row" on profiles
  for select using (auth.uid() = id);

create policy "profiles: insert own row" on profiles
  for insert with check (auth.uid() = id);

create policy "subscriptions: read own row" on subscriptions
  for select using (auth.uid() = user_id);
