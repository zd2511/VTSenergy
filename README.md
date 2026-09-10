# VTS Energy & Security V2

Production-oriented static web platform for **Volt Tech Solutions (Pty) Ltd, trading as VTS Energy & Security**.

## Architecture

- **Frontend:** semantic HTML5 + modular CSS + vanilla ES modules. No framework lock-in, no build step required.
- **Backend:** Supabase Postgres + Supabase Auth + Supabase Storage.
- **Hosting:** the public site and `/admin` can be deployed to GitHub Pages or another static host.
- **Security:** admin access is enforced by Supabase Auth and an `admin_users` allow-list protected by Row Level Security (RLS). The public site never contains the administrator password.
- **Storage:** product images live in a public Supabase Storage bucket, while uploads/deletes are restricted to approved admin users by Storage policies.

This avoids fake localStorage-only administration. Product and company changes are persisted centrally and are fetched by every visitor.

## 1. Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In Supabase Auth, create an administrator user manually. Use a strong production password. The supplied `vtsenergy123` is **development-only** and should not be retained in production.
4. Copy that user's UUID into `admin_users` with:

```sql
insert into public.admin_users (user_id, display_name)
values ('YOUR_AUTH_USER_UUID', 'VTS Administrator');
```

5. Confirm Storage contains the `product-images` bucket created by the SQL script.

### Important security note

Supabase's browser client uses the project's **anon/publishable key**. That key is expected to be public in a static app. Security comes from RLS, not from hiding the anon key. **Never put a Supabase service-role/secret key in this repository or frontend code.**

## 2. Configure the frontend

Copy:

`js/config.example.js` → `js/config.js`

Then replace the two placeholders with your Supabase project URL and anon/publishable key.

`config.js` is gitignored. For GitHub Pages, either commit a file containing only the public Supabase URL + anon/publishable key, or inject those two public values during your deployment process. Never place service-role keys here.

## 3. Temporary development password

The requested initial password is `vtsenergy123`. Do **not** hard-code it into the website. Create the Auth user in Supabase with that password only for development/testing, then change it in Supabase Auth before launch.

The application does not contain a password reset/admin credential editor because credential lifecycle should be handled by Supabase Auth rather than custom insecure client-side password storage.

## 4. Add/edit products

Go to `/admin/`, authenticate, then choose **Products**.

- Add Product creates a persistent database row.
- Image upload sends the file to Supabase Storage and stores its path in Postgres.
- Edit updates the existing row.
- Active controls public visibility.
- Featured controls the homepage featured catalogue.
- Delete requires confirmation and removes the image from storage when possible.

The public Products page reads from Postgres, so updates are shared across devices.

## 5. Change prices and WhatsApp

Edit a product's `price` and `price_type` in the admin editor.

WhatsApp is centrally configured in **Company Information**. Product enquiries use the current product name dynamically and URL-encode the message.

## 6. Company information

The Company Information panel edits the central `site_settings` row. Public pages use that data for contact information, footer details, coverage, mission, and vision.

## 7. Services

Services are database-backed too. The current starter dataset is editable in the `services` table. The admin UI focuses on the requested product/company management workflow; service management can be extended with the same RLS pattern without changing the public architecture.

## 8. Demo products

The SQL seed creates five **DEMO / REPLACE** products so the catalogue can be tested immediately:

- 5kW Hybrid Inverter
- Lithium Battery Storage System
- Solar Panel Package
- CCTV Surveillance Package
- Access Control System

These entries deliberately avoid invented manufacturer specifications. Replace them with VTS-approved product data before launch.

## 9. Deployment

### GitHub Pages

1. Upload the repository to GitHub.
2. Configure `js/config.js` with the public Supabase project values.
3. In GitHub: **Settings → Pages → Deploy from branch** and select the main branch/root.
4. The app is already written with relative paths, so it works from a repository subpath.

If your repository is `vts-energy-security`, use:

`https://YOUR-USERNAME.github.io/vts-energy-security/`

### Other static hosts

Upload the project directory as-is to Netlify, Cloudflare Pages, Vercel static hosting, or any static web host. No Node server is required.

## 10. SEO / production checklist

Before launch:

- Replace demo product content/images.
- Replace the placeholder canonical domain in each page's `<link rel="canonical">`.
- Update `sitemap.xml` and `robots.txt` to the real production domain.
- Verify Google Business Profile and map destination.
- Add real product structured data only for products actually sold by VTS.
- Review legal/privacy requirements for contact-form storage if form submissions are later persisted.
- Change the development administrator password.
- Enable MFA in Supabase Auth if appropriate for the VTS administrator account.
- Restrict Auth email settings according to the company's operational requirements.

## 11. What must never be exposed

Never expose:

- Supabase service-role/secret keys
- Database passwords
- SMTP passwords
- Private OAuth credentials
- Storage admin credentials
- Any private backend secret

The public frontend may contain the Supabase URL and anon/publishable key because RLS is the security boundary.

## 12. Project structure

```text
/
├── index.html
├── services.html
├── products.html
├── about.html
├── contact.html
├── admin/
│   └── index.html
├── assets/images/vts-logo.jpg
├── css/
│   ├── style.css
│   └── admin.css
├── js/
│   ├── config.example.js
│   ├── supabase.js
│   ├── data.js
│   ├── main.js
│   ├── products.js
│   ├── contact.js
│   └── admin.js
└── supabase/schema.sql
```

## 13. First-time local test

1. Edit `js/config.js` with the public Supabase URL, anon/publishable key and administrator email.
2. Serve the folder with `python3 -m http.server 8080` or another static server. Do not open HTML files directly with `file://` because browser module/CORS behaviour varies.
3. Open the local URL and test the public catalogue.
4. Open `/admin/` and sign in using the configured Supabase Auth email and the development password only if you created that Auth user with `vtsenergy123`.

If you deploy the repository publicly, make sure `js/config.js` contains only the public URL, anon/publishable key and admin email. The service-role key must never be present.
