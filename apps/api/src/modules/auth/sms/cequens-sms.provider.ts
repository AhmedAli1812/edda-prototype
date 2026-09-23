import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsProvider, SmsSendResult } from './sms-provider.interface';
import { OtpPurpose } from '@prisma/client';
import { maskPhone } from '../../../common/utils/phone.util';

/**
 * Normalizes Egyptian phone number at the CEQUENS provider boundary to "201xxxxxxxxx".
 * CEQUENS recipients parameter requires international digits without leading plus or zeros.
 */
export function formatCequensRecipient(phone: string): string {
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]+/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith('0')) {
    cleaned = '20' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('20') && cleaned.startsWith('1')) {
    cleaned = '20' + cleaned;
  }
  return cleaned;
}

/**
 * Safely extracts expiration timestamp (in ms) from a JWT payload if present.
 * Does not invent an expiration duration if absent.
 */
export function getJwtExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    const part1 = parts[1];
    if (parts.length !== 3 || !part1) return null;
    const payload = JSON.parse(Buffer.from(part1, 'base64').toString('utf8'));
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000;
    }
  } catch {
    // Non-fatal: if decoding fails, token expiration cannot be derived safely
  }
  return null;
}

@Injectable()
export class CequensSmsProvider implements ISmsProvider {
  private readonly logger = new Logger('CequensSmsProvider');

  private readonly authUrl = 'https://apis.cequens.com/auth/v1/tokens/';
  private readonly smsUrl = 'https://apis.cequens.com/sms/v1/messages';
  private readonly timeoutMs = 10000; // 10s finite timeout

  private readonly userName: string;
  private readonly apiKey: string;
  private readonly senderName: string;

  private cachedToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(private configService: ConfigService) {
    this.userName =
      this.configService.get<string>('sms.cequens.userName') ||
      process.env.CEQUENS_USERNAME ||
      '';
    this.apiKey =
      this.configService.get<string>('sms.cequens.apiKey') ||
      process.env.CEQUENS_API_KEY ||
      '';
    this.senderName =
      this.configService.get<string>('sms.cequens.senderName') ||
      process.env.CEQUENS_SENDER_NAME ||
      '';

    const nodeEnv =
      this.configService.get<string>('nodeEnv') ||
      this.configService.get<string>('NODE_ENV') ||
      'development';

    if (nodeEnv === 'production') {
      if (!this.userName || !this.apiKey || !this.senderName) {
        throw new Error(
          'FATAL CONFIGURATION ERROR: CEQUENS credentials (CEQUENS_USERNAME, CEQUENS_API_KEY, CEQUENS_SENDER_NAME) must be configured in production.',
        );
      }
    }
  }

  /**
   * Dispatches an OTP verification message via CEQUENS SMS API.
   * Throws on gateway error, authentication failure, network failure, or timeout.
   */
  async sendOtp(phone: string, otp: string, purpose: OtpPurpose): Promise<SmsSendResult> {
    const recipient = formatCequensRecipient(phone);
    const messageText = `رمز التحقق الخاص بك في Edda هو: ${otp}. صالح لمدة 5 دقائق.`;

    // Attempt delivery with automatic single-retry on 401 unauthorized
    const result = await this.dispatchWithRetry(recipient, messageText, phone);
    return result;
  }

  /**
   * Retrieves or refreshes the CEQUENS JWT access token.
   */
  private async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Date.now();

    // Reuse cached token if valid and not forcing refresh
    if (!forceRefresh && this.cachedToken) {
      if (this.tokenExpiry === null || now < this.tokenExpiry - 30000) {
        return this.cachedToken;
      }
    }

    // Invalidate cached token
    this.cachedToken = null;
    this.tokenExpiry = null;

    if (!this.userName || !this.apiKey) {
      throw new Error(
        'CEQUENS authentication failed: CEQUENS_USERNAME or CEQUENS_API_KEY is not configured.',
      );
    }

    let response: Response;
    try {
      response = await this.fetchWithTimeout(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          userName: this.userName,
          apiKey: this.apiKey,
        }),
      });
    } catch (err: any) {
      this.logger.error(`CEQUENS Sign-In request failed: ${err.message || err}`);
      throw new Error(`CEQUENS Sign-In network failure: ${err.message || err}`);
    }

    let body: any;
    try {
      body = await response.json();
    } catch {
      throw new Error(
        `CEQUENS Sign-In returned malformed non-JSON response (HTTP ${response.status}).`,
      );
    }

    if (!response.ok || body?.replyCode !== 0 || !body?.data?.access_token) {
      const replyMessage = body?.replyMessage || 'No access token returned';
      const replyCode = body?.replyCode ?? response.status;
      this.logger.error(
        `CEQUENS Sign-In rejected credentials (HTTP ${response.status}, code: ${replyCode}).`,
      );
      throw new Error(`CEQUENS authentication failed: ${replyMessage} (Code: ${replyCode})`);
    }

    const token = body.data.access_token as string;
    this.cachedToken = token;
    this.tokenExpiry = getJwtExpiry(token);

    return token;
  }

  /**
   * Executes SMS delivery with exactly one retry on token expiration/401.
   */
  private async dispatchWithRetry(
    recipient: string,
    messageText: string,
    originalPhone: string,
    isRetry = false,
  ): Promise<SmsSendResult> {
    const token = await this.getAccessToken(isRetry);

    let response: Response;
    try {
      response = await this.fetchWithTimeout(this.smsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          messageText,
          senderName: this.senderName,
          messageType: 'unicode',
          recipients: recipient,
        }),
      });
    } catch (err: any) {
      this.logger.error(
        `CEQUENS SMS dispatch network error to ${maskPhone(originalPhone)}: ${err.message || err}`,
      );
      throw new Error(`CEQUENS SMS network failure: ${err.message || err}`);
    }

    // Handle 401 Unauthorized: token expired or revoked
    if (response.status === 401) {
      this.cachedToken = null;
      this.tokenExpiry = null;

      if (!isRetry) {
        this.logger.warn('CEQUENS token returned 401; refreshing token and retrying once...');
        return this.dispatchWithRetry(recipient, messageText, originalPhone, true);
      }

      this.logger.error('CEQUENS authentication failed on retry after token refresh (HTTP 401).');
      throw new Error('CEQUENS authentication failure: rejected token after retry (HTTP 401).');
    }

    let body: any;
    try {
      body = await response.json();
    } catch {
      throw new Error(
        `CEQUENS SMS API returned malformed response (HTTP ${response.status}).`,
      );
    }

    if (!response.ok || body?.replyCode !== 0) {
      const replyCode = body?.replyCode ?? response.status;
      const replyMessage = body?.replyMessage || 'Unknown gateway rejection';
      const internalErrorDetails = body?.error?.internalErrors
        ?.map((e: any) => `${e.code}: ${e.details}`)
        .join(', ');

      const failureSummary = internalErrorDetails
        ? `${replyMessage} (${internalErrorDetails})`
        : replyMessage;

      this.logger.error(
        `CEQUENS gateway rejected SMS to ${maskPhone(originalPhone)} [ReplyCode: ${replyCode}, RequestId: ${body?.requestId || 'N/A'}]: ${failureSummary}`,
      );

      throw new Error(`CEQUENS SMS gateway rejection (Code ${replyCode}): ${failureSummary}`);
    }

    // Success validation: must have data.SentSMSIDs with at least one entry
    const sentIds = body?.data?.SentSMSIDs;
    if (!Array.isArray(sentIds) || sentIds.length === 0 || !sentIds[0]?.SMSId) {
      this.logger.error(
        `CEQUENS returned success replyCode 0 but missing SentSMSIDs for ${maskPhone(originalPhone)} (RequestId: ${body?.requestId || 'N/A'})`,
      );
      throw new Error('CEQUENS response missing SentSMSIDs confirmation.');
    }

    const providerMessageId = sentIds[0].SMSId as string;

    // Safe log: never log OTP codes, bodies, or credentials
    this.logger.log(
      `[CEQUENS SMS DISPATCH] To: ${maskPhone(originalPhone)} | RequestId: ${body.requestId} | SMSId: ${providerMessageId}`,
    );

    return {
      success: true,
      providerMessageId,
    };
  }

  /**
   * Wrapper around global fetch with AbortController timeout.
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
