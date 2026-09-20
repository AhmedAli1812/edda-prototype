import React from 'react';

type BadgeVariant = 'green' | 'orange' | 'blue' | 'red' | 'navy';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'orange',
}) => {
  const styles: Record<BadgeVariant, string> = {
    green: 'bg-green-light text-green border-green/20',
    orange: 'bg-orange-light text-orange border-orange/20',
    blue: 'bg-blue-light text-blue border-blue/20',
    red: 'bg-red-light text-red border-red/20',
    navy: 'bg-navy/10 text-navy border-navy/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styles[variant]}`}
    >
      {label}
    </span>
  );
};
