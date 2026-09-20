import 'dart:async';
import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage_service.dart';

typedef OnUnauthenticatedCallback = void Function();

class DioClient {
  late final Dio dio;
  final SecureStorageService _storage;
  final Dio _refreshDio;
  OnUnauthenticatedCallback? onUnauthenticated;

  Future<String?>? _refreshFuture;

  DioClient({
    SecureStorageService? storage,
    Dio? refreshDio,
    String? baseUrl,
  })  : _storage = storage ?? SecureStorageService(),
        _refreshDio = refreshDio ??
            Dio(
              BaseOptions(
                baseUrl: baseUrl ?? ApiConstants.baseUrl,
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 15),
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
              ),
            ) {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: (options, handler) async {
          // Do not attach access token to public endpoints or refresh endpoint
          final isPublic = options.path.contains('/auth/login') ||
              options.path.contains('/auth/otp') ||
              options.path.contains('/auth/register') ||
              options.path.contains(ApiConstants.refreshToken);

          if (!isPublic) {
            final token = await _storage.getAccessToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          final is401 = error.response?.statusCode == 401;
          final isRefreshEndpoint =
              error.requestOptions.path.contains(ApiConstants.refreshToken);
          final alreadyRetried =
              error.requestOptions.extra['retried'] == true;

          // Prevent recursion on refresh endpoint or double-retry
          if (is401 && !isRefreshEndpoint && !alreadyRetried) {
            try {
              // Single-flight lock: if refresh is already in flight, reuse the future
              _refreshFuture ??= _executeTokenRefresh();
              final newAccessToken = await _refreshFuture;

              if (newAccessToken != null) {
                // Retry the original request with new access token
                final retryOptions = error.requestOptions;
                retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                retryOptions.extra['retried'] = true;

                final response = await dio.fetch(retryOptions);
                return handler.resolve(response);
              } else {
                await _handleAuthFailure();
                return handler.next(error);
              }
            } catch (e) {
              await _handleAuthFailure();
              return handler.next(error);
            } finally {
              _refreshFuture = null;
            }
          }

          if (is401 && isRefreshEndpoint) {
            await _handleAuthFailure();
          }

          return handler.next(error);
        },
      ),
    );
  }

  Future<String?> _executeTokenRefresh() async {
    try {
      final currentRefreshToken = await _storage.getRefreshToken();
      if (currentRefreshToken == null) {
        return null;
      }

      final response = await _refreshDio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': currentRefreshToken},
      );

      if (response.statusCode == 200 && response.data != null) {
        final newAccessToken = response.data['accessToken'] as String?;
        final newRefreshToken = response.data['refreshToken'] as String?;

        if (newAccessToken != null && newRefreshToken != null) {
          await _storage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          );
          return newAccessToken;
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> _handleAuthFailure() async {
    await _storage.clearAll();
    onUnauthenticated?.call();
  }
}
