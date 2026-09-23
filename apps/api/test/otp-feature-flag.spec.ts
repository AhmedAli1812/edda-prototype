import { ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/modules/auth/auth.service';
import { PublicRegistrationRole } from '../src/modules/auth/dto/auth.dto';
import { hashPassword } from '../src/common/utils/crypto.util';
import configuration from '../src/config/configuration';
import { createSmsProvider } from '../src/modules/auth/sms/sms-provider.factory';
import { DisabledSmsProvider } from '../src/modules/auth/sms/disabled-sms.provider';
import { UserRole, UserStatus } from '@prisma/client';

describe('OTP_ENABLED Feature Flag Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuration & Provider Lifecycle', () => {
    it('production starts with OTP_ENABLED=false and no SMS credentials', () => {
      process.env.NODE_ENV = 'production';
      process.env.OTP_ENABLED = 'false';
      delete process.env.SMS_PROVIDER;
      delete process.env.CEQUENS_USERNAME;
      delete process.env.CEQUENS_API_KEY;
      delete process.env.CEQUENS_SENDER_NAME;
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      // Production secrets still present
      process.env.JWT_ACCESS_SECRET = 'a_very_secure_jwt_access_secret_32_chars_min!';
      process.env.JWT_REFRESH_SECRET = 'a_very_secure_jwt_refresh_secret_32_chars_min!';
      process.env.OTP_PEPPER = 'a_very_secure_otp_pepper_secret_32_chars_min!';
      process.env.NATIONAL_ID_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
      process.env.NATIONAL_ID_HMAC_KEY = 'a_very_secure_national_id_hmac_secret_32_min!';

      const config = configuration();
      expect(config.otp.enabled).toBe(false);

      const mockConfigService = {
        get: jest.fn((key: string, defaultVal?: any) => {
          if (key === 'nodeEnv' || key === 'NODE_ENV') return 'production';
          if (key === 'otp.enabled') return false;
          return defaultVal;
        }),
      } as any;

      const provider = createSmsProvider(mockConfigService);
      expect(provider).toBeInstanceOf(DisabledSmsProvider);
    });

    it('enabling OTP in production without SMS provider fails configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.OTP_ENABLED = 'true';
      delete process.env.SMS_PROVIDER;

      process.env.JWT_ACCESS_SECRET = 'a_very_secure_jwt_access_secret_32_chars_min!';
      process.env.JWT_REFRESH_SECRET = 'a_very_secure_jwt_refresh_secret_32_chars_min!';
      process.env.OTP_PEPPER = 'a_very_secure_otp_pepper_secret_32_chars_min!';
      process.env.NATIONAL_ID_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
      process.env.NATIONAL_ID_HMAC_KEY = 'a_very_secure_national_id_hmac_secret_32_min!';

      expect(() => configuration()).toThrow(/SMS_PROVIDER cannot be "development" in production/);
    });

    it('enabling OTP with development SMS provider in production fails', () => {
      process.env.NODE_ENV = 'production';
      process.env.OTP_ENABLED = 'true';
      process.env.SMS_PROVIDER = 'development';

      process.env.JWT_ACCESS_SECRET = 'a_very_secure_jwt_access_secret_32_chars_min!';
      process.env.JWT_REFRESH_SECRET = 'a_very_secure_jwt_refresh_secret_32_chars_min!';
      process.env.OTP_PEPPER = 'a_very_secure_otp_pepper_secret_32_chars_min!';
      process.env.NATIONAL_ID_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
      process.env.NATIONAL_ID_HMAC_KEY = 'a_very_secure_national_id_hmac_secret_32_min!';

      expect(() => configuration()).toThrow(/SMS_PROVIDER cannot be "development" in production/);
    });

    it('enabling OTP with CEQUENS still enforces its required credentials', () => {
      process.env.NODE_ENV = 'production';
      process.env.OTP_ENABLED = 'true';
      process.env.SMS_PROVIDER = 'cequens';
      delete process.env.CEQUENS_USERNAME;
      delete process.env.CEQUENS_API_KEY;
      delete process.env.CEQUENS_SENDER_NAME;

      process.env.JWT_ACCESS_SECRET = 'a_very_secure_jwt_access_secret_32_chars_min!';
      process.env.JWT_REFRESH_SECRET = 'a_very_secure_jwt_refresh_secret_32_chars_min!';
      process.env.OTP_PEPPER = 'a_very_secure_otp_pepper_secret_32_chars_min!';
      process.env.NATIONAL_ID_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
      process.env.NATIONAL_ID_HMAC_KEY = 'a_very_secure_national_id_hmac_secret_32_min!';

      expect(() => configuration()).toThrow(/CEQUENS_USERNAME must be set in production/);
    });
  });

  describe('AuthService Endpoints when OTP_ENABLED=false', () => {
    let authService: AuthService;
    let mockPrisma: any;
    let mockSmsProvider: any;
    let jwtService: JwtService;
    let configService: ConfigService;

    const accessSecret = 'dev_secret_access_key_min_32_characters_long!';
    const refreshSecret = 'dev_secret_refresh_key_min_32_characters_long!';

    beforeEach(() => {
      mockPrisma = {
        $transaction: jest.fn(async (cb) => (typeof cb === 'function' ? cb(mockPrisma) : Promise.all(cb))),
        user: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
        technicianProfile: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
        refreshToken: {
          create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        },
      };

      mockSmsProvider = new DisabledSmsProvider();
      jwtService = new JwtService();

      configService = new ConfigService({
        'otp.enabled': false,
        'jwt.accessSecret': accessSecret,
        'jwt.refreshSecret': refreshSecret,
        'jwt.accessExpiration': '15m',
      });

      authService = new AuthService(
        mockPrisma,
        jwtService,
        configService,
        mockSmsProvider,
      );
    });

    it('password registration works with OTP disabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }: any) => ({
        id: 'user-pass-reg',
        phone: data.phone,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role,
        status: data.status,
        rewardPoints: 0,
      }));

      const result = await authService.register({
        phone: '01012345678',
        password: 'Password123!',
        role: PublicRegistrationRole.CUSTOMER,
      });

      expect(result.success).toBe(true);
      expect(result.user.role).toBe(UserRole.CUSTOMER);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('password login works with OTP disabled', async () => {
      const passwordHash = await hashPassword('Password123!');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-pass-login',
        phone: '+201012345678',
        passwordHash,
        fullName: 'أحمد عميل',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      });

      const result = await authService.login({
        phone: '01012345678',
        password: 'Password123!',
      });

      expect(result.success).toBe(true);
      expect(result.user.id).toBe('user-pass-login');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('OTP send endpoint is unavailable when OTP is disabled', async () => {
      await expect(
        authService.sendOtp({
          phone: '01012345678',
          purpose: 'LOGIN' as any,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('OTP verification endpoint is unavailable when OTP is disabled', async () => {
      await expect(
        authService.verifyRegistrationOtp({
          phone: '01012345678',
          code: '482190',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
