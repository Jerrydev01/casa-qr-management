"use client";

import {
  createBusinessUnit,
  createDestinationType,
  deleteBusinessUnit,
  deleteDestinationType,
  toggleBusinessUnitActive,
  toggleDestinationTypeActive,
  updateBusinessUnit,
  updateDestinationType,
} from "@/app/actions/qr-actions";
import { DeleteModal } from "@/components/custom/DeleteModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { appToast } from "@/lib/toast";
import type {
  BusinessUnitInput,
  BusinessUnitRecord,
  DestinationTypeInput,
  DestinationTypeRecord,
  UserProfile,
} from "@/lib/types/inventory";
import {
  AddCircleHalfDotIcon,
  Delete02Icon,
  Edit02Icon,
  WorkflowCircle06Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

type EditableReference = {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
};

function toEditableReference(
  item: BusinessUnitRecord | DestinationTypeRecord | null,
): EditableReference {
  return {
    name: item?.name ?? "",
    slug: item?.slug ?? "",
    description: item?.description ?? "",
    is_active: item?.is_active ?? true,
  };
}

function ReferenceEditorDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue: EditableReference;
  onSubmit: (value: EditableReference) => Promise<void>;
}) {
  const [formValue, setFormValue] = React.useState(initialValue);
  const [isSubmitting, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setFormValue(initialValue);
  }, [initialValue, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              await onSubmit(formValue);
            });
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="reference-name">
              Name
            </label>
            <Input
              id="reference-name"
              value={formValue.name}
              onChange={(event) =>
                setFormValue((previousValue) => ({
                  ...previousValue,
                  name: event.target.value,
                }))
              }
              placeholder="Operations"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="reference-slug">
              Slug
            </label>
            <Input
              id="reference-slug"
              value={formValue.slug}
              onChange={(event) =>
                setFormValue((previousValue) => ({
                  ...previousValue,
                  slug: event.target.value,
                }))
              }
              placeholder="operations"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="reference-description"
            >
              Description
            </label>
            <Textarea
              id="reference-description"
              value={formValue.description}
              onChange={(event) =>
                setFormValue((previousValue) => ({
                  ...previousValue,
                  description: event.target.value,
                }))
              }
              placeholder="Optional internal context for admins"
            />
          </div>

          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive records stay visible in admin settings but disappear
                from active assignment lists.
              </p>
            </div>
            <input
              checked={formValue.is_active}
              className="h-4 w-4 accent-primary"
              onChange={(event) =>
                setFormValue((previousValue) => ({
                  ...previousValue,
                  is_active: event.target.checked,
                }))
              }
              type="checkbox"
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManagementSection<
  TItem extends BusinessUnitRecord | DestinationTypeRecord,
>({
  title,
  description,
  count,
  actionLabel,
  icon,
  items,
  readOnly,
  onCreate,
  onEdit,
  onToggle,
  onDelete,
}: {
  title: string;
  description: string;
  count: number;
  actionLabel: string;
  icon: React.ReactNode;
  items: TItem[];
  readOnly: boolean;
  onCreate: () => void;
  onEdit: (item: TItem) => void;
  onToggle: (item: TItem) => void;
  onDelete: (item: TItem) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
              {count}
            </Badge>
            {readOnly ? <Badge variant="outline">Read only</Badge> : null}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {!readOnly ? (
          <Button type="button" className="text-white" onClick={onCreate}>
            <HugeiconsIcon
              icon={AddCircleHalfDotIcon}
              strokeWidth={2}
              className="size-4"
            />
            {actionLabel}
          </Button>
        ) : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>/{item.slug}</TableCell>
                  <TableCell>
                    <p className="max-w-md text-sm text-muted-foreground">
                      {item.description || "No description provided."}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.is_active ? "default" : "outline"}
                      className={item.is_active ? "text-white" : ""}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {!readOnly ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onToggle(item)}
                          >
                            {item.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onEdit(item)}
                            title={`Edit ${item.name}`}
                          >
                            <HugeiconsIcon
                              icon={Edit02Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onDelete(item)}
                            title={`Delete ${item.name}`}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function OrganizationManagement({
  businessUnits: initialBusinessUnits,
  destinationTypes: initialDestinationTypes,
  profile,
}: {
  businessUnits: BusinessUnitRecord[];
  destinationTypes: DestinationTypeRecord[];
  profile: UserProfile | null;
}) {
  const [businessUnits, setBusinessUnits] =
    React.useState(initialBusinessUnits);
  const [destinationTypes, setDestinationTypes] = React.useState(
    initialDestinationTypes,
  );
  const [editingBusinessUnit, setEditingBusinessUnit] =
    React.useState<BusinessUnitRecord | null>(null);
  const [editingDestinationType, setEditingDestinationType] =
    React.useState<DestinationTypeRecord | null>(null);
  const [businessUnitDialogOpen, setBusinessUnitDialogOpen] =
    React.useState(false);
  const [destinationTypeDialogOpen, setDestinationTypeDialogOpen] =
    React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<
    | { kind: "business-unit"; item: BusinessUnitRecord }
    | { kind: "destination-type"; item: DestinationTypeRecord }
    | null
  >(null);
  const [isPending, startTransition] = React.useTransition();
  const isAdmin = profile?.role === "admin";

  React.useEffect(() => {
    setBusinessUnits(initialBusinessUnits);
  }, [initialBusinessUnits]);

  React.useEffect(() => {
    setDestinationTypes(initialDestinationTypes);
  }, [initialDestinationTypes]);

  const upsertBusinessUnit = React.useCallback(
    (businessUnit: BusinessUnitRecord) => {
      setBusinessUnits((previousItems) => {
        const exists = previousItems.some(
          (item) => item.id === businessUnit.id,
        );

        if (!exists) {
          return [...previousItems, businessUnit].sort((left, right) =>
            left.name.localeCompare(right.name),
          );
        }

        return previousItems
          .map((item) => (item.id === businessUnit.id ? businessUnit : item))
          .sort((left, right) => left.name.localeCompare(right.name));
      });
    },
    [],
  );

  const upsertDestinationType = React.useCallback(
    (destinationType: DestinationTypeRecord) => {
      setDestinationTypes((previousItems) => {
        const exists = previousItems.some(
          (item) => item.id === destinationType.id,
        );

        if (!exists) {
          return [...previousItems, destinationType].sort((left, right) =>
            left.name.localeCompare(right.name),
          );
        }

        return previousItems
          .map((item) =>
            item.id === destinationType.id ? destinationType : item,
          )
          .sort((left, right) => left.name.localeCompare(right.name));
      });
    },
    [],
  );

  const submitBusinessUnit = async (value: EditableReference) => {
    const payload: BusinessUnitInput = {
      name: value.name,
      slug: value.slug,
      description: value.description,
      is_active: value.is_active,
    };

    const result = editingBusinessUnit
      ? await updateBusinessUnit(editingBusinessUnit.id, payload)
      : await createBusinessUnit(payload);

    if (!result.success || !result.businessUnit) {
      appToast.error(
        editingBusinessUnit
          ? "Failed to update business unit"
          : "Failed to create business unit",
        {
          description: result.error ?? "Try again in a moment.",
        },
      );
      return;
    }

    upsertBusinessUnit(result.businessUnit);
    setBusinessUnitDialogOpen(false);
    setEditingBusinessUnit(null);
    appToast.success(
      editingBusinessUnit ? "Business unit updated" : "Business unit created",
      {
        description: result.businessUnit.name,
      },
    );
  };

  const submitDestinationType = async (value: EditableReference) => {
    const payload: DestinationTypeInput = {
      name: value.name,
      slug: value.slug,
      description: value.description,
      is_active: value.is_active,
    };

    const result = editingDestinationType
      ? await updateDestinationType(editingDestinationType.id, payload)
      : await createDestinationType(payload);

    if (!result.success || !result.destinationType) {
      appToast.error(
        editingDestinationType
          ? "Failed to update destination type"
          : "Failed to create destination type",
        {
          description: result.error ?? "Try again in a moment.",
        },
      );
      return;
    }

    upsertDestinationType(result.destinationType);
    setDestinationTypeDialogOpen(false);
    setEditingDestinationType(null);
    appToast.success(
      editingDestinationType
        ? "Destination type updated"
        : "Destination type created",
      {
        description: result.destinationType.name,
      },
    );
  };

  const handleBusinessUnitToggle = (item: BusinessUnitRecord) => {
    startTransition(async () => {
      const result = await toggleBusinessUnitActive(item.id, !item.is_active);

      if (!result.success || !result.businessUnit) {
        appToast.error("Failed to update business unit", {
          description: result.error ?? "Try again in a moment.",
        });
        return;
      }

      upsertBusinessUnit(result.businessUnit);
      appToast.success(
        result.businessUnit.is_active
          ? "Business unit activated"
          : "Business unit deactivated",
        {
          description: result.businessUnit.name,
        },
      );
    });
  };

  const handleDestinationTypeToggle = (item: DestinationTypeRecord) => {
    startTransition(async () => {
      const result = await toggleDestinationTypeActive(
        item.id,
        !item.is_active,
      );

      if (!result.success || !result.destinationType) {
        appToast.error("Failed to update destination type", {
          description: result.error ?? "Try again in a moment.",
        });
        return;
      }

      upsertDestinationType(result.destinationType);
      appToast.success(
        result.destinationType.is_active
          ? "Destination type activated"
          : "Destination type deactivated",
        {
          description: result.destinationType.name,
        },
      );
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.kind === "business-unit") {
      const result = await deleteBusinessUnit(deleteTarget.item.id);

      if (!result.success) {
        appToast.error("Failed to delete business unit", {
          description: result.error ?? "Try again in a moment.",
        });
        return;
      }

      setBusinessUnits((previousItems) =>
        previousItems.filter((item) => item.id !== deleteTarget.item.id),
      );
      appToast.success("Business unit deleted", {
        description: deleteTarget.item.name,
      });
    } else {
      const result = await deleteDestinationType(deleteTarget.item.id);

      if (!result.success) {
        appToast.error("Failed to delete destination type", {
          description: result.error ?? "Try again in a moment.",
        });
        return;
      }

      setDestinationTypes((previousItems) =>
        previousItems.filter((item) => item.id !== deleteTarget.item.id),
      );
      appToast.success("Destination type deleted", {
        description: deleteTarget.item.name,
      });
    }

    setDeleteTarget(null);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <ManagementSection
          actionLabel="New business unit"
          count={businessUnits.length}
          description="Create, rename, disable, and remove the company units that own QR assets."
          icon={
            <HugeiconsIcon
              icon={WorkflowCircle06Icon}
              strokeWidth={2}
              className="size-4"
            />
          }
          items={businessUnits}
          onCreate={() => {
            setEditingBusinessUnit(null);
            setBusinessUnitDialogOpen(true);
          }}
          onDelete={(item) => setDeleteTarget({ kind: "business-unit", item })}
          onEdit={(item) => {
            setEditingBusinessUnit(item);
            setBusinessUnitDialogOpen(true);
          }}
          onToggle={handleBusinessUnitToggle}
          readOnly={!isAdmin}
          title="Business units"
        />

        <ManagementSection
          actionLabel="New destination type"
          count={destinationTypes.length}
          description="Manage the QR categories the business can assign, such as menu, product, staff resource, and campaign."
          icon={
            <HugeiconsIcon
              icon={WorkflowCircle06Icon}
              strokeWidth={2}
              className="size-4"
            />
          }
          items={destinationTypes}
          onCreate={() => {
            setEditingDestinationType(null);
            setDestinationTypeDialogOpen(true);
          }}
          onDelete={(item) =>
            setDeleteTarget({ kind: "destination-type", item })
          }
          onEdit={(item) => {
            setEditingDestinationType(item);
            setDestinationTypeDialogOpen(true);
          }}
          onToggle={handleDestinationTypeToggle}
          readOnly={!isAdmin}
          title="Destination types"
        />
      </div>

      <ReferenceEditorDialog
        description="Business units keep different arms of the company separated without creating multiple tenants."
        initialValue={toEditableReference(editingBusinessUnit)}
        onOpenChange={(open) => {
          setBusinessUnitDialogOpen(open);
          if (!open) {
            setEditingBusinessUnit(null);
          }
        }}
        onSubmit={submitBusinessUnit}
        open={businessUnitDialogOpen}
        submitLabel={
          editingBusinessUnit ? "Save business unit" : "Create business unit"
        }
        title={
          editingBusinessUnit
            ? `Edit ${editingBusinessUnit.name}`
            : "Create business unit"
        }
      />

      <ReferenceEditorDialog
        description="Destination types control how QR codes are classified and filtered across the system."
        initialValue={toEditableReference(editingDestinationType)}
        onOpenChange={(open) => {
          setDestinationTypeDialogOpen(open);
          if (!open) {
            setEditingDestinationType(null);
          }
        }}
        onSubmit={submitDestinationType}
        open={destinationTypeDialogOpen}
        submitLabel={
          editingDestinationType
            ? "Save destination type"
            : "Create destination type"
        }
        title={
          editingDestinationType
            ? `Edit ${editingDestinationType.name}`
            : "Create destination type"
        }
      />

      <DeleteModal
        confirmText={
          deleteTarget?.kind === "business-unit"
            ? "Delete business unit"
            : "Delete destination type"
        }
        description={
          deleteTarget?.kind === "business-unit"
            ? "Delete this business unit only if it is no longer assigned to any QR code."
            : "Delete this destination type only if it is no longer assigned to any QR code."
        }
        isLoading={isPending}
        itemName={deleteTarget?.item.name}
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.kind === "business-unit"
            ? "Delete business unit"
            : "Delete destination type"
        }
      />
    </>
  );
}
