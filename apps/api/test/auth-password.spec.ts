import { BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/modules/auth/auth.service';
import { PublicRegistrationRole } from '../src/modules/auth/dto/auth.dto';
import { verifyPassword, hashPassword } from '../src/common/utils/crypto.util';
import { UserRole, UserStatus, KycStatus } from '@prisma/client';

describe('Password-Based Authentication Suite', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockSmsProvider: any;
  let jwtService: JwtService;
  let configService: ConfigService;

  const accessSecret = 'dev_secret_access_key_min_32_characters_long!';
  const refreshSecret = 'dev_secret_refresh_key_min_32_characters_long!';

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

    mockSmsProvider = {
      sendOtp: jest.fn(),
    };

    jwtService = new JwtService();

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'jwt.accessSecret') return accessSecret;
        if (key === 'jwt.refreshSecret') return refreshSecret;
        if (key === 'jwt.accessExpiration') return '15m';
        if (key === 'otp.pepper') return 'dev_otp_pepper_secret_min_32_characters_long!';
        return defaultValue;
      }),
    } as any;

    authService = new AuthService(
      mockPrisma,
      jwtService,
      configService,
      mockSmsProvider,
    );
  });

  describe('1. Registration Flow', () => {
    it('successfully registers a CUSTOMER with phone, password, and issues tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }: any) => ({
        id: 'user-cust-1',
        phone: data.phone,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role,
        status: data.status,
        rewardPoints: 0,
      }));

      const result = await authService.register({
        phone: '01012345678',
        password: 'SecurePassword123',
        role: PublicRegistrationRole.CUSTOMER,
        fullName: 'أحمد عميل',
      });

      expect(result.success).toBe(true);
      expect(result.user.role).toBe(UserRole.CUSTOMER);
      expect(result.user.phone).toBe('+201012345678');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Verify user creation in Prisma
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+201012345678',
            role: UserRole.CUSTOMER,
            fullName: 'أحمد عميل',
            wallet: {
              create: { availableBalanceMinorUnits: 0, pendingBalanceMinorUnits: 0 },
            },
          }),
        }),
      );

      // Verify OTP provider was NOT called
      expect(mockSmsProvider.sendOtp).not.toHaveBeenCalled();
    });

    it('successfully registers a TECHNICIAN and creates technicianProfile with NOT_SUBMITTED KYC', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }: any) => ({
        id: 'user-tech-1',
        phone: data.phone,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role,
        status: data.status,
        rewardPoints: 0,
        technicianProfile: {
          kycStatus: KycStatus.NOT_SUBMITTED,
        },
      }));

      const result = await authService.register({
        phone: '+201198765432',
        password: 'TechPassword123',
        role: PublicRegistrationRole.TECHNICIAN,
      });

      expect(result.success).toBe(true);
      expect(result.user.role).toBe(UserRole.TECHNICIAN);
      expect(result.user.phone).toBe('+201198765432');
      expect(result.user.kycStatus).toBe(KycStatus.NOT_SUBMITTED);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Verify technicianProfile creation
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: UserRole.TECHNICIAN,
            technicianProfile: {
              create: { kycStatus: KycStatus.NOT_SUBMITTED },
            },
          }),
        }),
      );

      // Verify OTP provider was NOT called
      expect(mockSmsProvider.sendOtp).not.toHaveBeenCalled();
    });

    it('stores password as a secure bcrypt hash, NEVER plaintext', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      let savedData: any = null;
      mockPrisma.user.create.mockImplementation(async ({ data }: any) => {
        savedData = data;
        return {
          id: 'user-hash-check',
          phone: data.phone,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          role: data.role,
          status: data.status,
          rewardPoints: 0,
        };
      });

      const rawPassword = 'MySecretPlaintextPassword!99';
      await authService.register({
        phone: '01234567890',
        password: rawPassword,
        role: PublicRegistrationRole.CUSTOMER,
      });

      expect(savedData).toBeDefined();
      expect(savedData.passwordHash).not.toBe(rawPassword);
      expect(savedData.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
      // Verify bcrypt compare confirms the hash matches raw password
      const match = await verifyPassword(rawPassword, savedData.passwordHash);
      expect(match).toBe(true);
    });

    it('rejects duplicate phone registration with ConflictException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        phone: '+201012345678',
      });

      await expect(
        authService.register({
          phone: '01012345678',
          password: 'Password123',
          role: PublicRegistrationRole.CUSTOMER,
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockSmsProvider.sendOtp).not.toHaveBeenCalled();
    });

    it('normalizes Egyptian phone variants (010..., +2010..., 2010...) to the same canonical format and detects duplicates', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        phone: '+201012345678',
      });

      // Try registering with local format "01012345678"
      await expect(
        authService.register({
          phone: '01012345678',
          password: 'Password123',
          role: PublicRegistrationRole.CUSTOMER,
        }),
      ).rejects.toThrow(ConflictException);

      // Try registering with country-code without plus "201012345678"
      await expect(
        authService.register({
          phone: '201012345678',
          password: 'Password123',
          role: PublicRegistrationRole.CUSTOMER,
        }),
      ).rejects.toThrow(ConflictException);

      // Try registering with full E.164 "+201012345678"
      await expect(
        authService.register({
          phone: '+201012345678',
          password: 'Password123',
          role: PublicRegistrationRole.CUSTOMER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects ADMIN registration through public endpoint', async () => {
      await expect(
        authService.register({
          phone: '01012345678',
          password: 'Password123',
          role: 'ADMIN' as any,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('rejects unsupported or arbitrary roles', async () => {
      await expect(
        authService.register({
          phone: '01012345678',
          password: 'Password123',
          role: 'STORE_PARTNER' as any,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        authService.register({
          phone: '01012345678',
          password: 'Password123',
          role: 'SUPERUSER' as any,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('2. Login Flow with Password', () => {
    let testPasswordHash: string;

    beforeAll(async () => {
      testPasswordHash = await hashPassword('CorrectPassword123');
    });

    it('explicitly rejects OTP-code login payloads without password', async () => {
      await expect(
        authService.login({ phone: '01012345678', code: '482190' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects passwords shorter than 8 characters during hashing/registration', async () => {
      await expect(
        authService.register({
          phone: '01012345678',
          password: 'short7!',
          role: PublicRegistrationRole.CUSTOMER,
        }),
      ).rejects.toThrow(/at least 8 characters/);
    });

    it('successfully logs in with phone and valid password, issuing access & refresh tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-login-1',
        phone: '+201012345678',
        passwordHash: testPasswordHash,
        fullName: 'أحمد عميل',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        rewardPoints: 50,
      });

      const result = await authService.login({
        phone: '01012345678',
        password: 'CorrectPassword123',
      });

      expect(result.success).toBe(true);
      expect(result.user.id).toBe('user-login-1');
      expect(result.user.role).toBe(UserRole.CUSTOMER);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Verify OTP provider was NOT called
      expect(mockSmsProvider.sendOtp).not.toHaveBeenCalled();
    });

    it('rejects login with wrong password using generic UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-login-1',
        phone: '+201012345678',
        passwordHash: testPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      });

      await expect(
        authService.login({
          phone: '01012345678',
          password: 'WrongPassword456',
        }),
      ).rejects.toThrow(UnauthorizedException);

      // Verify generic message prevents enumeration
      try {
        await authService.login({
          phone: '01012345678',
          password: 'WrongPassword456',
        });
      } catch (err: any) {
        expect(err.message).toBe('بيانات الدخول غير صحيحة');
      }

      expect(mockSmsProvider.sendOtp).not.toHaveBeenCalled();
    });

    it('rejects login with unknown phone using identical generic UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          phone: '01099999999',
          password: 'AnyPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      try {
        await authService.login({
          phone: '01099999999',
          password: 'AnyPassword123',
        });
      } catch (err: any) {
        expect(err.message).toBe('بيانات الدخول غير صحيحة');
      }

      expect(mockSmsProvider.sendOtp).not.toHaveBeenCalled();
    });

    it('normalizes Egyptian phone variants on login (010..., +2010..., 2010...)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-login-1',
        phone: '+201012345678',
        passwordHash: testPasswordHash,
        fullName: 'أحمد عميل',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      });

      // Login with local format
      const res1 = await authService.login({
        phone: '01012345678',
        password: 'CorrectPassword123',
      });
      expect(res1.success).toBe(true);

      // Login with country code format without plus
      const res2 = await authService.login({
        phone: '201012345678',
        password: 'CorrectPassword123',
      });
      expect(res2.success).toBe(true);

      // Login with international format
      const res3 = await authService.login({
        phone: '+201012345678',
        password: 'CorrectPassword123',
      });
      expect(res3.success).toBe(true);
    });

    it('rejects login for suspended accounts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-suspended',
        phone: '+201012345678',
        passwordHash: testPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        authService.login({
          phone: '01012345678',
          password: 'CorrectPassword123',
        }),
      ).rejects.toThrow(/الحساب معلق/);
    });
  });
});
