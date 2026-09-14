-- VTS service-directory cleanup
-- Run once on an existing database before/with the updated site.

-- Remove duplicate service rows created by older seed scripts. Keep the first/lowest-order row.
delete from public.services
where id in (
  select id from (
    select id, row_number() over (
      partition by lower(trim(category)), lower(trim(name))
      order by display_order asc, created_at asc, id asc
    ) as rn
    from public.services
  ) ranked
  where rn > 1
);

create unique index if not exists services_category_name_unique
  on public.services (lower(trim(category)), lower(trim(name)));

-- Remove only the old demonstration CCTV product. Real CCTV service records are untouched.
delete from public.products where slug='cctv-surveillance-package' and is_demo=true;

-- Make the seed scripts idempotent going forward.
