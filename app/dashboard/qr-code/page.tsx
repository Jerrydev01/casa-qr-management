import {
  getBusinessUnits,
  getDestinationTypes,
  getQRCodes,
} from "@/app/actions/qr-actions";
import { QRManagement } from "@/components/qr/qr-management";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { getPublicBaseUrl } from "@/lib/site-url";
import { getCurrentUserProfile } from "@/lib/supabase/profile";

export default async function QrCodePage() {
  const [
    items,
    businessUnits,
    destinationTypes,
    currentUserProfile,
    qrBaseUrl,
  ] = await Promise.all([
    getQRCodes(),
    getBusinessUnits(),
    getDestinationTypes(),
    getCurrentUserProfile("server"),
    getPublicBaseUrl(),
  ]);

  return (
    <SidebarInset>
      <SiteHeader title="QR Codes" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <div className="flex flex-col gap-2 px-1">
            <h2 className="text-lg font-semibold">Dynamic QR redirects</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Generate printable QR codes that always point to this CMS first,
              then redirect to the latest landing page URL you set here.
            </p>
          </div>
          <QRManagement
            businessUnits={businessUnits}
            destinationTypes={destinationTypes}
            items={items}
            profile={currentUserProfile?.profile ?? null}
            qrBaseUrl={qrBaseUrl}
          />
        </div>
      </div>
    </SidebarInset>
  );
}
