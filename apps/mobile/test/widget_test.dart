import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edda_mobile/main.dart';

void main() {
  testWidgets('EddaApp renders login screen with Arabic title', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: EddaApp()));
    await tester.pumpAndSettle();

    expect(find.text('عِدّة | الدخول والتسجيل'), findsOneWidget);
    expect(find.text('عِدّة'), findsOneWidget);
    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(find.text('إنشاء حساب جديد'), findsOneWidget);
  });
}
