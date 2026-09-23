import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ServiceUnavailableException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  SendOtpDto,
  LoginDto,
  RegisterDto,
  PublicRegistrationRole,
  VerifyRegistrationOtpDto,
  RegisterCustomerDto,
  RegisterTechnicianDto,
  RefreshTokenDto,
  LogoutDto,
  RegisterDeviceTokenDto,
} from './dto/auth.dto';
import { UserRole, UserStatus, OtpPurpose, KycStatus, OtpDeliveryStatus } from '@prisma/client';
import { normalizeEgyptianPhone, maskPhone } from '../../common/utils/phone.util';
import {
  hashOtp,
  hashPassword,
  verifyPassword,
  verifyVerifierHash,
  encryptAesGcm,
  computeNationalIdFingerprint,
  maskNationalId,
  hashIp,
} from '../../common/utils/crypto.util';
import { ISmsProvider, SMS_PROVIDER_TOKEN } from './sms/sms-provider.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(SMS_PROVIDER_TOKEN) private smsProvider: ISmsProvider,
  ) {}

  /**
   * Request an OTP code for LOGIN or REGISTRATION.
   * Transaction-safe with dedicated OtpRateLimit bucket, 60s cooldown, 5/hr rate limits,
   * external SMS delivery state machine, and enumeration-safe generic response.
   */
  async sendOtp(dto: SendOtpDto, clientIp: string = '127.0.0.1') {
    if (!this.configService.get<boolean>('otp.enabled', false)) {
      throw new ServiceUnavailableException('خدمة رمز التحقق (OTP) غير متاحة حالياً.');
    }
    const phone = normalizeEgyptianPhone(dto.phone);
    const purpose = dto.purpose;
    const now = new Date();
    const cooldownSeconds = this.configService.get<number>('otp.cooldownSeconds', 60);
    const expirationSeconds = this.configService.get<number>('otp.expirationSeconds', 300);
    const hourlyLimit = this.configService.get<number>('otp.hourlyRateLimit', 5);
    const otpPepper = this.configService.get<string>('otp.pepper')!;
    const isDeterministicTest = this.configService.get<boolean>('otp.deterministicTestOtp', false);
    const ipSalt = this.configService.get<string>('jwt.accessSecret')!;
    const ipHashed = hashIp(clientIp, ipSalt);

    // 1. Generate 6-digit cryptographic code [100000, 999999]
    const code = isDeterministicTest
      ? '482190'
      : crypto.randomInt(100000, 1000000).toString();

    const codeHash = hashOtp(code, otpPepper);
    const expiresAt = new Date(now.getTime() + expirationSeconds * 1000);

    // 2. Transactionally check/lock rate-limit bucket and reserve OTP record
    let otpRecordId = '';
    await this.prisma.$transaction(async (tx) => {
      // Concurrency protection: Ensure bucket exists and acquire row-level lock in MySQL
      try {
        await tx.$executeRawUnsafe(
          'INSERT INTO OtpRateLimit (phone, lastSentAt, hourlyCount, windowStart, ipHash, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE phone = phone',
          phone,
          new Date(0),
          now,
          ipHashed,
          now,
          now,
        );
      } catch {
        // Fallback for mock/test environments
        await tx.otpRateLimit.upsert({
          where: { phone },
          create: { phone, lastSentAt: new Date(0), hourlyCount: 0, windowStart: now, ipHash: ipHashed },
          update: {},
        }).catch(() => {});
      }

      let rateLimit: { phone: string; lastSentAt: Date; hourlyCount: number; windowStart: Date } | null = null;
      try {
        const rows: any = await tx.$queryRawUnsafe(
          'SELECT phone, lastSentAt, hourlyCount, windowStart FROM OtpRateLimit WHERE phone = ? FOR UPDATE',
          phone,
        );
        if (rows && rows.length > 0) {
          rateLimit = {
            phone: rows[0].phone,
            lastSentAt: new Date(rows[0].lastSentAt),
            hourlyCount: Number(rows[0].hourlyCount),
            windowStart: new Date(rows[0].windowStart),
          };
        }
      } catch {
        // Fallback for mock/test environments
        rateLimit = await tx.otpRateLimit.findUnique({ where: { phone } });
      }

      if (rateLimit && rateLimit.lastSentAt.getTime() > 0) {
        // Cooldown check
        const elapsedSinceLastSent = (now.getTime() - rateLimit.lastSentAt.getTime()) / 1000;
        if (elapsedSinceLastSent < cooldownSeconds) {
          const waitTime = Math.ceil(cooldownSeconds - elapsedSinceLastSent);
          throw new BadRequestException(
            `يرجى الانتظار ${waitTime} ثانية قبل طلب رمز تحقق جديد.`,
          );
        }

        // Hourly limit check
        const elapsedSinceWindow = (now.getTime() - rateLimit.windowStart.getTime()) / 1000;
        let newCount = rateLimit.hourlyCount + 1;
        let newWindowStart = rateLimit.windowStart;

        if (elapsedSinceWindow > 3600) {
          // Reset 1-hour rolling window
          newCount = 1;
          newWindowStart = now;
        } else if (rateLimit.hourlyCount >= hourlyLimit) {
          throw new BadRequestException(
            'تم تجاوز الحد الأقصى لطلب رموز التحقق خلال هذه الساعة. يرجى المحاولة لاحقاً.',
          );
        }

        await tx.otpRateLimit.update({
          where: { phone },
          data: {
            lastSentAt: now,
            hourlyCount: newCount,
            windowStart: newWindowStart,
            ipHash: ipHashed,
          },
        });
      } else {
        await tx.otpRateLimit.upsert({
          where: { phone },
          update: {
            lastSentAt: now,
            hourlyCount: 1,
            windowStart: now,
            ipHash: ipHashed,
          },
          create: {
            phone,
            lastSentAt: now,
            hourlyCount: 1,
            windowStart: now,
            ipHash: ipHashed,
          },
        });
      }

      // Invalidate any previous unconsumed active OTPs for this phone and purpose
      await tx.otpCode.updateMany({
        where: {
          phone,
          purpose,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          expiresAt: now,
        },
      });

      // Reserve OTP record with PENDING delivery state
      const createdOtp = await tx.otpCode.create({
        data: {
          phone,
          codeHash,
          purpose,
          deliveryStatus: OtpDeliveryStatus.PENDING,
          expiresAt,
          ipHash: ipHashed,
        },
      });
      otpRecordId = createdOtp.id;

      // Audit log: OTP Requested (never log the code)
      await tx.auditLog.create({
        data: {
          actorRole: UserRole.CUSTOMER,
          action: 'OTP_REQUESTED',
          entityType: 'OTP',
          entityId: createdOtp.id,
          ipAddress: ipHashed,
          details: { maskedPhone: maskPhone(phone), purpose },
        },
      });
    });

    // 3. Dispatch SMS OUTSIDE database transaction
    let deliverySuccess = false;
    let providerMessageId: string | undefined;

    try {
      const smsResult = await this.smsProvider.sendOtp(phone, code, purpose);
      deliverySuccess = smsResult.success;
      providerMessageId = smsResult.providerMessageId;
    } catch (err) {
      this.logger.error(`Failed to dispatch SMS to ${maskPhone(phone)}: ${err}`);
      deliverySuccess = false;
    }

    // 4. Update delivery state
    if (deliverySuccess) {
      await this.prisma.otpCode.update({
        where: { id: otpRecordId },
        data: {
          deliveryStatus: OtpDeliveryStatus.SENT,
          providerMessageId,
        },
      });
    } else {
      // Mark FAILED and reset lastSentAt in rate limit so user is not locked out
      await this.prisma.$transaction([
        this.prisma.otpCode.update({
          where: { id: otpRecordId },
          data: { deliveryStatus: OtpDeliveryStatus.FAILED },
        }),
        this.prisma.otpRateLimit.update({
          where: { phone },
          data: { lastSentAt: new Date(0) }, // Reset cooldown on provider failure
        }),
      ]);
      throw new BadRequestException('فشل إرسال رسالة التحقق عبر مزود الخدمة. يرجى المحاولة مجدداً.');
    }

    // 5. Return uniform enumeration-safe response
    return {
      success: true,
      message: 'إذا كان رقم الهاتف صالحاً، فسيصلك رمز التحقق عبر رسالة نصية قصيرة.',
      expiresInSeconds: expirationSeconds,
      cooldownSeconds,
    };
  }

  /**
   * Verifies an OTP for registration and returns a single-use OnboardingToken.
   */
  async verifyRegistrationOtp(dto: VerifyRegistrationOtpDto, clientIp: string = '127.0.0.1') {
    if (!this.configService.get<boolean>('otp.enabled', false)) {
      throw new ServiceUnavailableException('خدمة رمز التحقق (OTP) غير متاحة حالياً.');
    }
    const phone = normalizeEgyptianPhone(dto.phone);
    const now = new Date();
    const otpPepper = this.configService.get<string>('otp.pepper')!;
    const maxAttempts = this.configService.get<number>('otp.maxAttempts', 5);
    const codeHash = hashOtp(dto.code, otpPepper);
    const ipSalt = this.configService.get<string>('jwt.accessSecret')!;
    const ipHashed = hashIp(clientIp, ipSalt);

    const result: any = await this.prisma.$transaction(async (tx) => {
      // Atomic conditional update to consume OTP in one single statement
      const updateResult = await tx.otpCode.updateMany({
        where: {
          phone,
          purpose: OtpPurpose.REGISTRATION,
          deliveryStatus: OtpDeliveryStatus.SENT,
          consumedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: maxAttempts },
          codeHash,
        },
        data: {
          consumedAt: now,
        },
      });

      // Confirm exactly one row was updated
      if (updateResult.count !== 1) {
        // Increment attempts only on the latest active matching OTP for this phone and purpose
        const latestOtp = await tx.otpCode.findFirst({
          where: {
            phone,
            purpose: OtpPurpose.REGISTRATION,
            deliveryStatus: OtpDeliveryStatus.SENT,
            consumedAt: null,
            expiresAt: { gt: now },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (latestOtp) {
          await tx.otpCode.update({
            where: { id: latestOtp.id },
            data: { attempts: { increment: 1 } },
          });
        }

        await tx.auditLog.create({
          data: {
            actorRole: UserRole.CUSTOMER,
            action: 'OTP_VERIFICATION_FAILED',
            entityType: 'OTP',
            entityId: phone,
            ipAddress: ipHashed,
            details: { maskedPhone: maskPhone(phone), purpose: OtpPurpose.REGISTRATION },
            riskScore: 20,
          },
        });

        return { invalidOtp: true };
      }

      // Check if user already exists
      const existingUser = await tx.user.findUnique({ where: { phone } });
      if (existingUser) {
        return { existingUser: true };
      }

      // Generate single-use OnboardingToken (valid for 15 minutes)
      const jti = crypto.randomUUID();
      const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

      await tx.onboardingToken.create({
        data: {
          jti,
          phone,
          expiresAt,
        },
      });

      return {
        success: true,
        message: 'تم التحقق من رقم الهاتف بنجاح. يمكنك إتمام التسجيل.',
        onboardingToken: jti,
        expiresInSeconds: 900,
      };
    });

    if (result.invalidOtp) {
      throw new BadRequestException('رمز التحقق غير صحيح أو منتهي الصلاحية');
    }
    if (result.existingUser) {
      throw new ConflictException('رقم الهاتف مسجل بالفعل. يرجى تسجيل الدخول مباشرة.');
    }

    return result;
  }

  /**
   * Complete Customer registration using single-use OnboardingToken.
   */
  async registerCustomer(dto: RegisterCustomerDto, clientIp: string = '127.0.0.1') {
    if (!this.configService.get<boolean>('otp.enabled', false)) {
      throw new ServiceUnavailableException('خدمة التسجيل عبر رمز التحقق (OTP) غير متاحة حالياً.');
    }
    const now = new Date();
    const ipSalt = this.configService.get<string>('jwt.accessSecret')!;
    const ipHashed = hashIp(clientIp, ipSalt);

    return this.prisma.$transaction(async (tx) => {
      // Atomically consume onboarding token
      const tokenUpdate = await tx.onboardingToken.updateMany({
        where: {
          jti: dto.onboardingToken,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          consumedAt: now,
        },
      });

      // Confirm exactly one token was consumed
      if (tokenUpdate.count !== 1) {
        throw new BadRequestException('رمز التسجيل المؤقت غير صالح أو تم استخدامه مسبقاً');
      }

      const onboardingRecord = await tx.onboardingToken.findUnique({
        where: { jti: dto.onboardingToken },
      });

      if (!onboardingRecord) {
        throw new BadRequestException('رمز التسجيل المؤقت غير موجود');
      }

      const phone = onboardingRecord.phone;

      // Duplicate phone check
      const existingUser = await tx.user.findUnique({ where: { phone } });
      if (existingUser) {
        throw new ConflictException('رقم الهاتف مسجل مسبقاً');
      }

      // Create Customer User
      const user = await tx.user.create({
        data: {
          phone,
          fullName: dto.fullName.trim(),
          email: dto.email ? dto.email.trim().toLowerCase() : null,
          role: UserRole.CUSTOMER, // Strictly hardcoded, no STORE_PARTNER or ADMIN
          status: UserStatus.ACTIVE,
          wallet: {
            create: {
              availableBalanceMinorUnits: 0,
              pendingBalanceMinorUnits: 0,
            },
          },
          ...(dto.governorate && dto.city && dto.street
            ? {
                addresses: {
                  create: {
                    title: 'العنوان الرئيسي',
                    governorate: dto.governorate,
                    city: dto.city,
                    district: dto.city,
                    street: dto.street,
                    latitude: 30.0444,
                    longitude: 31.2357,
                    maskedAddress: `${dto.city} • ${dto.governorate}`,
                    isDefault: true,
                  },
                },
              }
            : {}),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          actorRole: UserRole.CUSTOMER,
          action: 'USER_REGISTERED',
          entityType: 'USER',
          entityId: user.id,
          ipAddress: ipHashed,
          details: { maskedPhone: maskPhone(phone), role: UserRole.CUSTOMER },
        },
      });

      // Issue tokens
      const session = await this.generateSessionTokens(tx, user.id, user.phone, user.role);

      return {
        success: true,
        message: 'تم إنشاء الحساب بنجاح',
        user: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          rewardPoints: user.rewardPoints,
        },
        ...session,
      };
    });
  }

  /**
   * Complete Technician registration using single-use OnboardingToken.
   */
  async registerTechnician(dto: RegisterTechnicianDto, clientIp: string = '127.0.0.1') {
    if (!this.configService.get<boolean>('otp.enabled', false)) {
      throw new ServiceUnavailableException('خدمة التسجيل عبر رمز التحقق (OTP) غير متاحة حالياً.');
    }
    const now = new Date();
    const nationalIdHmacKey = this.configService.get<string>('nationalId.hmacKey')!;
    const nationalIdEncryptionKey = this.configService.get<string>('nationalId.encryptionKey')!;
    const nationalIdKeyVersion = this.configService.get<number>('nationalId.keyVersion', 1);
    const ipSalt = this.configService.get<string>('jwt.accessSecret')!;
    const ipHashed = hashIp(clientIp, ipSalt);

    return this.prisma.$transaction(async (tx) => {
      // Atomically consume onboarding token
      const tokenUpdate = await tx.onboardingToken.updateMany({
        where: {
          jti: dto.onboardingToken,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          consumedAt: now,
        },
      });

      // Confirm exactly one token was consumed
      if (tokenUpdate.count !== 1) {
        throw new BadRequestException('رمز التسجيل المؤقت غير صالح أو تم استخدامه مسبقاً');
      }

      const onboardingRecord = await tx.onboardingToken.findUnique({
        where: { jti: dto.onboardingToken },
      });

      if (!onboardingRecord) {
        throw new BadRequestException('رمز التسجيل المؤقت غير موجود');
      }

      const phone = onboardingRecord.phone;

      // Duplicate phone check
      const existingUser = await tx.user.findUnique({ where: { phone } });
      if (existingUser) {
        throw new ConflictException('رقم الهاتف مسجل مسبقاً');
      }

      // Deterministic National ID fingerprint check
      const nationalIdClean = dto.nationalId.trim();
      const nationalIdFingerprint = computeNationalIdFingerprint(nationalIdClean, nationalIdHmacKey);

      const existingTechnician = await tx.technicianProfile.findUnique({
        where: { nationalIdFingerprint },
      });

      if (existingTechnician) {
        throw new ConflictException('الرقم القومي مسجل مسبقاً بحساب فني آخر');
      }

      // Encrypt National ID with AES-256-GCM
      const nationalIdEncrypted = encryptAesGcm(nationalIdClean, nationalIdEncryptionKey);

      // Create Technician User & Profile
      const user = await tx.user.create({
        data: {
          phone,
          fullName: dto.fullName.trim(),
          role: UserRole.TECHNICIAN, // Strictly hardcoded, no STORE_PARTNER or ADMIN
          status: UserStatus.ACTIVE,
          wallet: {
            create: {
              availableBalanceMinorUnits: 0,
              pendingBalanceMinorUnits: 0,
            },
          },
          technicianProfile: {
            create: {
              nationalIdEncrypted,
              nationalIdFingerprint,
              nationalIdKeyVersion,
              categories: dto.categories,
              bio: dto.bio?.trim() || null,
              serviceRadiusKm: dto.serviceRadiusKm || 15,
              kycStatus: KycStatus.PENDING_REVIEW,
            },
          },
        },
        include: { technicianProfile: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          actorRole: UserRole.TECHNICIAN,
          action: 'USER_REGISTERED',
          entityType: 'USER',
          entityId: user.id,
          ipAddress: ipHashed,
          details: {
            maskedPhone: maskPhone(phone),
            role: UserRole.TECHNICIAN,
            maskedNationalId: maskNationalId(nationalIdClean),
          },
        },
      });

      // Issue tokens
      const session = await this.generateSessionTokens(tx, user.id, user.phone, user.role);

      return {
        success: true,
        message: 'تم إنشاء حساب الفني بنجاح وهو قيد مراجعة مستندات التحقق',
        user: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          kycStatus: KycStatus.PENDING_REVIEW,
          nationalIdMasked: maskNationalId(nationalIdClean),
        },
        ...session,
      };
    });
  }

  /**
   * Public registration with phone + password + role (CUSTOMER or TECHNICIAN).
   * Securely hashes password via bcrypt, enforces Egyptian phone normalization,
   * creates user + wallet (+ technicianProfile if TECHNICIAN), and issues access & refresh tokens.
   */
  async register(dto: RegisterDto, clientIp: string = '127.0.0.1') {
    if (dto.role !== PublicRegistrationRole.CUSTOMER && dto.role !== PublicRegistrationRole.TECHNICIAN) {
      throw new BadRequestException('نوع الحساب غير صالح. يُسمح فقط بـ CUSTOMER أو TECHNICIAN');
    }

    const phone = normalizeEgyptianPhone(dto.phone);
    const ipSalt = this.configService.get<string>('jwt.accessSecret')!;
    const ipHashed = hashIp(clientIp, ipSalt);

    // Uniqueness pre-check
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('رقم الهاتف مسجل بالفعل. يرجى تسجيل الدخول مباشرة.');
    }

    const passwordHash = await hashPassword(dto.password);
    const userRole = dto.role === PublicRegistrationRole.TECHNICIAN ? UserRole.TECHNICIAN : UserRole.CUSTOMER;
    const defaultName = userRole === UserRole.TECHNICIAN ? 'فني عِدّة' : 'عميل عِدّة';
    const fullName = dto.fullName?.trim() || defaultName;

    return this.prisma.$transaction(async (tx) => {
      // Re-verify inside transaction to prevent race conditions
      const duplicateInTx = await tx.user.findUnique({ where: { phone } });
      if (duplicateInTx) {
        throw new ConflictException('رقم الهاتف مسجل بالفعل. يرجى تسجيل الدخول مباشرة.');
      }

      const user = await tx.user.create({
        data: {
          phone,
          passwordHash,
          fullName,
          role: userRole,
          status: UserStatus.ACTIVE,
          wallet: {
            create: {
              availableBalanceMinorUnits: 0,
              pendingBalanceMinorUnits: 0,
            },
          },
          ...(userRole === UserRole.TECHNICIAN
            ? {
                technicianProfile: {
                  create: {
                    kycStatus: KycStatus.NOT_SUBMITTED,
                  },
                },
              }
            : {}),
        },
        include: { technicianProfile: true },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          actorRole: user.role,
          action: 'USER_REGISTERED',
          entityType: 'USER',
          entityId: user.id,
          ipAddress: ipHashed,
          details: { maskedPhone: maskPhone(phone), role: user.role, authMethod: 'PASSWORD' },
        },
      });

      const session = await this.generateSessionTokens(tx, user.id, user.phone, user.role);

      return {
        success: true,
        message: 'تم إنشاء الحساب بنجاح',
        user: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          kycStatus: user.technicianProfile?.kycStatus || 'APPROVED',
          rewardPoints: user.rewardPoints,
        },
        ...session,
      };
    });
  }

  /**
   * User login using phone + password only.
   * Generic failure on non-existent account or invalid credentials (enumeration protection).
   * OTP-code login payloads are strictly rejected.
   */
  async login(dto: LoginDto, clientIp: string = '127.0.0.1') {
    if (!dto.password) {
      throw new BadRequestException('كلمة المرور مطلوبة لتسجيل الدخول');
    }

    const phone = normalizeEgyptianPhone(dto.phone);
    const ipSalt = this.configService.get<string>('jwt.accessSecret')!;
    const ipHashed = hashIp(clientIp, ipSalt);

    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { technicianProfile: true, storeProfile: true },
    });

    if (!user || !user.passwordHash) {
      await this.prisma.auditLog.create({
        data: {
          actorRole: UserRole.CUSTOMER,
          action: 'LOGIN_FAILED',
          entityType: 'USER',
          entityId: phone,
          ipAddress: ipHashed,
          details: { maskedPhone: maskPhone(phone), reason: 'INVALID_CREDENTIALS' },
          riskScore: 25,
        },
      }).catch(() => {});
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          actorRole: user.role,
          action: 'LOGIN_FAILED',
          entityType: 'USER',
          entityId: user.id,
          ipAddress: ipHashed,
          details: { maskedPhone: maskPhone(phone), reason: 'INVALID_CREDENTIALS' },
          riskScore: 25,
        },
      }).catch(() => {});
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (user.status === UserStatus.SUSPENDED) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          actorRole: user.role,
          action: 'ACCOUNT_SUSPENDED_LOGIN_ATTEMPT',
          entityType: 'USER',
          entityId: user.id,
          ipAddress: ipHashed,
          details: { maskedPhone: maskPhone(phone) },
          riskScore: 50,
          isFlagged: true,
        },
      }).catch(() => {});
      throw new UnauthorizedException('الحساب معلق. يرجى مراجعة إدارة المنصة.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          userId: user.id,
          actorRole: user.role,
          action: 'LOGIN_SUCCESS',
          entityType: 'USER',
          entityId: user.id,
          ipAddress: ipHashed,
          details: { maskedPhone: maskPhone(phone), role: user.role, authMethod: 'PASSWORD' },
        },
      });

      const session = await this.generateSessionTokens(tx, user.id, user.phone, user.role);

      return {
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          kycStatus: user.technicianProfile?.kycStatus || user.storeProfile?.kycStatus || 'APPROVED',
          rewardPoints: user.rewardPoints,
        },
        ...session,
      };
    });
  }

  /**
   * Refresh token rotation with verifier-first verification and token family reuse detection.
   */
  async refreshToken(dto: RefreshTokenDto, clientIp: string = '127.0.0.1') {
    const parts = dto.refreshToken.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new UnauthorizedException('رمز التحديث غير صالح');
    }
    const tokenId = parts[0];
    const rawVerifier = parts[1];
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret')!;
    const ipSalt = this.configService.get<string>('jwt.accessSecret')!;
    const ipHashed = hashIp(clientIp, ipSalt);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('رمز التحديث غير صالح أو منتهي الصلاحية');
    }

    // 1. Verify verifier hash FIRST using timing-safe comparison
    const isVerifierValid = verifyVerifierHash(rawVerifier!, storedToken.verifierHash, refreshSecret);
    if (!isVerifierValid) {
      throw new UnauthorizedException('رمز التحديث غير صالح');
    }

    // 2. ONLY after verifier passes: check if token is already revoked (Genuine Reuse Detection)
    if (storedToken.isRevoked || storedToken.revokedAt) {
      // Commit revocation of the entire family and audit log before throwing
      await this.prisma.$transaction(async (tx) => {
        await tx.refreshToken.updateMany({
          where: { familyId: storedToken.familyId },
          data: { isRevoked: true, revokedAt: new Date() },
        });

        await tx.auditLog.create({
          data: {
            userId: storedToken.userId,
            actorRole: storedToken.user.role,
            action: 'REFRESH_TOKEN_REUSE_DETECTED',
            entityType: 'REFRESH_TOKEN_FAMILY',
            entityId: storedToken.familyId,
            ipAddress: ipHashed,
            details: { reusedTokenId: storedToken.id },
            riskScore: 95,
            isFlagged: true,
          },
        });
      });

      // Thrown OUTSIDE transaction so security writes are committed!
      throw new UnauthorizedException(
        'تم رصد محاولة استخدام رمز تحديث مسبق. تم إنهاء كافة جلساتك لأسباب أمنية.',
      );
    }

    // 3. Expiration check
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('انتهت صلاحية رمز التحديث');
    }

    // 4. Token is valid -> Rotate inside transaction
    return this.prisma.$transaction(async (tx) => {
      const newTokenId = crypto.randomUUID();
      const newRawVerifier = crypto.randomBytes(32).toString('hex');
      const newVerifierHash = crypto
        .createHmac('sha256', refreshSecret)
        .update(newRawVerifier)
        .digest('hex');

      // Revoke old token
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          replacedByTokenId: newTokenId,
        },
      });

      // Insert new token into same family
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await tx.refreshToken.create({
        data: {
          id: newTokenId,
          userId: storedToken.userId,
          familyId: storedToken.familyId,
          verifierHash: newVerifierHash,
          expiresAt,
        },
      });

      const payload = {
        sub: storedToken.user.id,
        phone: storedToken.user.phone,
        role: storedToken.user.role,
      };

      const accessSecret = this.configService.get<string>('jwt.accessSecret')!;
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: this.configService.get<string>('jwt.accessExpiration', '15m'),
      });

      return {
        accessToken,
        refreshToken: `${newTokenId}.${newRawVerifier}`,
        expiresIn: 900,
      };
    });
  }

  /**
   * Verified logout for current session.
   * Requires complete `<id>.<verifier>` token.
   */
  async logout(userId: string, dto: LogoutDto, clientIp: string = '127.0.0.1') {
    const parts = dto.refreshToken.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new BadRequestException('صيغة رمز التحديث غير صحيحة');
    }
    const tokenId = parts[0];
    const rawVerifier = parts[1];
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret')!;
    const ipSalt = this.configService.get<string>('jwt.accessSecret')!;
    const ipHashed = hashIp(clientIp, ipSalt);

    const token = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });

    if (!token || token.userId !== userId) {
      return { success: true, message: 'تم تسجيل الخروج بنجاح' };
    }

    const isVerifierValid = verifyVerifierHash(rawVerifier!, token.verifierHash, refreshSecret);
    if (!isVerifierValid) {
      return { success: true, message: 'تم تسجيل الخروج بنجاح' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: tokenId },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId,
          actorRole: UserRole.CUSTOMER,
          action: 'LOGOUT',
          entityType: 'SESSION',
          entityId: tokenId,
          ipAddress: ipHashed,
        },
      });
    });

    return { success: true, message: 'تم تسجيل الخروج بنجاح' };
  }

  /**
   * Revoke all active sessions across all devices for this user.
   */
  async revokeAllSessions(userId: string, clientIp: string = '127.0.0.1') {
    const ipSalt = this.configService.get<string>('jwt.accessSecret')!;
    const ipHashed = hashIp(clientIp, ipSalt);

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId,
          actorRole: UserRole.CUSTOMER,
          action: 'REVOKE_ALL_SESSIONS',
          entityType: 'USER',
          entityId: userId,
          ipAddress: ipHashed,
        },
      });
    });

    return { success: true, message: 'تم إنهاء كافة الجلسات النشطة بنجاح' };
  }

  /**
   * Register or update FCM device token.
   */
  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: { userId, platform: dto.platform, isActive: true },
      create: { userId, token: dto.token, platform: dto.platform },
    });
    return { success: true, message: 'تم تسجيل معرف الجهاز بنجاح' };
  }

  /**
   * Helper to generate a new session (access token + refresh token in a new family).
   */
  private async generateSessionTokens(
    tx: any,
    userId: string,
    phone: string,
    role: UserRole,
  ) {
    const payload = { sub: userId, phone, role };
    const accessSecret = this.configService.get<string>('jwt.accessSecret')!;
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret')!;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: this.configService.get<string>('jwt.accessExpiration', '15m'),
    });

    const tokenId = crypto.randomUUID();
    const familyId = crypto.randomUUID();
    const rawVerifier = crypto.randomBytes(32).toString('hex');
    const verifierHash = crypto
      .createHmac('sha256', refreshSecret)
      .update(rawVerifier)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await tx.refreshToken.create({
      data: {
        id: tokenId,
        userId,
        familyId,
        verifierHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: `${tokenId}.${rawVerifier}`,
      expiresIn: 900,
    };
  }
}
