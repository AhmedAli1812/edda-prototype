import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/auth_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/customer/presentation/customer_home_screen.dart';
import '../../features/technician/presentation/technician_home_screen.dart';
import '../../features/safepay/presentation/safepay_job_screen.dart';
import '../../features/store/presentation/store_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isAtLogin = state.matchedLocation == '/';

      if (!isAuth) {
        return isAtLogin ? null : '/';
      }

      if (isAtLogin) {
        return authState.role == 'TECHNICIAN' ? '/technician' : '/customer';
      }

      // Role authorization guards
      if (state.matchedLocation.startsWith('/customer') &&
          authState.role == 'TECHNICIAN') {
        return '/technician';
      }
      if (state.matchedLocation.startsWith('/technician') &&
          authState.role == 'CUSTOMER') {
        return '/customer';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/customer',
        builder: (context, state) => const CustomerHomeScreen(),
      ),
      GoRoute(
        path: '/technician',
        builder: (context, state) => const TechnicianHomeScreen(),
      ),
      GoRoute(
        path: '/safepay-job',
        builder: (context, state) => const SafePayJobScreen(),
      ),
      GoRoute(
        path: '/store',
        builder: (context, state) => const StoreScreen(),
      ),
    ],
  );
});

// Backward-compatible static router instance
final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/customer',
      builder: (context, state) => const CustomerHomeScreen(),
    ),
    GoRoute(
      path: '/technician',
      builder: (context, state) => const TechnicianHomeScreen(),
    ),
    GoRoute(
      path: '/safepay-job',
      builder: (context, state) => const SafePayJobScreen(),
    ),
    GoRoute(
      path: '/store',
      builder: (context, state) => const StoreScreen(),
    ),
  ],
);
