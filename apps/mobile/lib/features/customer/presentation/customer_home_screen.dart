import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/edda_colors.dart';

class CustomerHomeScreen extends StatelessWidget {
  const CustomerHomeScreen({super.key});

  final List<Map<String, dynamic>> categories = const [
    {'name': 'كهرباء', 'icon': Icons.bolt, 'color': EddaColors.orange},
    {'name': 'سباكة', 'icon': Icons.water_drop_outlined, 'color': EddaColors.blue},
    {'name': 'تكييف', 'icon': Icons.ac_unit, 'color': EddaColors.navy},
    {'name': 'نقاشة', 'icon': Icons.format_paint_outlined, 'color': EddaColors.orange},
    {'name': 'أجهزة', 'icon': Icons.kitchen_outlined, 'color': EddaColors.green},
    {'name': 'أقفال', 'icon': Icons.lock_outline, 'color': EddaColors.navy},
    {'name': 'نجارة', 'icon': Icons.carpenter_outlined, 'color': EddaColors.orange},
    {'name': 'أخرى', 'icon': Icons.add_circle_outline, 'color': EddaColors.muted},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EddaColors.canvas,
      body: CustomScrollView(
        slivers: [
          // Hero Top Header
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 48, 20, 24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [EddaColors.navy, EddaColors.navyLight],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: Colors.white.withValues(alpha: 0.15),
                            child: const Text('م', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 12),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('أهلاً، محمد', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              Text('تحتاج تصلّح إيه اليوم؟', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                              Text('📍 مدينة نصر، القاهرة', style: TextStyle(color: Colors.white60, fontSize: 10)),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Hero CTA
                  GestureDetector(
                    onTap: () => context.push('/safepay-job'),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: EddaColors.orange,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: EddaColors.orange.withValues(alpha: 0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('اطلب فني موثّق', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
                              Text('استقبل عروض وادفع بنظام SafePay', style: TextStyle(color: Colors.white70, fontSize: 11)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.build, color: Colors.white, size: 24),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Trust Bar
                  Row(
                    children: [
                      _buildTrustItem('ضمان 30 يوم', Icons.shield_outlined),
                      const SizedBox(width: 8),
                      _buildTrustItem('دفع محمي', Icons.lock_outline),
                      const SizedBox(width: 8),
                      _buildTrustItem('فني موثّق', Icons.verified_user_outlined),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Categories Grid
                  const Text('اختار الخدمة', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: EddaColors.navy)),
                  const SizedBox(height: 12),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      childAspectRatio: 0.85,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                    ),
                    itemCount: categories.length,
                    itemBuilder: (context, index) {
                      final cat = categories[index];
                      return Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: EddaColors.line),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: (cat['color'] as Color).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(cat['icon'], color: cat['color'], size: 22),
                            ),
                            const SizedBox(height: 6),
                            Text(cat['name'], style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: EddaColors.ink)),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  // Active Service Card
                  const Text('الخدمة الحالية', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: EddaColors.navy)),
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: () => context.push('/safepay-job'),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: const Border(
                          right: BorderSide(color: EddaColors.orange, width: 4),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: EddaColors.navy.withValues(alpha: 0.04),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: EddaColors.greenLight,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text('الفني في الطريق', style: TextStyle(color: EddaColors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                              const Text('#SRV-2048', style: TextStyle(color: EddaColors.muted, fontSize: 10)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text('إصلاح عطل كهربائي بالمطبخ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(height: 6),
                          const Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('الفني: أحمد سالم', style: TextStyle(fontSize: 11, color: EddaColors.muted)),
                              Text('تم حجز 350 ج.م (SafePay)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: EddaColors.navy)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: EddaColors.orange,
        unselectedItemColor: EddaColors.muted,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'الرئيسية'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), label: 'طلباتي'),
          BottomNavigationBarItem(icon: Icon(Icons.storefront_outlined), label: 'المتجر'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), label: 'محفظتي'),
        ],
        onTap: (index) {
          if (index == 2) context.push('/store');
          if (index == 1) context.push('/safepay-job');
        },
      ),
    );
  }

  Widget _buildTrustItem(String title, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: EddaColors.line),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: EddaColors.orange),
            const SizedBox(height: 4),
            Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
