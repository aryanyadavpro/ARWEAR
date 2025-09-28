-- Users table for roles (link to auth.users via trigger or handle in application)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique,
  role text not null default 'user', -- 'user' | 'admin'
  created_at timestamptz default now()
);

-- Products
create table if not exists public.products (
  id text primary key, -- slug/id
  title text not null,
  description text,
  category text check (category in ('shirt', 'pants')),
  sizes text[] not null default '{}',
  price_cents integer not null,
  stock integer not null default 0,
  preview_image text,
  model_url text,
  created_at timestamptz default now()
);

-- Models metadata (anchors/tuning)
create table if not exists public.models_meta (
  id bigserial primary key,
  glb_url text not null,
  preview_url text,
  anchor_json jsonb, -- {x,y,z,scale,rot}
  created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id bigserial primary key,
  user_email text,
  items jsonb not null,
  amount_total integer not null,
  status text not null default 'pending', -- pending -> paid -> shipped -> delivered
  stripe_session_id text,
  created_at timestamptz default now()
);

-- Admin logs
create table if not exists public.admin_logs (
  id bigserial primary key,
  actor_email text,
  action text,
  payload jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.models_meta enable row level security;
alter table public.orders enable row level security;
alter table public.admin_logs enable row level security;

-- Policies
-- products: read for all, write for admins
create policy "products_select_all" on public.products for select using (true);
create policy "products_admin_write" on public.products for insert with check (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));
create policy "products_admin_update" on public.products for update using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));
create policy "products_admin_delete" on public.products for delete using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));

-- models_meta: admin only
create policy "models_meta_admin_select" on public.models_meta for select using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));
create policy "models_meta_admin_write" on public.models_meta for insert with check (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));
create policy "models_meta_admin_update" on public.models_meta for update using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));
create policy "models_meta_admin_delete" on public.models_meta for delete using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));

-- orders: user can read own (by email), admin can read all. Inserts allowed via webhook (no auth)
create policy "orders_user_select" on public.orders for select using (user_email = auth.jwt() ->> 'email');
create policy "orders_insert_webhook" on public.orders for insert with check (true); -- webhook uses service role; restrict via network if using Edge Functions
create policy "orders_admin_update" on public.orders for update using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));

-- admin_logs: admin-only
create policy "admin_logs_admin" on public.admin_logs for all using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));

-- Storage buckets (execute in Supabase SQL or GUI once): models, previews
-- In Storage policies, allow public read and admin write.
