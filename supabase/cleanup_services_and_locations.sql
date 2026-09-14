-- VTS cleanup: remove duplicate service rows while keeping the oldest row per category/name,
-- and set the two verified business locations.
-- Run this in Supabase SQL Editor after taking a database backup.

with ranked as (
  select id,
         row_number() over (
           partition by lower(trim(category)), lower(trim(name))
           order by created_at asc nulls last, id asc
         ) as rn
  from public.services
)
delete from public.services s
using ranked r
where s.id = r.id
  and r.rn > 1;

update public.site_settings
set address = E'18 Stott Rd, Prestbury, Pietermaritzburg, 3201, South Africa\n12 Kuhn St, Eveleigh, Boksburg, 1459, South Africa',
    updated_at = now()
where id = 1;
