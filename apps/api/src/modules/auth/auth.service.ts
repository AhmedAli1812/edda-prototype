import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto, RegisterDeviceTokenDto } from './dto/auth.dto';
import { UserRole, OtpPurpose } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const { phone, purpose } = dto;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 1. Rate limiting check: max 5 OTPs per hour per phone
    const recentOtpsCount = await this.prisma.otpCode.count({
      where: {
        phone,
        createdAt: { gte: oneHourAgo },
      },
    });

    const maxPerHour = this.configService.get<number>('throttle.otpRateLimitPerHour', 5);
    if (recentOtpsCount >= maxPerHour) {
      throw new BadRequestException('تم تجاوز الحد المسموح لإرسال رموز التحقق. يرجى المحاولة بعد ساعة.');
    }

    // 2. Generate random 4-digit code (deterministic mock in dev: 4821 if local)
    const code = process.env.NODE_ENV === 'production' 
      ? Math.floor(1000 + Math.random() * 9000).toString() 
      : '4821';

    const codeHash = await bcrypt.hash(code, 8);
    const expirationSeconds = this.configService.get<number>('throttle.otpExpirationSeconds', 300);
    const expiresAt = new Date(now.getTime() + expirationSeconds * 1000);

    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        purpose,
        expiresAt,
      },
    });

    this.logger.log(`[SMS Gateway Mock] Sent OTP ${code} to ${phone} for purpose ${purpose}`);

    return {
      success: true,
      message: 'تم إرسال رمز التحقق بنجاح',
      expiresInSeconds: expirationSeconds,
      // For development ease, code is included when not in production
      ...(process.env.NODE_ENV !== 'production' && { devOtp: code }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, code, purpose } = dto;
    const now = new Date();

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        purpose,
        verifiedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('رمز التحقق غير صالح أو انتهت صلاحيته');
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new BadRequestException('تم تجاوز الحد الأقصى للمحاولات لهذا الرمز. يرجى طلب رمز جديد.');
    }

    const isMatch = await bcrypt.compare(code, otpRecord.codeHash);
    if (!isMatch) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('رمز التحقق غير صحيح');
    }

    // Mark OTP as verified
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: now },
    });

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: { technicianProfile: true, storeProfile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          fullName: 'مستخدم جديد',
          role: UserRole.CUSTOMER,
          wallet: { create: { availableBalanceMinorUnits: 0, pendingBalanceMinorUnits: 0 } },
        },
        include: { technicianProfile: true, storeProfile: true },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.phone, user.role);

    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        kycStatus: user.technicianProfile?.kycStatus || user.storeProfile?.kycStatus || 'APPROVED',
        rewardPoints: user.rewardPoints,
      },
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.refreshToken).digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('رمز التحديث غير صالح أو منتهي الصلاحية');
    }

    // Revoke used refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(storedToken.user.id, storedToken.user.phone, storedToken.user.role);
  }

  async logout(userId: string) {
    // Revoke all active refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true, message: 'تم تسجيل الخروج بنجاح' };
  }

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: { userId, platform: dto.platform, isActive: true },
      create: { userId, token: dto.token, platform: dto.platform },
    });
    return { success: true, message: 'تم تسجيل معرف الجهاز بنجاح' };
  }

  private async generateTokens(userId: string, phone: string, role: string) {
    const payload = { sub: userId, phone, role };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET', 'dev_secret_access_key_min_32_characters!');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'dev_secret_refresh_key_min_32_characters!');

    const [accessToken, rawRefreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
      }),
      crypto.randomBytes(40).toString('hex'),
    ]);

    // Store hashed refresh token in database
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }
}
