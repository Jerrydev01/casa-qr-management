# TanStack Form Guide

This project uses TanStack Form as the main form state and validation layer.

The goal of the setup is simple:

- keep form schemas in one place
- keep rendered form components in one place
- keep shared field UI reusable
- keep the existing shadcn input components
- support both Next.js server-action forms and client-only forms

## Folder Structure

The current structure is:

```text
schemas/
forms/
components/forms/
```

What each folder is for:

- `schemas/`: form schemas, default values, and form option definitions
- `forms/`: concrete form components used by pages, dialogs, and modals
- `components/forms/`: reusable presentation helpers such as shared field chrome

Examples in this repo:

- `schemas/auth.ts`
- `schemas/qr.ts`
- `schemas/inventory.ts`
- `forms/auth/login-form.tsx`
- `forms/auth/register-form.tsx`
- `forms/auth/forgot-password-form.tsx`
- `forms/auth/reset-password-form.tsx`
- `forms/qr/qr-code-editor-form.tsx`
- `forms/inventory/edit-item-form.tsx`
- `components/forms/form-field.tsx`

## Core Idea

Each form is split into three layers:

1. Schema layer

This lives in `schemas/*` and defines:

- the Zod schema
- default values for the form
- the TypeScript value type

2. Form component layer

This lives in `forms/*` and defines:

- the TanStack Form hook setup
- field rendering
- submit behavior
- local form-specific side effects such as toasts or reset behavior

3. Page or dialog wrapper layer

This stays close to the route or modal and only handles:

- fetching data
- layout or card shells
- dialog open/close state
- passing props into the form component

This keeps pages thin and prevents validation logic from being scattered across route files.

## Shared Field Wrapper

The shared field wrapper is `components/forms/form-field.tsx`.

It does three things:

- renders the label
- renders optional helper text
- renders field-level error messages in a consistent way

It also exports two helpers:

- `getFieldErrorMessages()`
- `getFormErrorMessage()`

Use them whenever a TanStack field or form state may contain non-string error objects.

This matters because TanStack Form can store errors as strings, objects, or `Error` instances depending on the validator.

## Validation Strategy

This codebase uses Zod directly with TanStack Form.

Important note:

- `@tanstack/zod-form-adapter` is not used here
- the repo already uses Zod 4
- the published adapter version currently peers against Zod 3

TanStack Form already supports standard-schema validation, so plain Zod schemas work without the adapter.

> **Zod 4 — always set `{ error: "..." }` on `z.string()`:** when a field value
> arrives as `undefined` (e.g. a field that was never touched before server
> validation runs), Zod 4 fires the type-level check first and emits its
> built-in "Invalid input: expected string, received undefined" message before
> any `.min()` / `.email()` / `.regex()` message is reached. Pass the user-
> friendly message as the first argument to override that type-check error:
>
> ```ts
> // correct — overrides the type-check error message
> export const emailFieldSchema = z
>   .string({ error: "Enter a valid email address." })
>   .email("Enter a valid email address.");
>
> // wrong — undefined field shows "Invalid input: expected string, received undefined"
> export const emailFieldSchema = z
>   .string()
>   .email("Enter a valid email address.");
> ```

Typical pattern:

```ts
export const loginSchema = z.object({
  email: emailFieldSchema,
  password: passwordFieldSchema,
});
```

Then in the form component:

```ts
const form = useForm({
  ...loginFormOptions,
  validators: {
    onSubmit: loginSchema,
  },
});
```

Or for individual fields:

```ts
<form.Field name="email" validators={{ onBlur: emailFieldSchema }}>
```

## Two Form Patterns In This Repo

There are two real patterns in the app.

### 1. Next.js Server-Action Forms

Use this for route-level forms that submit through App Router server actions.

Current examples:

- auth forms in `forms/auth/*`

This pattern uses:

- `@tanstack/react-form-nextjs`
- `formOptions()` in the schema file
- `createServerValidate()` in the server action file
- `useActionState()` in the client form component
- `mergeForm()` plus `useTransform()` to merge server validation state back into the client form

Flow:

1. The schema file defines `formOptions()` and the Zod schema.
2. The server action validates `FormData` with `createServerValidate()`.
3. If validation fails, the action returns `error.formState`.
4. The client form uses `useActionState()` to receive that returned state.
5. `mergeForm()` merges server-side errors and values back into the TanStack Form instance.
6. The user sees errors in place without losing typed values.

Example from `app/actions/auth-actions.ts`:

```ts
const validateLogin = createServerValidate({
  ...loginFormOptions,
  onServerValidate: loginSchema,
});
```

And in the client form:

```ts
const [state, action] = React.useActionState(login, initialFormState);

const form = useForm({
  ...loginFormOptions,
  transform: useTransform(
    (baseForm) => mergeForm(baseForm, state ?? initialFormState),
    [state],
  ),
});
```

### 2. Client-Only Mutation Forms

Use this for dialogs and modals that call async functions directly instead of posting to a server action through `<form action=...>`.

Current examples:

- `forms/qr/qr-code-editor-form.tsx`
- `forms/inventory/edit-item-form.tsx`

This pattern uses:

- `@tanstack/react-form`
- `useForm()` with `validators.onSubmit`
- async `onSubmit` that calls existing action functions
- local `form.reset()` when props change

Flow:

1. The form is initialized from props.
2. Field validation runs on blur or submit.
3. On submit, the form builds the payload and calls the existing async mutation.
4. Success and failure feedback is shown with toasts.
5. The modal or dialog stays in control of open and close state.

Example shape:

```ts
const form = useForm({
  defaultValues: getQRCodeFormValues(qrCode),
  validators: {
    onSubmit: qrFormSchema,
  },
  onSubmit: async ({ value }) => {
    // call mutation
  },
});
```

## Why We Still Use Existing shadcn Inputs

TanStack Form is only the form state and validation layer.

The actual UI controls still come from the existing component library in `components/ui/`.

Examples:

- `Input`
- `Textarea`
- `Select`
- `Switch`
- `Checkbox`
- `ImageUpload`

That means form migration does not require redesigning the UI kit.

The pattern is:

```tsx
<form.Field name="email" validators={{ onBlur: emailFieldSchema }}>
  {(field) => (
    <FormField
      htmlFor={field.name}
      label="Email"
      errors={getFieldErrorMessages(field.state.meta.errors)}
    >
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </FormField>
  )}
</form.Field>
```

> **Important:** always use `value={field.state.value ?? ""}` on string inputs,
> not `value={field.state.value}`. During `form.reset()` and `mergeForm()`
> transitions, a field can briefly be `undefined`. Without the fallback React
> sees the input switch from controlled to uncontrolled and logs a warning.

> **Duplicate error keys:** `getFieldErrorMessages()` deduplicates the returned
> array internally. This prevents React duplicate-key warnings that occur when
> both an `onBlur` field validator and an `onSubmit` form validator produce the
> same message for the same field at the same time.

## Current Production Coverage

Forms already migrated to TanStack Form:

- login
- register
- forgot password
- reset password
- QR code create and edit dialog
- inventory edit item modal

Forms intentionally not migrated yet:

- demo and sample forms in `components/component-example.tsx`
- demo and inline table forms in `components/data-table.tsx`
- simple logout submit in `components/nav-user.tsx`

Those are not part of the current production form architecture.

## How A Field Works

A field in this codebase usually has four pieces:

1. `form.Field`

This binds a field name and optional validators.

2. `FormField`

This provides the shared label, helper text, and error rendering.

3. Existing UI control

Usually `Input`, `Textarea`, `Select`, or another existing component.

4. TanStack handlers

The value and events are wired from the field API:

- `field.state.value`
- `field.handleChange(...)`
- `field.handleBlur()`

## How Submit State Works

Buttons should be rendered with `form.Subscribe` so the UI reacts to submit state without re-rendering everything unnecessarily.

Typical pattern:

```tsx
<form.Subscribe
  selector={(formState) => ({
    canSubmit: formState.canSubmit,
    isSubmitting: formState.isSubmitting,
  })}
>
  {({ canSubmit, isSubmitting }) => (
    <Button disabled={!canSubmit || isSubmitting} type="submit">
      {isSubmitting ? "Saving..." : "Save"}
    </Button>
  )}
</form.Subscribe>
```

> **Important:** always return an **object** from the selector, never an array.
> When the selector returns an array, TypeScript infers each destructured item
> as the union of all element types. This causes type errors because booleans
> and error arrays all collapse into the same union type.

Use this for:

- disabling submit while the form is invalid
- showing pending button text
- avoiding duplicate submissions

## How Server Errors Work

For server-action forms, server validation and mutation errors are returned as form state instead of only being pushed into the URL.

This is why auth actions return objects like:

```ts
return {
  errorMap: {
    onServer: message,
  },
  values,
  errors: [message],
};
```

The client form then reads these with:

- `state?.errors`
- `mergeForm()`

This preserves input values and displays the error in place.

## How Resetting Works

Client-only modal forms often need to reset when the selected record changes or when the dialog opens.

Pattern used here:

```ts
React.useEffect(() => {
  if (!open) {
    return;
  }

  form.reset(getInventoryEditFormValues(item));
}, [form, item, open]);
```

This avoids stale form state when the same modal is reused for a different item or QR code.

## How To Add A New Form

Use this checklist.

### If it is a route form using a server action

1. Add a schema and `formOptions()` to `schemas/<feature>.ts`.
2. Add a `createServerValidate()` instance in the server action file.
3. Return `error.formState` on validation failure.
4. Return a TanStack-compatible error state for server-side mutation failures.
5. Create a client form component in `forms/<feature>/...`.
6. Use `useActionState()`, `useForm()`, `mergeForm()`, and `useTransform()`.
7. Keep the page file thin and render the form component there.

### If it is a modal or client-only form

1. Add a schema in `schemas/<feature>.ts`.
2. Create a form component in `forms/<feature>/...`.
3. Use `useForm()` from `@tanstack/react-form`.
4. Put validation in `validators.onSubmit` and field-level blur validators where useful.
5. Call the existing mutation function inside `onSubmit`.
6. Use `form.reset()` when the source record changes.
7. Keep modal open state outside the form component.

## Conventions To Keep

When adding more forms, follow these repo-specific conventions:

- keep schemas at the root `schemas/` level, not beside each page
- keep final form components in `forms/`
- keep field presentation shared through `components/forms/form-field.tsx`
- use existing shadcn UI components instead of introducing a second input library
- prefer thin route files and thin modal shells
- use Zod directly with TanStack Form
- use `form.Subscribe` for submit buttons and other small reactive slices

## Common Mistakes To Avoid

- Do not put form schemas directly inside pages unless there is a strong reason.
- Do not put large business mutation logic inside route components.
- Do not replace existing UI controls just to use TanStack Form.
- Do not use URL query params as the primary error channel for new forms when form state can be returned directly.
- Do not mix unrelated modal open-state logic into schema files.

## Related Files

The main reference files for this setup are:

- `schemas/auth.ts`
- `schemas/qr.ts`
- `schemas/inventory.ts`
- `components/forms/form-field.tsx`
- `app/actions/auth-actions.ts`
- `forms/auth/login-form.tsx`
- `forms/qr/qr-code-editor-form.tsx`
- `forms/inventory/edit-item-form.tsx`

If you need a starting point for a new form, copy the closest example from those files rather than inventing a new pattern.
