"use server";

import { revalidatePath } from "next/cache";

import { createActionClient } from "@/lib/supabase/action";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import {
  type BulkQRCodeImportError,
  type BulkQRCodeImportResult,
  type BulkQRCodeImportRowInput,
  type BusinessUnitInput,
  type BusinessUnitRecord,
  type DestinationTypeInput,
  type DestinationTypeRecord,
  type QRCodeInput,
  type QRCodeRecord,
} from "@/lib/types/inventory";

type QRCodeRow = {
  id: string;
  title: string;
  slug: string;
  business_unit_id: string;
  destination_type: string;
  destination_url: string;
  description: string | null;
  is_active: boolean;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
  business_unit:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
      }[]
    | null;
  destination_type_definition:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
      }[]
    | null;
};
type BusinessUnitRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DestinationTypeRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type QRCodeActionResult = {
  success: boolean;
  error?: string;
  qrCode?: QRCodeRecord;
};

type BusinessUnitActionResult = {
  success: boolean;
  error?: string;
  businessUnit?: BusinessUnitRecord;
};

type DestinationTypeActionResult = {
  success: boolean;
  error?: string;
  destinationType?: DestinationTypeRecord;
};

type LookupTable = Map<string, string | null>;

const qrCodeSelect = `
  id,
  title,
  slug,
  business_unit_id,
  destination_type,
  destination_url,
  description,
  is_active,
  scan_count,
  last_scanned_at,
  created_at,
  updated_at,
  business_unit:business_units!qr_codes_business_unit_id_fkey (
    id,
    name,
    slug
  ),
  destination_type_definition:destination_types!qr_codes_destination_type_fkey (
    id,
    name,
    slug
  )
`;

function mapBusinessUnitRow(row: BusinessUnitRow): BusinessUnitRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    is_active: row.is_active,
  };
}

function mapDestinationTypeRow(row: DestinationTypeRow): DestinationTypeRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    is_active: row.is_active,
  };
}

function normalizeBusinessUnit(
  businessUnit: QRCodeRow["business_unit"],
): QRCodeRecord["business_unit"] {
  if (Array.isArray(businessUnit)) {
    return businessUnit[0] ?? null;
  }

  return businessUnit ?? null;
}

function normalizeDestinationTypeDefinition(
  destinationTypeDefinition: QRCodeRow["destination_type_definition"],
): QRCodeRecord["destination_type_definition"] {
  if (Array.isArray(destinationTypeDefinition)) {
    return destinationTypeDefinition[0] ?? null;
  }

  return destinationTypeDefinition ?? null;
}

function mapQRCode(row: QRCodeRow): QRCodeRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    business_unit_id: row.business_unit_id,
    business_unit: normalizeBusinessUnit(row.business_unit),
    destination_type: row.destination_type,
    destination_type_definition: normalizeDestinationTypeDefinition(
      row.destination_type_definition,
    ),
    destination_url: row.destination_url,
    description: row.description,
    is_active: row.is_active,
    scan_count: Number(row.scan_count ?? 0),
    last_scanned_at: row.last_scanned_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTitle(title: string) {
  const trimmed = title.trim();

  if (!trimmed) {
    throw new Error("Title is required.");
  }

  return trimmed;
}

function normalizeName(name: string, fieldName: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmed;
}

function normalizeDescription(description?: string | null) {
  const trimmed = description?.trim();
  return trimmed ? trimmed : null;
}

function normalizeLookupKey(value: string) {
  return value.trim().toLowerCase();
}

function addLookupValue(
  lookup: LookupTable,
  rawKey: string,
  resolvedValue: string,
) {
  const key = normalizeLookupKey(rawKey);

  if (!key) {
    return;
  }

  const existingValue = lookup.get(key);

  if (existingValue && existingValue !== resolvedValue) {
    lookup.set(key, null);
    return;
  }

  if (!lookup.has(key)) {
    lookup.set(key, resolvedValue);
  }
}

function resolveLookupValue(
  value: string,
  lookup: LookupTable,
  missingMessage: string,
  ambiguousMessage: string,
) {
  const key = normalizeLookupKey(value);

  if (!key) {
    throw new Error(missingMessage);
  }

  if (!lookup.has(key)) {
    throw new Error(missingMessage);
  }

  const resolvedValue = lookup.get(key);

  if (!resolvedValue) {
    throw new Error(ambiguousMessage);
  }

  return resolvedValue;
}

function buildBusinessUnitLookup(
  businessUnits: Array<Pick<BusinessUnitRow, "id" | "name" | "slug">>,
) {
  const lookup: LookupTable = new Map();

  businessUnits.forEach((businessUnit) => {
    addLookupValue(lookup, businessUnit.id, businessUnit.id);
    addLookupValue(lookup, businessUnit.slug, businessUnit.id);
    addLookupValue(lookup, businessUnit.name, businessUnit.id);
  });

  return lookup;
}

function buildDestinationTypeLookup(
  destinationTypes: Array<Pick<DestinationTypeRow, "id" | "name" | "slug">>,
) {
  const lookup: LookupTable = new Map();

  destinationTypes.forEach((destinationType) => {
    addLookupValue(lookup, destinationType.id, destinationType.slug);
    addLookupValue(lookup, destinationType.slug, destinationType.slug);
    addLookupValue(lookup, destinationType.name, destinationType.slug);
  });

  return lookup;
}

function normalizeReferenceSlug(slug: string, fieldName: string) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalizedSlug;
}

function normalizeDestinationUrl(destinationUrl: string) {
  const trimmed = destinationUrl.trim();

  if (!trimmed) {
    throw new Error("Destination URL is required.");
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Destination URL must be a valid absolute URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Destination URL must start with http:// or https://.");
  }

  return parsed.toString();
}

function normalizeBusinessUnitId(businessUnitId: string) {
  const trimmed = businessUnitId.trim();

  if (!trimmed) {
    throw new Error("Business unit is required.");
  }

  return trimmed;
}

function normalizeDestinationType(destinationType: string) {
  const trimmed = destinationType.trim();

  if (!trimmed) {
    throw new Error("Destination type is required.");
  }

  return trimmed;
}

function validateQRCodeInput(input: QRCodeInput) {
  const slug = normalizeSlug(input.slug);

  if (!slug) {
    throw new Error("Slug is required.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      "Slug can only contain lowercase letters, numbers, and hyphens.",
    );
  }

  return {
    title: normalizeTitle(input.title),
    slug,
    business_unit_id: normalizeBusinessUnitId(input.business_unit_id),
    destination_type: normalizeDestinationType(input.destination_type),
    destination_url: normalizeDestinationUrl(input.destination_url),
    description: normalizeDescription(input.description),
    is_active: input.is_active ?? true,
  };
}

function validateBusinessUnitInput(input: BusinessUnitInput) {
  return {
    name: normalizeName(input.name, "Name"),
    slug: normalizeReferenceSlug(input.slug, "Slug"),
    description: normalizeDescription(input.description),
    is_active: input.is_active ?? true,
  };
}

function validateDestinationTypeInput(input: DestinationTypeInput) {
  return {
    name: normalizeName(input.name, "Name"),
    slug: normalizeReferenceSlug(input.slug, "Slug"),
    description: normalizeDescription(input.description),
    is_active: input.is_active ?? true,
  };
}

async function ensureAdminAccess() {
  const currentUserProfile = await getCurrentUserProfile("action");

  if (currentUserProfile?.profile?.role !== "admin") {
    return { error: "Only admins can manage this content." };
  }

  return { profile: currentUserProfile.profile };
}

function mapMutationError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "That slug is already in use. Choose a different slug.";
  }

  if (error.code === "23503") {
    return "This record is still in use and cannot be deleted yet.";
  }

  return error.message;
}

async function assertActiveBusinessUnitExists(businessUnitId: string) {
  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("business_units")
    .select("id")
    .eq("id", businessUnitId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Select a valid active business unit.");
  }
}

async function assertActiveDestinationTypeExists(destinationTypeSlug: string) {
  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("destination_types")
    .select("slug")
    .eq("slug", destinationTypeSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Select a valid active destination type.");
  }
}

function revalidateManagementRoutes() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/qr-code");
  revalidatePath("/dashboard/organization");
}

export async function getQRCodes(): Promise<QRCodeRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .select(qrCodeSelect)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch QR codes:", error.message);
    return [];
  }

  return ((data ?? []) as QRCodeRow[]).map(mapQRCode);
}

export async function getBusinessUnits(
  includeInactive = false,
): Promise<BusinessUnitRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("business_units")
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch business units:", error.message);
    return [];
  }

  return ((data ?? []) as BusinessUnitRow[]).map(mapBusinessUnitRow);
}

export async function getDestinationTypes(
  includeInactive = false,
): Promise<DestinationTypeRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("destination_types")
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch destination types:", error.message);
    return [];
  }

  return ((data ?? []) as DestinationTypeRow[]).map(mapDestinationTypeRow);
}

export async function createQRCode(
  input: QRCodeInput,
): Promise<QRCodeActionResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  const profile = access.profile;

  if (!profile) {
    return { success: false, error: "Unable to verify admin access." };
  }

  let payload: ReturnType<typeof validateQRCodeInput>;

  try {
    payload = validateQRCodeInput(input);
    await Promise.all([
      assertActiveBusinessUnitExists(payload.business_unit_id),
      assertActiveDestinationTypeExists(payload.destination_type),
    ]);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid QR code data.",
    };
  }

  const supabase = await createActionClient();
  const currentUserId = profile.id;
  const { data, error } = await supabase
    .from("qr_codes")
    .insert({
      ...payload,
      created_by: currentUserId,
      updated_by: currentUserId,
    })
    .select(qrCodeSelect)
    .single();

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return {
    success: true,
    qrCode: mapQRCode(data as QRCodeRow),
  };
}

export async function createBulkQRCodes(
  input: BulkQRCodeImportRowInput[],
): Promise<BulkQRCodeImportResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return {
      success: false,
      created: [],
      errors: [],
      totalRows: input.length,
      createdCount: 0,
      failedCount: input.length,
      error: access.error,
    };
  }

  const profile = access.profile;

  if (!profile) {
    return {
      success: false,
      created: [],
      errors: [],
      totalRows: input.length,
      createdCount: 0,
      failedCount: input.length,
      error: "Unable to verify admin access.",
    };
  }

  if (input.length === 0) {
    return {
      success: false,
      created: [],
      errors: [],
      totalRows: 0,
      createdCount: 0,
      failedCount: 0,
      error: "Provide at least one QR code row to import.",
    };
  }

  const supabase = await createActionClient();
  const [businessUnitResponse, destinationTypeResponse] = await Promise.all([
    supabase
      .from("business_units")
      .select("id, name, slug")
      .eq("is_active", true),
    supabase
      .from("destination_types")
      .select("id, name, slug")
      .eq("is_active", true),
  ]);

  if (businessUnitResponse.error || destinationTypeResponse.error) {
    return {
      success: false,
      created: [],
      errors: [],
      totalRows: input.length,
      createdCount: 0,
      failedCount: input.length,
      error:
        businessUnitResponse.error?.message ??
        destinationTypeResponse.error?.message ??
        "Unable to load reference data for the import.",
    };
  }

  const businessUnitLookup = buildBusinessUnitLookup(
    (businessUnitResponse.data ?? []) as Array<
      Pick<BusinessUnitRow, "id" | "name" | "slug">
    >,
  );
  const destinationTypeLookup = buildDestinationTypeLookup(
    (destinationTypeResponse.data ?? []) as Array<
      Pick<DestinationTypeRow, "id" | "name" | "slug">
    >,
  );
  const seenSlugs = new Set<string>();
  const created: QRCodeRecord[] = [];
  const errors: BulkQRCodeImportError[] = [];

  for (const row of input) {
    try {
      const payload = validateQRCodeInput({
        title: row.title,
        slug: row.slug,
        business_unit_id: resolveLookupValue(
          row.business_unit,
          businessUnitLookup,
          "Select a valid active business unit for this row.",
          "Business unit reference is ambiguous. Use the business unit slug or id.",
        ),
        destination_type: resolveLookupValue(
          row.destination_type,
          destinationTypeLookup,
          "Select a valid active destination type for this row.",
          "Destination type reference is ambiguous. Use the destination type slug or id.",
        ),
        destination_url: row.destination_url,
        description: row.description,
        is_active: row.is_active,
      });

      if (seenSlugs.has(payload.slug)) {
        throw new Error("This batch already contains the same slug.");
      }

      seenSlugs.add(payload.slug);

      const { data, error } = await supabase
        .from("qr_codes")
        .insert({
          ...payload,
          created_by: profile.id,
          updated_by: profile.id,
        })
        .select(qrCodeSelect)
        .single();

      if (error) {
        throw new Error(mapMutationError(error));
      }

      created.push(mapQRCode(data as QRCodeRow));
    } catch (error) {
      errors.push({
        rowNumber: row.rowNumber,
        title: row.title.trim(),
        slug: row.slug.trim(),
        error:
          error instanceof Error ? error.message : "Unable to import this row.",
      });
    }
  }

  if (created.length > 0) {
    revalidateManagementRoutes();
  }

  return {
    success: created.length > 0,
    created,
    errors,
    totalRows: input.length,
    createdCount: created.length,
    failedCount: errors.length,
    error:
      created.length === 0
        ? (errors[0]?.error ?? "No QR codes were imported.")
        : undefined,
  };
}

export async function updateQRCode(
  qrCodeId: string,
  input: QRCodeInput,
): Promise<QRCodeActionResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  const profile = access.profile;

  if (!profile) {
    return { success: false, error: "Unable to verify admin access." };
  }

  let payload: ReturnType<typeof validateQRCodeInput>;

  try {
    payload = validateQRCodeInput(input);
    await Promise.all([
      assertActiveBusinessUnitExists(payload.business_unit_id),
      assertActiveDestinationTypeExists(payload.destination_type),
    ]);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid QR code data.",
    };
  }

  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .update({
      ...payload,
      updated_by: profile.id,
    })
    .eq("id", qrCodeId)
    .select(qrCodeSelect)
    .single();

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return {
    success: true,
    qrCode: mapQRCode(data as QRCodeRow),
  };
}

export async function toggleQRCodeActive(
  qrCodeId: string,
  isActive: boolean,
): Promise<QRCodeActionResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  const profile = access.profile;

  if (!profile) {
    return { success: false, error: "Unable to verify admin access." };
  }

  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .update({ is_active: isActive, updated_by: profile.id })
    .eq("id", qrCodeId)
    .select(qrCodeSelect)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateManagementRoutes();

  return {
    success: true,
    qrCode: mapQRCode(data as QRCodeRow),
  };
}

export async function deleteQRCode(
  qrCodeId: string,
): Promise<{ success: boolean; error?: string }> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  const supabase = await createActionClient();
  const { error } = await supabase.from("qr_codes").delete().eq("id", qrCodeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateManagementRoutes();

  return { success: true };
}

export async function createBusinessUnit(
  input: BusinessUnitInput,
): Promise<BusinessUnitActionResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  let payload: ReturnType<typeof validateBusinessUnitInput>;

  try {
    payload = validateBusinessUnitInput(input);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Invalid business unit data.",
    };
  }

  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("business_units")
    .insert(payload)
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return {
    success: true,
    businessUnit: mapBusinessUnitRow(data as BusinessUnitRow),
  };
}

export async function updateBusinessUnit(
  businessUnitId: string,
  input: BusinessUnitInput,
): Promise<BusinessUnitActionResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  let payload: ReturnType<typeof validateBusinessUnitInput>;

  try {
    payload = validateBusinessUnitInput(input);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Invalid business unit data.",
    };
  }

  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("business_units")
    .update(payload)
    .eq("id", businessUnitId)
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return {
    success: true,
    businessUnit: mapBusinessUnitRow(data as BusinessUnitRow),
  };
}

export async function toggleBusinessUnitActive(
  businessUnitId: string,
  isActive: boolean,
): Promise<BusinessUnitActionResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("business_units")
    .update({ is_active: isActive })
    .eq("id", businessUnitId)
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return {
    success: true,
    businessUnit: mapBusinessUnitRow(data as BusinessUnitRow),
  };
}

export async function deleteBusinessUnit(
  businessUnitId: string,
): Promise<{ success: boolean; error?: string }> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  const supabase = await createActionClient();
  const { error } = await supabase
    .from("business_units")
    .delete()
    .eq("id", businessUnitId);

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return { success: true };
}

export async function createDestinationType(
  input: DestinationTypeInput,
): Promise<DestinationTypeActionResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  let payload: ReturnType<typeof validateDestinationTypeInput>;

  try {
    payload = validateDestinationTypeInput(input);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Invalid destination type data.",
    };
  }

  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("destination_types")
    .insert(payload)
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return {
    success: true,
    destinationType: mapDestinationTypeRow(data as DestinationTypeRow),
  };
}

export async function updateDestinationType(
  destinationTypeId: string,
  input: DestinationTypeInput,
): Promise<DestinationTypeActionResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  let payload: ReturnType<typeof validateDestinationTypeInput>;

  try {
    payload = validateDestinationTypeInput(input);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Invalid destination type data.",
    };
  }

  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("destination_types")
    .update(payload)
    .eq("id", destinationTypeId)
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return {
    success: true,
    destinationType: mapDestinationTypeRow(data as DestinationTypeRow),
  };
}

export async function toggleDestinationTypeActive(
  destinationTypeId: string,
  isActive: boolean,
): Promise<DestinationTypeActionResult> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  const supabase = await createActionClient();
  const { data, error } = await supabase
    .from("destination_types")
    .update({ is_active: isActive })
    .eq("id", destinationTypeId)
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return {
    success: true,
    destinationType: mapDestinationTypeRow(data as DestinationTypeRow),
  };
}

export async function deleteDestinationType(
  destinationTypeId: string,
): Promise<{ success: boolean; error?: string }> {
  const access = await ensureAdminAccess();

  if (access.error) {
    return { success: false, error: access.error };
  }

  const supabase = await createActionClient();
  const { error } = await supabase
    .from("destination_types")
    .delete()
    .eq("id", destinationTypeId);

  if (error) {
    return { success: false, error: mapMutationError(error) };
  }

  revalidateManagementRoutes();

  return { success: true };
}
