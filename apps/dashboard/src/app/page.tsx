import Link from 'next/link';
import { ShieldCheck, Store } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 text-white">
      <div className="w-16 h-16 rounded-2xl bg-orange flex items-center justify-center text-white text-3xl font-black mb-4 shadow-xl">
        ع
      </div>
      <h1 className="text-3xl font-extrabold mb-2">منصة عِدّة</h1>
      <p className="text-gray-300 text-sm mb-8 text-center max-w-md">
        لوحة التحكم المركزية - اختر بوابتك للمتابعة وإدارة العمليات اليومية
      </p>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-xl">
        <Link
          href="/admin"
          className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl p-6 flex flex-col items-center text-center transition group hover:-translate-y-1"
        >
          <div className="p-4 bg-orange/20 text-orange rounded-2xl mb-4 group-hover:scale-110 transition">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-lg font-bold mb-1">لوحة الإدارة والتشغيل</h2>
          <p className="text-xs text-gray-300">
            متابعة الخدمات، مكافحة الالتفاف، إدارة النزاعات، والتسويات المالية
          </p>
        </Link>

        <Link
          href="/partner-store"
          className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl p-6 flex flex-col items-center text-center transition group hover:-translate-y-1"
        >
          <div className="p-4 bg-green-light/20 text-green rounded-2xl mb-4 group-hover:scale-110 transition">
            <Store size={32} />
          </div>
          <h2 className="text-lg font-bold mb-1">بوابة المحل الشريك</h2>
          <p className="text-xs text-gray-300">
            استقبال طلبات قطع الغيار، تجهيز المنتجات، والتحقق بكود QR
          </p>
        </Link>
      </div>

      <p className="mt-12 text-[11px] text-gray-400">
        عِدّة • منصة خدمات الصيانة والمتاجر الشريكة © 2026
      </p>
    </main>
  );
}
