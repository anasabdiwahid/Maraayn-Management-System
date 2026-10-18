import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'amber' | 'navy' | 'green' | 'red' | 'blue' | 'purple';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'amber',
  trend,
}) => {
  const colorStyles = {
    amber: 'bg-amber-50 text-brand-amber border-amber-200',
    navy: 'bg-slate-100 text-brand-navy border-slate-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    red: 'bg-rose-50 text-rose-600 border-rose-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 line-clamp-1">{title}</span>
        <div className={`p-1.5 sm:p-2.5 rounded-lg border shrink-0 ${colorStyles[color]}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div className="mt-2.5 sm:mt-4 flex items-baseline justify-between gap-1">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{value}</h3>
        {trend && (
          <span
            className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
              trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-[10px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">{subtitle}</p>}
    </div>
  );
};

