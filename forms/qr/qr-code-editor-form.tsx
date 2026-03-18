"use client";

import { createQRCode, updateQRCode } from "@/app/actions/qr-actions";
import {
  FormField,
  getFieldErrorMessages,
  getFormErrorMessage,
} from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { appToast } from "@/lib/toast";
import {
  type BusinessUnitRecord,
  type DestinationTypeRecord,
  type QRCodeRecord,
} from "@/lib/types/inventory";
import { cn } from "@/lib/utils";
import {
  getQRCodeFormValues,
  qrBusinessUnitFieldSchema,
  qrDestinationFieldSchema,
  qrDestinationTypeFieldSchema,
  qrFormSchema,
  qrSlugFieldSchema,
  qrTitleFieldSchema,
  toQRCodeInput,
} from "@/schemas/qr";
import { useForm } from "@tanstack/react-form";
import * as React from "react";

type QRCodeEditorFormProps = {
  businessUnits: BusinessUnitRecord[];
  destinationTypes: DestinationTypeRecord[];
  onClose: () => void;
  onSaved: (qrCode: QRCodeRecord) => void;
  qrCode: QRCodeRecord | null;
};

export function QRCodeEditorForm({
  businessUnits,
  destinationTypes,
  onClose,
  onSaved,
  qrCode,
}: QRCodeEditorFormProps) {
  const form = useForm({
    defaultValues: getQRCodeFormValues(qrCode),
    validators: {
      onSubmit: qrFormSchema,
    },
    onSubmit: async ({ value }) => {
      const result = qrCode
        ? await updateQRCode(qrCode.id, toQRCodeInput(value))
        : await createQRCode(toQRCodeInput(value));

      if (!result.success || !result.qrCode) {
        appToast.error(
          qrCode ? "Failed to update QR code" : "Failed to create QR code",
          {
            description: result.error ?? "Try again in a moment.",
          },
        );
        return;
      }

      onSaved(result.qrCode);
      onClose();
      appToast.success(qrCode ? "QR code updated" : "QR code created", {
        description: `/${result.qrCode.slug} is ready to print and share.`,
      });
    },
  });

  React.useEffect(() => {
    form.reset(getQRCodeFormValues(qrCode));
  }, [form, qrCode]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="title" validators={{ onBlur: qrTitleFieldSchema }}>
        {(field) => (
          <FormField
            htmlFor={field.name}
            label="Title*"
            description="Use a business-friendly label so admins can identify the QR code quickly."
            errors={getFieldErrorMessages(field.state.meta.errors)}
          >
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Staff lunch menu"
              aria-invalid={field.state.meta.errors.length > 0}
              required
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="slug" validators={{ onBlur: qrSlugFieldSchema }}>
        {(field) => (
          <FormField
            htmlFor={field.name}
            label="Slug*"
            description="Lowercase letters, numbers, and hyphens only. This becomes the public path under /qr/."
            errors={getFieldErrorMessages(field.state.meta.errors)}
          >
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="residence-hall"
              aria-invalid={field.state.meta.errors.length > 0}
              required
            />
          </FormField>
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field
          name="business_unit_id"
          validators={{ onBlur: qrBusinessUnitFieldSchema }}
        >
          {(field) => (
            <FormField
              htmlFor={field.name}
              label="Business unit*"
              description="Assign this QR code to the arm of the company that owns it."
              errors={getFieldErrorMessages(field.state.meta.errors)}
            >
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(String(value))}
              >
                <SelectTrigger className="w-full">
                  <span
                    className={cn(
                      "flex flex-1 text-left text-sm",
                      !field.state.value && "text-muted-foreground",
                    )}
                  >
                    {field.state.value
                      ? (businessUnits.find((bu) => bu.id === field.state.value)
                          ?.name ?? field.state.value)
                      : "Select a business unit"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {businessUnits.map((businessUnit) => (
                    <SelectItem key={businessUnit.id} value={businessUnit.id}>
                      {businessUnit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>

        <form.Field
          name="destination_type"
          validators={{ onBlur: qrDestinationTypeFieldSchema }}
        >
          {(field) => (
            <FormField
              htmlFor={field.name}
              label="Destination type*"
              description="Classify what this QR code is meant to open."
              errors={getFieldErrorMessages(field.state.meta.errors)}
            >
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(
                    String(value) as QRCodeRecord["destination_type"],
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <span
                    className={cn(
                      "flex flex-1 text-left text-sm",
                      !field.state.value && "text-muted-foreground",
                    )}
                  >
                    {field.state.value
                      ? (destinationTypes.find(
                          (dt) => dt.slug === field.state.value,
                        )?.name ?? field.state.value)
                      : "Select a destination type"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {destinationTypes.map((destinationType) => (
                    <SelectItem
                      key={destinationType.id}
                      value={destinationType.slug}
                    >
                      {destinationType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field
        name="destination_url"
        validators={{ onBlur: qrDestinationFieldSchema }}
      >
        {(field) => (
          <FormField
            htmlFor={field.name}
            label="Destination URL*"
            description="This is still the live redirect target until internal menu, product, and staff resource modules are introduced."
            errors={getFieldErrorMessages(field.state.meta.errors)}
          >
            <Input
              id={field.name}
              name={field.name}
              type="url"
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="https://example.com/menu"
              aria-invalid={field.state.meta.errors.length > 0}
              required
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <FormField
            htmlFor={field.name}
            label="Description"
            errors={getFieldErrorMessages(field.state.meta.errors)}
          >
            <Textarea
              id={field.name}
              name={field.name}
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Main Project or Residence Hall QR code"
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="is_active">
        {(field) => (
          <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Active redirect</p>
              <p className="text-xs text-muted-foreground">
                Inactive QR codes stop redirecting until re-enabled.
              </p>
            </div>
            <Switch
              checked={field.state.value}
              onCheckedChange={(checked) =>
                field.handleChange(Boolean(checked))
              }
            />
          </label>
        )}
      </form.Field>

      <form.Subscribe
        selector={(formState) => ({
          errors: formState.errors,
          isSubmitting: formState.isSubmitting,
          canSubmit: formState.canSubmit,
        })}
      >
        {({ errors, isSubmitting, canSubmit }) => (
          <>
            {errors
              .map(getFormErrorMessage)
              .filter((error): error is string => Boolean(error))
              .map((error) => (
                <p
                  key={error}
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ))}

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <FormSubmitButton
                className="text-white"
                disabled={!canSubmit || isSubmitting}
                idleText={qrCode ? "Save changes" : "Create QR code"}
                pendingText={qrCode ? "Saving..." : "Creating..."}
              />
            </div>
          </>
        )}
      </form.Subscribe>
    </form>
  );
}
