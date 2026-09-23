import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/edda_colors.dart';
import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Login Controllers
  final TextEditingController _loginPhoneController = TextEditingController(text: '01012345678');
  final TextEditingController _loginPasswordController = TextEditingController();
  bool _obscureLoginPassword = true;

  // Register Controllers
  final TextEditingController _regPhoneController = TextEditingController();
  final TextEditingController _regPasswordController = TextEditingController();
  final TextEditingController _regConfirmPasswordController = TextEditingController();
  final TextEditingController _regFullNameController = TextEditingController();
  String _registrationRole = 'CUSTOMER'; // 'CUSTOMER' or 'TECHNICIAN'
  bool _obscureRegPassword = true;
  bool _obscureRegConfirmPassword = true;

  String? _clientErrorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _loginPhoneController.dispose();
    _loginPasswordController.dispose();
    _regPhoneController.dispose();
    _regPasswordController.dispose();
    _regConfirmPasswordController.dispose();
    _regFullNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final authNotifier = ref.read(authControllerProvider.notifier);

    // Listen to authentication state and navigate to corresponding role flow
    ref.listen<AuthState>(authControllerProvider, (previous, next) {
      if (next.isAuthenticated && (previous == null || !previous.isAuthenticated)) {
        if (next.role == 'TECHNICIAN') {
          context.go('/technician');
        } else {
          context.go('/customer');
        }
      }
    });

    final displayedError = _clientErrorMessage ?? authState.errorMessage;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('عِدّة | الدخول والتسجيل'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: EddaColors.orange,
          unselectedLabelColor: EddaColors.muted,
          indicatorColor: EddaColors.orange,
          tabs: const [
            Tab(text: 'تسجيل الدخول'),
            Tab(text: 'إنشاء حساب جديد'),
          ],
        ),
      ),
      body: SafeArea(
        child: authState.isLoading
            ? const Center(child: CircularProgressIndicator(color: EddaColors.orange))
            : TabBarView(
                controller: _tabController,
                children: [
                  _buildLoginTab(displayedError, authNotifier),
                  _buildRegisterTab(displayedError, authNotifier),
                ],
              ),
      ),
    );
  }

  Widget _buildLoginTab(String? errorMessage, AuthController notifier) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildLogo(),
          const SizedBox(height: 24),
          if (errorMessage != null) _buildErrorBanner(errorMessage),
          TextField(
            key: const Key('login_phone_field'),
            controller: _loginPhoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'رقم المحمول (مثال: 01012345678)',
              prefixIcon: Icon(Icons.phone_outlined, color: EddaColors.muted),
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            key: const Key('login_password_field'),
            controller: _loginPasswordController,
            obscureText: _obscureLoginPassword,
            decoration: InputDecoration(
              labelText: 'كلمة المرور',
              prefixIcon: const Icon(Icons.lock_outline, color: EddaColors.muted),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureLoginPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: EddaColors.muted,
                ),
                onPressed: () {
                  setState(() => _obscureLoginPassword = !_obscureLoginPassword);
                },
              ),
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            key: const Key('login_button'),
            onPressed: () async {
              setState(() => _clientErrorMessage = null);
              final phone = _loginPhoneController.text.trim();
              final password = _loginPasswordController.text;

              if (phone.isEmpty) {
                setState(() => _clientErrorMessage = 'يرجى إدخال رقم المحمول');
                return;
              }
              if (password.isEmpty) {
                setState(() => _clientErrorMessage = 'يرجى إدخال كلمة المرور');
                return;
              }

              await notifier.loginWithPassword(
                phone: phone,
                password: password,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: EddaColors.navy,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text('دخول', style: TextStyle(fontSize: 16)),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterTab(String? errorMessage, AuthController notifier) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (errorMessage != null) _buildErrorBanner(errorMessage),
          const Text(
            'نوع الحساب',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: EddaColors.navy),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ChoiceChip(
                  key: const Key('role_customer_chip'),
                  label: const Center(child: Text('عميل')),
                  selected: _registrationRole == 'CUSTOMER',
                  selectedColor: EddaColors.orange.withValues(alpha: 0.2),
                  labelStyle: TextStyle(
                    color: _registrationRole == 'CUSTOMER' ? EddaColors.orange : EddaColors.navy,
                    fontWeight: FontWeight.bold,
                  ),
                  onSelected: (val) {
                    if (val) setState(() => _registrationRole = 'CUSTOMER');
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ChoiceChip(
                  key: const Key('role_technician_chip'),
                  label: const Center(child: Text('فني')),
                  selected: _registrationRole == 'TECHNICIAN',
                  selectedColor: EddaColors.navy.withValues(alpha: 0.15),
                  labelStyle: TextStyle(
                    color: _registrationRole == 'TECHNICIAN' ? EddaColors.navy : Colors.black87,
                    fontWeight: FontWeight.bold,
                  ),
                  onSelected: (val) {
                    if (val) setState(() => _registrationRole = 'TECHNICIAN');
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            key: const Key('reg_phone_field'),
            controller: _regPhoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'رقم المحمول المصري (مثال: 01012345678)',
              prefixIcon: Icon(Icons.phone_outlined, color: EddaColors.muted),
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('reg_fullname_field'),
            controller: _regFullNameController,
            decoration: const InputDecoration(
              labelText: 'الاسم الكامل (اختياري)',
              prefixIcon: Icon(Icons.person_outline, color: EddaColors.muted),
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('reg_password_field'),
            controller: _regPasswordController,
            obscureText: _obscureRegPassword,
            decoration: InputDecoration(
              labelText: 'كلمة المرور (8 أحرف على الأقل)',
              prefixIcon: const Icon(Icons.lock_outline, color: EddaColors.muted),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureRegPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: EddaColors.muted,
                ),
                onPressed: () {
                  setState(() => _obscureRegPassword = !_obscureRegPassword);
                },
              ),
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('reg_confirm_password_field'),
            controller: _regConfirmPasswordController,
            obscureText: _obscureRegConfirmPassword,
            decoration: InputDecoration(
              labelText: 'تأكيد كلمة المرور',
              prefixIcon: const Icon(Icons.lock_reset_outlined, color: EddaColors.muted),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureRegConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: EddaColors.muted,
                ),
                onPressed: () {
                  setState(() => _obscureRegConfirmPassword = !_obscureRegConfirmPassword);
                },
              ),
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            key: const Key('register_button'),
            onPressed: () async {
              setState(() => _clientErrorMessage = null);
              final phone = _regPhoneController.text.trim();
              final password = _regPasswordController.text;
              final confirmPassword = _regConfirmPasswordController.text;
              final fullName = _regFullNameController.text.trim();

              if (phone.isEmpty) {
                setState(() => _clientErrorMessage = 'يرجى إدخال رقم المحمول');
                return;
              }

              if (password.length < 8) {
                setState(() => _clientErrorMessage = 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل');
                return;
              }

              if (password != confirmPassword) {
                setState(() => _clientErrorMessage = 'كلمة المرور وتأكيد كلمة المرور غير متطابقين');
                return;
              }

              await notifier.register(
                phone: phone,
                password: password,
                role: _registrationRole,
                fullName: fullName.isNotEmpty ? fullName : null,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: EddaColors.orange,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text('إنشاء حساب', style: TextStyle(fontSize: 16)),
          ),
        ],
      ),
    );
  }

  Widget _buildLogo() {
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: EddaColors.orange,
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Center(
            child: Text(
              'ع',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'عِدّة',
          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: EddaColors.navy),
        ),
        const Text(
          'صيانة مضمونة ومتجر قطع غيار موثوق',
          style: TextStyle(fontSize: 12, color: EddaColors.muted),
        ),
      ],
    );
  }

  Widget _buildErrorBanner(String message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Text(
        message,
        style: TextStyle(color: Colors.red.shade800, fontSize: 13),
      ),
    );
  }
}
