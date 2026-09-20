import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_GATEWAY, PaymentGateway } from './payment-gateway.interface';
import { AuthorizeServicePaymentDto, ProcessRefundDto } from './dto/payment.dto';
import { PaymentStatus, JobStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(
    private prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY) private gateway: PaymentGateway,
  ) {}

  async authorizeJobPayment(customerId: string, dto: AuthorizeServicePaymentDto) {
    const { jobId, idempotencyKey, amountMinorUnits, paymentMethod } = dto;

    // 1. Idempotency Check
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });

    if (existingPayment) {
      this.logger.log(`Idempotency hit for key ${idempotencyKey}. Returning existing payment.`);
      return {
        idempotent: true,
        payment: existingPayment,
      };
    }

    // 2. Validate Job State
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { customer: true, offer: true },
    });

    if (!job) {
      throw new NotFoundException('الخدمة المطلوبة غير موجودة');
    }

    if (job.customerId !== customerId) {
      throw new BadRequestException('غير مصرح لك بإجراء الدفع لهذا الطلب');
    }

    // 3. Delegate to provider-agnostic gateway
    const authResult = await this.gateway.authorize({
      idempotencyKey,
      amountMinorUnits,
      currency: 'EGP',
      customerId,
      customerPhone: job.customer.phone,
      customerEmail: job.customer.email || undefined,
      metadata: { jobId, offerId: job.offerId },
    });

    // 4. Save Payment Record
    const payment = await this.prisma.payment.create({
      data: {
        customerId,
        jobId,
        gatewayProvider: this.gateway.providerName,
        gatewayTransactionId: authResult.gatewayTransactionId,
        idempotencyKey,
        amountMinorUnits,
        currency: 'EGP',
        status: authResult.status === 'AUTHORIZED' ? PaymentStatus.AUTHORIZED : PaymentStatus.INITIATED,
        paymentMethod,
        authorizedAt: authResult.status === 'AUTHORIZED' ? new Date() : null,
      },
    });

    // 5. Update Job status to CONFIRMED and reveal details
    if (authResult.status === 'AUTHORIZED') {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.CONFIRMED },
      });
    }

    return {
      idempotent: false,
      payment,
      redirectUrl: authResult.redirectUrl,
    };
  }

  async captureJobPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('سجل الدفع غير موجود');
    }

    if (payment.status === PaymentStatus.CAPTURED) {
      return { payment, alreadyCaptured: true };
    }

    if (!payment.gatewayTransactionId) {
      throw new BadRequestException('لا يوجد معرّف معاملة لدى بوابة الدفع');
    }

    const captureResult = await this.gateway.capture({
      idempotencyKey: `CAP-${payment.idempotencyKey}`,
      gatewayTransactionId: payment.gatewayTransactionId,
      amountMinorUnits: payment.amountMinorUnits,
    });

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.CAPTURED,
        capturedAt: new Date(),
      },
    });

    return { payment: updatedPayment, captureResult };
  }

  async processRefund(dto: ProcessRefundDto) {
    const { paymentId, amountMinorUnits, reason, idempotencyKey } = dto;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || !payment.gatewayTransactionId) {
      throw new NotFoundException('سجل الدفع غير موجود');
    }

    const refundResult = await this.gateway.refund({
      idempotencyKey,
      gatewayTransactionId: payment.gatewayTransactionId,
      amountMinorUnits,
      reason,
    });

    const refundRecord = await this.prisma.refund.create({
      data: {
        paymentId,
        amountMinorUnits,
        reason,
        gatewayRefundRef: refundResult.gatewayRefundRef,
        status: 'COMPLETED',
      },
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });

    return refundRecord;
  }

  async handleWebhook(rawBody: any, headers: Record<string, any>) {
    const verification = await this.gateway.verifyWebhookSignature(rawBody, headers);

    if (!verification.isValid) {
      throw new BadRequestException('توقيع الويب هوك غير صالح');
    }

    // Check duplicate webhook event
    const existingEvent = await this.prisma.paymentWebhookEvent.findUnique({
      where: { gatewayEventId: verification.gatewayEventId },
    });

    if (existingEvent) {
      this.logger.log(`Webhook event ${verification.gatewayEventId} already recorded and processed.`);
      return { success: true, duplicate: true };
    }

    // Record webhook event idempotently
    await this.prisma.paymentWebhookEvent.create({
      data: {
        gatewayEventId: verification.gatewayEventId,
        provider: this.gateway.providerName,
        eventType: verification.eventType,
        payload: verification.payload,
        isProcessed: true,
        processedAt: new Date(),
      },
    });

    return { success: true, duplicate: false };
  }
}
