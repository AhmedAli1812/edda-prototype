import 'package:flutter/material.dart';
import '../../../core/theme/edda_colors.dart';

class SafePayJobScreen extends StatelessWidget {
  const SafePayJobScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EddaColors.canvas,
      appBar: AppBar(
        title: const Text('متابعة الخدمة وSafePay'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shield_outlined, color: EddaColors.orange),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('مركز حماية SafePay والنزاعات')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // SafePay Card
            Container(
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
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: EddaColors.greenLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text('الفني في الطريق', style: TextStyle(color: EddaColors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                      const Text('#SRV-2048', style: TextStyle(color: EddaColors.muted, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('إصلاح عطل كهربائي بالمطبخ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const Text('الفني: أحمد سالم (★ 4.9)', style: TextStyle(color: EddaColors.muted, fontSize: 12)),
                  const Divider(height: 24),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('المبلغ المحجوز لدى البوابة', style: TextStyle(fontSize: 12, color: EddaColors.muted)),
                      Text('350.00 ج.م', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: EddaColors.navy)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // OTP Section
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: EddaColors.line),
              ),
              child: Column(
                children: [
                  const Text('كود تأكيد الوصول (Arrival OTP)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: EddaColors.navy)),
                  const SizedBox(height: 4),
                  const Text('شارك هذا الكود مع الفني عند وصوله لتأكيد الزيارة', style: TextStyle(fontSize: 11, color: EddaColors.muted)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: ['4', '8', '2', '1'].map((digit) {
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        width: 50,
                        height: 56,
                        decoration: BoxDecoration(
                          color: EddaColors.canvas,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: EddaColors.line),
                        ),
                        child: Center(
                          child: Text(
                            digit,
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: EddaColors.navy),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Protection Note
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: EddaColors.navy,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                children: [
                  Icon(Icons.lock_outline, color: EddaColors.orange, size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('حماية SafePay من عِدّة', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('المبلغ محجوز لدى بوابة الدفع ولا يُحوّل للفني إلا بعد انتهاء نافذة الاعتراض 24 ساعة.', style: TextStyle(color: Colors.white70, fontSize: 10)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 48),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      side: const BorderSide(color: EddaColors.line),
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('المحادثة الوسيطة قيد التشغيل')),
                      );
                    },
                    icon: const Icon(Icons.chat_bubble_outline, color: EddaColors.navy, size: 18),
                    label: const Text('محادثة', style: TextStyle(color: EddaColors.navy, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      _showChangeOrderModal(context);
                    },
                    child: const Text('طلب إضافة'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showChangeOrderModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('طلب تغيير أو قطع غيار إضافية', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: EddaColors.navy)),
              const SizedBox(height: 6),
              const Text('أي قطعة غيار أو عمل إضافي يتطلب موافقتك ودفع قيمته داخل التطبيق.', style: TextStyle(fontSize: 11, color: EddaColors.muted)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: EddaColors.canvas,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: EddaColors.line),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('مفتاح شنايدر أصلي (بيت الكهرباء)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    Text('95.00 ج.م', style: TextStyle(fontWeight: FontWeight.bold, color: EddaColors.orange)),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('تمت الموافقة ودفع الإضافة بنظام SafePay')),
                  );
                },
                child: const Text('موافقة ودفع 95 ج.م'),
              ),
            ],
          ),
        );
      },
    );
  }
}
