import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import * as React from "react";

function normalizeErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : null;
  }

  return null;
}

export function getFormErrorMessage(error: unknown): string | null {
  return normalizeErrorMessage(error);
}

export function getFieldErrorMessages(errors: unknown[] | undefined): string[] {
  return Array.from(
    new Set(
      (errors ?? [])
        .map(normalizeErrorMessage)
        .filter((message): message is string => Boolean(message)),
    ),
  );
}

type FormFieldProps = {
  children: React.ReactNode;
  description?: string;
  errors?: string[];
  htmlFor: string;
  label: string;
  className?: string;
};

export function FormField({
  children,
  description,
  errors = [],
  htmlFor,
  label,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {errors.map((error) => (
        <p
          key={error}
          className="text-sm text-destructive flex gap-1 items-center"
          role="alert"
        >
          {error}
        </p>
      ))}
    </div>
  );
}
