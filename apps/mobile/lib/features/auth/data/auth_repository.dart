import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../domain/auth_models.dart';

class AuthRepository {
  final DioClient _dioClient;
  final SecureStorageService _storage;

  AuthRepository({
    DioClient? dioClient,
    SecureStorageService? storage,
  })  : _dioClient = dioClient ?? DioClient(),
        _storage = storage ?? SecureStorageService();

  Future<Map<String, dynamic>> sendOtp({
    required String phone,
    required String purpose, // 'LOGIN' or 'REGISTRATION'
  }) async {
    final response = await _dioClient.dio.post(
      ApiConstants.sendOtp,
      data: {
        'phone': phone,
        'purpose': purpose,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<String> verifyRegistrationOtp({
    required String phone,
    required String code,
  }) async {
    final response = await _dioClient.dio.post(
      ApiConstants.verifyRegistrationOtp,
      data: {
        'phone': phone,
        'code': code,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return data['onboardingToken'] as String;
  }

  Future<AuthSession> login({
    required String phone,
    required String code,
  }) async {
    final response = await _dioClient.dio.post(
      ApiConstants.login,
      data: {
        'phone': phone,
        'code': code,
      },
    );
    final session = AuthSession.fromJson(response.data as Map<String, dynamic>);
    await _saveSession(session);
    return session;
  }

  Future<AuthSession> registerCustomer({
    required String onboardingToken,
    required String fullName,
    String? email,
    String? governorate,
    String? city,
    String? street,
  }) async {
    final response = await _dioClient.dio.post(
      ApiConstants.registerCustomer,
      data: {
        'onboardingToken': onboardingToken,
        'fullName': fullName,
        if (email != null && email.isNotEmpty) 'email': email,
        if (governorate != null && governorate.isNotEmpty) 'governorate': governorate,
        if (city != null && city.isNotEmpty) 'city': city,
        if (street != null && street.isNotEmpty) 'street': street,
      },
    );
    final session = AuthSession.fromJson(response.data as Map<String, dynamic>);
    await _saveSession(session);
    return session;
  }

  Future<AuthSession> registerTechnician({
    required String onboardingToken,
    required String fullName,
    required String nationalId,
    required List<String> categories,
    String? bio,
    int? serviceRadiusKm,
  }) async {
    final response = await _dioClient.dio.post(
      ApiConstants.registerTechnician,
      data: {
        'onboardingToken': onboardingToken,
        'fullName': fullName,
        'nationalId': nationalId,
        'categories': categories,
        if (bio != null && bio.isNotEmpty) 'bio': bio,
        if (serviceRadiusKm != null) 'serviceRadiusKm': serviceRadiusKm,
      },
    );
    final session = AuthSession.fromJson(response.data as Map<String, dynamic>);
    await _saveSession(session);
    return session;
  }

  Future<void> logout() async {
    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken != null) {
      try {
        await _dioClient.dio.post(
          ApiConstants.logout,
          data: {'refreshToken': refreshToken},
        );
      } catch (_) {
        // Continue clearing local storage even if network call fails
      }
    }
    await _storage.clearAll();
  }

  Future<void> _saveSession(AuthSession session) async {
    await _storage.saveTokens(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
    await _storage.saveUserRole(session.user.role);
  }
}
