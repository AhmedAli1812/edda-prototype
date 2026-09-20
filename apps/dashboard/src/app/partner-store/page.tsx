import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Store, ShoppingCart, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PartnerStoreHomePage() {
  const storeOrders = [
    { id: 'ORD-8712', item: 'مفتاح شنايدر أصلي 16A', pickupMethod: 'استلام بواسطة الفني', eta: 'خلال 15 دقيقة', amount: '95 ج.م', status: 'جديد', variant: 'orange' as const },
    { id: 'ORD-8711', item: 'طقم إصلاح حنفية تركي', pickupMethod: 'توصيل لموقع العميل', eta: 'خلال 30 دقيقة', amount: '140 ج.م', status: 'قيد التجهيز', variant: 'blue' as const },
    { id: 'ORD-8709', item: 'كابل 4 مم سويدي (10 متر)', pickupMethod: 'استلام من العميل بكود QR', eta: 'جاهز للاستلام', amount: '320 ج.م', status: 'جاهز', variant: 'green' as const },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar role="partner-store" />
      <div className="flex-1 flex flex-col">
        <Header title="بوابة المحل الشريك - بيت الكهرباء" subtitle="فرع مدينة نصر • شريك معتمد لدى عِدّة" userName="بيت الكهرباء" />

        <main className="p-8 space-y-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <StatCard
              title="مبيعات اليوم"
              value="3,420 ج.م"
              change="+14.2%"
              isPositive={true}
              icon={<ShoppingCart size={20} />}
            />
            <StatCard
              title="طلبات تحتاج تجهيز الآن"
              value="5"
              subtitle="سرعة التجهيز تؤثر على الترتيب"
              icon={<Clock size={20} />}
            />
            <StatCard
              title="معدل الجاهزية والالتزام"
              value="96%"
              subtitle="متوسط التجهيز: 18 دقيقة"
              icon={<CheckCircle2 size={20} />}
            />
            <StatCard
              title="التقييم العام"
              value="★ 4.9"
              subtitle="من 142 فني وعميل"
              icon={<Store size={20} />}
            />
          </div>

          <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-navy">الطلبات الواردة لتجهيز قطع الغيار</h3>
                <p className="text-xs text-muted">استلام مباشر من الفرع بكود QR أو شحن سريع لموقع الصيانة</p>
              </div>
              <Link
                href="/partner-store/orders"
                className="text-xs font-bold text-orange hover:underline"
              >
                عرض كل الطلبات
              </Link>
            </div>

            <div className="divide-y divide-line">
              {storeOrders.map((order) => (
                <div key={order.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-navy">{order.id}</span>
                      <span className="text-xs font-bold text-gray-700">• {order.item}</span>
                    </div>
                    <span className="text-xs text-muted">{order.pickupMethod} • الوقت المتوقع: {order.eta}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-extrabold text-navy">{order.amount}</span>
                    <StatusBadge label={order.status} variant={order.variant} />
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
