import { BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/modules/auth/auth.service';
import { normalizeEgyptianPhone, maskPhone } from '../src/common/utils/phone.util';
import {
  hashOtp,
  verifyOtpHash,
  encryptAesGcm,
  decryptAesGcm,
  computeNationalIdFingerprint,
  maskNationalId,
  verifyVerifierHash,
} from '../src/common/utils/crypto.util';
import configuration from '../src/config/configuration';
import { createSmsProvider } from '../src/modules/auth/sms/sms-provider.factory';
import { DevelopmentSmsProvider } from '../src/modules/auth/sms/development-sms.provider';
import { UserRole, UserStatus, OtpPurpose, KycStatus, OtpDeliveryStatus } from '@prisma/client';

describe('Phase 1 Production Authentication Suite', () => {
  const pepper = 'dev_otp_pepper_secret_min_32_characters_long!';
  const base64EncKey = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE='; // 32 bytes in base64
  const hmacKey = 'dev_national_id_hmac_secret_min_32_characters_long!';
  const refreshSecret = 'dev_secret_refresh_key_min_32_characters_long!';
  const accessSecret = 'dev_secret_access_key_min_32_characters_long!';

  describe('1. Phone Number Normalization & Egyptian Validation', () => {
    it('normalizes local 010, 011, 012, 015 numbers to E.164 (+201...) format', () => {
      expect(normalizeEgyptianPhone('01012345678')).toBe('+201012345678');
      expect(normalizeEgyptianPhone('01198765432')).toBe('+201198765432');
      expect(normalizeEgyptianPhone('01234567890')).toBe('+201234567890');
      expect(normalizeEgyptianPhone('01511223344')).toBe('+201511223344');
    });

    it('converts Eastern Arabic numerals (٠-٩) accurately to Western digits', () => {
      expect(normalizeEgyptianPhone('٠١٠١٢٣٤٥٦٧٨')).toBe('+201012345678');
      expect(normalizeEgyptianPhone('+٢٠١١٩٨٧٦٥٤٣٢')).toBe('+201198765432');
    });

    it('accepts numbers already in E.164 +20 format', () => {
      expect(normalizeEgyptianPhone('+201012345678')).toBe('+201012345678');
      expect(normalizeEgyptianPhone('00201012345678')).toBe('+201012345678');
    });

    it('rejects invalid prefixes or lengths', () => {
      expect(() => normalizeEgyptianPhone('01312345678')).toThrow(BadRequestException);
      expect(() => normalizeEgyptianPhone('010123456')).toThrow(BadRequestException);
      expect(() => normalizeEgyptianPhone('+966501234567')).toThrow(BadRequestException);
      expect(() => normalizeEgyptianPhone('invalid-phone')).toThrow(BadRequestException);
    });

    it('masks phone numbers safely for logs and audit', () => {
      expect(maskPhone('+201012345678')).toBe('+2010****5678');
    });
  });

  describe('2. Cryptographic Utilities & National ID Protection', () => {
    it('hashes OTP using HMAC-SHA256 with pepper and verifies with constant-time equality', () => {
      const code = '482190';
      const hash = hashOtp(code, pepper);
      expect(hash).toHaveLength(64);
      expect(verifyOtpHash(code, hash, pepper)).toBe(true);
      expect(verifyOtpHash('123456', hash, pepper)).toBe(false);
    });

    it('encrypts National ID with AES-256-GCM using base64-decoded 32-byte key and decrypts accurately', () => {
      const nationalId = '29801010101234';
      const encrypted = encryptAesGcm(nationalId, base64EncKey);
      expect(encrypted.split(':')).toHaveLength(3); // iv:tag:ciphertext
      const decrypted = decryptAesGcm(encrypted, base64EncKey);
      expect(decrypted).toBe(nationalId);
    });

    it('computes deterministic HMAC-SHA256 fingerprint for National ID uniqueness checks', () => {
      const nationalId = '29801010101234';
      const fp1 = computeNationalIdFingerprint(nationalId, hmacKey);
      const fp2 = computeNationalIdFingerprint(nationalId, hmacKey);
      const fpDifferent = computeNationalIdFingerprint('29801010109999', hmacKey);
      expect(fp1).toBe(fp2);
      expect(fp1).not.toBe(fpDifferent);
    });

    it('masks National ID safely: shows only the last 4 digits', () => {
      expect(maskNationalId('29801010101234')).toBe('**********1234');
    });

    it('timingSafeEqual verification for refresh token verifiers works correctly', () => {
      const rawVerifier = 'my_secret_random_verifier_string_123';
      const hash = require('crypto').createHmac('sha256', refreshSecret).update(rawVerifier).digest('hex');
      expect(verifyVerifierHash(rawVerifier, hash, refreshSecret)).toBe(true);
      expect(verifyVerifierHash('wrong_verifier', hash, refreshSecret)).toBe(false);
    });
  });

  describe('3. Production Configuration Guards', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('allows development provider in development environment', () => {
      process.env.NODE_ENV = 'development';
      process.env.OTP_ENABLED = 'true';
      process.env.SMS_PROVIDER = 'development';
      const config = configuration();
      expect(config.sms.provider).toBe('development');

      const mockConfigService = {
        get: jest.fn((key: string, defaultVal?: any) => {
          if (key === 'nodeEnv' || key === 'NODE_ENV') return 'development';
          if (key === 'otp.enabled') return true;
          if (key === 'sms.provider') return 'development';
          return defaultVal;
        }),
      } as any;
      const provider = createSmsProvider(mockConfigService);
      expect(provider).toBeInstanceOf(DevelopmentSmsProvider);
    });

    it('allows development provider in test environment', () => {
      process.env.NODE_ENV = 'test';
      process.env.OTP_ENABLED = 'true';
      process.env.SMS_PROVIDER = 'development';
      const config = configuration();
      expect(config.sms.provider).toBe('development');

      const mockConfigService = {
        get: jest.fn((key: string, defaultVal?: any) => {
          if (key === 'nodeEnv' || key === 'NODE_ENV') return 'test';
          if (key === 'otp.enabled') return true;
          if (key === 'sms.provider') return 'development';
          return defaultVal;
        }),
      } as any;
      const provider = createSmsProvider(mockConfigService);
      expect(provider).toBeInstanceOf(DevelopmentSmsProvider);
    });

    it('throws fatal error in production if SMS_PROVIDER is development', () => {
      process.env.NODE_ENV = 'production';
      process.env.OTP_ENABLED = 'true';
      process.env.SMS_PROVIDER = 'development';
      expect(() => configuration()).toThrow(/SMS_PROVIDER cannot be "development" in production/);

      const mockConfigService = {
        get: jest.fn((key: string, defaultVal?: any) => {
          if (key === 'nodeEnv' || key === 'NODE_ENV') return 'production';
          if (key === 'otp.enabled') return true;
          if (key === 'sms.provider') return 'development';
          return defaultVal;
        }),
      } as any;
      expect(() => createSmsProvider(mockConfigService)).toThrow(/SMS_PROVIDER cannot be "development" in production/);
    });

    it('throws fatal error in production if SMS_PROVIDER is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.OTP_ENABLED = 'true';
      delete process.env.SMS_PROVIDER;
      expect(() => configuration()).toThrow(/SMS_PROVIDER cannot be "development" in production/);

      const mockConfigService = {
        get: jest.fn((key: string, defaultVal?: any) => {
          if (key === 'nodeEnv' || key === 'NODE_ENV') return 'production';
          if (key === 'otp.enabled') return true;
          if (key === 'sms.provider') return undefined;
          return defaultVal;
        }),
      } as any;
      expect(() => createSmsProvider(mockConfigService)).toThrow(/SMS_PROVIDER cannot be "development" in production/);
    });

    it('throws fatal error if SMS_PROVIDER is unsupported', () => {
      process.env.NODE_ENV = 'development';
      process.env.OTP_ENABLED = 'true';
      process.env.SMS_PROVIDER = 'unsupported_gateway';
      expect(() => configuration()).toThrow(/Unsupported SMS provider/);

      const mockConfigService = {
        get: jest.fn((key: string, defaultVal?: any) => {
          if (key === 'nodeEnv' || key === 'NODE_ENV') return 'development';
          if (key === 'otp.enabled') return true;
          if (key === 'sms.provider') return 'unsupported_gateway';
          return defaultVal;
        }),
      } as any;
      expect(() => createSmsProvider(mockConfigService)).toThrow(/Unsupported SMS provider/);
    });

    it('throws fatal error in production if secrets are too short', () => {
      process.env.NODE_ENV = 'production';
      process.env.OTP_ENABLED = 'true';
      process.env.SMS_PROVIDER = 'twilio';
      process.env.JWT_ACCESS_SECRET = 'short';
      expect(() => configuration()).toThrow(/JWT_ACCESS_SECRET must be set and at least 32 characters/);
    });
  });

  describe('4. AuthService End-to-End Logic & Security Invariants', () => {
    let authService: AuthService;
    let mockPrisma: any;
    let mockSmsProvider: any;
    let jwtService: JwtService;
    let configService: ConfigService;

    beforeEach(() => {
      mockPrisma = {
        $transaction: jest.fn(async (cb) => {
          if (typeof cb === 'function') {
            return cb(mockPrisma);
          }
          if (Array.isArray(cb)) {
            return Promise.all(cb);
          }
        }),
        $executeRawUnsafe: jest.fn().mockResolvedValue(1),
        $queryRawUnsafe: jest.fn().mockResolvedValue([]),
        otpRateLimit: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        otpCode: {
          create: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
          findFirst: jest.fn(),
        },
        user: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        onboardingToken: {
          create: jest.fn(),
          findUnique: jest.fn(),
          updateMany: jest.fn(),
        },
        technicianProfile: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
        refreshToken: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        },
        deviceToken: {
          upsert: jest.fn().mockResolvedValue({ id: 'dev-1' }),
        },
      };

      mockSmsProvider = {
        sendOtp: jest.fn().mockResolvedValue({ success: true, providerMessageId: 'SMS-MSG-100' }),
      };

      configService = new ConfigService({
        'otp.enabled': true,
        'jwt.accessSecret': accessSecret,
        'jwt.refreshSecret': refreshSecret,
        'jwt.accessExpiration': '15m',
        'jwt.refreshExpiration': '7d',
        'otp.pepper': pepper,
        'otp.cooldownSeconds': 60,
        'otp.expirationSeconds': 300,
        'otp.maxAttempts': 5,
        'otp.hourlyRateLimit': 5,
        'otp.deterministicTestOtp': false,
        'nationalId.encryptionKey': base64EncKey,
        'nationalId.hmacKey': hmacKey,
        'nationalId.keyVersion': 1,
      });

      jwtService = new JwtService({ secret: accessSecret });

      authService = new AuthService(
        mockPrisma,
        jwtService,
        configService,
        mockSmsProvider,
      );
    });

    describe('sendOtp lifecycle', () => {
      it('creates OTP with PENDING status, sends SMS outside transaction, and marks SENT', async () => {
        mockPrisma.otpCode.create.mockResolvedValue({ id: 'otp-rec-1' });

        const result = await authService.sendOtp({
          phone: '01012345678',
          purpose: OtpPurpose.LOGIN,
        });

        expect(result.success).toBe(true);
        expect(result.message).toContain('إذا كان رقم الهاتف صالحاً');
        expect(mockSmsProvider.sendOtp).toHaveBeenCalledTimes(1);
        expect(mockPrisma.otpCode.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'otp-rec-1' },
            data: { deliveryStatus: OtpDeliveryStatus.SENT, providerMessageId: 'SMS-MSG-100' },
          }),
        );
      });

      it('enforces 60-second cooldown on consecutive requests', async () => {
        const now = new Date();
        mockPrisma.$queryRawUnsafe.mockResolvedValue([
          { phone: '+201012345678', lastSentAt: new Date(now.getTime() - 20000), hourlyCount: 1, windowStart: now },
        ]);

        await expect(
          authService.sendOtp({ phone: '01012345678', purpose: OtpPurpose.LOGIN }),
        ).rejects.toThrow(BadRequestException);
      });

      it('enforces 5 per hour rate limit', async () => {
        const now = new Date();
        mockPrisma.$queryRawUnsafe.mockResolvedValue([
          { phone: '+201012345678', lastSentAt: new Date(now.getTime() - 90000), hourlyCount: 5, windowStart: now },
        ]);

        await expect(
          authService.sendOtp({ phone: '01012345678', purpose: OtpPurpose.LOGIN }),
        ).rejects.toThrow(/تم تجاوز الحد الأقصى/);
      });

      it('resets cooldown when SMS provider delivery fails so user is not trapped', async () => {
        mockPrisma.otpCode.create.mockResolvedValue({ id: 'otp-rec-fail' });
        mockSmsProvider.sendOtp.mockResolvedValue({ success: false });

        await expect(
          authService.sendOtp({ phone: '01012345678', purpose: OtpPurpose.LOGIN }),
        ).rejects.toThrow(BadRequestException);

        expect(mockPrisma.otpRateLimit.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { lastSentAt: new Date(0) },
          }),
        );
      });
    });

    describe('verifyRegistrationOtp lifecycle', () => {
      it('atomically consumes registration OTP and issues single-use OnboardingToken', async () => {
        mockPrisma.otpCode.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.onboardingToken.create.mockResolvedValue({ id: 'onb-1' });

        const result = await authService.verifyRegistrationOtp({
          phone: '01012345678',
          code: '482190',
        });

        expect(result.success).toBe(true);
        expect(result.onboardingToken).toBeDefined();
        expect(mockPrisma.onboardingToken.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              phone: '+201012345678',
            }),
          }),
        );
      });

      it('rejects if OTP conditional update fails (count !== 1) and increments attempts', async () => {
        mockPrisma.otpCode.updateMany.mockResolvedValue({ count: 0 });

        await expect(
          authService.verifyRegistrationOtp({
            phone: '01012345678',
            code: '000000',
          }),
        ).rejects.toThrow(BadRequestException);

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ action: 'OTP_VERIFICATION_FAILED' }),
          }),
        );
      });
    });

    describe('registerCustomer lifecycle', () => {
      it('atomically consumes onboarding token and registers customer with initial wallet', async () => {
        mockPrisma.onboardingToken.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.onboardingToken.findUnique.mockResolvedValue({
          jti: 'jti-valid',
          phone: '+201012345678',
        });
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: 'cust-1',
          phone: '+201012345678',
          fullName: 'عميل تجريبي',
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          rewardPoints: 0,
        });
        mockPrisma.refreshToken.create.mockResolvedValue({ id: 'ref-1' });

        const result = await authService.registerCustomer({
          onboardingToken: 'jti-valid',
          fullName: 'عميل تجريبي',
          governorate: 'القاهرة',
          city: 'مدينة نصر',
          street: 'شارع الطيران',
        });

        expect(result.success).toBe(true);
        expect(result.user.role).toBe(UserRole.CUSTOMER);
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      });

      it('rejects customer registration if onboarding token already consumed', async () => {
        mockPrisma.onboardingToken.updateMany.mockResolvedValue({ count: 0 });

        await expect(
          authService.registerCustomer({
            onboardingToken: 'jti-already-used',
            fullName: 'عميل آخر',
          }),
        ).rejects.toThrow(/رمز التسجيل المؤقت غير صالح أو تم استخدامه/);
      });
    });

    describe('registerTechnician lifecycle', () => {
      it('encrypts National ID with AES-256-GCM and stores deterministic fingerprint', async () => {
        mockPrisma.onboardingToken.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.onboardingToken.findUnique.mockResolvedValue({
          jti: 'jti-tech-1',
          phone: '+201099998888',
        });
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.technicianProfile.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: 'tech-1',
          phone: '+201099998888',
          fullName: 'فني كهرباء محترف',
          role: UserRole.TECHNICIAN,
          status: UserStatus.ACTIVE,
          rewardPoints: 0,
        });
        mockPrisma.refreshToken.create.mockResolvedValue({ id: 'ref-tech-1' });

        const result = await authService.registerTechnician({
          onboardingToken: 'jti-tech-1',
          fullName: 'فني كهرباء محترف',
          nationalId: '29801010101234',
          categories: ['electricity'],
          serviceRadiusKm: 20,
        });

        expect(result.success).toBe(true);
        expect(result.user.nationalIdMasked).toBe('**********1234');
        expect(mockPrisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              role: UserRole.TECHNICIAN,
              technicianProfile: expect.objectContaining({
                create: expect.objectContaining({
                  nationalIdKeyVersion: 1,
                  kycStatus: KycStatus.PENDING_REVIEW,
                }),
              }),
            }),
          }),
        );
      });

      it('rejects duplicate National ID via deterministic fingerprint', async () => {
        mockPrisma.onboardingToken.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.onboardingToken.findUnique.mockResolvedValue({
          jti: 'jti-tech-dup',
          phone: '+201099998888',
        });
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.technicianProfile.findUnique.mockResolvedValue({ id: 'existing-tech' });

        await expect(
          authService.registerTechnician({
            onboardingToken: 'jti-tech-dup',
            fullName: 'فني مكرر',
            nationalId: '29801010101234',
            categories: ['plumbing'],
          }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('login lifecycle & enumeration protection', () => {
      it('explicitly rejects OTP-code login payloads without password', async () => {
        await expect(
          authService.login({ phone: '01012345678', code: '482190' } as any),
        ).rejects.toThrow(BadRequestException);
      });

      it('returns generic UnauthorizedException when account does not exist (enumeration safe)', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          authService.login({ phone: '01012345678', password: 'Password123' }),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'LOGIN_FAILED',
              details: expect.objectContaining({ reason: 'INVALID_CREDENTIALS' }),
            }),
          }),
        );
      });

      it('rejects suspended accounts and logs ACCOUNT_SUSPENDED_LOGIN_ATTEMPT', async () => {
        const hash = await require('../src/common/utils/crypto.util').hashPassword('Password123');
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'user-susp',
          phone: '+201012345678',
          passwordHash: hash,
          status: UserStatus.SUSPENDED,
          role: UserRole.CUSTOMER,
        });

        await expect(
          authService.login({ phone: '01012345678', password: 'Password123' }),
        ).rejects.toThrow(/الحساب معلق/);

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'ACCOUNT_SUSPENDED_LOGIN_ATTEMPT',
              isFlagged: true,
            }),
          }),
        );
      });
    });

    describe('Refresh Token Rotation & Family Reuse Detection', () => {
      it('verifies verifier first; if token was already revoked, revokes family and logs audit before throwing', async () => {
        const tokenId = 'tok-uuid-1';
        const rawVerifier = 'valid_raw_verifier_secret_str';
        const verifierHash = require('crypto')
          .createHmac('sha256', refreshSecret)
          .update(rawVerifier)
          .digest('hex');

        mockPrisma.refreshToken.findUnique.mockResolvedValue({
          id: tokenId,
          userId: 'usr-1',
          familyId: 'family-alpha',
          verifierHash,
          isRevoked: true, // Already revoked token (reuse attempt!)
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 100000),
          user: { id: 'usr-1', phone: '+201012345678', role: UserRole.CUSTOMER },
        });

        await expect(
          authService.refreshToken({ refreshToken: `${tokenId}.${rawVerifier}` }),
        ).rejects.toThrow(/تم رصد محاولة استخدام رمز تحديث مسبق/);

        // Entire family revoked
        expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { familyId: 'family-alpha' },
            data: expect.objectContaining({ isRevoked: true }),
          }),
        );

        // Audit log created
        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'REFRESH_TOKEN_REUSE_DETECTED',
              isFlagged: true,
            }),
          }),
        );
      });

      it('does NOT revoke family if verifier fails (protects against token ID guessing)', async () => {
        const tokenId = 'tok-uuid-guessed';
        const verifierHash = require('crypto')
          .createHmac('sha256', refreshSecret)
          .update('real_verifier')
          .digest('hex');

        mockPrisma.refreshToken.findUnique.mockResolvedValue({
          id: tokenId,
          userId: 'usr-victim',
          familyId: 'victim-family',
          verifierHash,
          isRevoked: false,
          user: { id: 'usr-victim', phone: '+201011112222', role: UserRole.CUSTOMER },
        });

        await expect(
          authService.refreshToken({ refreshToken: `${tokenId}.wrong_attacker_verifier` }),
        ).rejects.toThrow(UnauthorizedException);

        // Token family was NOT touched!
        expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
      });
    });

    describe('Verified Logout', () => {
      it('verifies complete <id>.<verifier> before revoking session', async () => {
        const tokenId = 'logout-tok-1';
        const rawVerifier = 'raw_logout_verifier';
        const verifierHash = require('crypto')
          .createHmac('sha256', refreshSecret)
          .update(rawVerifier)
          .digest('hex');

        mockPrisma.refreshToken.findUnique.mockResolvedValue({
          id: tokenId,
          userId: 'usr-logout',
          verifierHash,
        });

        const result = await authService.logout('usr-logout', {
          refreshToken: `${tokenId}.${rawVerifier}`,
        });

        expect(result.success).toBe(true);
        expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: tokenId },
            data: expect.objectContaining({ isRevoked: true }),
          }),
        );
      });
    });
  });
});
