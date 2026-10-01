create table categories(id uuid primary key default gen_random_uuid(),name text not null,slug text unique not null,image text,sort int default 0);
create table products(id uuid primary key default gen_random_uuid(),category_id uuid references categories(id) on delete cascade,name text not null,price text,description text,specs text,images text[] default '{}',hidden boolean default false,created_at timestamptz default now());
alter table categories enable row level security;
alter table products enable row level security;
create policy "read cat" on categories for select using (true);
create policy "read prod" on products for select using (true);
create policy "admin cat" on categories for all to authenticated using (true) with check (true);
create policy "admin prod" on products for all to authenticated using (true) with check (true);
insert into storage.buckets(id,name,public) values('images','images',true) on conflict do nothing;
create policy "img read" on storage.objects for select using (bucket_id='images');
create policy "img write" on storage.objects for all to authenticated using (bucket_id='images') with check (bucket_id='images');
insert into categories(name,slug,image,sort) values
('Motorcycles','motorcycles','https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop',0),
('ATV','atv','https://images.unsplash.com/photo-1721343431343-1a0241c07a2f?q=80&w=2070&auto=format&fit=crop',1),
('UTV','utv','https://images.unsplash.com/photo-1607020383881-f1f5e0e3383e?q=80&w=2070&auto=format&fit=crop',2),
('Marine','marine','https://images.unsplash.com/photo-1464476365993-fd990d712d0c?q=80&w=2070&auto=format&fit=crop',3);
