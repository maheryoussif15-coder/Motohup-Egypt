alter table categories add column if not exists hidden boolean default false;
alter table categories add column if not exists description text;
alter table categories add column if not exists image_style jsonb default '{}'::jsonb;

alter table products add column if not exists condition text default 'new';
alter table products add column if not exists image_style jsonb default '{}'::jsonb;
update products set condition = 'new' where condition is null;

insert into categories(name,slug,sort,description) values
('Cars','cars',5,'Quality cars, new and used, inspected and ready to drive.'),
('Accessories & Spare Parts','parts',6,'Genuine OEM and racing-grade components to keep every machine at peak power.'),
('Clothing','clothing',7,'Riding gear and apparel built for protection and style.')
on conflict (slug) do nothing;

create table if not exists orders(
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text,
  product_price text,
  customer_name text not null,
  phone text not null,
  city text,
  address text,
  note text,
  status text default 'new',
  created_at timestamptz default now()
);

alter table orders enable row level security;

drop policy if exists "orders insert" on orders;
drop policy if exists "orders admin" on orders;

create policy "orders insert" on orders for insert to anon, authenticated with check (true);
create policy "orders admin" on orders for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table orders;
