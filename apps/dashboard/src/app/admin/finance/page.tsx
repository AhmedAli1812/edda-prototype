import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Wallet, ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';

export default function AdminFinancePage() {
  const settlementBatches = [
    { beneficiary: 'الفنيون المعتمدون (دورة الغد)', count: '143 فني', amount: '420,500 ج.م', commission: '50,460 ج.م', status: 'جاهز للتحويل', variant: 'green' as const },
    { beneficiary: 'المتاجر الشريكة (دورة الأحد)', count: '22 متجر', amount: '178,300 ج.م', commission: '14,264 ج.م', status: 'قيد التدقيق', variant: 'blue' as const },
    { beneficiary: 'مبالغ مجمدة لوجود نزاع', count: '4 حالات', amount: '32,140 ج.م', commission: '0 ج.م', status: 'مجمدة', variant: 'red' as const },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col">
        <Header title="المالية والتسويات وبوابة الدفع" subtitle="إدارة العمولات والتحويلات البنكية ومطابقة الحسابات" />

        <main className="p-8 space-y-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <StatCard
              title="إيراد المنصة هذا الشهر"
              value="186,400 ج.م"
              subtitle="عمولات الصيانة + مبيعات المتجر"
              icon={<Wallet size={20} />}
            />
            <StatCard
              title="إجمالي حجم التداول (GMV)"
              value="1.24M ج.م"
              change="+18.5%"
              isPositive={true}
              icon={<ArrowUpRight size={20} />}
            />
            <StatCard
              title="متوسط نسبة العمولة (Take Rate)"
              value="14.9%"
              subtitle="12% فنيين • 8% متاجر"
              icon={<Scale size={20} />}
            />
            <StatCard
              title="مستحقات معلقة بالنزاعات"
              value="32,140 ج.م"
              subtitle="محجوزة لحين صدور قرار الدعم"
              icon={<ArrowDownRight size={20} />}
            />
          </div>

          <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-navy">دفعات التسوية البنكية (Settlement Batches)</h3>
                <p className="text-xs text-muted">التحويلات المجدولة للحسابات البنكية ومحافظ الفنيين والمتاجر</p>
              </div>
              <button className="px-4 py-2 bg-orange text-white text-xs font-bold rounded-xl hover:bg-orange-hover transition shadow-sm">
                تأكيد دورة التسوية الحالية
              </button>
            </div>

            <div className="divide-y divide-line">
              {settlementBatches.map((batch, i) => (
                <div key={i} className="py-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-navy">{batch.beneficiary}</h4>
                    <span className="text-xs text-muted">المستفيدون: {batch.count} • عمولة المنصة: {batch.commission}</span>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="text-base font-extrabold text-navy">{batch.amount}</span>
                    <StatusBadge label={batch.status} variant={batch.variant} />
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
