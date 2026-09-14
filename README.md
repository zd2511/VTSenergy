# VTS Energy & Security — Client Handoff

## What this package contains

This is the preserved VTS Energy & Security website plus the final reliability, SEO, product, promotion, contact, map and admin improvements.

## Public pages

- `index.html` — premium/cinematic homepage, regional presence, selected solutions, product filters, location map and contact CTA.
- `about.html` — VTS company information, mission, vision, values and regional coverage.
- `services.html` — Energy Solutions and Digital Security Solutions.
- `products.html` — live Supabase product catalogue, search, categories, sorting, promotions and product details.
- `contact.html` — contact form, contact details and Pietermaritzburg Google Maps embed.

## Admin

- `admin/` — password-only VTS management portal using the existing Supabase Auth architecture.
- Admin authentication does not store the password in website code.
- The configured admin email is used internally by Supabase Auth; the visible login remains password-only.
- Product create/edit/hide/delete, images, featured status, ordering and promotions are supported.
- Authentication and management requests have timeouts so a network/database failure cannot leave the UI indefinitely stuck on “Signing in…” or “Saving…”.
- Cancel/Exit in the product editor remains usable while a save is pending.

## Supabase setup — required before production

Run:

`supabase/migration_promotions.sql`

Then run `supabase/migration_services_cleanup.sql` once on an existing database to remove duplicate service seed rows and prevent them from returning.

in the Supabase SQL Editor once against the production database. It adds:

- `specifications`
- `promotion_status`
- `promotion_type`
- `original_price`
- `sale_price`

It also reloads the PostgREST schema cache and hardens the product/image admin RLS policies.

If the project is being installed from scratch, use `supabase/schema.sql` or `supabase/schema_complete.sql`.

Make sure the administrator's Supabase Auth user UUID exists in `public.admin_users`.

## Resilience

Public company settings have a built-in fallback. Product data is cached in browser storage after a successful Supabase load, so a temporary Supabase/network failure does not unnecessarily blank the catalogue or footer on a returning visitor.

The footer is rendered immediately with fallback data before remote settings are requested, preventing Quick Links from disappearing during slow/offline requests.

The homepage uses the latest active products as a fallback for “Selected solutions” when no products are explicitly marked Featured.

## SEO

The public pages include page-specific titles, descriptions, Open Graph/Twitter metadata, canonical hints, robots directives and structured data where appropriate. The admin area is `noindex,nofollow` and excluded from `robots.txt`.

### Production domain

The current sitemap/robots files use `https://vtsenergysecurity.co.za/` because that domain matches the supplied VTS email domain. **Verify this is the client's final website domain before launch.** If the production domain is different, update:

- `robots.txt`
- `sitemap.xml`
- the canonical URLs in the five public HTML files

Google Search Console should then be connected and the sitemap submitted.

## Email

The contact form uses the existing frontend architecture and opens the visitor's email client with a prepared enquiry. It does not claim to provide server-side email delivery.

For automatic server-side delivery, configure a transactional email provider/serverless endpoint before enabling that workflow.

## Google Maps

A no-API-key Google Maps embed is included on the homepage and Contact page for:

18 Stott Rd, Prestbury, Pietermaritzburg, 3201, South Africa

12 Kuhn St, Eveleigh, Boksburg, 1459, South Africa

## Important production checks

1. Verify the production domain and update SEO URLs if required.
2. Run `supabase/migration_promotions.sql`.
3. Verify the administrator Auth account exists.
4. Verify that administrator UUID exists in `admin_users`.
5. Verify the `product-images` Storage bucket exists and its policies are applied.
6. Replace any demonstration catalogue products/data with approved client product data.
7. Test product create/edit/image upload/promotion from the live admin portal.
8. Test the public catalogue after saving a product from admin.
9. Submit the final sitemap in Google Search Console.
10. Confirm the deployed site is HTTPS and that the final canonical URLs match the live domain.
