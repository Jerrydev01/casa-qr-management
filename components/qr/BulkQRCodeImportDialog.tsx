import { createBulkQRCodes } from "@/app/actions/qr-actions";
import { parseBulkQRCodeImport } from "@/lib/qr/bulk-import";
import {
  BulkQRCodeImportResult,
  BusinessUnitRecord,
  DestinationTypeRecord,
  QRCodeRecord,
} from "@/lib/types/inventory";
import { cn } from "@/lib/utils";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Download04Icon,
  FileUploadIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React from "react";
import { appToast } from "../custom/toast-ui";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
const BulkQRCodeImportDialog = ({
  businessUnits,
  destinationTypes,
  open,
  onImported,
  onOpenChange,
}: {
  businessUnits: BusinessUnitRecord[];
  destinationTypes: DestinationTypeRecord[];
  open: boolean;
  onImported: (qrCodes: QRCodeRecord[]) => void;
  onOpenChange: (open: boolean) => void;
}) => {
  const [rawInput, setRawInput] = React.useState("");
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(
    null,
  );
  const [result, setResult] = React.useState<BulkQRCodeImportResult | null>(
    null,
  );
  const [isPending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const template = React.useMemo(() => {
    const buSlug = businessUnits[0]?.slug ?? "general";
    const dtSlugs = destinationTypes.map((dt) => dt.slug);
    const staffSlug = dtSlugs.includes("staff_resource")
      ? "staff_resource"
      : (dtSlugs[0] ?? "external_link");
    const menuSlug = dtSlugs.includes("menu")
      ? "menu"
      : (dtSlugs[1] ?? dtSlugs[0] ?? "external_link");
    return [
      "title,slug,business_unit,destination_type,destination_url,description,is_active",
      `Staff profile - Jane Doe,staff-jane-doe,${buSlug},${staffSlug},https://example.com/staff/jane-doe,Profile QR for Jane Doe,true`,
      `Lunch menu,lunch-menu,${buSlug},${menuSlug},https://example.com/menu/lunch,Daily lunch menu,true`,
    ].join("\n");
  }, [businessUnits, destinationTypes]);

  const parsedPreview = React.useMemo(
    () => parseBulkQRCodeImport(rawInput),
    [rawInput],
  );

  React.useEffect(() => {
    if (open) return;
    setRawInput("");
    setUploadedFileName(null);
    setResult(null);
  }, [open]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setRawInput(await file.text());
      setUploadedFileName(file.name);
      setResult(null);
    } catch {
      appToast.error("Unable to read the selected file.");
    } finally {
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const parsed = parseBulkQRCodeImport(rawInput);
    if (parsed.errors.length > 0 || parsed.rows.length === 0) {
      appToast.error(parsed.errors[0] ?? "The file has no valid rows.");
      return;
    }
    startTransition(async () => {
      const r = await createBulkQRCodes(parsed.rows);
      setResult(r);
      if (r.created.length > 0) onImported(r.created);
      if (r.createdCount > 0 && r.failedCount === 0) {
        appToast.success(`${r.createdCount} QR codes created.`);
        onOpenChange(false);
      } else if (r.createdCount > 0) {
        appToast.success(`${r.createdCount} created, ${r.failedCount} failed.`);
      } else {
        appToast.error(
          r.error ?? r.errors[0]?.error ?? "No QR codes were created.",
        );
      }
    });
  };

  const hasParseErrors =
    rawInput.trim().length > 0 && parsedPreview.errors.length > 0;
  const readyRowCount = parsedPreview.rows.length;
  const hasFile = rawInput.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk create QR codes</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* ── Actions row ── */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <HugeiconsIcon icon={Download04Icon} strokeWidth={2} />
              Download template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <HugeiconsIcon icon={FileUploadIcon} strokeWidth={2} />
              Upload CSV
            </Button>
            <input
              ref={fileInputRef}
              accept=".csv,.txt,text/csv,text/plain"
              aria-label="Upload QR import CSV"
              className="hidden"
              onChange={handleFileSelected}
              type="file"
            />
          </div>

          {/* ── Valid slugs hint ── */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Business units:</span>{" "}
            {businessUnits.map((bu) => bu.slug).join(", ") || "—"}
            {"  ·  "}
            <span className="font-medium text-foreground">Types:</span>{" "}
            {destinationTypes.map((dt) => dt.slug).join(", ") || "—"}
          </p>

          {/* ── File chip ── */}
          {hasFile ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  strokeWidth={2}
                  className={cn(
                    "size-4 shrink-0",
                    hasParseErrors ? "text-destructive" : "text-emerald-500",
                  )}
                />
                <span className="text-sm truncate">
                  {uploadedFileName ?? "File loaded"}
                </span>
                {readyRowCount > 0 && !hasParseErrors ? (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {readyRowCount} {readyRowCount === 1 ? "row" : "rows"}
                  </Badge>
                ) : null}
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title="Remove file"
                onClick={() => {
                  setRawInput("");
                  setUploadedFileName(null);
                  setResult(null);
                }}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            </div>
          ) : null}

          {/* ── Parse errors ── */}
          {hasParseErrors ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 space-y-0.5">
              {parsedPreview.errors.map((e) => (
                <p key={e} className="text-xs text-destructive">
                  {e}
                </p>
              ))}
            </div>
          ) : null}

          {/* ── Row preview ── */}
          {readyRowCount > 0 && !hasParseErrors ? (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Slug</TableHead>
                      <TableHead className="text-xs">Unit</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedPreview.rows.map((row) => (
                      <TableRow key={`${row.rowNumber}-${row.slug}`}>
                        <TableCell className="text-xs font-medium">
                          {row.title || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.slug}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.business_unit}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.destination_type}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {/* ── Import result ── */}
          {result ? (
            <div className="rounded-md border border-border px-3 py-2.5 space-y-2">
              <div className="flex items-center gap-2">
                {result.createdCount > 0 ? (
                  <Badge className="text-white text-xs">
                    {result.createdCount} created
                  </Badge>
                ) : null}
                {result.failedCount > 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    {result.failedCount} failed
                  </Badge>
                ) : null}
              </div>
              {result.errors.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {result.errors.map((err) => (
                    <p
                      key={`${err.rowNumber}-${err.slug}`}
                      className="text-xs text-destructive"
                    >
                      Row {err.rowNumber}
                      {err.slug ? ` · ${err.slug}` : ""} — {err.error}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="text-white"
            disabled={isPending || readyRowCount === 0 || hasParseErrors}
            onClick={handleImport}
          >
            {isPending
              ? "Importing…"
              : readyRowCount > 0
                ? `Create ${readyRowCount} QR ${readyRowCount === 1 ? "code" : "codes"}`
                : "Create QR codes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkQRCodeImportDialog;
