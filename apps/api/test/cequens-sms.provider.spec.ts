import { ConfigService } from '@nestjs/config';
import { OtpPurpose } from '@prisma/client';
import {
  CequensSmsProvider,
  formatCequensRecipient,
  getJwtExpiry,
} from '../src/modules/auth/sms/cequens-sms.provider';
import configuration from '../src/config/configuration';

describe('CequensSmsProvider & Configuration Suite', () => {
  let provider: CequensSmsProvider;
  let mockConfigService: jest.Mocked<ConfigService>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key: string, defaultVal?: any) => {
        const configMap: Record<string, any> = {
          nodeEnv: 'development',
          NODE_ENV: 'development',
          'sms.provider': 'cequens',
          'sms.cequens.userName': 'test_cequens_user',
          'sms.cequens.apiKey': 'test_cequens_api_key_123',
          'sms.cequens.senderName': 'Edda',
        };
        return configMap[key] !== undefined ? configMap[key] : defaultVal;
      }),
    } as any;

    provider = new CequensSmsProvider(mockConfigService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('1. Phone Number Normalization at Provider Boundary', () => {
    it('normalizes local 010, 011, 012, 015 Egyptian numbers to 201xxxxxxxxx', () => {
      expect(formatCequensRecipient('01012345678')).toBe('201012345678');
      expect(formatCequensRecipient('01198765432')).toBe('201198765432');
      expect(formatCequensRecipient('01234567890')).toBe('201234567890');
      expect(formatCequensRecipient('01511223344')).toBe('201511223344');
    });

    it('normalizes canonical E.164 +20 numbers by stripping leading plus', () => {
      expect(formatCequensRecipient('+201012345678')).toBe('201012345678');
      expect(formatCequensRecipient('+201198765432')).toBe('201198765432');
    });

    it('handles 0020 international prefix and plain 20 format', () => {
      expect(formatCequensRecipient('00201012345678')).toBe('201012345678');
      expect(formatCequensRecipient('201012345678')).toBe('201012345678');
    });

    it('handles 10-digit number without country code or leading zero', () => {
      expect(formatCequensRecipient('1012345678')).toBe('201012345678');
    });
  });

  describe('2. JWT Expiration Parser Utility', () => {
    it('extracts expiration timestamp from standard JWT payload', () => {
      const expSec = Math.floor(Date.now() / 1000) + 3600;
      const payloadBase64 = Buffer.from(JSON.stringify({ exp: expSec, sub: 'test' })).toString('base64');
      const fakeJwt = `header.${payloadBase64}.signature`;
      expect(getJwtExpiry(fakeJwt)).toBe(expSec * 1000);
    });

    it('returns null safely for invalid or non-JWT strings without throwing', () => {
      expect(getJwtExpiry('invalid-token')).toBeNull();
      expect(getJwtExpiry('')).toBeNull();
      expect(getJwtExpiry('a.b')).toBeNull();
    });
  });

  describe('3. Successful Authentication & SMS Dispatch Flow', () => {
    it('signs in to CEQUENS, obtains access token, and sends SMS returning providerMessageId', async () => {
      const mockFetch = jest.fn();

      // 1. Mock Sign-In response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          replyMessage: '[Request handled successfully]',
          requestId: 'auth-req-123',
          data: {
            access_token: 'mock_jwt_access_token_xyz',
          },
        }),
      });

      // 2. Mock SMS response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          replyMessage: 'Request handled successfully',
          requestId: 'sms-req-456',
          data: {
            SentSMSIDs: [
              {
                SMSId: 'cequens-sms-uuid-789',
              },
            ],
            InvalidRecipients: '',
          },
        }),
      });

      global.fetch = mockFetch;

      const result = await provider.sendOtp('+201012345678', '482190', OtpPurpose.REGISTRATION);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBe('cequens-sms-uuid-789');

      // Verify Sign-In request
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toBe('https://apis.cequens.com/auth/v1/tokens/');
      const authBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(authBody).toEqual({
        userName: 'test_cequens_user',
        apiKey: 'test_cequens_api_key_123',
      });

      // Verify SMS request
      expect(mockFetch.mock.calls[1][0]).toBe('https://apis.cequens.com/sms/v1/messages');
      expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe('Bearer mock_jwt_access_token_xyz');
      const smsBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(smsBody.recipients).toBe('201012345678');
      expect(smsBody.senderName).toBe('Edda');
      expect(smsBody.messageType).toBe('unicode');
      expect(smsBody.messageText).toContain('Edda');
      expect(smsBody.messageText).toContain('482190');
    });

    it('reuses cached token for subsequent requests without re-calling Sign-In', async () => {
      const mockFetch = jest.fn();

      // Sign-In response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'cached_token_abc' },
        }),
      });

      // 1st SMS response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { SentSMSIDs: [{ SMSId: 'sms-1' }] },
        }),
      });

      // 2nd SMS response (should not trigger Sign-In again)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { SentSMSIDs: [{ SMSId: 'sms-2' }] },
        }),
      });

      global.fetch = mockFetch;

      const res1 = await provider.sendOtp('+201012345678', '111111', OtpPurpose.LOGIN);
      const res2 = await provider.sendOtp('+201098765432', '222222', OtpPurpose.LOGIN);

      expect(res1.providerMessageId).toBe('sms-1');
      expect(res2.providerMessageId).toBe('sms-2');
      // Sign-In called once + 2 SMS requests = 3 total fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('4. Failure Handling & Gateway Rejections', () => {
    it('throws when CEQUENS Sign-In fails with 401 unauthorized', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          replyCode: -1,
          replyMessage: '[Request failed] UnAuthorized-Invalid User',
        }),
      });

      await expect(
        provider.sendOtp('01012345678', '123456', OtpPurpose.LOGIN),
      ).rejects.toThrow(/CEQUENS authentication failed/);
    });

    it('throws when CEQUENS gateway rejects invalid sender name (code -12)', async () => {
      const mockFetch = jest.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'valid_token' },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          replyCode: -1,
          replyMessage: '[Request failed] Bad Request',
          error: {
            internalErrors: [{ code: -12, details: 'Invalid Sender Name' }],
          },
        }),
      });
      global.fetch = mockFetch;

      await expect(
        provider.sendOtp('01012345678', '123456', OtpPurpose.LOGIN),
      ).rejects.toThrow(/Invalid Sender Name/);
    });

    it('throws when CEQUENS gateway reports insufficient balance/credits (code -17)', async () => {
      const mockFetch = jest.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'valid_token' },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          replyCode: -1,
          replyMessage: '[Request failed] Bad Request',
          error: {
            internalErrors: [{ code: -17, details: 'Not Enough Credits.' }],
          },
        }),
      });
      global.fetch = mockFetch;

      await expect(
        provider.sendOtp('01012345678', '123456', OtpPurpose.LOGIN),
      ).rejects.toThrow(/Not Enough Credits/);
    });

    it('throws on network failure during dispatch', async () => {
      const mockFetch = jest.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'valid_token' },
        }),
      });
      mockFetch.mockRejectedValueOnce(new Error('Network connection timeout'));
      global.fetch = mockFetch;

      await expect(
        provider.sendOtp('01012345678', '123456', OtpPurpose.LOGIN),
      ).rejects.toThrow(/CEQUENS SMS network failure/);
    });

    it('throws on malformed JSON response from CEQUENS SMS API', async () => {
      const mockFetch = jest.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'valid_token' },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Unexpected token < in JSON at position 0');
        },
      });
      global.fetch = mockFetch;

      await expect(
        provider.sendOtp('01012345678', '123456', OtpPurpose.LOGIN),
      ).rejects.toThrow(/malformed response/);
    });

    it('throws when replyCode is 0 but SentSMSIDs is missing from response', async () => {
      const mockFetch = jest.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'valid_token' },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          replyMessage: 'Request handled successfully',
          data: { SentSMSIDs: [] },
        }),
      });
      global.fetch = mockFetch;

      await expect(
        provider.sendOtp('01012345678', '123456', OtpPurpose.LOGIN),
      ).rejects.toThrow(/missing SentSMSIDs confirmation/);
    });
  });

  describe('5. Token Refresh & Single-Retry on 401', () => {
    it('invalidates token on 401, re-authenticates, and successfully retries once', async () => {
      const mockFetch = jest.fn();

      // 1. Initial Sign-In
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'old_expired_token' },
        }),
      });

      // 2. Initial SMS dispatch -> 401 Unauthorized
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ replyCode: -1, replyMessage: 'UnAuthorized-Invalid User' }),
      });

      // 3. Re-Sign-In after 401 invalidation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'fresh_new_token' },
        }),
      });

      // 4. Retried SMS dispatch -> Success 200
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { SentSMSIDs: [{ SMSId: 'retried-sms-success' }] },
        }),
      });

      global.fetch = mockFetch;

      const result = await provider.sendOtp('01012345678', '999999', OtpPurpose.LOGIN);
      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBe('retried-sms-success');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('does not retry indefinitely if second attempt also returns 401', async () => {
      const mockFetch = jest.fn();

      // 1. Initial Sign-In
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'token_attempt_1' },
        }),
      });

      // 2. Initial SMS -> 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ replyCode: -1 }),
      });

      // 3. Re-Sign-In
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          replyCode: 0,
          data: { access_token: 'token_attempt_2' },
        }),
      });

      // 4. Retried SMS -> 401 again
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ replyCode: -1 }),
      });

      global.fetch = mockFetch;

      await expect(
        provider.sendOtp('01012345678', '999999', OtpPurpose.LOGIN),
      ).rejects.toThrow(/rejected token after retry/);

      // Must stop at 4 fetch calls (no infinite loop)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('6. Production Startup Credentials Validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, OTP_ENABLED: 'true' };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('rejects startup in production when CEQUENS_USERNAME is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.SMS_PROVIDER = 'cequens';
      delete process.env.CEQUENS_USERNAME;
      process.env.CEQUENS_API_KEY = 'valid_api_key';
      process.env.CEQUENS_SENDER_NAME = 'Edda';
      process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.OTP_PEPPER = 'c'.repeat(32);
      process.env.NATIONAL_ID_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
      process.env.NATIONAL_ID_HMAC_KEY = 'd'.repeat(32);

      expect(() => configuration()).toThrow(/CEQUENS_USERNAME must be set in production/);
    });

    it('rejects startup in production when CEQUENS_API_KEY is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.SMS_PROVIDER = 'cequens';
      process.env.CEQUENS_USERNAME = 'valid_user';
      delete process.env.CEQUENS_API_KEY;
      process.env.CEQUENS_SENDER_NAME = 'Edda';
      process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.OTP_PEPPER = 'c'.repeat(32);
      process.env.NATIONAL_ID_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
      process.env.NATIONAL_ID_HMAC_KEY = 'd'.repeat(32);

      expect(() => configuration()).toThrow(/CEQUENS_API_KEY must be set in production/);
    });

    it('rejects startup in production when CEQUENS_SENDER_NAME is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.SMS_PROVIDER = 'cequens';
      process.env.CEQUENS_USERNAME = 'valid_user';
      process.env.CEQUENS_API_KEY = 'valid_api_key';
      delete process.env.CEQUENS_SENDER_NAME;
      process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.OTP_PEPPER = 'c'.repeat(32);
      process.env.NATIONAL_ID_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
      process.env.NATIONAL_ID_HMAC_KEY = 'd'.repeat(32);

      expect(() => configuration()).toThrow(/CEQUENS_SENDER_NAME must be set in production/);
    });

    it('passes production startup when all required CEQUENS credentials are set without needing Twilio credentials', () => {
      process.env.NODE_ENV = 'production';
      process.env.SMS_PROVIDER = 'cequens';
      process.env.CEQUENS_USERNAME = 'valid_user';
      process.env.CEQUENS_API_KEY = 'valid_api_key';
      process.env.CEQUENS_SENDER_NAME = 'Edda';
      process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.OTP_PEPPER = 'c'.repeat(32);
      process.env.NATIONAL_ID_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
      process.env.NATIONAL_ID_HMAC_KEY = 'd'.repeat(32);

      // Explicitly ensure no Twilio credentials are provided
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      const config = configuration();
      expect(config.sms.provider).toBe('cequens');
      expect(config.sms.cequens.userName).toBe('valid_user');
      expect(config.sms.cequens.apiKey).toBe('valid_api_key');
      expect(config.sms.cequens.senderName).toBe('Edda');
    });
  });
});
