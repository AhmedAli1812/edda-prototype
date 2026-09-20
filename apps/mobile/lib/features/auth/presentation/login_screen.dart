import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/edda_colors.dart';
import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Controllers
  final TextEditingController _loginPhoneController = TextEditingController(text: '01012345678');
  final TextEditingController _loginOtpController = TextEditingController();

  final TextEditingController _regPhoneController = TextEditingController();
  final TextEditingController _regOtpController = TextEditingController();
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _nationalIdController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _streetController = TextEditingController();
  final TextEditingController _bioController = TextEditingController();

  String _registrationRole = 'CUSTOMER'; // 'CUSTOMER' or 'TECHNICIAN'
  final Set<String> _selectedCategories = {'electricity'};

  // Timer
  Timer? _cooldownTimer;
  int _secondsRemaining = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _tabController.dispose();
    _loginPhoneController.dispose();
    _loginOtpController.dispose();
    _regPhoneController.dispose();
    _regOtpController.dispose();
    _fullNameController.dispose();
    _nationalIdController.dispose();
    _cityController.dispose();
    _streetController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  void _startCooldown(int seconds) {
    setState(() => _secondsRemaining = seconds);
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 1) {
        setState(() => _secondsRemaining--);
      } else {
        timer.cancel();
        setState(() => _secondsRemaining = 0);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final authNotifier = ref.read(authControllerProvider.notifier);

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
                  _buildLoginTab(authState, authNotifier),
                  _buildRegisterTab(authState, authNotifier),
                ],
              ),
      ),
    );
  }

  Widget _buildLoginTab(AuthState state, AuthController notifier) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildLogo(),
          const SizedBox(height: 24),
          if (state.errorMessage != null) _buildErrorBanner(state.errorMessage!),
          TextField(
            controller: _loginPhoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'رقم المحمول (مثال: 01012345678)',
              prefixIcon: Icon(Icons.phone_outlined, color: EddaColors.muted),
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          if (state.otpSent) ...[
            TextField(
              controller: _loginOtpController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(
                labelText: 'رمز التحقق (6 أرقام)',
                prefixIcon: Icon(Icons.lock_clock_outlined, color: EddaColors.muted),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
          ],
          ElevatedButton(
            onPressed: () async {
              if (!state.otpSent) {
                final ok = await notifier.requestOtp(
                  phone: _loginPhoneController.text.trim(),
                  purpose: 'LOGIN',
                );
                if (ok) {
                  _startCooldown(state.cooldownSeconds > 0 ? state.cooldownSeconds : 60);
                }
              } else {
                await notifier.loginWithOtp(
                  phone: _loginPhoneController.text.trim(),
                  code: _loginOtpController.text.trim(),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: EddaColors.navy,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text(state.otpSent ? 'تأكيد الدخول' : 'إرسال رمز التحقق'),
          ),
          if (state.otpSent && _secondsRemaining > 0) ...[
            const SizedBox(height: 12),
            Text(
              'يمكنك إعادة طلب الرمز بعد $_secondsRemaining ثانية',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: EddaColors.muted),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRegisterTab(AuthState state, AuthController notifier) {
    final hasOnboardingToken = state.onboardingToken != null;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (state.errorMessage != null) _buildErrorBanner(state.errorMessage!),
          if (!hasOnboardingToken) ...[
            const Text(
              'الخطوة 1: التحقق من رقم الهاتف',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: EddaColors.navy),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _regPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'رقم المحمول المصري',
                prefixIcon: Icon(Icons.phone_outlined, color: EddaColors.muted),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            if (state.otpSent) ...[
              TextField(
                controller: _regOtpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: const InputDecoration(
                  labelText: 'رمز التحقق (6 أرقام)',
                  prefixIcon: Icon(Icons.lock_clock_outlined, color: EddaColors.muted),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
            ],
            ElevatedButton(
              onPressed: () async {
                if (!state.otpSent) {
                  final ok = await notifier.requestOtp(
                    phone: _regPhoneController.text.trim(),
                    purpose: 'REGISTRATION',
                  );
                  if (ok) {
                    _startCooldown(state.cooldownSeconds > 0 ? state.cooldownSeconds : 60);
                  }
                } else {
                  await notifier.verifyRegistrationOtp(
                    phone: _regPhoneController.text.trim(),
                    code: _regOtpController.text.trim(),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: EddaColors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(state.otpSent ? 'تأكيد الرمز والمتابعة' : 'إرسال رمز التحقق'),
            ),
          ] else ...[
            const Text(
              'الخطوة 2: استكمال بيانات الحساب',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: EddaColors.navy),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ChoiceChip(
                    label: const Text('عميل'),
                    selected: _registrationRole == 'CUSTOMER',
                    onSelected: (val) => setState(() => _registrationRole = 'CUSTOMER'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ChoiceChip(
                    label: const Text('فني صيانة'),
                    selected: _registrationRole == 'TECHNICIAN',
                    onSelected: (val) => setState(() => _registrationRole = 'TECHNICIAN'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _fullNameController,
              decoration: const InputDecoration(
                labelText: 'الاسم الكامل',
                prefixIcon: Icon(Icons.person_outline),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            if (_registrationRole == 'CUSTOMER') ...[
              TextField(
                controller: _cityController,
                decoration: const InputDecoration(
                  labelText: 'المدينة / المنطقة',
                  prefixIcon: Icon(Icons.location_city_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _streetController,
                decoration: const InputDecoration(
                  labelText: 'الشارع / العنوان',
                  prefixIcon: Icon(Icons.home_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
            ] else ...[
              TextField(
                controller: _nationalIdController,
                keyboardType: TextInputType.number,
                maxLength: 14,
                decoration: const InputDecoration(
                  labelText: 'الرقم القومي (14 رقم)',
                  prefixIcon: Icon(Icons.badge_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
              const Text('تخصصات الصيانة:', style: TextStyle(fontWeight: FontWeight.bold)),
              Wrap(
                spacing: 8,
                children: [
                  FilterChip(
                    label: const Text('كهرباء'),
                    selected: _selectedCategories.contains('electricity'),
                    onSelected: (val) => setState(() {
                      val ? _selectedCategories.add('electricity') : _selectedCategories.remove('electricity');
                    }),
                  ),
                  FilterChip(
                    label: const Text('سباكة'),
                    selected: _selectedCategories.contains('plumbing'),
                    onSelected: (val) => setState(() {
                      val ? _selectedCategories.add('plumbing') : _selectedCategories.remove('plumbing');
                    }),
                  ),
                  FilterChip(
                    label: const Text('تكييف'),
                    selected: _selectedCategories.contains('ac'),
                    onSelected: (val) => setState(() {
                      val ? _selectedCategories.add('ac') : _selectedCategories.remove('ac');
                    }),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _bioController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'نبذة عن خبراتك وسنوات العمل',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                if (_registrationRole == 'CUSTOMER') {
                  await notifier.registerCustomer(
                    fullName: _fullNameController.text.trim(),
                    city: _cityController.text.trim(),
                    street: _streetController.text.trim(),
                  );
                } else {
                  await notifier.registerTechnician(
                    fullName: _fullNameController.text.trim(),
                    nationalId: _nationalIdController.text.trim(),
                    categories: _selectedCategories.toList(),
                    bio: _bioController.text.trim(),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: EddaColors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('إتمام التسجيل والدخول'),
            ),
          ],
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
