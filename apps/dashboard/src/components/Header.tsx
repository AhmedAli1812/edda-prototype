import React from 'react';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  userName = 'أحمد سالم',
}) => {
  return (
    <header className="h-16 bg-white border-b border-line px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-base font-bold text-navy leading-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-xl bg-canvas border border-line flex items-center justify-center text-navy relative hover:bg-gray-100 transition">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-3 pr-4 border-r border-line">
          <div className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-sm">
            {userName[0]}
          </div>
          <div className="text-right">
            <span className="block text-xs font-bold text-navy">{userName}</span>
            <span className="block text-[10px] text-muted">حساب معتمد</span>
          </div>
        </div>
      </div>
    </header>
  );
};
