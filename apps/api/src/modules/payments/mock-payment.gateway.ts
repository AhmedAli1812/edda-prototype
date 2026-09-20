import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  PaymentGateway,
  AuthorizePaymentRequest,
  AuthorizePaymentResult,
  CapturePaymentRequest,
  CapturePaymentResult,
  VoidPaymentRequest,
  VoidPaymentResult,
  RefundPaymentRequest,
  RefundPaymentResult,
  WebhookVerificationResult,
} from './payment-gateway.interface';

@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  readonly providerName = 'mock';
  private readonly logger = new Logger('MockPaymentGateway');

  async authorize(request: AuthorizePaymentRequest): Promise<AuthorizePaymentResult> {
    this.logger.log(`[MockPayment] Authorizing ${request.amountMinorUnits} piasters for customer ${request.customerId} (Idempotency: ${request.idempotencyKey})`);

    const gatewayTransactionId = `MOCK-AUTH-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    return {
      gatewayTransactionId,
      status: 'AUTHORIZED',
      rawResponse: { simulated: true, provider: 'mock' },
    };
  }

  async capture(request: CapturePaymentRequest): Promise<CapturePaymentResult> {
    this.logger.log(`[MockPayment] Capturing ${request.amountMinorUnits} piasters for transaction ${request.gatewayTransactionId}`);

    return {
      gatewayTransactionId: request.gatewayTransactionId,
      status: 'CAPTURED',
      capturedAmountMinorUnits: request.amountMinorUnits,
    };
  }

  async void(request: VoidPaymentRequest): Promise<VoidPaymentResult> {
    this.logger.log(`[MockPayment] Voiding authorization ${request.gatewayTransactionId}`);

    return {
      gatewayTransactionId: request.gatewayTransactionId,
      status: 'VOIDED',
    };
  }

  async refund(request: RefundPaymentRequest): Promise<RefundPaymentResult> {
    this.logger.log(`[MockPayment] Refunding ${request.amountMinorUnits} piasters for transaction ${request.gatewayTransactionId}`);

    const gatewayRefundRef = `MOCK-REF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    return {
      gatewayRefundRef,
      status: 'REFUNDED',
      refundedAmountMinorUnits: request.amountMinorUnits,
    };
  }

  async verifyWebhookSignature(rawBody: any, headers: Record<string, any>): Promise<WebhookVerificationResult> {
    const gatewayEventId = headers['x-mock-event-id'] || `EVT-${Date.now()}`;
    const eventType = rawBody?.type || 'payment.authorized';

    return {
      isValid: true,
      gatewayEventId,
      eventType,
      payload: rawBody,
      gatewayTransactionId: rawBody?.transactionId,
      paymentStatus: 'AUTHORIZED',
    };
  }
}
