import { ServiceUnavailableException } from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';
import { ISmsProvider, SmsSendResult } from './sms-provider.interface';

/**
 * Null SMS Provider used when OTP_ENABLED=false.
 * Does not require external credentials and does not dispatch network calls.
 */
export class DisabledSmsProvider implements ISmsProvider {
  async sendOtp(phone: string, otp: string, purpose: OtpPurpose): Promise<SmsSendResult> {
    throw new ServiceUnavailableException('خدمة رمز التحقق (OTP) غير متاحة حالياً.');
  }
}
