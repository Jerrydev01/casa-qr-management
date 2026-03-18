"use";
"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type {
  BusinessUnitRecord,
  DestinationTypeRecord,
  QRCodeRecord,
} from "@/lib/types/inventory";
import { cn } from "@/lib/utils";
import {
  ArrowRight01Icon,
  BarChartIcon,
  Building01Icon,
  CheckmarkCircle02Icon,
  Database01Icon,
  QrCode01Icon,
  Settings01Icon,
  Wifi01Icon,
  WorkflowCircle06Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

function StatCard({
  title,
  value,
  description,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm",
        "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
      )}
    >
      {/* gradient wash on hover */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.04] bg-linear-to-br",
          gradient,
        )}
      />
      {/* ambient glow orb */}
      <div
        className={cn(
          "absolute -right-8 -top-8 h-28 w-28 rounded-full bg-linear-to-br opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-20",
          gradient,
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md",
            gradient,
          )}
        >
          {icon}
        </div>
      </div>
      <div className="relative mt-4 space-y-0.5">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export function DashboardOverview({
  businessUnits,
  destinationTypes,
  items,
}: {
  businessUnits: BusinessUnitRecord[];
  destinationTypes: DestinationTypeRecord[];
  items: QRCodeRecord[];
}) {
  const activeCodes = items.filter((item) => item.is_active).length;
  const inactiveCodes = items.length - activeCodes;
  const totalScans = items.reduce((sum, item) => sum + item.scan_count, 0);
  const activeBusinessUnits = businessUnits.filter((bu) => bu.is_active).length;
  const recentItems = [...items].slice(0, 6);

  const unitDistribution = businessUnits
    .map((bu) => ({
      id: bu.id,
      name: bu.name,
      count: items.filter((item) => item.business_unit_id === bu.id).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const typeDistribution = destinationTypes
    .map((dt) => ({
      id: dt.id,
      name: dt.name,
      slug: dt.slug,
      count: items.filter((item) => item.destination_type === dt.slug).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxUnitCount = Math.max(1, ...unitDistribution.map((e) => e.count));

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI strip ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total QR codes"
          value={String(items.length)}
          description={`${activeCodes} active · ${inactiveCodes} paused`}
          gradient="from-blue-500 to-cyan-500"
          icon={
            <HugeiconsIcon
              icon={QrCode01Icon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
        />
        <StatCard
          title="Active redirects"
          value={String(activeCodes)}
          description="Actively forwarding scans right now."
          gradient="from-emerald-500 to-teal-500"
          icon={
            <HugeiconsIcon
              icon={Wifi01Icon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
        />
        <StatCard
          title="Total scans"
          value={totalScans.toLocaleString("en-NG")}
          description="Cumulative scans across all QR codes."
          gradient="from-violet-500 to-purple-500"
          icon={
            <HugeiconsIcon
              icon={BarChartIcon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
        />
        <StatCard
          title="Business units"
          value={String(businessUnits.length)}
          description={`${activeBusinessUnits} active · ${businessUnits.length - activeBusinessUnits} inactive`}
          gradient="from-orange-500 to-amber-500"
          icon={
            <HugeiconsIcon
              icon={Building01Icon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Left: Recent QR codes */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <HugeiconsIcon
                    icon={QrCode01Icon}
                    strokeWidth={2}
                    className="size-4 text-blue-500"
                  />
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  Recent QR codes
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                The latest records created or updated in the workspace.
              </p>
            </div>
            <Link
              href="/dashboard/qr-code"
              className={cn(
                buttonVariants({ size: "sm" }),
                "shrink-0 text-white",
              )}
            >
              Open workspace
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {recentItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <HugeiconsIcon
                    icon={QrCode01Icon}
                    strokeWidth={1.5}
                    className="size-6 text-muted-foreground"
                  />
                </div>
                <p className="text-sm font-medium">No QR codes yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Head to the QR workspace to create your first dynamic
                  redirect.
                </p>
              </div>
            ) : (
              recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-background/50 px-4 py-3 transition-colors hover:bg-accent/40"
                >
                  {/* Active indicator dot */}
                  <span
                    className={cn(
                      "mt-0.5 h-2 w-2 shrink-0 self-start rounded-full",
                      item.is_active ? "bg-emerald-500" : "bg-border",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">/{item.slug}</span>
                      {item.business_unit?.name ? (
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {item.business_unit.name}
                        </span>
                      ) : null}
                      {item.destination_type_definition?.name ? (
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {item.destination_type_definition.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    <span className="text-sm font-semibold tabular-nums">
                      {item.scan_count.toLocaleString("en-NG")}
                    </span>
                    <span className="text-xs text-muted-foreground">scans</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 6 && (
            <div className="pt-1 text-center">
              <Link
                href="/dashboard/qr-code"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                View all {items.length} QR codes
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
              </Link>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold tracking-tight">
              Quick actions
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Jump directly to the most common tasks.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/dashboard/qr-code"
                className={cn(buttonVariants(), "justify-start text-white")}
              >
                <HugeiconsIcon
                  icon={QrCode01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                Manage QR codes
              </Link>
              <Link
                href="/dashboard/organization"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "justify-start",
                )}
              >
                <HugeiconsIcon
                  icon={Settings01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                Manage organization
              </Link>
            </div>
          </div>

          {/* Business unit distribution */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                <HugeiconsIcon
                  icon={Database01Icon}
                  strokeWidth={2}
                  className="size-4 text-orange-500"
                />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight">
                  Unit distribution
                </h3>
                <p className="text-xs text-muted-foreground">
                  QR codes per business unit
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {unitDistribution.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                  Assign QR codes to business units to see distribution.
                </p>
              ) : (
                unitDistribution.map((entry) => (
                  <div key={entry.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{entry.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {entry.count}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-orange-500 to-amber-400 transition-all duration-700"
                        style={{
                          width: `${Math.round((entry.count / maxUnitCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Destination type usage */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <HugeiconsIcon
                  icon={WorkflowCircle06Icon}
                  strokeWidth={2}
                  className="size-4 text-violet-500"
                />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight">
                  Destination types
                </h3>
                <p className="text-xs text-muted-foreground">
                  {destinationTypes.length} types configured
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {destinationTypes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                  No destination types configured yet.
                </p>
              ) : (
                destinationTypes.map((dt) => {
                  const usage = typeDistribution.find(
                    (e) => e.slug === dt.slug,
                  );
                  return (
                    <div
                      key={dt.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {dt.is_active ? (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            strokeWidth={2}
                            className="size-4 shrink-0 text-emerald-500"
                          />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                        )}
                        <span className="text-sm font-medium">{dt.name}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2.5 py-0.5 text-xs tabular-nums"
                      >
                        {usage?.count ?? 0}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
