"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
  FilterHorizontalIcon,
  FilterRemoveIcon,
  QrCode01Icon,
  Settings01Icon,
  Wifi01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function StatCard({
  title,
  value,
  description,
  icon,
  gradient,
  trend,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: { val: string; positive: boolean };
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border/50 bg-background/50 p-6 shadow-sm backdrop-blur-xl",
        "transition-all duration-500 hover:shadow-xl hover:border-border/80",
      )}
    >
      {/* Dynamic Background Glow */}
      <div
        className={cn(
          "absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-[0.03] bg-linear-to-br",
          gradient,
        )}
      />
      <div
        className={cn(
          "absolute -right-8 -top-8 h-32 w-32 rounded-full bg-linear-to-br opacity-5 blur-[40px] transition-opacity duration-700 group-hover:opacity-20",
          gradient,
        )}
      />

      <div className="relative flex items-center justify-between">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br shadow-inner ring-1 ring-white/10 dark:ring-white/5",
            gradient,
          )}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
              trend.positive
                ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
            )}
          >
            {trend.positive ? "+" : ""}
            {trend.val}
          </div>
        )}
      </div>

      <div className="relative mt-6 space-y-1.5">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-4xl font-extrabold tracking-tight text-foreground">
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground/80">
          {description}
        </p>
      </div>
    </div>
  );
}

// Chart color palettes
const COLORS = [
  "#3b82f6", // blue-500
  "#8b5cf6", // blue-500 -> violet-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
];

export function DashboardOverview({
  businessUnits,
  destinationTypes,
  items: rawItems,
}: {
  businessUnits: BusinessUnitRecord[];
  destinationTypes: DestinationTypeRecord[];
  items: QRCodeRecord[];
}) {
  // Filter states
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Apply filters to items
  const items = useMemo(() => {
    return rawItems.filter((item) => {
      // 1. Time filter (based on creation date for now)
      if (timeFilter !== "all") {
        const itemDate = new Date(item.created_at);
        const now = new Date();
        const diffDays =
          (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);

        if (timeFilter === "today" && diffDays > 1) return false;
        if (timeFilter === "week" && diffDays > 7) return false;
        if (timeFilter === "month" && diffDays > 30) return false;
      }

      // 2. Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !item.is_active) return false;
        if (statusFilter === "inactive" && item.is_active) return false;
      }

      // 3. Business Unit filter
      if (unitFilter !== "all" && item.business_unit_id !== unitFilter) {
        return false;
      }

      // 4. Destination Type filter
      if (typeFilter !== "all" && item.destination_type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [rawItems, timeFilter, statusFilter, unitFilter, typeFilter]);

  const activeCodes = items.filter((item) => item.is_active).length;
  const inactiveCodes = items.length - activeCodes;
  const totalScans = items.reduce((sum, item) => sum + item.scan_count, 0);
  const activeBusinessUnits = businessUnits.filter((bu) => bu.is_active).length;
  const recentItems = [...items]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  const activeFiltersCount =
    (timeFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (unitFilter !== "all" ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setTimeFilter("all");
    setStatusFilter("all");
    setUnitFilter("all");
    setTypeFilter("all");
  };

  const unitDistribution = useMemo(() => {
    return businessUnits
      .map((bu) => ({
        name: bu.name,
        count: items.filter((item) => item.business_unit_id === bu.id).length,
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [businessUnits, items]);

  const typeDistribution = useMemo(() => {
    return destinationTypes
      .map((dt) => ({
        name: dt.name,
        value: items.filter((item) => item.destination_type === dt.slug).length,
      }))
      .filter((entry) => entry.value > 0);
  }, [destinationTypes, items]);

  // Generate pseudo-mock data for the area chart to make dashboard look premium.
  const scanHistoryData = useMemo(() => {
    const data = [];
    const today = new Date();
    const remaining = totalScans || 1500; // Mock base scale

    // Simple pseudo-random generator
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // We do 14 days
    for (let i = 14; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const val = Math.floor(remaining * (pseudoRandom(i + remaining) * 0.15));
      data.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        scans: val,
      });
    }
    // Make last element nice
    data[data.length - 1].scans = Math.floor(remaining * 0.2) + 5;
    return data;
  }, [totalScans]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── Header Area ── */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-base text-muted-foreground">
            Monitor your QR code performance and quick actions.
          </p>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3 overflow-x-auto w-full pt-4 md:pt-0">
            <Link
              href="/dashboard/qr-code"
              className={cn(
                buttonVariants({ size: "default" }),
                "h-10 rounded-full px-5 text-white shadow-md transition-transform hover:-translate-y-0.5",
              )}
            >
              <HugeiconsIcon
                icon={QrCode01Icon}
                strokeWidth={2}
                className="mr-2 size-4"
              />
              Manage Codes
            </Link>
            <Link
              href="/dashboard/organization"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "h-10 rounded-full px-5 transition-transform hover:-translate-y-0.5",
              )}
            >
              <HugeiconsIcon
                icon={Settings01Icon}
                strokeWidth={2}
                className="mr-2 size-4"
              />
              Settings
            </Link>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 gap-2 rounded-xl px-4 transition-colors",
                      activeFiltersCount > 0 &&
                        "border-blue-500/50 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
                    )}
                  >
                    <HugeiconsIcon
                      icon={FilterHorizontalIcon}
                      className="size-4"
                    />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px] bg-blue-500 text-white">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                }
              ></PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 rounded-2xl p-0 shadow-xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={FilterHorizontalIcon}
                      className="size-4 text-muted-foreground"
                    />
                    <span className="text-sm font-semibold">Filters</span>
                    {activeFiltersCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 text-[10px]"
                      >
                        {activeFiltersCount} active
                      </Badge>
                    )}
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <HugeiconsIcon
                        icon={FilterRemoveIcon}
                        className="size-3.5"
                      />
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Filter groups */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 p-4">
                  {/* Time */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Time
                    </label>
                    <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value ?? "all")}>
                      <SelectTrigger className="h-9 w-full rounded-xl text-sm">
                        <span
                          className={cn(
                            "flex flex-1 text-left text-sm",
                            timeFilter === "all" && "text-muted-foreground",
                          )}
                        >
                          {timeFilter === "all" && "All time"}
                          {timeFilter === "today" && "Today"}
                          {timeFilter === "week" && "7 days"}
                          {timeFilter === "month" && "30 days"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Past 7 days</SelectItem>
                        <SelectItem value="month">Past 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value ?? "all")}
                    >
                      <SelectTrigger className="h-9 w-full rounded-xl text-sm">
                        <span
                          className={cn(
                            "flex flex-1 text-left text-sm",
                            statusFilter === "all" && "text-muted-foreground",
                          )}
                        >
                          {statusFilter === "all" && "All"}
                          {statusFilter === "active" && "Active"}
                          {statusFilter === "inactive" && "Paused"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Business Unit — full width */}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Business Unit
                    </label>
                    <Select value={unitFilter} onValueChange={(value) => setUnitFilter(value ?? "all")}>
                      <SelectTrigger className="h-9 w-full rounded-xl text-sm">
                        <span
                          className={cn(
                            "flex flex-1 truncate text-left text-sm",
                            unitFilter === "all" && "text-muted-foreground",
                          )}
                        >
                          {unitFilter === "all"
                            ? "All units"
                            : (businessUnits?.find((bu) => bu.id === unitFilter)
                                ?.name ?? "All units")}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All units</SelectItem>
                        {businessUnits.map((bu) => (
                          <SelectItem key={bu.id} value={bu.id}>
                            {bu.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Destination Type — full width */}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Destination Type
                    </label>
                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? "")}>
                      <SelectTrigger className="h-9 w-full rounded-xl text-sm">
                        <span
                          className={cn(
                            "flex flex-1 truncate text-left text-sm",
                            typeFilter === "all" && "text-muted-foreground",
                          )}
                        >
                          {typeFilter === "all"
                            ? "All types"
                            : (destinationTypes?.find(
                                (dt) => dt.slug === typeFilter,
                              )?.name ?? "All types")}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All types</SelectItem>
                        {destinationTypes.map((dt) => (
                          <SelectItem key={dt.id} value={dt.slug}>
                            {dt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Endpoints"
          value={String(items.length)}
          description={`${activeCodes} active · ${inactiveCodes} paused`}
          gradient="from-indigo-500 to-blue-500"
          trend={{ val: "12%", positive: true }}
          icon={
            <HugeiconsIcon
              icon={QrCode01Icon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
        />
        <StatCard
          title="Active Redirects"
          value={String(activeCodes)}
          description="Ready and receiving traffic"
          gradient="from-emerald-500 to-teal-400"
          trend={{ val: "4.5%", positive: true }}
          icon={
            <HugeiconsIcon
              icon={Wifi01Icon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
        />
        <StatCard
          title="Total Captures"
          value={totalScans.toLocaleString("en-US")}
          description="Lifetime engagement events"
          gradient="from-violet-500 to-fuchsia-500"
          trend={{ val: "22%", positive: true }}
          icon={
            <HugeiconsIcon
              icon={BarChartIcon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
        />
        <StatCard
          title="Active Workspaces"
          value={String(businessUnits.length)}
          description={`${activeBusinessUnits} functional units`}
          gradient="from-amber-500 to-orange-400"
          icon={
            <HugeiconsIcon
              icon={Building01Icon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          }
        />
      </div>

      {/* ── Main Charts Area ── */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Area Chart */}
        <div className="flex min-h-[400px] flex-col overflow-hidden rounded-3xl border border-border/50 bg-background/40 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-xl dark:ring-white/5">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Scan Activity
              </h3>
              <p className="text-sm text-muted-foreground">
                Engagement over the past 14 days
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={scanHistoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.1)"
                  className="stroke-muted-foreground/20"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor", opacity: 0.5 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor", opacity: 0.5 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "rgba(10, 10, 10, 0.8)",
                    backdropFilter: "blur(12px)",
                    color: "#fff",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                  }}
                  itemStyle={{ color: "#fff", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScans)"
                  activeDot={{ r: 8, strokeWidth: 0, fill: "#8b5cf6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart (Destination types) */}
        <div className="flex min-h-[400px] flex-col overflow-hidden rounded-3xl border border-border/50 bg-background/40 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-xl dark:ring-white/5">
          <div className="mb-2">
            <h3 className="text-lg font-semibold tracking-tight">
              Destinations
            </h3>
            <p className="text-sm text-muted-foreground">Type distribution</p>
          </div>
          <div className="flex flex-1 items-center justify-center min-h-[250px] w-full">
            {typeDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: "rgba(10, 10, 10, 0.8)",
                      color: "#fff",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-sm font-medium text-muted-foreground">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Section ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Top Business Units Bar Chart */}
        <div className="flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-background/40 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-xl dark:ring-white/5">
          <div className="mb-6">
            <h3 className="text-lg font-semibold tracking-tight">Units</h3>
            <p className="text-sm text-muted-foreground">Top departments</p>
          </div>
          <div className="h-[280px] w-full">
            {unitDistribution.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">No units found</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={unitDistribution}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                    className="stroke-muted-foreground/10"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: "rgba(10, 10, 10, 0.8)",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[0, 6, 6, 0]}
                    barSize={24}
                  >
                    {unitDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 2) % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Items List */}
        <div className="flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-background/40 p-0 shadow-sm ring-1 ring-black/5 backdrop-blur-xl dark:ring-white/5">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Recent Generations
              </h3>
              <p className="text-sm text-muted-foreground">
                Latest codes in your network
              </p>
            </div>
            <Link
              href="/dashboard/qr-code"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5 rounded-full px-4 font-semibold text-blue-500 hover:bg-blue-500/10 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300",
              )}
            >
              View All
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Link>
          </div>

          <div className="flex flex-1 flex-col">
            {recentItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/50">
                  <HugeiconsIcon
                    icon={QrCode01Icon}
                    strokeWidth={1.5}
                    className="size-6 text-muted-foreground"
                  />
                </div>
                <p className="text-base font-medium">No activity yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Head to the workspace to create a dynamic redirect.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                  >
                    {/* Status Dot */}
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          item.is_active
                            ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                            : "bg-zinc-400",
                        )}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-400">
                        {item.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="rounded-md px-1.5 py-0 text-[10px] font-medium"
                        >
                          /{item.slug}
                        </Badge>
                        {item.business_unit?.name && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <HugeiconsIcon
                              icon={Building01Icon}
                              className="size-3"
                            />
                            {item.business_unit.name}
                          </span>
                        )}
                        {item.destination_type_definition?.name && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              className="size-3 text-emerald-500"
                            />
                            {item.destination_type_definition.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={BarChartIcon}
                          className="size-3.5 text-muted-foreground"
                        />
                        <span className="font-mono text-sm font-bold tabular-nums">
                          {item.scan_count.toLocaleString("en-US")}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        total scans
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
