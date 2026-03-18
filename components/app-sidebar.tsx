"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { CurrentUserProfile } from "@/lib/supabase/profile";
import {
  DashboardSquare01Icon,
  Database01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
    },
    {
      title: "QR Codes",
      url: "/dashboard/qr-code",
      icon: <HugeiconsIcon icon={Database01Icon} strokeWidth={2} />,
    },
    {
      title: "Organization",
      url: "/dashboard/organization",
      icon: <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />,
    },
  ],
  navSecondary: [],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: CurrentUserProfile["profile"] | null;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5! mt-3 lg:mt-0 "
              render={<Link href="/dashboard" />}
              onClick={closeMobileSidebar}
            >
              {/* <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-5!" /> */}
              <Image
                src="/casalavoro-logo.png"
                alt="Casalavoro Logo"
                width={200}
                height={20}
                className="object-contain relative top-1"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {data.navSecondary.length > 0 ? (
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
