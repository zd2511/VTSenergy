# VTS Energy & Security — V2 Fixes

This package preserves the existing VTS Energy & Security website and management portal while applying targeted fixes.

## Important
The updated `supabase/schema.sql` includes the `products.specifications` column and the verified VTS company/service data. Apply it to the connected Supabase project before using product specifications in the management portal.

The public client configuration remains in `js/config.js`. No administrator password is stored in the frontend.

## Main fixes
- Reliable Add Product submission with loading/duplicate-submit protection, surfaced errors, immediate list updates and safe image handling.
- Mobile admin navigation drawer with backdrop, close-on-selection, Escape support and modal-safe layering.
- Homepage chapter/numbered presentation removed.
- Southern Africa coverage added prominently below the hero.
- Verified company, contact, coverage, mission, vision, values and service content reflected in the schema/fallback content.
- Product specifications are now persisted as JSON.

## Enhancements in this package
- Premium/cinematic homepage treatment using a real photographic solar hero image, restrained CSS motion and responsive regional-presence display.
- About page expanded with the supplied VTS Energy & Security company, energy, digital security, mission, vision, values and regional coverage content.
- Services page guarantees the full requested Energy Solutions and Digital Security Solutions directory, with a static fallback if the database is temporarily unavailable.
- Product promotions now support `promotion_status`, `promotion_type`, `original_price` and `sale_price` in Supabase. Admins can create On Sale or Special Offer products and the public catalogue displays the promotion on cards and product details.
- Contact form includes Name, Company, Email, Phone, Subject, Product/Service and Message, native validation, a honeypot field and clear email-client feedback. It uses `mailto:` and therefore requires a configured desktop/mobile mail client rather than pretending to provide server-side delivery.
- Contact page includes a no-key Google Maps embed plus the verified Prestbury address.
- Existing footer Quick Links and the `VTS` administrator link are preserved and point to the existing authenticated admin area.
- `supabase/schema.sql` and `supabase/schema_complete.sql` include the promotion fields/migrations.
