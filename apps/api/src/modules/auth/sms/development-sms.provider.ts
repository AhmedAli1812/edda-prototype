import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ISmsProvider, SmsSendResult } from './sms-provider.interface';
import { OtpPurpose } from '@prisma/client';
import { maskPhone } from '../../../common/utils/phone.util';

@Injectable()
export class DevelopmentSmsProvider implements ISmsProvider {
  private readonly logger = new Logger('DevelopmentSmsProvider');

  constructor(private configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'production' || nodeEnv === 'staging') {
      throw new Error(
        'CRITICAL SECURITY CONFIGURATION ERROR: DevelopmentSmsProvider is strictly forbidden in production and staging environments.',
      );
    }
  }

  async sendOtp(phone: string, otp: string, purpose: OtpPurpose): Promise<SmsSendResult> {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    // Double check: strictly only log in development or test environments
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      this.logger.log(
        `[DEV SMS DISPATCH] To: ${maskPhone(phone)} | Code: [${otp}] | Purpose: ${purpose}`,
      );
    } else {
      throw new Error('DevelopmentSmsProvider invoked outside development/test mode');
    }

    return {
      success: true,
      providerMessageId: `mock-sms-${crypto.randomUUID()}`,
    };
  }
}
