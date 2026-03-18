"use client";

import { register } from "@/app/actions/auth-actions";
import {
  FormField,
  getFieldErrorMessages,
  getFormErrorMessage,
} from "@/components/forms/form-field";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import {
  emailFieldSchema,
  fullNameFieldSchema,
  passwordFieldSchema,
  registerFormOptions,
} from "@/schemas/auth";
import {
  initialFormState,
  mergeForm,
  useForm,
  useTransform,
} from "@tanstack/react-form-nextjs";
import Link from "next/link";
import * as React from "react";

type RegisterFormProps = {
  externalError?: string;
};

export function RegisterForm({ externalError }: RegisterFormProps) {
  const [state, action] = React.useActionState(register, initialFormState);
  const form = useForm({
    ...registerFormOptions,
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
      <form.Field name="full_name" validators={{ onBlur: fullNameFieldSchema }}>
        {(field) => (
          <FormField
            htmlFor={field.name}
            label="Full Name"
            errors={getFieldErrorMessages(field.state.meta.errors)}
          >
            <Input
              id={field.name}
              name={field.name}
              type="text"
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
              required
            />
          </FormField>
        )}
      </form.Field>

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
            idleText="Register"
            pendingText="Creating account..."
          />
        )}
      </form.Subscribe>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="text-primary underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
