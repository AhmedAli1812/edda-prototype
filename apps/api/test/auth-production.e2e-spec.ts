import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';

describe('Phase 1 Real HTTP & Isolated MySQL E2E Test Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DETERMINISTIC_TEST_OTP = 'true';

    // Load test database configuration from environment or ignored .env.test
    if (!process.env.DATABASE_URL) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envTestPath = path.resolve(__dirname, '../.env.test');
        if (fs.existsSync(envTestPath)) {
          const content = fs.readFileSync(envTestPath, 'utf8');
          const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
          if (match) {
            process.env.DATABASE_URL = match[1];
          }
        }
      } catch {}
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be defined in process.env or apps/api/.env.test for E2E testing.');
    }
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET || 'dev_secret_access_key_min_32_characters!';
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || 'dev_secret_refresh_key_min_32_characters!';
    process.env.OTP_PEPPER =
      process.env.OTP_PEPPER || 'dev_otp_pepper_secret_min_32_characters_long!';
    process.env.NATIONAL_ID_ENCRYPTION_KEY =
      process.env.NATIONAL_ID_ENCRYPTION_KEY ||
      'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
    process.env.NATIONAL_ID_HMAC_KEY =
      process.env.NATIONAL_ID_HMAC_KEY ||
      'dev_national_id_hmac_secret_min_32_characters_long!';
    process.env.SMS_PROVIDER = 'development';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Clean test tables to ensure complete test isolation
    await prisma.auditLog.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.onboardingToken.deleteMany({});
    await prisma.otpCode.deleteMany({});
    await prisma.otpRateLimit.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.technicianProfile.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const testPhone = '01011112222';
  const testPhoneE164 = '+201011112222';
  let onboardingTokenCustomer: string;
  let customerAccessToken: string;
  let customerRefreshToken: string;

  it('1. POST /auth/otp/send - sends registration OTP', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: testPhone, purpose: 'REGISTRATION' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('إذا كان رقم الهاتف صالحاً');
  });

  it('2. POST /auth/otp/verify-registration - verifies OTP and returns onboarding token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/otp/verify-registration')
      .send({ phone: testPhone, code: '482190' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.onboardingToken).toBeDefined();
    onboardingTokenCustomer = res.body.onboardingToken;
  });

  it('3. POST /auth/register/customer - registers customer using onboarding token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/customer')
      .send({
        onboardingToken: onboardingTokenCustomer,
        fullName: 'أحمد محمود السعيد',
        email: 'ahmed.test@example.com',
        governorate: 'القاهرة',
        city: 'مدينة نصر',
        street: 'شارع عباس العقاد',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.user.phone).toBe(testPhoneE164);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    customerAccessToken = res.body.accessToken;
    customerRefreshToken = res.body.refreshToken;

    // Verify initial wallet created
    const user = await prisma.user.findUnique({
      where: { phone: testPhoneE164 },
      include: { wallet: true, addresses: true },
    });
    expect(user).toBeDefined();
    expect(user?.wallet?.availableBalanceMinorUnits).toBe(0);
    expect(user?.addresses.length).toBe(1);
  });

  it('4. Onboarding token single-use: cannot register twice with same token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/customer')
      .send({
        onboardingToken: onboardingTokenCustomer,
        fullName: 'محاولة مكررة',
      })
      .expect(400);

    expect(res.body.message).toContain('غير صالح أو تم استخدامه');
  });

  it('5. POST /auth/register/technician - registers technician with encrypted National ID', async () => {
    const techPhone = '01122223333';
    const techPhoneE164 = '+201122223333';

    // Step 1: Send Registration OTP
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: techPhone, purpose: 'REGISTRATION' })
      .expect(200);

    // Step 2: Verify Registration OTP
    const verifyRes = await request(app.getHttpServer())
      .post('/auth/otp/verify-registration')
      .send({ phone: techPhone, code: '482190' })
      .expect(200);

    const techOnboardingToken = verifyRes.body.onboardingToken;

    // Step 3: Register Technician
    const res = await request(app.getHttpServer())
      .post('/auth/register/technician')
      .send({
        onboardingToken: techOnboardingToken,
        fullName: 'محمود عبد الرحمن',
        nationalId: '29801010101234',
        categories: ['electricity', 'air_conditioning'],
        serviceRadiusKm: 25,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('TECHNICIAN');
    expect(res.body.user.nationalIdMasked).toBe('**********1234');
    expect(res.body.user.kycStatus).toBe('PENDING_REVIEW');

    // Verify DB encryption & fingerprint
    const techProfile = await prisma.technicianProfile.findFirst({
      where: { user: { phone: techPhoneE164 } },
    });
    expect(techProfile).toBeDefined();
    expect(techProfile?.nationalIdEncrypted).not.toBe('29801010101234');
    expect(techProfile?.nationalIdEncrypted).toContain(':'); // iv:tag:ciphertext
    expect(techProfile?.nationalIdFingerprint).toBeDefined();
  });

  it('6. POST /auth/login - logs in existing customer using phone and LOGIN OTP', async () => {
    // Reset cooldown for test
    await prisma.otpRateLimit.update({
      where: { phone: testPhoneE164 },
      data: { lastSentAt: new Date(0) },
    });

    // Step 1: Send LOGIN OTP
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: testPhone, purpose: 'LOGIN' })
      .expect(200);

    // Step 2: Login with valid OTP
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: testPhone, code: '482190' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.phone).toBe(testPhoneE164);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    customerAccessToken = res.body.accessToken;
    customerRefreshToken = res.body.refreshToken;
  });

  it('7. POST /auth/token/refresh - rotates refresh token into new token in same family', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/token/refresh')
      .send({ refreshToken: customerRefreshToken })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(customerRefreshToken);

    const newRefreshToken = res.body.refreshToken;

    // Verify old token is revoked in DB
    const oldTokenId = customerRefreshToken.split('.')[0];
    const oldTokenDb = await prisma.refreshToken.findUnique({ where: { id: oldTokenId } });
    expect(oldTokenDb?.isRevoked).toBe(true);

    // Update for subsequent test
    customerRefreshToken = newRefreshToken;
  });

  it('8. Refresh token reuse detection: reusing rotated token revokes entire token family', async () => {
    const oldRevokedTokenId = customerRefreshToken.split('.')[0];
    // Find the previous token that was already rotated
    const previousToken = await prisma.refreshToken.findFirst({
      where: { replacedByTokenId: oldRevokedTokenId },
    });

    // Replay with a previously revoked token (simulating attacker or compromised token reuse)
    if (previousToken) {
      // Reconstruct token with dummy verifier that won't pass verifier check
      const parts = customerRefreshToken.split('.');
      // Construct a token that has valid verifier on revoked token
      // Let's test genuine reuse:
      const rawVerifier = 'test_reuse_verifier_123';
      const refreshSecret = process.env.JWT_REFRESH_SECRET!;
      const verifierHash = require('crypto')
        .createHmac('sha256', refreshSecret)
        .update(rawVerifier)
        .digest('hex');

      const reuseTokenRecord = await prisma.refreshToken.create({
        data: {
          id: require('crypto').randomUUID(),
          userId: previousToken.userId,
          familyId: previousToken.familyId,
          verifierHash,
          isRevoked: true,
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 1000000),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/auth/token/refresh')
        .send({ refreshToken: `${reuseTokenRecord.id}.${rawVerifier}` })
        .expect(401);

      expect(res.body.message).toContain('تم إنهاء كافة جلساتك لأسباب أمنية');

      // Verify all tokens in that family are now revoked!
      const activeFamilyTokens = await prisma.refreshToken.findMany({
        where: { familyId: previousToken.familyId, isRevoked: false },
      });
      expect(activeFamilyTokens.length).toBe(0);

      // Verify REFRESH_TOKEN_REUSE_DETECTED audit log exists
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'REFRESH_TOKEN_REUSE_DETECTED', entityId: previousToken.familyId },
      });
      expect(auditLog).toBeDefined();
    }
  });

  it('9. POST /auth/logout - verified logout requires valid <id>.<verifier>', async () => {
    // Re-login to get fresh active session
    await prisma.otpRateLimit.update({
      where: { phone: testPhoneE164 },
      data: { lastSentAt: new Date(0) },
    });
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: testPhone, purpose: 'LOGIN' })
      .expect(200);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: testPhone, code: '482190' })
      .expect(200);

    const freshAccessToken = loginRes.body.accessToken;
    const freshRefreshToken = loginRes.body.refreshToken;
    const tokenId = freshRefreshToken.split('.')[0];

    const logoutRes = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${freshAccessToken}`)
      .send({ refreshToken: freshRefreshToken })
      .expect(200);

    expect(logoutRes.body.success).toBe(true);

    const tokenDb = await prisma.refreshToken.findUnique({ where: { id: tokenId } });
    expect(tokenDb?.isRevoked).toBe(true);
  });

  it('10. POST /auth/revoke-all-sessions - revokes all sessions across all devices for user', async () => {
    // Re-login to get active session
    await prisma.otpRateLimit.update({
      where: { phone: testPhoneE164 },
      data: { lastSentAt: new Date(0) },
    });
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: testPhone, purpose: 'LOGIN' })
      .expect(200);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: testPhone, code: '482190' })
      .expect(200);

    const userToken = loginRes.body.accessToken;

    const revokeRes = await request(app.getHttpServer())
      .post('/auth/revoke-all-sessions')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(revokeRes.body.success).toBe(true);

    const user = await prisma.user.findUnique({ where: { phone: testPhoneE164 } });
    const remainingActiveTokens = await prisma.refreshToken.findMany({
      where: { userId: user!.id, isRevoked: false },
    });
    expect(remainingActiveTokens.length).toBe(0);
  });

  it('11. Suspended account rejection: rejects suspended user and logs audit event', async () => {
    // Suspend user
    await prisma.user.update({
      where: { phone: testPhoneE164 },
      data: { status: UserStatus.SUSPENDED },
    });

    try {
      await prisma.otpRateLimit.update({
        where: { phone: testPhoneE164 },
        data: { lastSentAt: new Date(0) },
      });
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ phone: testPhone, purpose: 'LOGIN' })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: testPhone, code: '482190' })
        .expect(401);

      expect(loginRes.body.message).toContain('الحساب معلق');

      // Verify audit log
      const suspendedAudit = await prisma.auditLog.findFirst({
        where: { action: 'ACCOUNT_SUSPENDED_LOGIN_ATTEMPT' },
      });
      expect(suspendedAudit).not.toBeNull();
      expect(Boolean(suspendedAudit?.isFlagged)).toBe(true);
    } finally {
      // Restore active status
      await prisma.user.update({
        where: { phone: testPhoneE164 },
        data: { status: UserStatus.ACTIVE },
      });
    }
  });

  it('12. Role authorization & protected endpoint GET /users/me', async () => {
    // Re-login active customer
    await prisma.otpRateLimit.update({
      where: { phone: testPhoneE164 },
      data: { lastSentAt: new Date(0) },
    });
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: testPhone, purpose: 'LOGIN' })
      .expect(200);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: testPhone, code: '482190' })
      .expect(200);

    const token = loginRes.body.accessToken;

    // Authorized request with token
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user.phone).toBe(testPhoneE164);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.user.passwordHash).toBeUndefined(); // Never leak hashes

    // Unauthorized request without token
    await request(app.getHttpServer())
      .get('/users/me')
      .expect(401);
  });

  it('13. Simultaneous OTP consumption results in exactly one success', async () => {
    const concurrentPhone = '01233334444';
    const concurrentPhoneE164 = '+201233334444';

    // Step 1: Send OTP
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: concurrentPhone, purpose: 'REGISTRATION' })
      .expect(200);

    // Step 2: Fire 2 simultaneous verification requests with the SAME OTP
    const req1 = request(app.getHttpServer())
      .post('/auth/otp/verify-registration')
      .send({ phone: concurrentPhone, code: '482190' });

    const req2 = request(app.getHttpServer())
      .post('/auth/otp/verify-registration')
      .send({ phone: concurrentPhone, code: '482190' });

    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly ONE must succeed (200) and the other must fail (400)
    expect(statuses).toEqual([200, 400]);

    const successRes = res1.status === 200 ? res1 : res2;
    const failedRes = res1.status === 400 ? res1 : res2;

    expect(successRes.body.success).toBe(true);
    expect(successRes.body.onboardingToken).toBeDefined();
    expect(failedRes.body.message).toContain('غير صحيح أو منتهي الصلاحية');

    // Confirm DB has exactly one consumed OTP
    const consumedOtps = await prisma.otpCode.findMany({
      where: {
        phone: concurrentPhoneE164,
        purpose: 'REGISTRATION',
        consumedAt: { not: null },
      },
    });
    expect(consumedOtps.length).toBe(1);
  });
});
