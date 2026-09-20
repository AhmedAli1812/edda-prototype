import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Wrench, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const activeJobs = [
    { id: '#SRV-2048', category: 'كهرباء', technician: 'أحمد سالم', status: 'الفني في الطريق', amount: '350 ج.م', variant: 'green' as const },
    { id: '#SRV-2047', category: 'تكييف', technician: 'محمود علي', status: 'تنفيذ الخدمة', amount: '440 ج.م', variant: 'blue' as const },
    { id: '#SRV-2046', category: 'سباكة', technician: 'حسن سامي', status: 'نزاع مفتوح', amount: '310 ج.م', variant: 'red' as const },
    { id: '#SRV-2045', category: 'أجهزة', technician: 'كريم عادل', status: 'مكتملة - بانتظار التسوية', amount: '520 ج.م', variant: 'navy' as const },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col">
        <Header title="لوحة تشغيل عِدّة المركزية" subtitle="متابعة حركة الطلبات والتنفيذ المباشر" />

        <main className="p-8 space-y-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <StatCard
              title="إجمالي العمليات اليوم (GMV)"
              value="84,620 ج.م"
              change="+12.4%"
              isPositive={true}
              icon={<TrendingUp size={20} />}
            />
            <StatCard
              title="خدمات نشطة الآن"
              value="126"
              subtitle="21 في الطريق • 67 قيد التنفيذ"
              icon={<Wrench size={20} />}
            />
            <StatCard
              title="طلبات قطع غيار المتجر"
              value="18"
              subtitle="5 بانتظار الاستلام بكود QR"
              icon={<ShoppingBag size={20} />}
            />
            <StatCard
              title="تنبيهات ومخاطر مفتوحة"
              value="4"
              change="تحتاج تدخل"
              isPositive={false}
              icon={<AlertTriangle size={20} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-line p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-navy">الخدمات النشطة لحظياً</h3>
                  <p className="text-xs text-muted">حالة التنفيذ والـ OTP ومطابقة المواقع</p>
                </div>
                <span className="text-xs text-orange font-bold">تحديث تلقائي (WebSocket)</span>
              </div>

              <div className="divide-y divide-line">
                {activeJobs.map((job) => (
                  <div key={job.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-navy">{job.id}</span>
                        <span className="text-xs text-muted">• {job.category}</span>
                      </div>
                      <span className="text-xs text-gray-500">الفني: {job.technician}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-navy">{job.amount}</span>
                      <StatusBadge label={job.status} variant={job.variant} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-line p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-navy mb-1">دورة SafePay</h3>
                <p className="text-xs text-muted mb-6">حالة تدفق المبالغ من التفويض حتى التسوية</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-bold">
                      <span>مبالغ مفوضة (محجوزة بالبوابة)</span>
                      <span className="text-navy">42,500 ج.م</span>
                    </div>
                    <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                      <div className="h-full bg-orange rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-bold">
                      <span>خدمات في نافذة الاعتراض (24 ساعة)</span>
                      <span className="text-blue">18,300 ج.م</span>
                    </div>
                    <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                      <div className="h-full bg-blue rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-bold">
                      <span>جاهزة للتسوية والتحويل</span>
                      <span className="text-green">23,820 ج.م</span>
                    </div>
                    <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                      <div className="h-full bg-green rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-canvas rounded-xl text-[11px] text-muted leading-relaxed mt-6">
                💡 المنصة لا تحتفظ بأموال العملاء بشكل مباشر؛ المبالغ مفوضة عبر بوابة دفع مرخصة من البنك المركزي، وتُطلق بعد انتهاء نافذة الاعتراض.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
