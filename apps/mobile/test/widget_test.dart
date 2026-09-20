import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edda_mobile/main.dart';

void main() {
  testWidgets('EddaApp renders login screen with Arabic title', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: EddaApp()));
    await tester.pumpAndSettle();

    expect(find.text('دخول إلى عِدّة'), findsOneWidget);
    expect(find.text('عِدّة'), findsOneWidget);
    expect(find.text('عميل'), findsOneWidget);
    expect(find.text('فني صيانة'), findsOneWidget);
  });
}
