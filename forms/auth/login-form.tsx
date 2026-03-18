"use client";

import { login } from "@/app/actions/auth-actions";
import {
  FormField,
  getFieldErrorMessages,
  getFormErrorMessage,
} from "@/components/forms/form-field";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import {
  emailFieldSchema,
  loginFormOptions,
  passwordFieldSchema,
} from "@/schemas/auth";
import {
  initialFormState,
  mergeForm,
  useForm,
  useTransform,
} from "@tanstack/react-form-nextjs";
import Link from "next/link";
import * as React from "react";

type LoginFormProps = {
  allowRegistrationLink: boolean;
  externalError?: string;
};

export function LoginForm({
  allowRegistrationLink,
  externalError,
}: LoginFormProps) {
  const [state, action] = React.useActionState(login, initialFormState);
  const form = useForm({
    ...loginFormOptions,
    transform: useTransform(
      (baseForm) => mergeForm(baseForm, state ?? initialFormState),
      [state],
    ),
  });

  const formErrors = React.useMemo(() => {
    const messages = [
      externalError,
      ...(state?.errors ?? []).map(getFormErrorMessage),
    ].filter((message): message is string => Boolean(message));

    return Array.from(new Set(messages));
  }, [externalError, state]);

  return (
    <form
      action={action as never}
      className="space-y-4"
      onSubmit={() => form.handleSubmit()}
    >
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
              type="email"
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
              required
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="password" validators={{ onBlur: passwordFieldSchema }}>
        {(field) => (
          <FormField
            htmlFor={field.name}
            label="Password"
            errors={getFieldErrorMessages(field.state.meta.errors)}
          >
            <Input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
              required
            />
          </FormField>
        )}
      </form.Field>

      {formErrors.map((error) => (
        <p key={error} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ))}

      <form.Subscribe
        selector={(formState) => [formState.canSubmit, formState.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <FormSubmitButton
            className="w-full text-white"
            disabled={!canSubmit || isSubmitting}
            idleText="Sign in"
            pendingText="Signing in..."
          />
        )}
      </form.Subscribe>

      <p className="text-center text-sm text-muted-foreground">
        <Link className="text-primary underline" href="/forgot-password">
          Forgot password?
        </Link>
      </p>

      {allowRegistrationLink ? (
        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link className="text-primary underline" href="/register">
            Create one
          </Link>
        </p>
      ) : null}
    </form>
  );
}
