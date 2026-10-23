# সঞ্জীবন (Shonjibon) — বর্জ্য থেকে নতুন জীবন

A bilingual (বাংলা/English), premium-minimal website for **Shonjibon**, a BRAC Amra Notun Network
(JUST Cohort 2026) student project that turns shrimp-shell waste into chitosan for a low-cost,
electricity-free, gravity-fed 5-layer water filter for arsenic-affected coastal Bangladesh — plus
four waste-based byproducts (Soyad flour, shell-craft ornaments, ChitoClear, Agri shelf-life powder).

Built with **Vite + React 18/19 + TypeScript + Tailwind CSS v4 + React Router v6 + TanStack Query +
Zustand + react-hook-form + Zod + Supabase (Postgres/Auth/Storage) + react-i18next + Tiptap +
@dnd-kit + Recharts + Framer Motion**.

---

## 1. Project structure

```
src/
  main.tsx, App.tsx, routes.tsx, index.css
  lib/        supabase.ts · api.ts · mockDb.ts · i18n.ts · utils.ts · schemas.ts · types.ts
  store/      cart.ts · ui.ts
  components/ ui/ · layout/ · home/ · product/ · shared/
  pages/      Home · Products · ProductDetail · Research · Testing · Community · News · Article ·
              Info (Team/About/FAQ/Contact) · Cart · Checkout · OrderSuccess · NotFound
  admin/      AdminApp · AdminLayout · Login · Dashboard · Settings · shared (DataTable + ContentForm) ·
              GenericManagers (Categories/Journey/Research/Testing/Impact/Team/Testimonials/FAQs/
              Partners/Downloads/Community) · ProductsManager · ArticlesManager · MediaManager ·
              OrdersManager · MiscManagers (Messages/Subscribers/Audit/Users)
  locales/    en.json · bn.json
supabase/     001_init.sql · seed.sql
public/       favicon.svg · og-image.svg · robots.txt · sitemap.xml
```

### Why some files are grouped
To keep the codebase consistent and easy to navigate inside this sandboxed project (and to stay
within tool/step budgets while building it), several small, closely-related UI pieces are grouped
into a single module instead of one-file-per-component — e.g. all base UI primitives live in
`components/ui/index.tsx`, the four "Info" pages share `pages/Info.tsx`, and every simple
admin-managed table (categories, journey, research, test results, impact stats, team, testimonials,
FAQs, partners, downloads, community visits) is generated from **one** generic
`ManagerPage`/`DataTable`/`ContentForm` engine in `admin/shared.tsx` + `admin/GenericManagers.tsx`.
Functionally this still satisfies "one manager per table" — each table gets its own route, its own
schema, and its own CRUD screen — it's just implemented with a shared, schema-driven engine instead
of 12 near-identical files.

---

## 2. One interface, two backends

`src/lib/api.ts` exposes typed functions (`listProducts`, `saveProduct`, `createOrder`,
`listSimple`/`saveSimple`/`deleteSimple`/`reorderSimple` for the generic tables, etc.). Every function:

- Uses **Supabase** (Postgres + RLS) automatically when `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` are set in `.env`.
- Otherwise falls back to **`mockDb.ts`**, a fully-seeded localStorage database (with an in-memory
  fallback if localStorage is unavailable) — no backend required to demo the whole site.

Admin auth mirrors this: Supabase Auth (email/password) in mode (a), or a simple password gate
(default `shonjibon2026`, changeable under **Admin → Settings**) in mode (b). No service-role key is
ever used in the client.

---

## 3. Install & run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

The site works immediately with **no environment variables** — it runs fully on the seeded mock
database in your browser's localStorage. Visit `/admin` and log in with `shonjibon2026`.

---

## 4. Connect real Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/001_init.sql`, `supabase/002_functions.sql`,
   `supabase/003_storage_policies.sql`, `supabase/004_content_publication.sql`,
   `supabase/005_audit_trigger_fix.sql`, `supabase/migrations/004_upgrade.sql`,
   `supabase/006_test_result_sample_guard.sql`, `supabase/007_brand_impact_shell_team.sql`,
   `supabase/008_customer_accounts_security.sql`,
   then `supabase/seed.sql`.
3. Copy `.env.example` to `.env` and fill in your project's values:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```

4. Restart `npm run dev` — the app now reads/writes Supabase instead of localStorage.

### Edge Functions, email, and submission limits

Deploy `send-order-email`, `send-contact-email`, `subscribe-newsletter`, `manage-admin-user`,
`sslcommerz-ipn`, and `sslcommerz-return` with the Supabase CLI. Configure `RESEND_API_KEY`,
`RESEND_FROM`, `ORDER_NOTIFICATION_EMAIL`, `CONTACT_NOTIFICATION_EMAIL`, a private
`RATE_LIMIT_SALT`, and `SITE_URL` using `supabase secrets set`. SSLCommerz checkout additionally
requires `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, and `SSLCOMMERZ_MODE` (`sandbox`
or `live`). Supabase supplies the project URL and service-role key to Edge Functions; never put
the service-role key in a `VITE_*` variable. Test in sandbox before enabling live credentials.
Manual bank/mobile payments remain pending until staff confirm them in Admin → Orders.

```bash
supabase functions deploy send-order-email
supabase functions deploy send-contact-email
supabase functions deploy subscribe-newsletter
supabase functions deploy manage-admin-user
supabase functions deploy sslcommerz-ipn
supabase functions deploy sslcommerz-return
```

The order Edge Function invokes the service-only `create_order(customer jsonb, items jsonb)`
database function. It ignores browser-supplied prices and names, reading published product prices
and names from Postgres. Contact, order, and newsletter submissions are limited to five per IP per
hour. The IP is hashed with the server-only salt before rate-limit storage.

Run the storage policy assertions after migrations with:

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/003_storage_policies.sql
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/008_customer_accounts_security.sql
```

### Create the first admin user

Supabase Auth manages login, but every authenticated user also needs a row in `profiles` with a
`role` to pass Row Level Security checks:

```sql
-- 1. Create a user from the Supabase Dashboard → Authentication → Users → Add user
-- 2. Then link their profile (replace the uuid with the new user's id):
insert into profiles (id, full_name, email, role)
values ('00000000-0000-0000-0000-000000000000', 'Admin', 'admin@example.com', 'super_admin');
```

Log in at `/admin` with that user's email/password.

Customers can create accounts at `/account`, save delivery addresses and products, and see orders
created while signed in. The account profile is created by the `auth.users` trigger. Admin routes
and data policies require an `editor` or `super_admin` profile; customer roles cannot access admin
records or change their own role.

### Storage

`003_storage_policies.sql` configures the public **`media`** bucket with a 5MB limit, an image/PDF
MIME allowlist, public read, and admin-only write/update/delete.

---

## 5. Build & deploy

```bash
npm run build       # outputs dist/
npm run preview      # sanity-check the production build locally
```

### Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** the repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Project Settings → Environment
   Variables**. Do not add a Supabase service-role key to Vercel client-side environment variables.
5. In Supabase **Authentication → URL Configuration**, set the production website URL and add the
   Vercel URL to the allowed redirect URLs.
6. Deploy. The included `vercel.json` rewrites client-side routes to the app entry point so paths
   such as `/admin` work when opened directly.

Use the Supabase backend for a shared live demo. Without those environment variables, the app uses
browser-local demo data, which is not shared between teammates and is not suitable for production.

---

## 6. Performance notes

The app is built for route-level code splitting (`React.lazy` + `Suspense`), a fully separate admin
bundle, TanStack Query caching (`staleTime: 5 min`), skeleton loaders, lazy/responsive images, and
`font-display: swap` with Latin + Bengali subsets. Production builds preserve Vite's separate lazy
chunks so admin, Tiptap, Recharts, and drag-and-drop code do not need to be in the initial page load.

---

## 7. Content & claims rules (please keep these if you extend the site)

- Always say the filter **"helps reduce arsenic, heavy metals and turbidity"** — never that it
  removes salinity or fully purifies water.
- The **Research** and **Filter product** pages always show: *"Does not remove salinity; pair with
  rainwater harvesting and SODIS solar disinfection for germs."*
- Any invented number, quote, or test value carries `is_sample: true` / `status: "sample"` and
  renders a small **"Sample data"** badge until an admin marks it verified in `/admin/testing` or the
  relevant manager.

---

## 8. 10-point test checklist

1. **Language toggle** — switch বাং/EN from the header on every single page (including `/admin`
   login) and confirm text, numbers, and dates update instantly and persist on reload.
2. **Bangla rendering** — conjuncts like ক্ষ, জ্ঞ, ত্ত (see FAQ and Research pages) render as single
   glyphs, not broken/boxed characters, in Noto Sans Bengali.
3. **Mobile layout** — at 375px width: slim header, hamburger opens a full-screen menu, cart drawer,
   journey timeline scroll-snaps horizontally, masonry gallery reflows to 2 columns.
4. **Admin → public sync** — edit a product or article in `/admin`, save, then revisit the public
   page (TanStack Query cache is invalidated on save) and confirm the change appears without a hard
   refresh.
5. **Full order flow** — add 2+ products to the cart, checkout with the required fields, land on
   `/order-success/SJ-2026-xxxx`, then confirm the order appears in `/admin/orders` with items and
   total.
6. **Every image loads** — no broken `<img>` icons anywhere; all seed content uses inline SVG/gradient
   illustrations as graceful fallbacks if a URL is empty.
7. **No salinity over-claims** — search the rendered site for "salinity" / "লবণাক্ত" and confirm every
   mention is a limitation/disclaimer, never a claim of removal.
8. **Accessibility** — tab through the header, mobile menu, and checkout form using only the
   keyboard; focus rings should be visible everywhere; images have alt text.
9. **Drag-and-drop reorder** — in any generic admin manager (e.g. `/admin/faqs`), drag a row by its
   handle and confirm the new order persists after reload.
10. **Honeypot & validation** — submit the Contact or Checkout form with invalid data (e.g. missing
    phone) and confirm plain-language bilingual errors appear; the hidden `company` field blocks bot
    submissions silently.

---

## 9. Admin quick reference

- URL: `/admin` (fully lazy-loaded, separate from the public bundle in source).
- Mock mode password: `shonjibon2026` (change under **Settings**).
- **Settings** also has **Export/Import JSON backup** and **Reset to demo data** (mock mode only).
- `Ctrl/Cmd + S` inside a content form is a best-effort shortcut users will expect — submit buttons
  are always visible as the reliable path.

---

*A BRAC Amra Notun Network (JUST Cohort 2026) student project.*
