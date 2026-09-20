import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsEnum } from 'class-validator';
import { OtpPurpose } from '@prisma/client';

export class SendOtpDto {
  @ApiProperty({ example: '+201012345678', description: 'Egyptian phone number in E.164 or local format' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  phone: string;

  @ApiProperty({ enum: OtpPurpose, default: OtpPurpose.LOGIN, description: 'Purpose of the OTP code' })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose = OtpPurpose.LOGIN;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+201012345678', description: 'Phone number' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  phone: string;

  @ApiProperty({ example: '4821', description: '4 to 6-digit OTP code' })
  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  code: string;

  @ApiProperty({ enum: OtpPurpose, default: OtpPurpose.LOGIN })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose = OtpPurpose.LOGIN;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Valid refresh token' })
  @IsNotEmpty({ message: 'رمز التحديث مطلوب' })
  refreshToken: string;
}

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'FCM device token' })
  @IsNotEmpty({ message: 'رمز الجهاز مطلوب' })
  token: string;

  @ApiProperty({ example: 'android', enum: ['android', 'ios', 'web'] })
  @IsNotEmpty()
  platform: string;
}
