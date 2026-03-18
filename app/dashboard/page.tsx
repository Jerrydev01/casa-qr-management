import {
  getBusinessUnits,
  getDestinationTypes,
  getQRCodes,
} from "@/app/actions/qr-actions";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset } from "@/components/ui/sidebar";

export default async function DashboardPage() {
  const [items, businessUnits, destinationTypes] = await Promise.all([
    getQRCodes(),
    getBusinessUnits(true),
    getDestinationTypes(true),
  ]);

  return (
    <SidebarInset>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <div className="flex flex-col gap-2 px-1">
            <h2 className="text-lg font-semibold">Operations overview</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Monitor QR performance, business structure, and destination setup
              from a single control surface.
            </p>
          </div>
          <DashboardOverview
            businessUnits={businessUnits}
            destinationTypes={destinationTypes}
            items={items}
          />
        </div>
      </div>
    </SidebarInset>
  );
}
