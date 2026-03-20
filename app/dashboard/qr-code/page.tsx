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
      <div className="flex flex-1 flex-col overflow-y-auto bg-muted/20">
        <div className="flex w-full flex-1 flex-col gap-6 p-4 lg:p-8 mx-auto">
          <div className="flex flex-col gap-2 px-1 border-b pb-6">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Dynamic QR redirects
            </h1>
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
