import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsString,
  Length,
  IsOptional,
  IsEmail,
  IsArray,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { OtpPurpose } from '@prisma/client';

export class SendOtpDto {
  @ApiProperty({
    example: '01012345678',
    description: 'Egyptian mobile phone number (local or international format)',
  })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  phone: string;

  @ApiProperty({
    enum: [OtpPurpose.LOGIN, OtpPurpose.REGISTRATION],
    example: OtpPurpose.LOGIN,
    description: 'Purpose of the OTP: LOGIN or REGISTRATION',
  })
  @IsEnum(OtpPurpose, { message: 'الغرض من الرمز يجب أن يكون تسجيل الدخول أو إنشاء حساب جديد' })
  purpose: OtpPurpose;
}

export class VerifyRegistrationOtpDto {
  @ApiProperty({ example: '01012345678', description: 'Normalized Egyptian phone number' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '482190', description: '6-digit OTP verification code' })
  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @Length(6, 6, { message: 'رمز التحقق يجب أن يتكون من 6 أرقام' })
  code: string;
}

export enum PublicRegistrationRole {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
}

export class RegisterDto {
  @ApiProperty({
    example: '01012345678',
    description: 'Egyptian mobile phone number (local or international format)',
  })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'Account password (minimum 8 characters)',
  })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @IsString()
  @Length(8, 128, { message: 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل' })
  password: string;

  @ApiProperty({
    enum: PublicRegistrationRole,
    example: PublicRegistrationRole.CUSTOMER,
    description: 'Account role (CUSTOMER or TECHNICIAN)',
  })
  @IsNotEmpty({ message: 'نوع الحساب مطلوب' })
  @IsEnum(PublicRegistrationRole, {
    message: 'نوع الحساب غير صالح. يُسمح فقط بـ CUSTOMER أو TECHNICIAN',
  })
  role: PublicRegistrationRole;

  @ApiPropertyOptional({ example: 'أحمد محمد', description: 'User full name' })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'الاسم يجب أن يتراوح بين 2 و 100 حرف' })
  fullName?: string;
}

export class LoginDto {
  @ApiProperty({ example: '01012345678', description: 'Normalized Egyptian phone number' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'StrongPassword123', description: 'Account password (minimum 8 characters)' })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @IsString()
  @Length(8, 128, { message: 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل' })
  password: string;
}


export class RegisterCustomerDto {
  @ApiProperty({
    description: 'Single-use onboarding token received from /auth/otp/verify-registration',
  })
  @IsNotEmpty({ message: 'رمز التسجيل المؤقت مطلوب' })
  @IsString()
  onboardingToken: string;

  @ApiProperty({ example: 'أحمد محمد', description: 'Customer full name' })
  @IsNotEmpty({ message: 'الاسم الكامل مطلوب' })
  @IsString()
  @Length(3, 100, { message: 'الاسم يجب أن يتراوح بين 3 و 100 حرف' })
  fullName: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com', description: 'Optional email address' })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @ApiPropertyOptional({ example: 'القاهرة', description: 'Governorate' })
  @IsOptional()
  @IsString()
  governorate?: string;

  @ApiPropertyOptional({ example: 'مدينة نصر', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'شارع عباس العقاد', description: 'Street address' })
  @IsOptional()
  @IsString()
  street?: string;
}

export class RegisterTechnicianDto {
  @ApiProperty({
    description: 'Single-use onboarding token received from /auth/otp/verify-registration',
  })
  @IsNotEmpty({ message: 'رمز التسجيل المؤقت مطلوب' })
  @IsString()
  onboardingToken: string;

  @ApiProperty({ example: 'محمود السيد', description: 'Technician full name' })
  @IsNotEmpty({ message: 'الاسم الكامل مطلوب' })
  @IsString()
  @Length(3, 100, { message: 'الاسم يجب أن يتراوح بين 3 و 100 حرف' })
  fullName: string;

  @ApiProperty({
    example: '29801010101234',
    description: '14-digit Egyptian National ID number',
  })
  @IsNotEmpty({ message: 'الرقم القومي مطلوب' })
  @Matches(/^[23]\d{13}$/, {
    message: 'الرقم القومي المصري غير صالح. يجب أن يتكون من 14 رقماً ويبدأ بـ 2 أو 3',
  })
  nationalId: string;

  @ApiProperty({
    example: ['electricity', 'air_conditioning'],
    description: 'Service categories technician is qualified for',
  })
  @IsArray({ message: 'يجب اختيار فئات الصيانة' })
  categories: string[];

  @ApiPropertyOptional({ example: 'فني كهرباء منازل معتمد خبرة 10 سنوات' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 15, description: 'Service radius in Kilometers' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  serviceRadiusKm?: number;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000.a1b2c3d4...',
    description: 'Refresh token in <id>.<verifier> format',
  })
  @IsNotEmpty({ message: 'رمز التحديث مطلوب' })
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000.a1b2c3d4...',
    description: 'Current session refresh token in <id>.<verifier> format',
  })
  @IsNotEmpty({ message: 'رمز التحديث للجلسة مطلوب' })
  @IsString()
  refreshToken: string;
}

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'FCM device token' })
  @IsNotEmpty({ message: 'رمز الجهاز مطلوب' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'android', enum: ['android', 'ios', 'web'] })
  @IsNotEmpty()
  @IsString()
  platform: string;
}
