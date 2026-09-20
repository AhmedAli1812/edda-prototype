import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DETERMINISTIC_TEST_OTP = 'true';

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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) should return 200 ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('edda-api');
      });
  });

  it('/auth/otp/send (POST) should send OTP with rate limiting', () => {
    return request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: '+201598765432', purpose: 'LOGIN' })
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('رمز التحقق');
      });
  });
});
