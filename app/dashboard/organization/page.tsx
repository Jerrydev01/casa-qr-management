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
      <div className="flex flex-1 flex-col overflow-y-auto bg-muted/20">
        <div className="flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 lg:p-8 mx-auto">
          <div className="flex flex-col gap-2 px-1 border-b pb-6">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Organization Settings
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground">
              Maintain the business units and destination types used throughout
              the QR management system. Configure definitions and status for
              your organization's core reference data here.
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
