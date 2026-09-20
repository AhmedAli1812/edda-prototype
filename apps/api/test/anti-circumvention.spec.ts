import { AntiCircumventionService } from '../src/modules/anti-circumvention/anti-circumvention.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('AntiCircumventionService', () => {
  let service: AntiCircumventionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      chatAntiCircumventionLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };
    service = new AntiCircumventionService(mockPrisma as unknown as PrismaService);
  });

  it('should detect and flag standard Egyptian mobile numbers', async () => {
    const result = await service.scanChatMessage('job-1', 'user-1', 'user-2', 'كلمنا على الرقم ده 01012345678');
    expect(result.isSuspicious).toBe(true);
    expect(result.detectedReason).toBe('PHONE_NUMBER_DETECTED');
    expect(result.sanitizedMessage).toContain('تم حجب رسالة');
    expect(mockPrisma.chatAntiCircumventionLog.create).toHaveBeenCalled();
  });

  it('should detect external payment keywords like InstaPay and Vodafone Cash', async () => {
    const result = await service.scanChatMessage('job-1', 'user-1', 'user-2', 'حول المبلغ على انستاباي أسهل');
    expect(result.isSuspicious).toBe(true);
    expect(result.detectedReason).toBe('EXTERNAL_PAYMENT_REQUEST');
  });

  it('should allow legitimate maintenance and job inquiries', async () => {
    const result = await service.scanChatMessage('job-1', 'user-1', 'user-2', 'أنا وصلت أمام العمارة في الدور الثالث');
    expect(result.isSuspicious).toBe(false);
    expect(result.sanitizedMessage).toBe('أنا وصلت أمام العمارة في الدور الثالث');
    expect(mockPrisma.chatAntiCircumventionLog.create).not.toHaveBeenCalled();
  });
});
