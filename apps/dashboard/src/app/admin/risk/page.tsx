import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ShieldAlert, AlertOctagon, PhoneCall, KeyRound } from 'lucide-react';

export default function AdminRiskPage() {
  const riskIncidents = [
    {
      id: 'RSK-104',
      title: 'محاولة مشاركة رقم هاتف بالمحادثة',
      actor: 'الفني أحمد سالم (F-104)',
      job: '#SRV-2041',
      snippet: 'أرسل: "كلمنا على الرقم ده 01012345678"',
      level: 'عالية' as const,
      variant: 'red' as const,
      time: 'منذ 15 دقيقة',
    },
    {
      id: 'RSK-103',
      title: 'طلب تحويل خارجي عبر انستاباي',
      actor: 'الفني سامح حسن (F-088)',
      job: '#SRV-2038',
      snippet: 'أرسل: "حول باقي المبلغ على انستاباي عشان نخلص"',
      level: 'عالية' as const,
      variant: 'red' as const,
      time: 'منذ ساعتين',
    },
    {
      id: 'RSK-102',
      title: 'محاولة تسجيل وصول بدون كود OTP',
      actor: 'الفني محمود علي (F-176)',
      job: '#SRV-2032',
      snippet: 'تم رفض إدخال كود وصول خاطئ 3 مرات متتالية',
      level: 'متوسطة' as const,
      variant: 'orange' as const,
      time: 'منذ 4 ساعات',
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col">
        <Header title="مركز مكافحة الالتفاف والمخاطر" subtitle="مراقبة المحادثات والاتصال الوسيط وحماية SafePay" />

        <main className="p-8 space-y-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              title="تنبيهات مشاركة أرقام"
              value="7"
              subtitle="خلال الـ 24 ساعة الماضية"
              icon={<PhoneCall size={20} />}
            />
            <StatCard
              title="محاولات دفع خارجي مرصودة"
              value="3"
              subtitle="تم حجب الرسائل تلقائياً"
              icon={<AlertOctagon size={20} />}
            />
            <StatCard
              title="نزاعات مفتوحة"
              value="4"
              subtitle="معدل النزاع 1.2% (تحت المستهدف)"
              icon={<ShieldAlert size={20} />}
            />
          </div>

          <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-navy">سجل رصد السلوكيات المشبوهة</h3>
                <p className="text-xs text-muted">فلاتر الـ Regex والذكاء الاصطناعي لرصد الالتفاف على الدفع</p>
              </div>
            </div>

            <div className="space-y-4">
              {riskIncidents.map((inc) => (
                <div key={inc.id} className="p-4 rounded-xl border border-line bg-canvas flex items-start justify-between">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm text-navy">{inc.title}</span>
                      <StatusBadge label={inc.level} variant={inc.variant} />
                      <span className="text-[11px] text-muted">{inc.time}</span>
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      المسؤول: {inc.actor} • الطلب المرتبط: <span className="font-bold text-navy">{inc.job}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-line text-xs text-navy font-mono">
                      {inc.snippet}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-navy text-white hover:bg-navy-light transition">
                      مراجعة المحادثة
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red text-white hover:bg-red/90 transition">
                      إيقاف مؤقت
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
