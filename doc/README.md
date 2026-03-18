# Casa QR Management Documentation

This document explains the current implementation of the project as it exists today.

It is intended to answer four practical questions:

1. What the application does right now
2. How the current QR implementation is structured
3. Which parts of the product are already built versus only planned
4. Where to look in the codebase when extending the system

## 1. Current Product Scope

The application is currently a QR management system built on top of a Next.js + Supabase foundation.

At the moment, the system supports:

- authentication and protected dashboard access
- role-based user profiles (`admin` and `staff`)
- QR code creation, editing, activation/deactivation, deletion, preview, print, and export
- grouping QR codes by business unit
- classifying QR codes by destination type
- a public redirect endpoint that increments scan analytics
- organization-level CRUD for business units and destination types
- an operations dashboard that summarizes QR usage and reference data

The application does **not** yet support true first-class content modules such as:

- menus
- products
- staff resources

That means the current system still works with this model:

- a QR code has a `destination_type` for classification
- a QR code has a `destination_url` as the actual redirect target

So today the system is:

- `QR -> URL`

not yet:

- `QR -> Menu`
- `QR -> Product`
- `QR -> Staff Resource`

## 2. High-Level Architecture

The project uses the following stack:

- Next.js App Router
- React 19
- Supabase SSR auth + Postgres
- server actions for authenticated mutations
- Base UI / shadcn-style component structure
- TanStack Form for client form state
- Zod for validation

The application is organized around a fairly clear split:

- **server pages** fetch data and compose screens
- **server actions** perform authenticated mutations and revalidation
- **client components** handle interactivity
- **schema.sql** is the database source of truth for the current implementation

## 3. Main User Flows

### 3.1 Sign in and access the dashboard

Users authenticate through the auth flow and are redirected into the protected dashboard area.

The main protected routes are:

- `/dashboard`
- `/dashboard/qr-code`
- `/dashboard/organization`

### 3.2 Create a QR code

An admin can create a QR code with:

- title
- slug
- business unit
- destination type
- destination URL
- optional description
- active/inactive state

The QR code is stored in the database and is printable immediately.

### 3.3 Bulk create QR codes

An admin can also create many QR codes in one operation from the QR management screen.

The current bulk workflow supports:

- pasting CSV content directly into a dialog
- uploading a CSV or plain-text file
- using business unit slugs or ids instead of UUID lookup by hand
- using destination type slugs or ids
- partial-success imports, where valid rows are created and invalid rows are reported back individually

Expected CSV headers:

- `title`
- `slug`
- `business_unit`
- `destination_type`
- `destination_url`
- optional `description`
- optional `is_active`

The import is still URL-based, so this is currently best suited to cases like:

- bulk staff profile QR creation
- campaign launch batches
- menu rollouts
- product landing page rollouts

### 3.4 Public QR scan flow

When a guest or staff member scans a printed QR code:

1. they hit `/qr/[slug]`
2. the route calls the Supabase RPC `resolve_qr_code(input_slug text)`
3. the RPC increments `scan_count`
4. the RPC updates `last_scanned_at`
5. the route redirects the user to the saved `destination_url`

This is the key reason the system is “dynamic”: the printed QR always points to the application first, so the final destination URL can be changed later without reprinting the QR asset.

## 4. Current Route Structure

### Public route

- `app/qr/[slug]/route.ts`

Purpose:

- resolve a QR slug
- increment analytics
- redirect to the latest destination URL

### Dashboard overview

- `app/dashboard/page.tsx`

Purpose:

- render the operations overview page
- summarize QR counts, business-unit usage, and destination-type usage

### QR management workspace

- `app/dashboard/qr-code/page.tsx`

Purpose:

- load QR records, business units, destination types, current user profile, and public base URL
- pass that data into the main interactive QR management client component

### Organization management

- `app/dashboard/organization/page.tsx`

Purpose:

- load business units and destination types including inactive records
- render the organization CRUD interface

## 5. Core Database Model

The current implementation is centered around four tables.

### 5.1 `public.profiles`

Stores application-level user information for authenticated users.

Main fields:

- `id`
- `email`
- `full_name`
- `role`

Roles currently supported:

- `admin`
- `staff`

### 5.2 `public.business_units`

Represents the internal organizational arms that own QR assets.

Main fields:

- `id`
- `name`
- `slug`
- `description`
- `is_active`
- timestamps

Seeded default:

- `general`

Purpose:

- group QR codes by ownership or operational area
- support filtering, reporting, and future module segmentation

### 5.3 `public.destination_types`

Represents the allowed use-case categories for QR codes.

Main fields:

- `id`
- `name`
- `slug`
- `description`
- `is_active`
- timestamps

Currently seeded values:

- `menu`
- `product`
- `staff_resource`
- `campaign`
- `external_link`

Purpose:

- classify what kind of experience a QR code is intended to open
- keep this reference data editable through the dashboard instead of hardcoding it in the frontend

### 5.4 `public.qr_codes`

This is the main operational table.

Main fields:

- `id`
- `title`
- `slug`
- `business_unit_id`
- `destination_type`
- `destination_url`
- `description`
- `is_active`
- `created_by`
- `updated_by`
- `scan_count`
- `last_scanned_at`
- timestamps

Important current design detail:

- `destination_type` is a classification field
- `destination_url` is still the actual redirect target

This is why `menu`, `product`, and `staff_resource` are currently labels and not yet true internal entities.

## 6. RLS and Permissions

The schema enables row-level security on the core tables.

The permission model currently works like this:

- staff can read business units, destination types, and QR codes
- staff can read their own profile and update their own profile within constraints
- admins have full CRUD access to profiles, business units, destination types, and QR codes

The helper function used in policy checks is:

- `public.is_admin()`

This keeps mutation authority inside the database layer as well as the application layer.

## 7. Server-Side Action Layer

The main operational action file is:

- `app/actions/qr-actions.ts`

This file currently handles three domains.

### 7.1 QR actions

- fetch QR codes
- create QR codes
- update QR codes
- toggle QR active state
- delete QR codes

### 7.2 Business unit actions

- fetch active business units
- fetch all business units including inactive ones
- create business units
- update business units
- toggle active state
- delete business units

### 7.3 Destination type actions

- fetch active destination types
- fetch all destination types including inactive ones
- create destination types
- update destination types
- toggle active state
- delete destination types

The action layer also performs:

- normalization of names, slugs, and descriptions
- URL validation for QR destinations
- role checks for admin-only mutations
- page revalidation after successful writes

## 8. Frontend Screens and Components

### 8.1 Dashboard overview

Main files:

- `app/dashboard/page.tsx`
- `components/dashboard/dashboard-overview.tsx`

Purpose:

- present a management summary instead of duplicating the QR workspace
- show current counts and usage trends
- give quick navigation into operational screens

This page is meant to be the control surface, not the full CRUD workspace.

### 8.2 QR management workspace

Main files:

- `app/dashboard/qr-code/page.tsx`
- `components/qr/qr-management.tsx`
- `forms/qr/qr-code-editor-form.tsx`
- `schemas/qr.ts`

Capabilities currently implemented:

- search QR records
- filter by business unit
- filter by destination type
- create QR codes
- edit QR codes
- activate/deactivate QR codes
- delete QR codes
- preview generated QR codes
- copy public QR link
- download SVG
- download PNG
- print QR codes
- paginate the QR list

### 8.3 Organization management

Main files:

- `app/dashboard/organization/page.tsx`
- `components/dashboard/organization-management.tsx`

Capabilities currently implemented:

- create business units
- edit business units
- activate/deactivate business units
- delete business units
- create destination types
- edit destination types
- activate/deactivate destination types
- delete destination types

This screen is where the application’s reference data is managed.

## 9. Form and Validation Strategy

The QR editor currently uses:

- TanStack Form for client-side state
- Zod for field validation and submit validation

Main files:

- `forms/qr/qr-code-editor-form.tsx`
- `schemas/qr.ts`

The QR form validates:

- title
- slug format
- business unit selection
- destination type selection
- destination URL format

The editor currently supports two important UX behaviors:

- showing labels for selected business units and destination types instead of raw IDs/slugs
- resetting form state correctly between create and edit flows

## 10. Redirect and Analytics Flow

The redirect implementation is intentionally simple and reliable.

### Application route

- `app/qr/[slug]/route.ts`

### Database helper

- `public.resolve_qr_code(input_slug text)` in `schema.sql`

### What happens during a scan

- the QR slug is normalized
- the RPC finds an active QR code by slug
- the RPC increments `scan_count`
- the RPC updates `last_scanned_at`
- the route validates the stored URL
- the user is redirected with HTTP 307

This means analytics are tightly coupled to successful resolution of an active QR code.

## 11. Sidebar and Navigation

Current main navigation:

- Dashboard
- QR Codes
- Organization

Sidebar file:

- `components/app-sidebar.tsx`

This reflects the current product shape: one overview page, one operational QR workspace, and one reference-data admin area.

## 12. What Is Planned But Not Built Yet

This is the most important implementation boundary to understand.

The system already supports classification such as:

- `destination_type = menu`
- `destination_type = product`
- `destination_type = staff_resource`

But the system does **not** yet have actual module tables or CRUD screens for:

- menus
- products
- staff resources

That means the current model is still:

- `QR -> destination_url`

not yet:

- `QR -> Menu record`
- `QR -> Product record`
- `QR -> Staff Resource record`

To reach that future state, the application still needs:

- new content tables
- new CRUD pages and forms
- QR foreign-key or target-reference fields
- conditional QR editor logic for internal targets
- redirect resolution based on linked internal entities instead of only raw URLs

## 13. Current Limitations

The following limitations are intentional or simply not implemented yet:

- destination types are metadata only; they do not yet imply internal object relationships
- QR codes always resolve to a stored absolute URL
- there is no first-class menu/product/staff-resource public page layer yet
- the project still contains some older docs from earlier kitchen/menu-oriented work that may not fully reflect the current QR-first implementation

If there is any conflict between old documentation and the current code, treat the current code and this document as the source of truth.

## 14. Recommended Extension Path

The safest way to evolve the system is:

1. build the `menus` module first
2. let QR codes attach to a menu record
3. update the public redirect logic to resolve menu URLs from the linked record
4. repeat the same pattern for products
5. repeat the same pattern for staff resources

This keeps the next implementation slice small, testable, and structurally consistent with the current architecture.

## 15. Related Documents In This Folder

Current supporting docs:

- `doc/dynamic-qr-codes.md`
- `doc/schema-explained.md`
- `doc/tanstack-forms.md`

Recommended reading order for a new developer:

1. this file
2. `doc/dynamic-qr-codes.md`
3. `doc/tanstack-forms.md`
4. `schema.sql`

## 16. Source of Truth

For the current implementation, the most important files are:

- `schema.sql`
- `app/actions/qr-actions.ts`
- `app/dashboard/page.tsx`
- `app/dashboard/qr-code/page.tsx`
- `app/dashboard/organization/page.tsx`
- `app/qr/[slug]/route.ts`
- `components/qr/qr-management.tsx`
- `components/dashboard/dashboard-overview.tsx`
- `components/dashboard/organization-management.tsx`
- `forms/qr/qr-code-editor-form.tsx`
- `schemas/qr.ts`

If you are changing behavior, start there.
