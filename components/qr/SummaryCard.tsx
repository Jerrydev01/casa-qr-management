import { cn } from '@/lib/utils';
import React from 'react'

const SummaryCard = ({
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
}) => {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      {/* Hover gradient wash */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.04] bg-linear-to-br",
          gradient,
        )}
      />
      {/* Glow orb */}
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br opacity-10 blur-3xl",
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
};

export default SummaryCard;