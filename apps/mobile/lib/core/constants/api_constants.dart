class ApiConstants {
  // Use 10.0.2.2 for Android emulator, 127.0.0.1 for Web/Desktop/iOS
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api/v1',
  );
  static const String sendOtp = '/auth/otp/send';
  static const String verifyRegistrationOtp = '/auth/otp/verify-registration';
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String registerCustomer = '/auth/register/customer';
  static const String registerTechnician = '/auth/register/technician';
  static const String refreshToken = '/auth/token/refresh';
  static const String logout = '/auth/logout';
  static const String revokeAllSessions = '/auth/revoke-all-sessions';
  static const String userMe = '/users/me';
  static const String deviceToken = '/auth/device-token';
  static const String authorizePayment = '/payments/authorize';
}
