import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/customer/presentation/customer_home_screen.dart';
import '../../features/technician/presentation/technician_home_screen.dart';
import '../../features/safepay/presentation/safepay_job_screen.dart';
import '../../features/store/presentation/store_screen.dart';

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
