import type { BulkQRCodeImportRowInput } from "@/lib/types/inventory";

const requiredColumns = [
  "title",
  "slug",
  "business_unit",
  "destination_type",
  "destination_url",
] as const;

const headerAliases: Record<
  string,
  (typeof requiredColumns)[number] | "description" | "is_active"
> = {
  active: "is_active",
  business_unit: "business_unit",
  business_unit_id: "business_unit",
  business_unit_name: "business_unit",
  business_unit_slug: "business_unit",
  description: "description",
  destination_type: "destination_type",
  destination_type_slug: "destination_type",
  destination_url: "destination_url",
  link: "destination_url",
  notes: "description",
  qr_slug: "slug",
  redirect_url: "destination_url",
  slug: "slug",
  status: "is_active",
  target_url: "destination_url",
  title: "title",
  type: "destination_type",
  unit: "business_unit",
  unit_slug: "business_unit",
  url: "destination_url",
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0]?.trim() ?? "";
  const candidates = [",", "\t", ";"] as const;

  return candidates.reduce(
    (best, candidate) => {
      const count = firstLine.split(candidate).length - 1;

      if (count > best.count) {
        return { delimiter: candidate, count };
      }

      return best;
    },
    { delimiter: "," as const, count: -1 },
  ).delimiter;
}

function parseDelimitedRows(text: string, delimiter: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentField += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && character === delimiter) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += character;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((value) => value.trim().length > 0));
}

function parseBooleanFlag(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  if (["true", "1", "yes", "y", "active"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "inactive"].includes(normalized)) {
    return false;
  }

  throw new Error(
    `Invalid is_active value \"${value}\". Use true/false, yes/no, 1/0, or active/inactive.`,
  );
}

export function parseBulkQRCodeImport(text: string): {
  rows: BulkQRCodeImportRowInput[];
  errors: string[];
} {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      rows: [],
      errors: ["Paste CSV content or upload a file before importing."],
    };
  }

  const delimiter = detectDelimiter(trimmed);
  const parsedRows = parseDelimitedRows(trimmed, delimiter);

  if (parsedRows.length < 2) {
    return {
      rows: [],
      errors: ["The import needs a header row and at least one data row."],
    };
  }

  const normalizedHeaders = parsedRows[0].map(
    (header) => headerAliases[normalizeHeader(header)] ?? null,
  );
  const missingColumns = requiredColumns.filter(
    (column) => !normalizedHeaders.includes(column),
  );

  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [
        `Missing required columns: ${missingColumns.join(", ")}. Required headers: ${requiredColumns.join(", ")}.`,
      ],
    };
  }

  const rows: BulkQRCodeImportRowInput[] = [];
  const errors: string[] = [];

  for (let rowIndex = 1; rowIndex < parsedRows.length; rowIndex += 1) {
    const sourceRow = parsedRows[rowIndex];
    const record: Partial<BulkQRCodeImportRowInput> = {
      rowNumber: rowIndex + 1,
    };

    normalizedHeaders.forEach((header, columnIndex) => {
      if (!header) {
        return;
      }

      const value = sourceRow[columnIndex] ?? "";

      if (header === "description") {
        record.description = value.trim();
        return;
      }

      if (header === "is_active") {
        try {
          record.is_active = parseBooleanFlag(value);
        } catch (error) {
          errors.push(
            `Row ${rowIndex + 1}: ${error instanceof Error ? error.message : "Invalid active flag."}`,
          );
        }
        return;
      }

      record[header] = value.trim();
    });

    if (
      !record.title &&
      !record.slug &&
      !record.business_unit &&
      !record.destination_type &&
      !record.destination_url &&
      !record.description
    ) {
      continue;
    }

    rows.push({
      rowNumber: record.rowNumber ?? rowIndex + 1,
      title: record.title ?? "",
      slug: record.slug ?? "",
      business_unit: record.business_unit ?? "",
      destination_type: record.destination_type ?? "",
      destination_url: record.destination_url ?? "",
      description: record.description ?? "",
      is_active: record.is_active ?? true,
    });
  }

  return { rows, errors };
}
