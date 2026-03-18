# Kitchen CMS Schema Guide

This document explains `schema.sql` in plain terms, including role behavior, menu pricing models, and seed data.

## 1) Overview

The schema is built for a menu management CMS with:

- Authenticated users (`auth.users`) mirrored into `public.profiles`
- Role-based access (`admin`, `staff`)
- Menu catalog (`menu_categories`, `menu_items`)
- Flexible pricing (`fixed`, `variable`, `tbd`)
- Addons and item-addon mapping
- Price audit logs for accountability

## 2) Core Tables

### `public.profiles`

- One row per authenticated user (`id` references `auth.users.id`)
- Stores `email`, `full_name`, `role`, and the selected `kitchen_id`
- Role is constrained to `admin` or `staff`

### `public.kitchens`

- Stores the list of kitchens/branches available in the CMS
- Signup can read active kitchens before authentication so new users can pick one

### `public.menu_categories`

- Category taxonomy for menu items (Breakfast, Pasta, etc.)
- `sort_order` controls display order
- `is_active` allows soft deactivation

### `public.menu_items`

- Main menu records (name, description, sku)
- Belongs to a category (`category_id`)
- Pricing is controlled by:
  - `price_mode = 'fixed'` -> `price_amount` must be set and > 0
  - `price_mode = 'variable'` -> `price_amount` must be null (use price options)
  - `price_mode = 'tbd'` -> `price_amount` must be null
- Visibility controls:
  - `is_active` for operational availability
  - `is_visible` for display in public-facing contexts

### `public.menu_item_price_options`

- Child table for variable-price menu items
- Example: side portions (`Single`, `4 Pax`, `6 Pax`)
- Includes `sort_order` and `is_active`

### `public.menu_addons`

- Reusable addon definitions (e.g., milk options, breakfast options)

### `public.menu_item_addons`

- Many-to-many bridge between `menu_items` and `menu_addons`
- Allows each item to attach zero or more addons

### `public.menu_item_images`

- Optional image gallery table for items (separate from `menu_items.image_url`)

### `public.price_audit_logs`

- Tracks price changes:
  - `item_id`
  - `old_price`
  - `new_price`
  - `user_id`
  - optional `reason`

## 3) Price Model (`menu_price_mode`)

Enum values:

- `fixed`: one concrete amount in `menu_items.price_amount`
- `variable`: item has options in `menu_item_price_options`
- `tbd`: no price yet

`menu_items_price_consistency` check constraint enforces these rules at DB level.

## 4) Role and RLS Behavior

RLS is enabled on all public tables in this schema.

### Helper Function

- `public.is_admin()` checks `profiles` for the current `auth.uid()` role.

### Profiles Policies

- Users can read their own profile
- Users can update their own profile (with role locked to `staff` via policy check)
- Admins have full access to profiles

### Menu Policies

- Admins: full CRUD on menu tables, addons, and price logs
- Staff: read access to active menu/category/price-option data and read access to price logs

## 5) Triggers and Functions

### `handle_new_user()`

- Auto-creates/updates a `profiles` row when a new auth user is inserted.
- Copies `full_name` and `kitchen_id` from `raw_user_meta_data` into `public.profiles`.

### `handle_updated_at()`

- Auto-updates `updated_at` on category/item/price-option/addon tables.

## 6) Seed Data

The seed section populates:

- Full CASA categories
- CASA items (including `tbd` items)
- Variable side pricing options
- Addons and selection lists (for example breakfast hot plate options, `Softies` selections, coffee add-ons, and Casa Tropicana fruit picks)
- Initial option mappings to the relevant parent menu items

## 7) Convenience Views

- `public.v_menu_full` exposes the landing-page friendly menu payload.
- It includes both the original item columns and aliased fields like `item_name`, `item_description`, and `item_sku`.
- It also aggregates `price_options` and `addons` as JSON arrays so selection-based menu entries can be rendered without extra joins.

## 8) Important Operational Notes

- If you rerun `schema.sql`, it is mostly idempotent (`if not exists`, `on conflict`, policy drops before recreation).
- Role correctness depends on `profiles` row availability for each user.
- App-side admin checks and DB-side RLS should both be considered required for defense-in-depth.

## 9) Quick Verification Queries

Check your own profile role:

```sql
select id, email, role
from public.profiles
where id = auth.uid();
```

See an item with addons:

```sql
select i.name, a.name as addon_name, a.price
from public.menu_items i
left join public.menu_item_addons mia on mia.item_id = i.id
left join public.menu_addons a on a.id = mia.addon_id
where i.sku = 'BREAKFAST-001';
```

See the full landing payload for selection-based items:

```sql
select category_name, item_name, price_mode, price_amount, price_options, addons
from public.v_menu_full
where kitchen_slug = 'cenare-wuse-kitchen'
  and item_sku in ('BREAKFAST-001', 'SD-002', 'FJ-006');
```

See variable pricing options:

```sql
select i.name, o.label, o.price_amount
from public.menu_items i
join public.menu_item_price_options o on o.item_id = i.id
where i.price_mode = 'variable'
order by i.name, o.sort_order;
```
