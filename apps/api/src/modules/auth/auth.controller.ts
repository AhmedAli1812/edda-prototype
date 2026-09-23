import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  SendOtpDto,
  LoginDto,
  RegisterDto,
  VerifyRegistrationOtpDto,
  RegisterCustomerDto,
  RegisterTechnicianDto,
  RefreshTokenDto,
  LogoutDto,
  RegisterDeviceTokenDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('المصادقة والحسابات (Auth)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'إرسال رمز تحقق OTP',
    description: 'إرسال رمز تحقق عبر رسالة نصية لأغراض تسجيل الدخول أو إنشاء حساب مع حماية كاملة ضد استقصاء الحسابات',
  })
  @ApiResponse({ status: 200, description: 'تم استلام الطلب ومعالجته بنجاح' })
  async sendOtp(@Body() dto: SendOtpDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.authService.sendOtp(dto, ip);
  }

  @Post('otp/verify-registration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'التحقق من رمز OTP للتسجيل واستخراج رمز الإعداد (Onboarding Token)',
    description: 'يتحقق من الرمز ويستهلكه ذرياً ويصدر رمز تسجيل مؤقت صالح لمدة 15 دقيقة للاستخدام لمرة واحدة فقط',
  })
  @ApiResponse({ status: 200, description: 'تم التحقق بنجاح وإصدار رمز التسجيل المؤقت' })
  async verifyRegistrationOtp(@Body() dto: VerifyRegistrationOtpDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.authService.verifyRegistrationOtp(dto, ip);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'إنشاء حساب جديد برقم الهاتف وكلمة المرور ونوع الحساب',
    description: 'تسجيل عميل أو فني بكلمة مرور مشفرة وإصدار توكنات الجلسة مباشرة',
  })
  @ApiResponse({ status: 201, description: 'تم إنشاء الحساب وإصدار توكنات الجلسة بنجاح' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.authService.register(dto, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'تسجيل الدخول برقم الهاتف وكلمة المرور',
    description: 'التحقق من صحة بيانات الدخول وإصدار توكنات الجلسة (Access Token و Refresh Token)',
  })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول وإصدار توكنات الجلسة' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.authService.login(dto, ip);
  }

  @Post('register/customer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'تسجيل حساب عميل جديد',
    description: 'استهلاك رمز التسجيل المؤقت وإنشاء حساب عميل ومحفظته وعنوانه وإصدار توكنات الجلسة',
  })
  @ApiResponse({ status: 201, description: 'تم إنشاء حساب العميل بنجاح' })
  async registerCustomer(@Body() dto: RegisterCustomerDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.authService.registerCustomer(dto, ip);
  }

  @Post('register/technician')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'تسجيل حساب فني صيانة جديد',
    description: 'استهلاك رمز التسجيل المؤقت وإنشاء حساب فني وتشفير الرقم القومي AES-256-GCM وبصمته الرقمية ومحفظته',
  })
  @ApiResponse({ status: 201, description: 'تم إنشاء حساب الفني بنجاح' })
  async registerTechnician(@Body() dto: RegisterTechnicianDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.authService.registerTechnician(dto, ip);
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'تدوير وتجديد توكن الوصول (Refresh Token Rotation)',
    description: 'التحقق أولاً من صحة المجزأة، وكشف إعادة الاستخدام لإلغاء عائلة التوكنات كاملة في حال الرصد الأمني',
  })
  @ApiResponse({ status: 200, description: 'تم تدوير التوكن وإصدار زوج جديد' })
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.authService.refreshToken(dto, ip);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'تسجيل الخروج من الجلسة الحالية',
    description: 'التحقق من صحة التوكن الكامل <id>.<verifier> وإبطال الجلسة الحالية فقط',
  })
  @ApiResponse({ status: 200, description: 'تم تسجيل الخروج وإبطال الجلسة' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() dto: LogoutDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.authService.logout(userId, dto, ip);
  }

  @Post('revoke-all-sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'إنهاء كافة الجلسات النشطة لجميع الأجهزة',
    description: 'إبطال كافة رموز التحديث النشطة للمستخدم وتسجيل عملية أمنية في سجل التدقيق',
  })
  @ApiResponse({ status: 200, description: 'تم إنهاء كافة الجلسات بنجاح' })
  async revokeAllSessions(@CurrentUser('id') userId: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.authService.revokeAllSessions(userId, ip);
  }

  @Post('device-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'تسجيل معرّف الجهاز للإشعارات الفورية (FCM)' })
  async registerDeviceToken(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.authService.registerDeviceToken(userId, dto);
  }
}
