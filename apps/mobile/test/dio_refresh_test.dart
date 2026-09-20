import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:edda_mobile/core/network/dio_client.dart';
import 'package:edda_mobile/core/storage/secure_storage_service.dart';

class MockStorage extends SecureStorageService {
  String? accessToken = 'initial_expired_token';
  String? refreshToken = 'valid_refresh_token';
  bool cleared = false;

  @override
  Future<String?> getAccessToken() async => accessToken;

  @override
  Future<String?> getRefreshToken() async => refreshToken;

  @override
  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  @override
  Future<void> clearAll() async {
    accessToken = null;
    refreshToken = null;
    cleared = true;
  }
}

class FakeRefreshAdapter implements HttpClientAdapter {
  int refreshCallCount = 0;
  bool shouldFail = false;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (options.path.contains('/auth/token/refresh')) {
      refreshCallCount++;
      if (shouldFail) {
        return ResponseBody.fromString(
          '{"message":"Unauthorized"}',
          401,
          headers: {'content-type': ['application/json']},
        );
      }
      return ResponseBody.fromString(
        '{"accessToken":"new_rotated_access_token","refreshToken":"new_refresh_token"}',
        200,
        headers: {'content-type': ['application/json']},
      );
    }
    return ResponseBody.fromString('{}', 404);
  }

  @override
  void close({bool force = false}) {}
}

class FakeApiAdapter implements HttpClientAdapter {
  int apiCallCount = 0;
  List<String> seenAuthHeaders = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    apiCallCount++;
    final authHeader = options.headers['Authorization'] as String? ?? '';
    seenAuthHeaders.add(authHeader);

    // Return 401 if request has expired token, 200 if request has new token
    if (authHeader == 'Bearer initial_expired_token') {
      return ResponseBody.fromString(
        '{"message":"Expired token"}',
        401,
        headers: {'content-type': ['application/json']},
      );
    } else if (authHeader == 'Bearer new_rotated_access_token') {
      return ResponseBody.fromString(
        '{"status":"success","data":"protected_data"}',
        200,
        headers: {'content-type': ['application/json']},
      );
    }

    return ResponseBody.fromString('{}', 403);
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  group('DioClient Single-Flight Refresh Tests', () {
    late MockStorage mockStorage;
    late FakeRefreshAdapter fakeRefreshAdapter;
    late FakeApiAdapter fakeApiAdapter;
    late DioClient client;
    bool onUnauthCalled = false;

    setUp(() {
      mockStorage = MockStorage();
      fakeRefreshAdapter = FakeRefreshAdapter();
      fakeApiAdapter = FakeApiAdapter();
      onUnauthCalled = false;

      final refreshDio = Dio(BaseOptions(baseUrl: 'http://localhost:4000/api/v1'));
      refreshDio.httpClientAdapter = fakeRefreshAdapter;

      client = DioClient(
        storage: mockStorage,
        refreshDio: refreshDio,
        baseUrl: 'http://localhost:4000/api/v1',
      );
      client.dio.httpClientAdapter = fakeApiAdapter;
      client.onUnauthenticated = () {
        onUnauthCalled = true;
      };
    });

    test('Simultaneous 401 requests trigger exactly ONE refresh request and both retry', () async {
      // Execute 2 concurrent requests that fail with 401
      final future1 = client.dio.get('/users/me');
      final future2 = client.dio.get('/orders/mine');

      final results = await Future.wait([future1, future2]);

      // Both should eventually succeed after single refresh
      expect(results[0].statusCode, 200);
      expect(results[1].statusCode, 200);

      // Refresh endpoint must have been called EXACTLY once (single-flight)
      expect(fakeRefreshAdapter.refreshCallCount, 1);

      // Both requests retried with the new token
      expect(mockStorage.accessToken, 'new_rotated_access_token');
      expect(mockStorage.refreshToken, 'new_refresh_token');
      expect(onUnauthCalled, false);
    });

    test('Failed token refresh clears credentials and triggers onUnauthenticated callback', () async {
      fakeRefreshAdapter.shouldFail = true;

      expect(
        () async => await client.dio.get('/users/me'),
        throwsA(isA<DioException>()),
      );

      // Wait brief microtask loop for failure handling
      await Future.delayed(const Duration(milliseconds: 10));

      expect(fakeRefreshAdapter.refreshCallCount, 1);
      expect(mockStorage.cleared, true);
      expect(onUnauthCalled, true);
    });

    test('Refresh endpoint itself cannot recursively trigger token refresh on 401', () async {
      fakeRefreshAdapter.shouldFail = true;

      // Calling refresh endpoint directly on main dio
      try {
        await client.dio.post('/auth/token/refresh', data: {'refreshToken': 'bad'});
      } catch (_) {}

      // Must NOT invoke the refresh adapter
      expect(fakeRefreshAdapter.refreshCallCount, 0);
    });
  });
}
