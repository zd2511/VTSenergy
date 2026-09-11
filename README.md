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
