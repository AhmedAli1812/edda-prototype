'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QrCode, Search, Check } from 'lucide-react';

export default function PartnerStoreOrdersPage() {
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  const orders = [
    { id: 'ORD-8712', customer: 'الفني أحمد سالم (#SRV-2048)', item: 'مفتاح شنايدر أصلي 16A', qty: 1, price: '95 ج.م', type: 'استلام فني', status: 'جديد', variant: 'orange' as const },
    { id: 'ORD-8711', customer: 'العميل كريم إبراهيم', item: 'طقم إصلاح حنفية تركي', qty: 1, price: '140 ج.م', type: 'توصيل للمنزل', status: 'قيد التجهيز', variant: 'blue' as const },
    { id: 'ORD-8709', customer: 'العميل محمد أدهم', item: 'كابل 4 مم سويدي (10 م)', qty: 1, price: '320 ج.م', type: 'استلام فرع (كود QR)', status: 'جاهز للاستلام', variant: 'green' as const },
  ];

  const handleVerifyQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) return;

    if (qrCodeInput === 'QR-ORD-8709' || qrCodeInput === '8709') {
      setVerificationMessage('✅ تم التحقق من الكود بنجاح! تم تسليم طلب ORD-8709 واعتماد مستحقات المحل.');
    } else {
      setVerificationMessage('⚠️ كود الـ QR غير صحيح أو تم استخدامه مسبقاً.');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar role="partner-store" />
      <div className="flex-1 flex flex-col">
        <Header title="إدارة وتجهيز الطلبات" subtitle="طلبات قطع الغيار ومطابقة أكواد الاستلام" userName="بيت الكهرباء" />

        <main className="p-8 space-y-8 flex-1">
          {/* QR Verification Bar */}
          <div className="bg-navy text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <QrCode size={20} className="text-orange" />
                  التحقق من كود الاستلام السريع (QR Pickup)
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  اطلب من الفني أو العميل كود الاستلام من التطبيق لتأكيد التسليم واعتماد الرصيد فوراً
                </p>
              </div>

              <form onSubmit={handleVerifyQr} className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="أدخل كود الـ QR أو رقم الطلب"
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-orange w-full md:w-64"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange text-white text-xs font-bold rounded-xl hover:bg-orange-hover transition flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Check size={16} />
                  تأكيد التسليم
                </button>
              </form>
            </div>

            {verificationMessage && (
              <div className="mt-4 p-3 rounded-xl bg-white/10 text-xs font-medium border border-white/20">
                {verificationMessage}
              </div>
            )}
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-navy">قائمة الطلبات الجارية</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">إجمالي 3 طلبات</span>
              </div>
            </div>

            <div className="divide-y divide-line">
              {orders.map((ord) => (
                <div key={ord.id} className="py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-navy">{ord.id}</span>
                      <span className="text-xs font-bold text-ink">• {ord.item} (الكمية: {ord.qty})</span>
                      <StatusBadge label={ord.status} variant={ord.variant} />
                    </div>
                    <div className="text-xs text-muted">
                      العميل: {ord.customer} • طريقة الاستلام: <span className="font-bold text-navy">{ord.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="text-base font-extrabold text-navy">{ord.price}</span>
                    <button className="px-3 py-1.5 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-light transition">
                      تجهيز الطلب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
