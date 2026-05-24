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
  accentColor?: "teal" | "orange" | "blue" | "red" | "green" | "purple";
}

const accentMap = {
  teal:   { glow: "hover:shadow-[#14b8a6]/10", border: "hover:border-[#14b8a6]/30", iconBg: "bg-[#14b8a6]/10", iconColor: "text-[#14b8a6]", trendColor: "text-[#14b8a6]" },
  orange: { glow: "hover:shadow-[#f97316]/10", border: "hover:border-[#f97316]/30", iconBg: "bg-[#f97316]/10", iconColor: "text-[#f97316]", trendColor: "text-[#f97316]" },
  blue:   { glow: "hover:shadow-[#60a5fa]/10", border: "hover:border-[#60a5fa]/30", iconBg: "bg-[#60a5fa]/10", iconColor: "text-[#60a5fa]", trendColor: "text-[#60a5fa]" },
  red:    { glow: "hover:shadow-[#f87171]/10", border: "hover:border-[#f87171]/30", iconBg: "bg-[#f87171]/10", iconColor: "text-[#f87171]", trendColor: "text-[#f87171]" },
  green:  { glow: "hover:shadow-[#4ade80]/10", border: "hover:border-[#4ade80]/30", iconBg: "bg-[#4ade80]/10", iconColor: "text-[#4ade80]", trendColor: "text-[#4ade80]" },
  purple: { glow: "hover:shadow-[#a78bfa]/10", border: "hover:border-[#a78bfa]/30", iconBg: "bg-[#a78bfa]/10", iconColor: "text-[#a78bfa]", trendColor: "text-[#a78bfa]" },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  accentColor = "teal",
}) => {
  const accent = accentMap[accentColor];

  return (
    <div
      className={`group relative rounded-2xl border border-white/[0.07] bg-[#111318] p-5 shadow-lg transition-all duration-300 overflow-hidden
        hover:shadow-xl hover:border-white/[0.12] ${accent.glow} ${accent.border}
      `}
    >
      {/* Subtle top gradient line */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent`} />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <span className="text-[10px] font-bold tracking-[0.12em] text-white/40 uppercase block">
            {title}
          </span>
          <div className="text-3xl font-black text-white tracking-tight tabular-nums">
            {value}
          </div>
          {(description || trend) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {trend && (
                <span
                  className={`text-[10px] font-semibold inline-flex items-center gap-0.5 ${
                    trend.isPositive ? "text-[#4ade80]" : "text-[#f87171]"
                  }`}
                >
                  {trend.isPositive ? (
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  {trend.value}
                </span>
              )}
              {description && (
                <span className="text-[10px] text-white/30 font-medium">{description}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className={`w-11 h-11 rounded-xl ${accent.iconBg} ${accent.iconColor} flex items-center justify-center shrink-0 border border-white/[0.05] transition-transform group-hover:scale-110`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
