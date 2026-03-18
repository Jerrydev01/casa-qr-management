import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DestinationTypeRecord } from "./types/inventory";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDestinationTypeLabel(
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

export function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return dateFormatter.format(parsed);
}

export function buildQrUrl(qrBaseUrl: string, slug: string) {
  return `${qrBaseUrl}/qr/${slug}`;
}
