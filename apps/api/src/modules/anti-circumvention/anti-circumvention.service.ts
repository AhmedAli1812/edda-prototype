import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskLevel, AntiCircumventionAction } from '@prisma/client';

export interface MessageScanResult {
  isSuspicious: boolean;
  detectedReason?: string;
  riskLevel: RiskLevel;
  action: AntiCircumventionAction;
  sanitizedMessage: string;
}

@Injectable()
export class AntiCircumventionService {
  private readonly logger = new Logger('AntiCircumventionService');

  // Regex patterns for Egyptian mobile numbers, spelled-out digits, and external payment handles
  private readonly phonePatterns = [
    /(?:(?:\+?20)|0)?1[0125]\d{8}/g, // Standard 010, 011, 012, 015
    /(?:زيرو|صفر)\s*(?:واحد|١)\s*(?:صفر|واحد|اتنين|تلاتة|خمسة|[0125])[\s\d٠-٩]{7,15}/gu, // Arabic spelled numbers
  ];

  private readonly paymentKeywords = [
    /انستاباي/i,
    /انستا باي/i,
    /instapay/i,
    /فودافون كاش/i,
    /vodafone cash/i,
    /تحويل بره/i,
    /كاش برة/i,
    /ابعتلي كاش/i,
    /رقمي الواتس/i,
    /واتساب/i,
    /whatsapp/i,
  ];

  constructor(private prisma: PrismaService) {}

  async scanChatMessage(
    jobId: string,
    senderId: string,
    recipientId: string,
    messageText: string,
  ): Promise<MessageScanResult> {
    let isSuspicious = false;
    let detectedReason: string | undefined;
    let riskLevel: RiskLevel = RiskLevel.LOW;
    let action: AntiCircumventionAction = AntiCircumventionAction.NONE;

    // 1. Phone number pattern detection
    for (const pattern of this.phonePatterns) {
      if (pattern.test(messageText)) {
        isSuspicious = true;
        detectedReason = 'PHONE_NUMBER_DETECTED';
        riskLevel = RiskLevel.HIGH;
        action = AntiCircumventionAction.WARNING_ISSUED;
        break;
      }
    }

    // 2. External payment keywords detection
    if (!isSuspicious) {
      for (const pattern of this.paymentKeywords) {
        if (pattern.test(messageText)) {
          isSuspicious = true;
          detectedReason = 'EXTERNAL_PAYMENT_REQUEST';
          riskLevel = RiskLevel.MEDIUM;
          action = AntiCircumventionAction.WARNING_ISSUED;
          break;
        }
      }
    }

    if (isSuspicious) {
      this.logger.warn(
        `[Anti-Circumvention Alert] Sender ${senderId} in Job ${jobId} triggered ${detectedReason} (Risk: ${riskLevel})`,
      );

      // Log in database for administrative review
      await this.prisma.chatAntiCircumventionLog.create({
        data: {
          jobId,
          senderId,
          recipientId,
          originalMessage: messageText,
          flaggedReason: detectedReason || 'UNKNOWN',
          riskLevel,
          actionTaken: action,
        },
      });
    }

    return {
      isSuspicious,
      detectedReason,
      riskLevel,
      action,
      sanitizedMessage: isSuspicious
        ? '⚠️ [تنبيه عِدّة: تم حجب رسالة تحتوي على وسيلة تواصل أو دفع خارج التطبيق حفاظاً على حماية SafePay والضمان]'
        : messageText,
    };
  }
}
