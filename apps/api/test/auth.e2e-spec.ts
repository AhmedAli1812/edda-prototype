import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
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
      .send({ phone: '+201012345678', purpose: 'LOGIN' })
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('تم إرسال');
      });
  });
});
