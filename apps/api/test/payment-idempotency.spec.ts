import { PaymentsService } from '../src/modules/payments/payments.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { MockPaymentGateway } from '../src/modules/payments/mock-payment.gateway';
import { PaymentStatus, PaymentMethodType } from '@prisma/client';

describe('Payment Idempotency & Gateway Flow', () => {
  let service: PaymentsService;
  let mockPrisma: any;
  let gateway: MockPaymentGateway;

  beforeEach(() => {
    gateway = new MockPaymentGateway();
    mockPrisma = {
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      job: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      paymentWebhookEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new PaymentsService(mockPrisma as unknown as PrismaService, gateway);
  });

  it('should return existing payment when duplicate idempotency key is submitted', async () => {
    const existingPayment = {
      id: 'pay-existing-1',
      idempotencyKey: 'IDEMP-JOB-2048-DUP',
      amountMinorUnits: 35000,
      currency: 'EGP',
      status: PaymentStatus.AUTHORIZED,
    };

    mockPrisma.payment.findUnique.mockResolvedValue(existingPayment);

    const result = await service.authorizeJobPayment('cust-1', {
      jobId: 'job-1',
      idempotencyKey: 'IDEMP-JOB-2048-DUP',
      amountMinorUnits: 35000,
      paymentMethod: PaymentMethodType.CARD,
    });

    expect(result.idempotent).toBe(true);
    expect(result.payment.id).toBe('pay-existing-1');
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it('should delegate authorization to gateway and record new payment when key is fresh', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(null);
    mockPrisma.job.findUnique.mockResolvedValue({
      id: 'job-1',
      customerId: 'cust-1',
      offerId: 'offer-1',
      customer: { phone: '01012345678', email: 'cust@edda.eg' },
    });

    const newPayment = {
      id: 'pay-new-1',
      idempotencyKey: 'IDEMP-FRESH-99',
      amountMinorUnits: 35000,
      status: PaymentStatus.AUTHORIZED,
    };
    mockPrisma.payment.create.mockResolvedValue(newPayment);

    const result = await service.authorizeJobPayment('cust-1', {
      jobId: 'job-1',
      idempotencyKey: 'IDEMP-FRESH-99',
      amountMinorUnits: 35000,
      paymentMethod: PaymentMethodType.CARD,
    });

    expect(result.idempotent).toBe(false);
    expect(mockPrisma.payment.create).toHaveBeenCalled();
    expect(mockPrisma.job.update).toHaveBeenCalled();
  });
});
