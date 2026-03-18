import { formOptions } from "@tanstack/react-form-nextjs";
import { z } from "zod";

export const emailFieldSchema = z
  .string({ error: "Enter a valid email address." })
  .email("Enter a valid email address.");

export const passwordFieldSchema = z
  .string({ error: "Password must be at least 6 characters." })
  .min(6, "Password must be at least 6 characters.");

export const fullNameFieldSchema = z
  .string({ error: "Full name is required." })
  .min(1, "Full name is required.");

export const loginSchema = z.object({
  email: emailFieldSchema,
  password: passwordFieldSchema,
});

export const registerSchema = z.object({
  full_name: fullNameFieldSchema,
  email: emailFieldSchema,
  password: passwordFieldSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailFieldSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordFieldSchema,
    confirmPassword: passwordFieldSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginFormOptions = formOptions({
  defaultValues: {
    email: "",
    password: "",
  },
});

export const registerFormOptions = formOptions({
  defaultValues: {
    full_name: "",
    email: "",
    password: "",
  },
});

export const forgotPasswordFormOptions = formOptions({
  defaultValues: {
    email: "",
  },
});

export const resetPasswordFormOptions = formOptions({
  defaultValues: {
    password: "",
    confirmPassword: "",
  },
});

export type LoginFormValues = z.input<typeof loginSchema>;
export type RegisterFormValues = z.input<typeof registerSchema>;
export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;
