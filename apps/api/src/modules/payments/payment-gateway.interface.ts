export interface AuthorizePaymentRequest {
  idempotencyKey: string;
  amountMinorUnits: number; // Integer (Egyptian Piasters)
  currency: string;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
}

export interface AuthorizePaymentResult {
  gatewayTransactionId: string;
  status: 'AUTHORIZED' | 'PENDING' | 'FAILED';
  redirectUrl?: string;
  requiresAction?: boolean;
  rawResponse?: any;
}

export interface CapturePaymentRequest {
  idempotencyKey: string;
  gatewayTransactionId: string;
  amountMinorUnits: number;
}

export interface CapturePaymentResult {
  gatewayTransactionId: string;
  status: 'CAPTURED' | 'FAILED';
  capturedAmountMinorUnits: number;
}

export interface VoidPaymentRequest {
  gatewayTransactionId: string;
  reason?: string;
}

export interface VoidPaymentResult {
  gatewayTransactionId: string;
  status: 'VOIDED' | 'FAILED';
}

export interface RefundPaymentRequest {
  idempotencyKey: string;
  gatewayTransactionId: string;
  amountMinorUnits: number;
  reason: string;
}

export interface RefundPaymentResult {
  gatewayRefundRef: string;
  status: 'REFUNDED' | 'FAILED';
  refundedAmountMinorUnits: number;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  gatewayEventId: string;
  eventType: string;
  payload: any;
  gatewayTransactionId?: string;
  paymentStatus?: 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export interface PaymentGateway {
  readonly providerName: string;

  authorize(request: AuthorizePaymentRequest): Promise<AuthorizePaymentResult>;

  capture(request: CapturePaymentRequest): Promise<CapturePaymentResult>;

  void(request: VoidPaymentRequest): Promise<VoidPaymentResult>;

  refund(request: RefundPaymentRequest): Promise<RefundPaymentResult>;

  verifyWebhookSignature(rawBody: any, headers: Record<string, any>): Promise<WebhookVerificationResult>;
}
