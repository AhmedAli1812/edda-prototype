import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/edda_colors.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _phoneController = TextEditingController(text: '01012345678');
  final TextEditingController _otpController = TextEditingController(text: '4821');
  bool _otpSent = false;
  String _selectedRole = 'CUSTOMER'; // CUSTOMER or TECHNICIAN

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('دخول إلى عِدّة'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              Center(
                child: Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    color: EddaColors.orange,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: EddaColors.orange.withValues(alpha: 0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'ع',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'عِدّة',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: EddaColors.navy,
                ),
              ),
              const Text(
                'صيانة مضمونة ومتجر موثوق في مكان واحد',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: EddaColors.muted,
                ),
              ),
              const SizedBox(height: 32),

              // Persona Switcher
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedRole = 'CUSTOMER'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _selectedRole == 'CUSTOMER' ? EddaColors.orangeLight : EddaColors.canvas,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _selectedRole == 'CUSTOMER' ? EddaColors.orange : EddaColors.line,
                          ),
                        ),
                        child: Text(
                          'عميل',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _selectedRole == 'CUSTOMER' ? EddaColors.orange : EddaColors.muted,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedRole = 'TECHNICIAN'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _selectedRole == 'TECHNICIAN' ? EddaColors.greenLight : EddaColors.canvas,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _selectedRole == 'TECHNICIAN' ? EddaColors.green : EddaColors.line,
                          ),
                        ),
                        child: Text(
                          'فني صيانة',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _selectedRole == 'TECHNICIAN' ? EddaColors.green : EddaColors.muted,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'رقم الموبايل',
                  prefixIcon: Icon(Icons.phone_outlined, color: EddaColors.muted),
                ),
              ),
              const SizedBox(height: 16),

              if (_otpSent) ...[
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'رمز التحقق (OTP)',
                    prefixIcon: Icon(Icons.lock_clock_outlined, color: EddaColors.muted),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'رمز الاختبار التلقائي: 4821',
                  style: TextStyle(fontSize: 11, color: EddaColors.muted),
                ),
                const SizedBox(height: 16),
              ],

              const Spacer(),

              ElevatedButton(
                onPressed: () {
                  if (!_otpSent) {
                    setState(() => _otpSent = true);
                  } else {
                    if (_selectedRole == 'CUSTOMER') {
                      context.go('/customer');
                    } else {
                      context.go('/technician');
                    }
                  }
                },
                child: Text(_otpSent ? 'تأكيد ودخول' : 'إرسال رمز التحقق'),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
