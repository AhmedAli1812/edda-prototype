import { OtpPurpose } from '@prisma/client';

export interface SmsSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface ISmsProvider {
  /**
   * Dispatches an OTP code to a normalized Egyptian phone number.
   *
   * @param phone Normalized E.164 phone number (+201XXXXXXXXX)
   * @param otp 6-digit numeric OTP code
   * @param purpose Reason for OTP (LOGIN, REGISTRATION, etc.)
   */
  sendOtp(phone: string, otp: string, purpose: OtpPurpose): Promise<SmsSendResult>;
}

export const SMS_PROVIDER_TOKEN = 'SMS_PROVIDER_TOKEN';
