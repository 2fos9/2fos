import React, { ReactNode } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantClasses = {
    primary: "bg-[#D4AF37] hover:bg-[#c49f2c] text-[#0B1329] font-semibold shadow-sm",
    secondary: "bg-[#131B36] hover:bg-[#1c274c] text-slate-100 border border-slate-700/60",
    outline: "border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    ghost: "text-slate-300 hover:text-white hover:bg-slate-800/50",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-[#131B36] border border-slate-800/80 rounded-xl p-5 shadow-lg text-slate-100 ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800/60">
          <div>
            {title && <h3 className="font-semibold text-lg text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export interface BadgeProps {
  children: ReactNode;
  variant?: "gold" | "navy" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  const variantClasses = {
    gold: "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30",
    navy: "bg-[#0B1329] text-sky-300 border border-sky-800/50",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    neutral: "bg-slate-800/70 text-slate-300 border border-slate-700/50",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  changeLabel,
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#131B36] border border-slate-800 rounded-xl p-5 shadow-md transition-all duration-200 hover:border-[#D4AF37]/40 ${
        onClick ? "cursor-pointer hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        <div className="p-2.5 rounded-lg bg-[#0B1329] border border-slate-800 text-[#D4AF37]">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-100">{value}</span>
        {changeLabel && (
          <span
            className={`text-xs font-medium ${
              trend === "up"
                ? "text-emerald-400"
                : trend === "down"
                ? "text-rose-400"
                : "text-slate-400"
            }`}
          >
            {changeLabel}
          </span>
        )}
      </div>
    </div>
  );
};