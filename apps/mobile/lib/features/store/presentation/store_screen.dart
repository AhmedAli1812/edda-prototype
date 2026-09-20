import 'package:flutter/material.dart';
import '../../../core/theme/edda_colors.dart';

class StoreScreen extends StatelessWidget {
  const StoreScreen({super.key});

  final List<Map<String, dynamic>> products = const [
    {
      'title': 'مفتاح شنايدر أصلي 16A',
      'store': 'بيت الكهرباء • فرع مدينة نصر',
      'price': '95 ج.م',
      'icon': Icons.bolt,
    },
    {
      'title': 'طقم إصلاح حنفية تركي',
      'store': 'السباك الحديث',
      'price': '140 ج.م',
      'icon': Icons.water_drop_outlined,
    },
    {
      'title': 'مفك كهرباء معزول 1000V',
      'store': 'الرواد للأدوات',
      'price': '185 ج.م',
      'icon': Icons.handyman_outlined,
    },
    {
      'title': 'رول دهان احترافي 9 بوصة',
      'store': 'ألوان المدينة',
      'price': '95 ج.م',
      'icon': Icons.format_paint_outlined,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EddaColors.canvas,
      appBar: AppBar(
        title: const Text('متجر عِدّة والشركاء'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined, color: EddaColors.navy),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('سلة المشتريات فارغة حالياً')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search field
            TextField(
              decoration: InputDecoration(
                hintText: 'ابحث عن أداة أو قطعة غيار أو محل شريك...',
                prefixIcon: const Icon(Icons.search, color: EddaColors.muted),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: EddaColors.line),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Partner stores banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: EddaColors.line),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: EddaColors.canvas,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text('ك', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: EddaColors.navy)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('بيت الكهرباء (شريك موثّق)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('استلام فوري بكود QR أو توصيل خلال 30 دقيقة', style: TextStyle(fontSize: 10, color: EddaColors.muted)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: EddaColors.greenLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('مفتوح', style: TextStyle(color: EddaColors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text('الأكثر طلباً', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: EddaColors.navy)),
            const SizedBox(height: 12),

            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.8,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) {
                final p = products[index];
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: EddaColors.line),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 90,
                        decoration: const BoxDecoration(
                          color: EddaColors.canvas,
                          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                        ),
                        child: Center(
                          child: Icon(p['icon'], size: 36, color: EddaColors.navy),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p['title'], maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                            const SizedBox(height: 2),
                            Text(p['store'], maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 9, color: EddaColors.muted)),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(p['price'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: EddaColors.navy)),
                                Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: EddaColors.orange,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.add, color: Colors.white, size: 18),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
