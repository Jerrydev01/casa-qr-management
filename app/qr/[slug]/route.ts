import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type ResolveQRCodeRow = {
  destination_url: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return new NextResponse("QR code not found.", { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_qr_code", {
    input_slug: normalizedSlug,
  });

  if (error) {
    console.error("Failed to resolve QR code:", error.message);
    return new NextResponse("QR code not found.", { status: 404 });
  }

  const qrCode = ((data ?? []) as ResolveQRCodeRow[])[0] ?? null;

  if (!qrCode) {
    return new NextResponse("QR code not found.", { status: 404 });
  }

  let destinationUrl: URL;

  try {
    destinationUrl = new URL(qrCode.destination_url);
  } catch {
    return new NextResponse("QR code destination is invalid.", { status: 500 });
  }

  if (
    destinationUrl.protocol !== "http:" &&
    destinationUrl.protocol !== "https:"
  ) {
    return new NextResponse("QR code destination is invalid.", { status: 500 });
  }

  return NextResponse.redirect(destinationUrl, 307);
}
