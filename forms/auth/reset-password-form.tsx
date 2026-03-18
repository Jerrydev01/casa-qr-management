"use client";

import { updatePassword } from "@/app/actions/auth-actions";
import {
  FormField,
  getFieldErrorMessages,
  getFormErrorMessage,
} from "@/components/forms/form-field";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import {
  passwordFieldSchema,
  resetPasswordFormOptions,
  resetPasswordSchema,
} from "@/schemas/auth";
import {
  initialFormState,
  mergeForm,
  useForm,
  useTransform,
} from "@tanstack/react-form-nextjs";
import * as React from "react";

type ResetPasswordFormProps = {
  externalError?: string;
};

export function ResetPasswordForm({ externalError }: ResetPasswordFormProps) {
  const [state, action] = React.useActionState(
    updatePassword,
    initialFormState,
  );
  const form = useForm({
    ...resetPasswordFormOptions,
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
      <form.Field name="password" validators={{ onBlur: passwordFieldSchema }}>
        {(field) => (
          <FormField
            htmlFor={field.name}
            label="New password"
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
              // required
            />
          </FormField>
        )}
      </form.Field>

      <form.Field
        name="confirmPassword"
        validators={{ onBlur: resetPasswordSchema.shape.confirmPassword }}
      >
        {(field) => (
          <FormField
            htmlFor={field.name}
            label="Confirm password"
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
        selector={(formState) => ({
          canSubmit: formState.canSubmit,
          isSubmitting: formState.isSubmitting,
          values: formState.values,
        })}
      >
        {({ canSubmit, isSubmitting, values }) => {
          const passwordsMatch = values.password === values.confirmPassword;

          return (
            <FormSubmitButton
              className="w-full"
              disabled={!canSubmit || !passwordsMatch}
              idleText="Update password"
              pendingText="Updating password..."
            />
          );
        }}
      </form.Subscribe>
    </form>
  );
}
