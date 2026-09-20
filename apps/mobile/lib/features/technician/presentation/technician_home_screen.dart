import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/edda_colors.dart';

class TechnicianHomeScreen extends StatefulWidget {
  const TechnicianHomeScreen({super.key});

  @override
  State<TechnicianHomeScreen> createState() => _TechnicianHomeScreenState();
}

class _TechnicianHomeScreenState extends State<TechnicianHomeScreen> {
  bool _isOnline = true;

  final List<Map<String, dynamic>> _jobRequests = const [
    {
      'id': 'REQ-2048',
      'category': 'كهرباء',
      'title': 'مفتاح كهرباء يفصل باستمرار بالمطبخ',
      'location': 'مدينة نصر • 1.2 كم (العنوان التفصيلي بعد الحجز)',
      'budget': '300 - 500 ج.م',
      'time': 'منذ 5 دقائق',
    },
    {
      'id': 'REQ-2049',
      'category': 'تكييف',
      'title': 'التكييف لا يبرد ويصدر صوت أزيز',
      'location': 'مصر الجديدة • 2.4 كم',
      'budget': '450 - 700 ج.م',
      'time': 'منذ 12 دقيقة',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EddaColors.canvas,
      body: CustomScrollView(
        slivers: [
          // Technician Hero Header
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 48, 20, 24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [EddaColors.navy, Color(0xFF146246)],
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
                            backgroundColor: Colors.white.withValues(alpha: 0.2),
                            child: const Text('أ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 12),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('أهلاً، أحمد سالم', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                              Text('فني كهرباء موثّق • ★ 4.9', style: TextStyle(color: Colors.white70, fontSize: 11)),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: () => context.go('/'),
                        icon: const Icon(Icons.logout, color: Colors.white70),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Online Toggle
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isOnline ? 'أنت متاح لاستقبال الطلبات' : 'أنت غير متاح حالياً',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const Text('تظهر للعملاء القريبين بنطاق 15 كم', style: TextStyle(color: Colors.white70, fontSize: 10)),
                          ],
                        ),
                        Switch(
                          value: _isOnline,
                          activeThumbColor: EddaColors.green,
                          onChanged: (val) => setState(() => _isOnline = val),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stats row
                  Row(
                    children: [
                      _buildStatItem('التقييم', '4.9 ★'),
                      const SizedBox(width: 8),
                      _buildStatItem('خدمات منجزة', '146'),
                      const SizedBox(width: 8),
                      _buildStatItem('متاح للسحب', '4,860 ج.م'),
                    ],
                  ),
                  const SizedBox(height: 24),

                  const Text('طلبات صيانة قريبة منك', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: EddaColors.navy)),
                  const SizedBox(height: 12),

                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _jobRequests.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final job = _jobRequests[index];
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: EddaColors.line),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: EddaColors.orangeLight,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(job['category'], style: const TextStyle(color: EddaColors.orange, fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                                Text(job['time'], style: const TextStyle(color: EddaColors.muted, fontSize: 10)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(job['title'], style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('📍 ${job['location']}', style: const TextStyle(fontSize: 11, color: EddaColors.muted)),
                            const Divider(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('الميزانية: ${job['budget']}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: EddaColors.navy)),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    minimumSize: const Size(110, 38),
                                    backgroundColor: EddaColors.navy,
                                  ),
                                  onPressed: () => _showBidDialog(context, job),
                                  child: const Text('قدّم عرض', style: TextStyle(fontSize: 12)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: EddaColors.line),
        ),
        child: Column(
          children: [
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: EddaColors.navy)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 10, color: EddaColors.muted)),
          ],
        ),
      ),
    );
  }

  void _showBidDialog(BuildContext context, Map<String, dynamic> job) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('تقديم عرض سعر محمي', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: EddaColors.navy)),
              const Text('السعر يشمل المعاينة والإصلاح الأساسي. أي قطع غيار تُضاف كطلب تغيير.', style: TextStyle(fontSize: 11, color: EddaColors.muted)),
              const SizedBox(height: 16),
              const TextField(
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'السعر المقترح (ج.م)',
                  hintText: '340',
                ),
              ),
              const SizedBox(height: 12),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'وقت الوصول المتوقع',
                  hintText: 'خلال 45 دقيقة',
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('تم إرسال العرض للعميل بنجاح')),
                  );
                },
                child: const Text('إرسال العرض'),
              ),
            ],
          ),
        );
      },
    );
  }
}
