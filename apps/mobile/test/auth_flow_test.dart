import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edda_mobile/features/auth/presentation/login_screen.dart';
import 'package:edda_mobile/features/auth/presentation/auth_controller.dart';
import 'package:edda_mobile/features/auth/data/auth_repository.dart';
import 'package:edda_mobile/features/auth/domain/auth_models.dart';
import 'package:edda_mobile/core/storage/secure_storage_service.dart';
import 'package:edda_mobile/core/router/app_router.dart';

class MockSecureStorage extends SecureStorageService {
  String? accessToken;
  String? refreshToken;
  String? userRole;

  @override
  Future<String?> getAccessToken() async => accessToken;

  @override
  Future<String?> getRefreshToken() async => refreshToken;

  @override
  Future<String?> getUserRole() async => userRole;

  @override
  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  @override
  Future<void> saveUserRole(String role) async {
    userRole = role;
  }

  @override
  Future<void> clearAll() async {
    accessToken = null;
    refreshToken = null;
    userRole = null;
  }
}

class FakeAuthRepository extends AuthRepository {
  bool shouldFailLogin = false;
  bool shouldFailRegister = false;
  String? lastRegisteredRole;
  String? lastLoginPhone;

  @override
  Future<AuthSession> loginWithPassword({
    required String phone,
    required String password,
  }) async {
    lastLoginPhone = phone;
    if (shouldFailLogin) {
      throw Exception('Invalid credentials');
    }
    return AuthSession(
      accessToken: 'fake_access_token',
      refreshToken: 'fake_refresh_token',
      user: UserSummary(
        id: 'u-1',
        phone: phone,
        fullName: 'عميل تجريبي',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      ),
    );
  }

  @override
  Future<AuthSession> register({
    required String phone,
    required String password,
    required String role,
    String? fullName,
  }) async {
    lastRegisteredRole = role;
    if (shouldFailRegister) {
      throw Exception('Registration failed');
    }
    return AuthSession(
      accessToken: 'fake_reg_access_token',
      refreshToken: 'fake_reg_refresh_token',
      user: UserSummary(
        id: 'u-reg-1',
        phone: phone,
        fullName: fullName ?? (role == 'TECHNICIAN' ? 'فني عِدّة' : 'عميل عِدّة'),
        role: role,
        status: 'ACTIVE',
      ),
    );
  }
}

void main() {
  group('Auth Flow Tests', () {
    late FakeAuthRepository fakeRepo;
    late MockSecureStorage mockStorage;

    setUp(() {
      fakeRepo = FakeAuthRepository();
      mockStorage = MockSecureStorage();
    });

    test('AuthController registers CUSTOMER and updates authenticated state with CUSTOMER role', () async {
      final controller = AuthController(
        repository: fakeRepo,
        storage: mockStorage,
      );

      final ok = await controller.register(
        phone: '01012345678',
        password: 'Password123',
        role: 'CUSTOMER',
        fullName: 'أحمد عميل',
      );

      expect(ok, true);
      expect(controller.state.isAuthenticated, true);
      expect(controller.state.role, 'CUSTOMER');
      expect(fakeRepo.lastRegisteredRole, 'CUSTOMER');
    });

    test('AuthController registers TECHNICIAN and updates authenticated state with TECHNICIAN role', () async {
      final controller = AuthController(
        repository: fakeRepo,
        storage: mockStorage,
      );

      final ok = await controller.register(
        phone: '01198765432',
        password: 'Password123',
        role: 'TECHNICIAN',
        fullName: 'محمود فني',
      );

      expect(ok, true);
      expect(controller.state.isAuthenticated, true);
      expect(controller.state.role, 'TECHNICIAN');
      expect(fakeRepo.lastRegisteredRole, 'TECHNICIAN');
    });

    test('AuthController logs in with phone and password', () async {
      final controller = AuthController(
        repository: fakeRepo,
        storage: mockStorage,
      );

      final ok = await controller.loginWithPassword(
        phone: '01012345678',
        password: 'Password123',
      );

      expect(ok, true);
      expect(controller.state.isAuthenticated, true);
      expect(controller.state.role, 'CUSTOMER');
      expect(fakeRepo.lastLoginPhone, '01012345678');
    });

    test('AuthController handles failed login and sets friendly error message', () async {
      fakeRepo.shouldFailLogin = true;
      final controller = AuthController(
        repository: fakeRepo,
        storage: mockStorage,
      );

      final ok = await controller.loginWithPassword(
        phone: '01012345678',
        password: 'WrongPassword',
      );

      expect(ok, false);
      expect(controller.state.isAuthenticated, false);
      expect(controller.state.errorMessage, contains('بيانات الدخول غير صحيحة'));
    });

    testWidgets('LoginScreen shows phone & password fields and validates password mismatch on registration', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(fakeRepo),
            secureStorageProvider.overrideWithValue(mockStorage),
          ],
          child: const MaterialApp(
            home: LoginScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify Login Tab elements
      expect(find.byKey(const Key('login_phone_field')), findsOneWidget);
      expect(find.byKey(const Key('login_password_field')), findsOneWidget);
      expect(find.byKey(const Key('login_button')), findsOneWidget);

      // Switch to Registration Tab
      await tester.tap(find.text('إنشاء حساب جديد'));
      await tester.pumpAndSettle();

      // Verify Account Type selector (عميل / فني)
      expect(find.byKey(const Key('role_customer_chip')), findsOneWidget);
      expect(find.byKey(const Key('role_technician_chip')), findsOneWidget);
      expect(find.text('عميل'), findsOneWidget);
      expect(find.text('فني'), findsOneWidget);

      // Verify Registration input fields
      expect(find.byKey(const Key('reg_phone_field')), findsOneWidget);
      expect(find.byKey(const Key('reg_password_field')), findsOneWidget);
      expect(find.byKey(const Key('reg_confirm_password_field')), findsOneWidget);
      expect(find.byKey(const Key('register_button')), findsOneWidget);

      // Tap on فني chip to switch role
      await tester.tap(find.byKey(const Key('role_technician_chip')));
      await tester.pumpAndSettle();

      // Test client-side validation: Password mismatch
      await tester.enterText(find.byKey(const Key('reg_phone_field')), '01012345678');
      await tester.enterText(find.byKey(const Key('reg_password_field')), 'Password123');
      await tester.enterText(find.byKey(const Key('reg_confirm_password_field')), 'DifferentPassword');
      await tester.tap(find.byKey(const Key('register_button')));
      await tester.pumpAndSettle();

      // Verify error banner is shown
      expect(find.text('كلمة المرور وتأكيد كلمة المرور غير متطابقين'), findsOneWidget);

      // Test client-side validation: Password < 8 chars
      await tester.enterText(find.byKey(const Key('reg_password_field')), '1234567');
      await tester.enterText(find.byKey(const Key('reg_confirm_password_field')), '1234567');
      await tester.tap(find.byKey(const Key('register_button')));
      await tester.pumpAndSettle();

      expect(find.text('كلمة المرور يجب أن تتكون من 8 أحرف على الأقل'), findsOneWidget);
    });

    testWidgets('Router redirects CUSTOMER to /customer and TECHNICIAN to /technician', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(fakeRepo),
            secureStorageProvider.overrideWithValue(mockStorage),
          ],
          child: Consumer(
            builder: (context, ref, _) {
              final router = ref.watch(routerProvider);
              return MaterialApp.router(
                routerConfig: router,
              );
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Initially at Login screen
      expect(find.text('عِدّة | الدخول والتسجيل'), findsOneWidget);

      // Switch to Register tab
      await tester.tap(find.text('إنشاء حساب جديد'));
      await tester.pumpAndSettle();

      // Select فني (TECHNICIAN)
      await tester.tap(find.byKey(const Key('role_technician_chip')));
      await tester.pumpAndSettle();

      // Fill valid registration form
      await tester.enterText(find.byKey(const Key('reg_phone_field')), '01198765432');
      await tester.enterText(find.byKey(const Key('reg_password_field')), 'Password123');
      await tester.enterText(find.byKey(const Key('reg_confirm_password_field')), 'Password123');
      await tester.tap(find.byKey(const Key('register_button')));
      await tester.pumpAndSettle();

      // Should be redirected to Technician Home screen
      expect(find.text('أنت متاح لاستقبال الطلبات'), findsOneWidget);
    });
  });
}
