class ApiConstants {
  // Use 10.0.2.2 for Android emulator, localhost for iOS simulator / web
  static const String baseUrl = 'http://10.0.2.2:4000/api/v1';

  static const String sendOtp = '/auth/otp/send';
  static const String verifyOtp = '/auth/otp/verify';
  static const String refreshToken = '/auth/token/refresh';
  static const String logout = '/auth/logout';
  static const String userMe = '/users/me';
  static const String authorizePayment = '/payments/authorize';
}
