import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'عِدّة | لوحة الإدارة والمتاجر الشريكة',
  description: 'لوحة التحكم والتشغيل لمنصة عِدّة لخدمات الصيانة والمتاجر الشريكة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-canvas text-ink antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
