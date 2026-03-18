import { headers } from "next/headers";

export async function getPublicBaseUrl() {
  const headerList = await headers();
  const origin = headerList.get("origin");

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
