import { ConfigService } from '@nestjs/config';
import { ISmsProvider } from './sms-provider.interface';
import { DevelopmentSmsProvider } from './development-sms.provider';
import { CequensSmsProvider } from './cequens-sms.provider';
import { DisabledSmsProvider } from './disabled-sms.provider';

export const SUPPORTED_SMS_PROVIDERS = ['development', 'cequens', 'twilio'] as const;
export type SupportedSmsProvider = (typeof SUPPORTED_SMS_PROVIDERS)[number];

/**
 * Factory for creating SMS provider instances dynamically based on configuration.
 *
 * Supported providers:
 * - 'development': Local development and automated testing only (logs OTP to stdout).
 * - 'cequens': Regional MENA/Egypt SMS gateway via official Sign-In + Messages API.
 * - 'twilio': Global SMS gateway (architecture stub).
 */
export function createSmsProvider(configService: ConfigService): ISmsProvider {
  const nodeEnv = configService.get<string>('nodeEnv') || configService.get<string>('NODE_ENV') || 'development';
  const rawOtpEnv = process.env.OTP_ENABLED?.trim().toLowerCase();
  const isOtpEnabled = configService.get<boolean>('otp.enabled') ?? (rawOtpEnv === 'true' || rawOtpEnv === '1');

  // When OTP is disabled, return DisabledSmsProvider and skip all SMS provider validation
  if (!isOtpEnabled) {
    return new DisabledSmsProvider();
  }

  const rawProvider = configService.get<string>('sms.provider') || process.env.SMS_PROVIDER;
  const provider = (rawProvider || (nodeEnv === 'production' ? '' : 'development')).trim().toLowerCase();

  // 1. Production must never run without a configured production provider
  if (nodeEnv === 'production') {
    if (!rawProvider || provider === 'development') {
      throw new Error(
        'FATAL CONFIGURATION ERROR: SMS_PROVIDER cannot be "development" in production. Configure a production SMS provider (e.g. cequens, twilio).',
      );
    }
  }

  // 2. Validate supported providers
  if (!SUPPORTED_SMS_PROVIDERS.includes(provider as SupportedSmsProvider)) {
    throw new Error(
      `FATAL CONFIGURATION ERROR: Unsupported SMS provider: "${rawProvider}". Supported providers: ${SUPPORTED_SMS_PROVIDERS.join(', ')}.`,
    );
  }

  // 3. Instantiate provider based on selection
  switch (provider) {
    case 'development': {
      if (nodeEnv !== 'development' && nodeEnv !== 'test') {
        throw new Error(
          `CRITICAL SECURITY CONFIGURATION ERROR: DevelopmentSmsProvider is strictly forbidden in "${nodeEnv}". Allowed only in "development" and "test".`,
        );
      }
      return new DevelopmentSmsProvider(configService);
    }

    case 'cequens': {
      return new CequensSmsProvider(configService);
    }

    case 'twilio': {
      throw new Error(
        'CONFIGURATION ERROR: Twilio SMS provider architecture is registered, but live HTTP gateway integration is pending provider account selection.',
      );
    }

    default:
      throw new Error(
        `FATAL CONFIGURATION ERROR: Unsupported SMS provider: "${provider}". Supported providers: ${SUPPORTED_SMS_PROVIDERS.join(', ')}.`,
      );
  }
}
