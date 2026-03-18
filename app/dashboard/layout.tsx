import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { redirectIfNotAuthenticated } from "@/lib/redirect/redirectIfNotAuthenticated";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfNotAuthenticated();

  const currentUserProfile = await getCurrentUserProfile("server");

  if (!currentUserProfile) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={currentUserProfile.profile ?? null} variant="inset" />
      {children}
    </SidebarProvider>
  );
}
