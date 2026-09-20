import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import '../domain/auth_models.dart';
import '../../../core/storage/secure_storage_service.dart';

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final UserSummary? user;
  final String? role;
  final String? errorMessage;
  final bool otpSent;
  final String? onboardingToken;
  final int cooldownSeconds;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.role,
    this.errorMessage,
    this.otpSent = false,
    this.onboardingToken,
    this.cooldownSeconds = 0,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    UserSummary? user,
    String? role,
    String? errorMessage,
    bool? otpSent,
    String? onboardingToken,
    int? cooldownSeconds,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      role: role ?? this.role,
      errorMessage: errorMessage,
      otpSent: otpSent ?? this.otpSent,
      onboardingToken: onboardingToken ?? this.onboardingToken,
      cooldownSeconds: cooldownSeconds ?? this.cooldownSeconds,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  final AuthRepository _repository;
  final SecureStorageService _storage;

  AuthController({
    required AuthRepository repository,
    required SecureStorageService storage,
  })  : _repository = repository,
        _storage = storage,
        super(const AuthState()) {
    checkInitialAuth();
  }

  Future<void> checkInitialAuth() async {
    final token = await _storage.getAccessToken();
    final role = await _storage.getUserRole();
    if (token != null && role != null) {
      state = state.copyWith(
        isAuthenticated: true,
        role: role,
      );
    }
  }

  Future<bool> requestOtp({
    required String phone,
    required String purpose, // 'LOGIN' or 'REGISTRATION'
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _repository.sendOtp(phone: phone, purpose: purpose);
      final cooldown = (res['cooldownSeconds'] as num?)?.toInt() ?? 60;
      state = state.copyWith(
        isLoading: false,
        otpSent: true,
        cooldownSeconds: cooldown,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل إرسال رمز التحقق. يرجى التأكد من صحة الرقم.',
      );
      return false;
    }
  }

  Future<bool> verifyRegistrationOtp({
    required String phone,
    required String code,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final token = await _repository.verifyRegistrationOtp(phone: phone, code: code);
      state = state.copyWith(
        isLoading: false,
        onboardingToken: token,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
      );
      return false;
    }
  }

  Future<bool> loginWithOtp({
    required String phone,
    required String code,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final session = await _repository.login(phone: phone, code: code);
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: session.user,
        role: session.user.role,
        otpSent: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'بيانات الدخول أو رمز التحقق غير صحيح',
      );
      return false;
    }
  }

  Future<bool> registerCustomer({
    required String fullName,
    String? email,
    String? governorate,
    String? city,
    String? street,
  }) async {
    if (state.onboardingToken == null) return false;
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final session = await _repository.registerCustomer(
        onboardingToken: state.onboardingToken!,
        fullName: fullName,
        email: email,
        governorate: governorate,
        city: city,
        street: street,
      );
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: session.user,
        role: session.user.role,
        onboardingToken: null,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل إتمام التسجيل. يرجى المحاولة مجدداً.',
      );
      return false;
    }
  }

  Future<bool> registerTechnician({
    required String fullName,
    required String nationalId,
    required List<String> categories,
    String? bio,
    int? serviceRadiusKm,
  }) async {
    if (state.onboardingToken == null) return false;
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final session = await _repository.registerTechnician(
        onboardingToken: state.onboardingToken!,
        fullName: fullName,
        nationalId: nationalId,
        categories: categories,
        bio: bio,
        serviceRadiusKm: serviceRadiusKm,
      );
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: session.user,
        role: session.user.role,
        onboardingToken: null,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل تسجيل الفني. تأكد من صحة الرقم القومي وعدم تكراره.',
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState();
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthController(repository: repository, storage: storage);
});
