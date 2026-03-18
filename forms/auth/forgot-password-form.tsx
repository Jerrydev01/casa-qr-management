"use client";

import { requestPasswordReset } from "@/app/actions/auth-actions";
import {
  FormField,
  getFieldErrorMessages,
  getFormErrorMessage,
} from "@/components/forms/form-field";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { emailFieldSchema, forgotPasswordFormOptions } from "@/schemas/auth";
import {
  initialFormState,
  mergeForm,
  useForm,
  useTransform,
} from "@tanstack/react-form-nextjs";
import Link from "next/link";
import * as React from "react";

type ForgotPasswordFormProps = {
  externalError?: string;
  success?: string;
};

export function ForgotPasswordForm({
  externalError,
  success,
}: ForgotPasswordFormProps) {
  const [state, action] = React.useActionState(
    requestPasswordReset,
    initialFormState,
  );
  const form = useForm({
    ...forgotPasswordFormOptions,
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

      {formErrors.map((error) => (
        <p key={error} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ))}

      {success ? (
        <p className="text-sm text-foreground" role="status">
          {success}
        </p>
      ) : null}

      <form.Subscribe
        selector={(formState) => [formState.canSubmit, formState.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <FormSubmitButton
            className="w-full text-white"
            disabled={!canSubmit || isSubmitting}
            idleText="Send reset link"
            pendingText="Sending link..."
          />
        )}
      </form.Subscribe>

      <p className="text-center text-sm text-muted-foreground">
        Back to{" "}
        <Link className="text-primary underline" href="/login">
          sign in
        </Link>
      </p>
    </form>
  );
}
