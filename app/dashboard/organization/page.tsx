import {
  getBusinessUnits,
  getDestinationTypes,
} from "@/app/actions/qr-actions";
import { OrganizationManagement } from "@/components/dashboard/organization-management";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { getCurrentUserProfile } from "@/lib/supabase/profile";

export default async function OrganizationPage() {
  const [businessUnits, destinationTypes, currentUserProfile] =
    await Promise.all([
      getBusinessUnits(true),
      getDestinationTypes(true),
      getCurrentUserProfile("server"),
    ]);

  return (
    <SidebarInset>
      <SiteHeader title="Organization" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <div className="flex flex-col gap-2 px-1">
            <h2 className="text-lg font-semibold">Reference data</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Maintain the business units and destination types used throughout
              the QR management system.
            </p>
          </div>
          <OrganizationManagement
            businessUnits={businessUnits}
            destinationTypes={destinationTypes}
            profile={currentUserProfile?.profile ?? null}
          />
        </div>
      </div>
    </SidebarInset>
  );
}
