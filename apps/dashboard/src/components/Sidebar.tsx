import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Wrench,
  ShieldAlert,
  Wallet,
  Store,
  Boxes,
  ClipboardList,
  CheckCircle,
} from 'lucide-react';

interface SidebarProps {
  role: 'admin' | 'partner-store';
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const adminLinks = [
    { href: '/admin', label: 'نظرة عامة', icon: <LayoutDashboard size={18} /> },
    { href: '/admin/risk', label: 'المخاطر والنزاعات', icon: <ShieldAlert size={18} /> },
    { href: '/admin/finance', label: 'المالية والتسويات', icon: <Wallet size={18} /> },
  ];

  const storeLinks = [
    { href: '/partner-store', label: 'رئيسية المتجر', icon: <Store size={18} /> },
    { href: '/partner-store/orders', label: 'طلبات التجهيز', icon: <ClipboardList size={18} /> },
  ];

  const links = role === 'admin' ? adminLinks : storeLinks;

  return (
    <aside className="w-64 bg-navy text-white min-h-screen flex flex-col p-4 border-l border-navy-light">
      <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-orange flex items-center justify-center text-white font-black text-xl shadow-lg">
          ع
        </div>
        <div>
          <h1 className="font-extrabold text-lg leading-tight">عِدّة</h1>
          <span className="text-[10px] text-gray-400 font-medium">
            {role === 'admin' ? 'لوحة الإدارة والتشغيل' : 'بوابة المحل الشريك'}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition"
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="pt-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-2"
        >
          <span>تبديل نوع الحساب</span>
        </Link>
      </div>
    </aside>
  );
};
