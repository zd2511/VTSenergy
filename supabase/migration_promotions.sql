-- VTS Energy & Security: promotion pricing migration
-- Run this once in Supabase SQL Editor if your existing products table
-- reports that original_price / sale_price / promotion_* columns are missing.

alter table public.products add column if not exists specifications jsonb;
alter table public.products add column if not exists promotion_status text default 'none';
alter table public.products add column if not exists promotion_type text default 'on_sale';
alter table public.products add column if not exists original_price numeric;
alter table public.products add column if not exists sale_price numeric;

-- Refresh PostgREST's schema cache after the DDL above.
notify pgrst, 'reload schema';

-- Harden the existing admin write policies so INSERT uses WITH CHECK and
-- authenticated administrators are the only users who can modify protected data.
drop policy if exists products_admin_write on public.products;
drop policy if exists products_admin_insert on public.products;
drop policy if exists products_admin_update on public.products;
drop policy if exists products_admin_delete on public.products;
create policy products_admin_insert on public.products for insert to authenticated with check(public.is_admin());
create policy products_admin_update on public.products for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy products_admin_delete on public.products for delete to authenticated using(public.is_admin());

drop policy if exists product_images_authenticated_write on storage.objects;
drop policy if exists product_images_admin_insert on storage.objects;
drop policy if exists product_images_admin_update on storage.objects;
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_insert on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_admin());
create policy product_images_admin_update on storage.objects for update to authenticated using(bucket_id='product-images' and public.is_admin()) with check(bucket_id='product-images' and public.is_admin());
create policy product_images_admin_delete on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_admin());

notify pgrst, 'reload schema';
