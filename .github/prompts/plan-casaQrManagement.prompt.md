## Plan: QR Platform Roadmap

Turn the current single-table dynamic redirect feature into an internal QR management platform for one company by adding business-unit structure, typed destinations, content modules for menus/products/resources, stronger governance, and operational tools. Reuse the existing Supabase RLS, server action, form, and dashboard patterns so the next version stays consistent with the current app instead of introducing a second architecture.

**Steps**

1. Phase 1 — Product framing and domain model. Keep the app single-company, but introduce internal organization entities so different arms of the company can operate cleanly without full SaaS tenancy. Add a `business_units` table and attach records such as QR codes, menus, products, and staff resources to a unit. Define a `destination_type` model for QR codes: `menu`, `product`, `staff_resource`, `campaign`, `external_link`. This is the key design decision that lets one QR system serve multiple company use cases without becoming a generic blob. This phase blocks later schema and UI work.
2. Phase 2 — Expand the database foundation. Extend `qr_codes` with governance and organization fields such as `business_unit_id`, `destination_type`, `title`, `short_code` or smarter slug strategy, `created_by`, `updated_by`, optional `expires_at`, and optional `archived_at` instead of hard deletes for historically important records. Add tables for `menus`, `menu_items`, `products`, and `staff_resources`, each with clear ownership back to a business unit. Add an `audit_logs` table for admin changes. Reuse the trigger and RLS style already established in schema.sql. Depends on step 1.
3. Phase 3 — Redesign QRs as managed assets rather than only redirects. Keep the existing public `/qr/[slug]` flow and `resolve_qr_code` RPC, but evolve resolution so each QR can point to an internal managed entity as well as an external URL. Recommended approach: store a resolved target model on the QR record and centralize final URL generation in a small service layer. This avoids duplicating redirect logic when menus, products, or resources get their own pages. Depends on step 2.
4. Phase 4 — Add internal CMS modules. Create admin pages for `Menus`, `Products`, and `Staff Resources`, using the current `QRManagement` CRUD structure as the template. Menus should support sections/items/availability; products should support category, description, image, status, and optional price/SKU; staff resources should support title, summary, link/file reference, and visibility. Each content record should be QR-attachable so admins can generate or assign a code directly from the module. Depends on steps 2 and 3. Parallelizable within the phase: menus, products, and staff resources can be built independently once the shared model exists.
5. Phase 5 — Improve dashboard organization for a company with multiple arms. Replace the current flat QR list with filters for business unit, destination type, status, owner, and creation date. Add tags or collections for campaigns and printing batches. Preserve the working search, summary cards, and pagination patterns from the current QR screen. Add sidebar sections for `QR Codes`, `Menus`, `Products`, `Staff Resources`, and later `Analytics`. Depends on steps 1 through 4.
6. Phase 6 — Add operational features the business will actually need. Prioritize bulk create/import, CSV export, branded print sheets, QR label templates, downloadable assets, and batch activation/deactivation. Keep staff read-only, but let admins manage at scale instead of one code at a time. Add soft archival instead of destructive deletion for any record with scan history. Depends on steps 2, 4, and 5.
7. Phase 7 — Strengthen analytics beyond a scan counter. Keep the existing aggregate fields for fast dashboard stats, but add a `qr_scan_events` table or equivalent logging path for timestamped scan history. Start with practical analytics: scans by day, top QR codes, scans by business unit, active vs inactive usage, and exportable reports. Leave geo/device analytics out unless the business explicitly needs it, because that increases privacy and implementation complexity. Depends on step 3 and can begin in parallel with steps 5 and 6 after the core schema exists.
8. Phase 8 — Tighten governance and admin workflows. Retain the current `admin` and `staff` split for now because the user chose read-only staff. Add audit logging, better mutation history, and optional publish/unpublish flows on menus and products rather than introducing a larger permissions system too early. Keep the design extensible so approvals or finer-grained permissions can be added later without rewriting every action. Depends on steps 2 and 4.
9. Phase 9 — Verification and rollout. Validate RLS and redirect integrity first, then verify CRUD flows per module, QR generation/printing, bulk operations, and analytics summaries. Add at least smoke coverage for login, QR creation, QR scan redirect, and one managed-entity flow such as menu publication. Depends on all prior steps.

**Relevant files**

- `c:\Users\ZEUS\Desktop\casalavoro-projects\casa-qr-management\schema.sql` — extend the database model, triggers, and RLS patterns already used for `profiles` and `qr_codes`
- `c:\Users\ZEUS\Desktop\casalavoro-projects\casa-qr-management\app\actions\qr-actions.ts` — reuse `ensureAdminAccess`, normalization, mutation error mapping, and revalidation patterns for future modules
- `c:\Users\ZEUS\Desktop\casalavoro-projects\casa-qr-management\app\qr\[slug]\route.ts` — preserve the public redirect contract while evolving target resolution
- `c:\Users\ZEUS\Desktop\casalavoro-projects\casa-qr-management\components\qr\qr-management.tsx` — reuse the current dashboard CRUD, filtering, preview, and print-export interaction patterns
- `c:\Users\ZEUS\Desktop\casalavoro-projects\casa-qr-management\forms\qr\qr-code-editor-form.tsx` — template for module editors and QR assignment workflows
- `c:\Users\ZEUS\Desktop\casalavoro-projects\casa-qr-management\schemas\qr.ts` — template for schema-driven validation in new forms
- `c:\Users\ZEUS\Desktop\casalavoro-projects\casa-qr-management\components\app-sidebar.tsx` — expand navigation for new management modules
- `c:\Users\ZEUS\Desktop\casalavoro-projects\casa-qr-management\lib\supabase\profile.ts` — current role-profile lookup reused by future admin-only modules
- `c:\Users\ZEUS\Desktop\casalavoro-projects\casa-qr-management\lib\types\inventory.ts` — likely split into module-specific types as the domain grows beyond QR records
- New likely files: dashboard pages and actions for menus, products, staff resources, analytics, plus shared service helpers for QR target resolution

**Verification**

1. Confirm the schema supports the chosen business model: one company, multiple internal business units, admin-managed records, read-only staff.
2. Validate RLS with both admin and staff accounts for every new table, especially QR creation, content editing, and read access.
3. Test the public QR flow end to end for each destination type: menu, product, staff resource, campaign, and external link.
4. Test bulk import-export and branded print flows with realistic volumes and duplicate-slug handling.
5. Verify audit logs are written for create, update, archive, activate-deactivate, and publish-unpublish operations.
6. Run lint and add at least smoke-level automated tests for auth, QR CRUD, and one managed-content flow.

**Decisions**

- In scope: evolve the app into a single-company internal QR management platform serving multiple company arms.
- In scope: menus, product pages, staff resources, campaigns, better organization, bulk management, branding-printing, analytics, auditability.
- Out of scope for the next version: multi-company SaaS tenancy, fine-grained permissions beyond admin-staff, advanced geo-device fingerprint analytics, public custom-domain management, and billing-quota logic.
- Recommendation: treat QR codes as managed assets linked to typed destination records, not just freeform URLs. Keep support for external URLs, but do not make them the only model anymore.
- Recommendation: use business units plus destination types to model different arms of the company instead of creating unrelated ad hoc QR categories.

**Further Considerations**

1. Recommended rollout order: `business_units` and QR schema first, then `menus`, then `products`, then `staff_resources`, then analytics-bulk tooling.
2. Recommended deletion policy: archive records with history instead of hard deleting them, especially QR codes that may already be printed.
3. Recommended analytics depth for V1: timestamps and per-unit trends first; defer device, location, or attribution data until there is a clear reporting need.
