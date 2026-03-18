# Dynamic QR Codes

This feature lets the Kitchen CMS generate printable QR codes that always point to the CMS first, then redirect guests to the current Bistro or Cenare landing page URL.

Example flow:

1. Guest scans a printed QR code.
2. The QR code opens `https://your-cms-domain/qr/bistro-main-menu`.
3. The CMS resolves the slug in Supabase.
4. The CMS increments scan analytics.
5. The guest is redirected to the latest `destination_url` configured in the dashboard.

Because the printed QR code always uses the CMS redirect URL, you can change the final destination later without reprinting the code.

## What Was Added

- Database table: `public.qr_codes`
- Supabase RPC: `public.resolve_qr_code(input_slug text)`
- Public redirect route: `/qr/[slug]`
- Protected dashboard page: `/dashboard/qr-code`
- QR management UI with create, edit, activate, deactivate, delete, preview, copy, print, SVG export, and PNG export
- Lightweight analytics: `scan_count` and `last_scanned_at`

## How To Use It

### 1. Apply the database changes

Run the latest contents of [schema.sql](../schema.sql) in Supabase so the following are created:

- `public.qr_codes`
- indexes for kitchen and slug lookup
- RLS policies for admin CRUD and staff read access
- the `public.resolve_qr_code(text)` RPC
- the `updated_at` trigger for `qr_codes`

This step is required before the dashboard page or public QR route can work.

### 2. Set the public base URL

The QR preview uses the request host when available, and falls back to `NEXT_PUBLIC_BASE_URL`.

Recommended in `.env.local`:

```bash
NEXT_PUBLIC_BASE_URL=https://cms.cenara.com
```

If this is missing locally, the feature falls back to `http://localhost:3000`.

### 3. Open the QR dashboard

After signing in, go to:

- `/dashboard/qr-code`

Or use the `QR Codes` item in the sidebar.

### 4. Create a QR code

On the QR dashboard:

1. Click `New QR code`.
2. Enter a slug such as `bistro-main-menu`.
3. Enter the destination URL, for example `https://bistro.com/menu`.
4. Add an optional description.
5. Leave `Active redirect` enabled if the QR code should work immediately.
6. Save.

The CMS stores the redirect record for the currently selected kitchen.

### 5. Print or share it

In the QR list:

1. Click the preview icon.
2. Copy the QR URL if needed.
3. Download SVG for high-quality print.
4. Download PNG for quick sharing.
5. Use `Print QR code` for browser printing.

Important: print the CMS QR URL, not the destination URL.

Example:

- QR URL: `https://cms.cenara.com/qr/bistro-main-menu`
- Destination URL: `https://bistro.com/menu`

### 6. Change the landing page later

When the Bistro or Cenare landing page changes:

1. Open the same QR code in `/dashboard/qr-code`.
2. Edit `Destination URL`.
3. Save.

All printed copies keep working because the slug does not change.

### 7. Temporarily disable a QR code

Use the `Deactivate` action in the table.

Inactive QR codes stop redirecting. The public `/qr/[slug]` route returns a not found response until the code is activated again.

## Who Can Do What

- Admins can create, edit, activate, deactivate, and delete QR codes.
- Staff can view QR codes for the active kitchen but cannot manage them.
- Anonymous visitors can only use the public `/qr/[slug]` route. They do not get direct table access.

## Implementation Overview

### Data model

The table is defined in [schema.sql](../schema.sql) and stores:

- `kitchen_id`: links the QR code to the selected kitchen
- `slug`: public identifier used in `/qr/[slug]`
- `destination_url`: final external page
- `description`: optional admin-facing notes
- `is_active`: controls whether scans redirect
- `scan_count`: total scans recorded through the CMS
- `last_scanned_at`: timestamp of the latest successful scan
- `created_at`, `updated_at`: audit timestamps

The slug is globally unique, which keeps routing simple and avoids ambiguous redirects.

### Public scan flow

The public route lives in [app/qr/[slug]/route.ts](../app/qr/[slug]/route.ts).

Flow:

1. The route reads the slug from the URL.
2. It normalizes the slug to lowercase.
3. It calls the Supabase RPC `resolve_qr_code`.
4. The RPC updates `scan_count` and `last_scanned_at` only for active rows.
5. The route validates that `destination_url` is an absolute `http` or `https` URL.
6. The route issues a `307` redirect.

If the slug does not exist, is inactive, or resolves to an invalid destination, the route returns an error response instead of redirecting.

### Why an RPC is used instead of direct anonymous table access

The feature uses `public.resolve_qr_code(text)` instead of opening anonymous read or write access to `public.qr_codes`.

That gives three benefits:

- anonymous users can resolve a slug without broad table permissions
- scan analytics are updated atomically in one database call
- inactive rows never redirect because the update query filters on `is_active = true`

### Dashboard data flow

The dashboard page lives in [app/dashboard/qr-code/page.tsx](../app/dashboard/qr-code/page.tsx).

It loads:

- QR codes from `getQRCodes()`
- the signed-in profile from `getUserProfile()`
- the active kitchen from `getActiveKitchenState()`
- the public base URL from `getPublicBaseUrl()`

The page renders the client UI in [components/qr/qr-management.tsx](../components/qr/qr-management.tsx).

### Server actions

The server actions are in [app/actions/qr-actions.ts](../app/actions/qr-actions.ts).

They handle:

- listing QR codes for the active kitchen
- creating a QR code
- updating a QR code
- toggling active state
- deleting a QR code

Important implementation details:

- actions are scoped to the currently active kitchen through `getActiveKitchenId()`
- admin-only mutations are enforced before writes
- slugs are normalized to lowercase kebab-case
- destination URLs must be absolute `http` or `https` URLs
- the dashboard route is revalidated after mutations

### Client UI behavior

The UI in [components/qr/qr-management.tsx](../components/qr/qr-management.tsx) provides:

- summary cards for total codes, active redirects, and total scans
- search and pagination
- a create/edit dialog
- a QR preview dialog
- copy-link support
- SVG download
- PNG download via canvas rendering
- browser print support

The preview QR is generated from:

```text
{publicBaseUrl}/qr/{slug}
```

and not from `destination_url`.

### Public base URL resolution

The helper in [lib/site-url.ts](../lib/site-url.ts) resolves the base URL in this order:

1. `origin` header
2. `x-forwarded-host` or `host` plus protocol
3. `NEXT_PUBLIC_BASE_URL`
4. `http://localhost:3000`

This keeps QR previews correct in production, preview deployments, and local development.

## Typical Bistro / Cenare Setup

Example records:

| Kitchen | Slug               | Destination URL           |
| ------- | ------------------ | ------------------------- |
| Bistro  | `bistro-main-menu` | `https://bistro.com/menu` |
| Cenare  | `cenare-home`      | `https://cenara.com`      |

Printed QR codes can then be placed on:

- tables
- takeaway bags
- flyers
- wall signage
- bills and receipts

## Troubleshooting

### The preview shows localhost

Set `NEXT_PUBLIC_BASE_URL` in `.env.local` or open the dashboard through the real production host.

### The QR code scans but does not redirect

Check the following:

- the row exists in `public.qr_codes`
- `is_active` is `true`
- the slug matches the printed URL
- `destination_url` is a valid absolute `http` or `https` URL
- `resolve_qr_code(text)` exists in Supabase

### Staff cannot create or edit QR codes

That is expected. Only admin profiles can mutate QR data.

### Scan count does not increase

Check whether the latest `schema.sql` has been applied, especially the `resolve_qr_code` RPC and the `grant execute` statement.

## Files Involved

- [schema.sql](../schema.sql)
- [app/actions/qr-actions.ts](../app/actions/qr-actions.ts)
- [app/dashboard/qr-code/page.tsx](../app/dashboard/qr-code/page.tsx)
- [app/qr/[slug]/route.ts](../app/qr/[slug]/route.ts)
- [components/qr/qr-management.tsx](../components/qr/qr-management.tsx)
- [components/app-sidebar.tsx](../components/app-sidebar.tsx)
- [lib/site-url.ts](../lib/site-url.ts)
- [lib/types/inventory.ts](../lib/types/inventory.ts)
