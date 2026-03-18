export type BusinessUnitRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};

export type BusinessUnitInput = {
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
};

export type DestinationTypeRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};

export type DestinationTypeInput = {
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
};

export type QRCodeRecord = {
  id: string;
  title: string;
  slug: string;
  business_unit_id: string;
  business_unit: Pick<BusinessUnitRecord, "id" | "name" | "slug"> | null;
  destination_type: string;
  destination_type_definition: Pick<
    DestinationTypeRecord,
    "id" | "name" | "slug"
  > | null;
  destination_url: string;
  description: string | null;
  is_active: boolean;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QRCodeInput = {
  title: string;
  slug: string;
  business_unit_id: string;
  destination_type: string;
  destination_url: string;
  description?: string | null;
  is_active?: boolean;
};

export type BulkQRCodeImportRowInput = {
  rowNumber: number;
  title: string;
  slug: string;
  business_unit: string;
  destination_type: string;
  destination_url: string;
  description?: string | null;
  is_active?: boolean;
};

export type BulkQRCodeImportError = {
  rowNumber: number;
  title: string;
  slug: string;
  error: string;
};

export type BulkQRCodeImportResult = {
  success: boolean;
  created: QRCodeRecord[];
  errors: BulkQRCodeImportError[];
  totalRows: number;
  createdCount: number;
  failedCount: number;
  error?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "staff";
};
