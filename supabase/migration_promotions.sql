-- VTS Energy & Security: promotion pricing migration
-- Run this once in Supabase SQL Editor if your existing products table
-- reports that original_price / sale_price / promotion_* columns are missing.

alter table public.products add column if not exists promotion_status text default 'none';
alter table public.products add column if not exists promotion_type text default 'on_sale';
alter table public.products add column if not exists original_price numeric;
alter table public.products add column if not exists sale_price numeric;

-- Refresh PostgREST's schema cache after the DDL above.
notify pgrst, 'reload schema';
