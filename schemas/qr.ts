import type { QRCodeInput, QRCodeRecord } from "@/lib/types/inventory";
import { z } from "zod";

export const qrTitleFieldSchema = z
  .string({ error: "Title is required." })
  .trim()
  .min(1, "Title is required.")
  .max(80, "Title must be 80 characters or less.");

export const qrSlugFieldSchema = z
  .string({
    error: "Slug can only contain lowercase letters, numbers, and hyphens.",
  })
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug can only contain lowercase letters, numbers, and hyphens.",
  );

export const qrDestinationFieldSchema = z
  .string({ error: "Destination URL is required." })
  .superRefine((value, ctx) => {
    if (!value || value.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination URL is required.",
        fatal: true,
      });
      return z.NEVER;
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination URL must be a valid absolute URL.",
        fatal: true,
      });
      return z.NEVER;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination URL must start with http:// or https://.",
      });
    }
  });

export const qrBusinessUnitFieldSchema = z
  .string({ error: "Business unit is required." })
  .trim()
  .min(1, "Business unit is required.");

export const qrDestinationTypeFieldSchema = z
  .string({ error: "Destination type is required." })
  .trim()
  .min(1, "Destination type is required.");

export const qrFormSchema = z.object({
  title: qrTitleFieldSchema,
  slug: qrSlugFieldSchema,
  business_unit_id: qrBusinessUnitFieldSchema,
  destination_type: qrDestinationTypeFieldSchema,
  destination_url: qrDestinationFieldSchema,
  description: z.string(),
  is_active: z.boolean(),
});

export type QRFormValues = z.input<typeof qrFormSchema>;

export function getQRCodeFormValues(qrCode: QRCodeRecord | null): QRFormValues {
  return {
    title: qrCode?.title ?? "",
    slug: qrCode?.slug ?? "",
    business_unit_id: qrCode?.business_unit_id ?? "",
    destination_type: qrCode?.destination_type ?? "external_link",
    destination_url: qrCode?.destination_url ?? "",
    description: qrCode?.description ?? "",
    is_active: qrCode?.is_active ?? true,
  };
}

export function toQRCodeInput(values: QRFormValues): QRCodeInput {
  return {
    title: values.title,
    slug: values.slug,
    business_unit_id: values.business_unit_id,
    destination_type: values.destination_type,
    destination_url: values.destination_url,
    description: values.description,
    is_active: values.is_active,
  };
}
