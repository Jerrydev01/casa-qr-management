"use client";

import { deleteQRCode, toggleQRCodeActive } from "@/app/actions/qr-actions";
import { TablePagination } from "@/components/custom/table-pagination";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QRCodeEditorForm } from "@/forms/qr/qr-code-editor-form";
import { appToast } from "@/lib/toast";
import {
  type BusinessUnitRecord,
  type DestinationTypeRecord,
  type QRCodeRecord,
  type UserProfile,
} from "@/lib/types/inventory";
import { cn } from "@/lib/utils";
import {
  BarChartIcon,
  Delete02Icon,
  DownloadIcon,
  Edit02Icon,
  EyeIcon,
  PlusSignIcon,
  QrCode01Icon,
  Wifi01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";
import QRCode from "react-qr-code";
import { DeleteModal } from "../custom/DeleteModal";

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDestinationTypeLabel(
  item: Pick<DestinationTypeRecord, "name"> | null,
  slug: string,
) {
  if (item?.name) {
    return item.name;
  }

  return slug
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return dateFormatter.format(parsed);
}

function buildQrUrl(qrBaseUrl: string, slug: string) {
  return `${qrBaseUrl}/qr/${slug}`;
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      {/* Hover gradient wash */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.04] bg-linear-to-br",
          gradient,
        )}
      />
      {/* Glow orb */}
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br opacity-10 blur-3xl",
          gradient,
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md",
            gradient,
          )}
        >
          {icon}
        </div>
      </div>

      <div className="relative mt-4 space-y-0.5">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function QRCodeEditorDialog({
  businessUnits,
  destinationTypes,
  open,
  onOpenChange,
  qrCode,
  onSaved,
}: {
  businessUnits: BusinessUnitRecord[];
  destinationTypes: DestinationTypeRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: QRCodeRecord | null;
  onSaved: (qrCode: QRCodeRecord) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-x-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {qrCode ? `Edit ${qrCode.slug}` : "Create a QR code"}
          </DialogTitle>
          <DialogDescription>
            The printed QR code always points to the CMS redirect URL. You can
            change the final destination later without reprinting it.
          </DialogDescription>
        </DialogHeader>
        <QRCodeEditorForm
          businessUnits={businessUnits}
          destinationTypes={destinationTypes}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
          qrCode={qrCode}
        />
      </DialogContent>
    </Dialog>
  );
}

function QRCodePreviewDialog({
  open,
  onOpenChange,
  qrCode,
  qrBaseUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: QRCodeRecord | null;
  qrBaseUrl: string;
}) {
  const qrWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const qrUrl = qrCode ? buildQrUrl(qrBaseUrl, qrCode.slug) : "";

  const getSvgMarkup = React.useCallback(() => {
    const svg = qrWrapperRef.current?.querySelector("svg");

    if (!svg) {
      throw new Error("QR code preview is not ready yet.");
    }

    return new XMLSerializer().serializeToString(svg);
  }, []);

  const copyLink = async () => {
    if (!qrUrl) return;

    try {
      await navigator.clipboard.writeText(qrUrl);
      appToast.success("QR link copied", {
        description: qrUrl,
      });
    } catch {
      appToast.error("Failed to copy link", {
        description: "Copy the URL manually from the field below.",
      });
    }
  };

  const downloadSvg = () => {
    if (!qrCode) return;

    try {
      const svgMarkup = getSvgMarkup();
      const blob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `${qrCode.slug}.svg`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      appToast.error("Download failed", {
        description:
          error instanceof Error ? error.message : "Unable to export the SVG.",
      });
    }
  };

  const downloadPng = () => {
    if (!qrCode) return;

    try {
      const svgMarkup = getSvgMarkup();
      const svgBlob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });
      const objectUrl = URL.createObjectURL(svgBlob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 1200;
        const context = canvas.getContext("2d");

        canvas.width = size;
        canvas.height = size;

        if (!context) {
          URL.revokeObjectURL(objectUrl);
          appToast.error("Download failed", {
            description: "Canvas is not available in this browser.",
          });
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, size, size);
        context.drawImage(image, 0, 0, size, size);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);

          if (!blob) {
            appToast.error("Download failed", {
              description: "Unable to render a PNG file.",
            });
            return;
          }

          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.href = pngUrl;
          link.download = `${qrCode.slug}.png`;
          link.click();
          URL.revokeObjectURL(pngUrl);
        }, "image/png");
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        appToast.error("Download failed", {
          description: "Unable to render the QR code as an image.",
        });
      };

      image.src = objectUrl;
    } catch (error) {
      appToast.error("Download failed", {
        description:
          error instanceof Error ? error.message : "Unable to export the PNG.",
      });
    }
  };

  const printQrCode = () => {
    if (!qrCode) return;

    try {
      const svgMarkup = getSvgMarkup();
      const iframe = document.createElement("iframe");

      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      document.body.appendChild(iframe);

      const printDocument = iframe.contentWindow?.document;

      if (!printDocument || !iframe.contentWindow) {
        iframe.remove();
        appToast.error("Print failed", {
          description: "Unable to open the browser print dialog.",
        });
        return;
      }

      printDocument.open();
      printDocument.write(`
        <html>
          <head>
            <title>${qrCode.slug}</title>
            <style>
              @page {
                size: auto;
                margin: 12mm;
              }
              body {
                font-family: Arial, sans-serif;
                display: flex;
                min-height: 100vh;
                margin: 0;
                align-items: center;
                justify-content: center;
                background: #ffffff;
              }
              .sheet {
                display: grid;
                gap: 16px;
                justify-items: center;
                text-align: center;
              }
              .sheet svg {
                width: 280px;
                height: 280px;
              }
            </style>
          </head>
          <body>
            <div class="sheet">
              <div>${svgMarkup}</div>
              <strong>${qrCode.slug}</strong>
            </div>
          </body>
        </html>
      `);
      printDocument.close();

      const cleanup = () => {
        window.removeEventListener("afterprint", cleanup);
        iframe.remove();
      };

      window.addEventListener("afterprint", cleanup, { once: true });

      window.setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        window.setTimeout(cleanup, 1000);
      }, 150);
    } catch (error) {
      appToast.error("Print failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to print this QR code.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{qrCode?.slug ?? "QR preview"}</DialogTitle>
          <DialogDescription>
            Print this QR code anywhere you want to send guests to the latest
            landing page for this campaign or kitchen.
          </DialogDescription>
        </DialogHeader>
        {qrCode ? (
          <div className="flex flex-col gap-6">
            <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
              <div
                ref={qrWrapperRef}
                className="mx-auto rounded-2xl border border-border bg-white p-4 shadow-xs"
              >
                <QRCode size={220} value={qrUrl} />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-public-link">Public QR URL</Label>
                  <Input id="qr-public-link" readOnly value={qrUrl} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-destination-link">Destination URL</Label>
                  <Input
                    id="qr-destination-link"
                    readOnly
                    value={qrCode.destination_url}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={copyLink} type="button" variant="outline">
                    Copy link
                  </Button>
                  <Button onClick={downloadSvg} type="button" variant="outline">
                    Download SVG
                  </Button>
                  <Button onClick={downloadPng} type="button" variant="outline">
                    <HugeiconsIcon icon={DownloadIcon} strokeWidth={2} />
                    Download PNG
                  </Button>
                  <Button
                    onClick={printQrCode}
                    type="button"
                    className={"text-white"}
                  >
                    Print QR code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function QRManagement({
  businessUnits,
  destinationTypes,
  items: initialItems,
  profile,
  qrBaseUrl,
}: {
  businessUnits: BusinessUnitRecord[];
  destinationTypes: DestinationTypeRecord[];
  items: QRCodeRecord[];
  profile: UserProfile | null;
  qrBaseUrl: string;
}) {
  const [items, setItems] = React.useState(initialItems);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = React.useState("all");
  const [selectedDestinationType, setSelectedDestinationType] =
    React.useState("all");
  const [page, setPage] = React.useState(0);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingQRCode, setEditingQRCode] = React.useState<QRCodeRecord | null>(
    null,
  );
  const [previewQRCode, setPreviewQRCode] = React.useState<QRCodeRecord | null>(
    null,
  );
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deletingQRCode, setDeletingQRCode] =
    React.useState<QRCodeRecord | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const destinationTypeLabelMap = React.useMemo(
    () =>
      new Map(
        destinationTypes?.map((destinationType) => [
          destinationType.slug,
          destinationType.name,
        ]),
      ),
    [destinationTypes],
  );
  const isAdmin = profile?.role === "admin";
  const pageSize = 8;

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  React.useEffect(() => {
    setPage(0);
  }, [deferredSearch, selectedBusinessUnit, selectedDestinationType]);

  const filteredItems = React.useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return items.filter((item) => {
      const matchesBusinessUnit =
        selectedBusinessUnit === "all" ||
        item.business_unit_id === selectedBusinessUnit;
      const matchesDestinationType =
        selectedDestinationType === "all" ||
        item.destination_type === selectedDestinationType;

      if (!matchesBusinessUnit || !matchesDestinationType) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        item.title,
        item.slug,
        item.destination_url,
        item.description ?? "",
        item.business_unit?.name ?? "",
        destinationTypeLabelMap.get(item.destination_type) ??
          formatDestinationTypeLabel(null, item.destination_type),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    deferredSearch,
    destinationTypeLabelMap,
    items,
    selectedBusinessUnit,
    selectedDestinationType,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );
  const activeCodes = items.filter((item) => item.is_active).length;
  const totalScans = items.reduce((sum, item) => sum + item.scan_count, 0);
  const lastScannedRecord = [...items]
    .filter((item) => item.last_scanned_at)
    .sort((left, right) => {
      return (
        new Date(right.last_scanned_at ?? 0).getTime() -
        new Date(left.last_scanned_at ?? 0).getTime()
      );
    })[0];

  React.useEffect(() => {
    if (page <= totalPages - 1) {
      return;
    }

    setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const upsertQRCode = React.useCallback((savedQRCode: QRCodeRecord) => {
    setItems((previousItems) => {
      const existingIndex = previousItems.findIndex(
        (item) => item.id === savedQRCode.id,
      );

      if (existingIndex === -1) {
        return [savedQRCode, ...previousItems];
      }

      return previousItems.map((item) =>
        item.id === savedQRCode.id ? savedQRCode : item,
      );
    });
  }, []);

  const handleToggle = (item: QRCodeRecord) => {
    startTransition(async () => {
      const result = await toggleQRCodeActive(item.id, !item.is_active);

      if (!result.success || !result.qrCode) {
        appToast.error("Failed to update QR code", {
          description: result.error ?? "Try again in a moment.",
        });
        return;
      }

      upsertQRCode(result.qrCode);
      appToast.success(
        result.qrCode.is_active ? "QR code activated" : "QR code deactivated",
        {
          description: `${result.qrCode.slug} will ${result.qrCode.is_active ? "now" : "no longer"} redirect scans.`,
        },
      );
    });
  };

  const handleDelete = (item: QRCodeRecord) => {
    setDeletingQRCode(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingQRCode) return;

    startTransition(async () => {
      const result = await deleteQRCode(deletingQRCode.id);

      if (!result.success) {
        appToast.error("Failed to delete QR code", {
          description: result.error ?? "Try again in a moment.",
        });
        return;
      }

      setItems((previousItems) =>
        previousItems.filter((qrCode) => qrCode.id !== deletingQRCode.id),
      );
      appToast.success("QR code deleted", {
        description: `${deletingQRCode.slug} has been removed.`,
      });
      setDeleteModalOpen(false);
      setDeletingQRCode(null);
    });
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="QR codes"
          value={String(items.length)}
          description="Manage every QR redirect from one central dashboard."
          icon={
            <HugeiconsIcon
              icon={QrCode01Icon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
          gradient="from-blue-500 to-cyan-500"
        />
        <SummaryCard
          title="Active redirects"
          value={String(activeCodes)}
          description="Active codes continue redirecting scans immediately."
          icon={
            <HugeiconsIcon
              icon={Wifi01Icon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
          gradient="from-emerald-500 to-teal-500"
        />
        <SummaryCard
          title="Total scans"
          value={totalScans.toLocaleString("en-NG")}
          description={
            lastScannedRecord
              ? `Latest activity: ${formatDate(lastScannedRecord.last_scanned_at)}`
              : "No scans recorded yet."
          }
          icon={
            <HugeiconsIcon
              icon={BarChartIcon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
          gradient="from-violet-500 to-purple-500"
        />
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <HugeiconsIcon
                  icon={QrCode01Icon}
                  strokeWidth={2}
                  className="size-4 text-primary"
                />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                QR redirect list
              </h3>
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
              >
                {filteredItems.length}
              </Badge>
              {!isAdmin ? (
                <Badge variant="outline" className="rounded-full text-xs">
                  Read only
                </Badge>
              ) : null}
            </div>
            <p className="max-w-lg text-sm text-muted-foreground">
              Organize QR assets by business unit and use case now, then attach
              them to menus, products, and staff resources as those modules
              land.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Input
              className="min-w-60"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, slug, unit, or destination"
              value={search}
            />
            <Select
              value={selectedBusinessUnit}
              onValueChange={(value) => setSelectedBusinessUnit(String(value))}
            >
              <SelectTrigger className="w-full sm:w-52">
                <span
                  className={cn(
                    "flex flex-1 text-left text-sm",
                    selectedBusinessUnit === "all" && "text-muted-foreground",
                  )}
                >
                  {selectedBusinessUnit === "all"
                    ? "All business units"
                    : (businessUnits?.find(
                        (bu) => bu.id === selectedBusinessUnit,
                      )?.name ?? "All business units")}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All business units</SelectItem>
                {businessUnits?.map((businessUnit) => (
                  <SelectItem key={businessUnit.id} value={businessUnit.id}>
                    {businessUnit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedDestinationType}
              onValueChange={(value) =>
                setSelectedDestinationType(String(value))
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <span
                  className={cn(
                    "flex flex-1 text-left text-sm",
                    selectedDestinationType === "all" &&
                      "text-muted-foreground",
                  )}
                >
                  {selectedDestinationType === "all"
                    ? "All destination types"
                    : (destinationTypes.find(
                        (dt) => dt.slug === selectedDestinationType,
                      )?.name ?? "All destination types")}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All destination types</SelectItem>
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
            {isAdmin ? (
              <Button
                onClick={() => {
                  setEditingQRCode(null);
                  setEditorOpen(true);
                }}
                type="button"
                className="shrink-0 text-white"
              >
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                New QR code
              </Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QR code</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scans</TableHead>
                <TableHead>Last scanned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="py-10 text-center text-muted-foreground"
                    colSpan={6}
                  >
                    {items.length === 0
                      ? "No QR codes yet. Create one to print your first dynamic redirect."
                      : "No QR codes match the current search."}
                  </TableCell>
                </TableRow>
              ) : (
                pagedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground text-wrap">
                            /{item.slug}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="rounded-full">
                            {formatDestinationTypeLabel(
                              item.destination_type_definition,
                              item.destination_type,
                            )}
                          </Badge>
                          {item.business_unit ? (
                            <Badge variant="outline" className="rounded-full">
                              {item.business_unit.name}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground text-wrap">
                          {buildQrUrl(qrBaseUrl, item.slug)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-sm space-y-1">
                        <a
                          className="line-clamp-1 text-sm text-primary underline-offset-4 hover:underline"
                          href={item.destination_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {item.destination_url}
                        </a>
                        {item.description ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
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
                      {item.scan_count.toLocaleString("en-NG")}
                    </TableCell>
                    <TableCell>{formatDate(item.last_scanned_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => setPreviewQRCode(item)}
                          size="icon-sm"
                          title="Preview QR code"
                          type="button"
                          variant="ghost"
                        >
                          <HugeiconsIcon
                            icon={EyeIcon}
                            strokeWidth={2}
                            className="size-4"
                          />
                        </Button>
                        {isAdmin ? (
                          <>
                            <Button
                              disabled={isPending}
                              onClick={() => handleToggle(item)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {item.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingQRCode(item);
                                setEditorOpen(true);
                              }}
                              size="icon-sm"
                              title="Edit QR code"
                              type="button"
                              variant="ghost"
                            >
                              <HugeiconsIcon
                                icon={Edit02Icon}
                                strokeWidth={2}
                                className="size-4"
                              />
                            </Button>
                            <Button
                              onClick={() => handleDelete(item)}
                              size="icon-sm"
                              title="Delete QR code"
                              type="button"
                              variant="ghost"
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

        <TablePagination
          onPageChange={setPage}
          page={page}
          pageSize={pageSize}
          totalItems={filteredItems.length}
          totalPages={totalPages}
        />
      </div>

      <QRCodeEditorDialog
        businessUnits={businessUnits}
        destinationTypes={destinationTypes}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditingQRCode(null);
          }
        }}
        onSaved={upsertQRCode}
        open={editorOpen}
        qrCode={editingQRCode}
      />

      <QRCodePreviewDialog
        onOpenChange={(open) => {
          if (!open) {
            setPreviewQRCode(null);
          }
        }}
        open={Boolean(previewQRCode)}
        qrBaseUrl={qrBaseUrl}
        qrCode={previewQRCode}
      />
      <DeleteModal
        confirmText="Delete QR code"
        description="Printed copies will stop working immediately. This action cannot be undone."
        itemName={
          deletingQRCode?.slug ? `/${deletingQRCode.slug}` : "this QR code"
        }
        onConfirm={confirmDelete}
        onOpenChange={setDeleteModalOpen}
        open={deleteModalOpen}
        isLoading={isPending}
        title="Delete QR code"
      />
    </>
  );
}
