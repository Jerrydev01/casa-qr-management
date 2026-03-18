"use server";

import { createActionClient } from "@/lib/supabase/action";
import {
  forgotPasswordFormOptions,
  forgotPasswordSchema,
  loginFormOptions,
  loginSchema,
  registerFormOptions,
  registerSchema,
  resetPasswordFormOptions,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type LoginFormValues,
  type RegisterFormValues,
  type ResetPasswordFormValues,
} from "@/schemas/auth";
import {
  ServerValidateError,
  createServerValidate,
} from "@tanstack/react-form-nextjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const validateLogin = createServerValidate({
  ...loginFormOptions,
  onServerValidate: loginSchema,
});

const validateRegister = createServerValidate({
  ...registerFormOptions,
  onServerValidate: registerSchema,
});

const validateForgotPassword = createServerValidate({
  ...forgotPasswordFormOptions,
  onServerValidate: forgotPasswordSchema,
});

const validateResetPassword = createServerValidate({
  ...resetPasswordFormOptions,
  onServerValidate: resetPasswordSchema,
});

function toFormErrorState<TValues>(values: TValues, message: string) {
  return {
    errorMap: {
      onServer: message,
    },
    values,
    errors: [message],
  };
}

async function getBaseUrl() {
  const headerList = await headers();
  const origin = headerList.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export async function login(_prevState: unknown, formData: FormData) {
  let values: LoginFormValues;

  try {
    values = await validateLogin(formData);
  } catch (error) {
    if (error instanceof ServerValidateError) {
      return error.formState;
    }

    throw error;
  }

  const email = values.email.trim().toLowerCase();
  const password = values.password;

  const supabase = await createActionClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return toFormErrorState(values, error.message);
  }

  redirect("/dashboard");
}

export async function register(_prevState: unknown, formData: FormData) {
  let values: RegisterFormValues;

  try {
    values = await validateRegister(formData);
  } catch (error) {
    if (error instanceof ServerValidateError) {
      return error.formState;
    }

    throw error;
  }

  const email = values.email.trim().toLowerCase();
  const password = values.password;
  const fullName = values.full_name.trim();

  const supabase = await createActionClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return toFormErrorState(values, error.message);
  }

  redirect("/dashboard");
}

export async function requestPasswordReset(
  _prevState: unknown,
  formData: FormData,
) {
  let values: ForgotPasswordFormValues;

  try {
    values = await validateForgotPassword(formData);
  } catch (error) {
    if (error instanceof ServerValidateError) {
      return error.formState;
    }

    throw error;
  }

  const normalizedEmail = values.email.trim().toLowerCase();

  const supabase = await createActionClient();
  const baseUrl = await getBaseUrl();
  const callbackUrl = `${baseUrl}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: callbackUrl,
  });

  if (error) {
    return toFormErrorState(values, error.message);
  }

  redirect(
    `/forgot-password?success=${encodeURIComponent("Check your email for a reset link.")}`,
  );
}

export async function updatePassword(_prevState: unknown, formData: FormData) {
  let values: ResetPasswordFormValues;

  try {
    values = await validateResetPassword(formData);
  } catch (error) {
    if (error instanceof ServerValidateError) {
      return error.formState;
    }

    throw error;
  }

  const password = values.password;

  const supabase = await createActionClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return toFormErrorState(values, error.message);
  }

  redirect(
    `/dashboard?success=${encodeURIComponent("Password updated successfully.")}`,
  );
}

export async function logout() {
  const supabase = await createActionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
