import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
}) => {
  return (
    <div className="rounded-2xl border border-stormy-teal/15 bg-card-background bg-gradient-to-br from-ink-black/40 to-ink-black/10 p-5 shadow-lg backdrop-blur-xs flex items-center justify-between transition-all hover:border-stormy-teal/30">
      <div className="space-y-2">
        <span className="text-2xs font-extrabold tracking-widest text-stormy-teal uppercase block">
          {title}
        </span>
        <h3 className="text-2xl font-black text-foreground tracking-tight">
          {value}
        </h3>
        {(description || trend) && (
          <div className="flex items-center gap-1.5 text-2xs">
            {trend && (
              <span
                className={`font-bold inline-flex items-center gap-0.5 ${
                  trend.isPositive ? "text-green-500" : "text-spicy-paprika"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </span>
            )}
            {description && (
              <span className="text-text-secondary/60 dark:text-dust-grey/60 font-medium">
                {description}
              </span>
            )}
          </div>
        )}
      </div>

      {icon && (
        <div className="w-12 h-12 rounded-xl bg-stormy-teal/10 flex items-center justify-center text-stormy-teal border border-stormy-teal/10">
          {icon}
        </div>
      )}
    </div>
  );
};
