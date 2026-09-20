import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-line shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted font-medium">{title}</span>
        {icon && <div className="p-2 bg-canvas rounded-xl text-navy">{icon}</div>}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-navy">{value}</div>
        <div className="flex items-center justify-between mt-1">
          {subtitle && <span className="text-[11px] text-muted">{subtitle}</span>}
          {change && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isPositive ? 'bg-green-light text-green' : 'bg-red-light text-red'
              }`}
            >
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
