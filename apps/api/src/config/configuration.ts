export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  const accessSecret = process.env.JWT_ACCESS_SECRET || (isProd ? '' : 'dev_secret_access_key_min_32_characters!');
  const refreshSecret = process.env.JWT_REFRESH_SECRET || (isProd ? '' : 'dev_secret_refresh_key_min_32_characters!');
  const otpPepper = process.env.OTP_PEPPER || (isProd ? '' : 'dev_otp_pepper_secret_min_32_characters!');
  const nationalIdEncryptionKey =
    process.env.NATIONAL_ID_ENCRYPTION_KEY ||
    (isProd ? '' : 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE='); // 32-byte key base64
  const nationalIdHmacKey =
    process.env.NATIONAL_ID_HMAC_KEY || (isProd ? '' : 'dev_national_id_hmac_secret_min_32_chars!');
  const smsProvider = process.env.SMS_PROVIDER || 'development';

  // Strict production assertions
  if (isProd) {
    if (smsProvider === 'development' || !process.env.SMS_PROVIDER) {
      throw new Error(
        'FATAL CONFIGURATION ERROR: SMS_PROVIDER cannot be "development" in production. Configure a production SMS provider (e.g. twilio, unifonic, vodafone).',
      );
    }
    if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
      throw new Error('FATAL CONFIGURATION ERROR: JWT_ACCESS_SECRET must be set and at least 32 characters long.');
    }
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('FATAL CONFIGURATION ERROR: JWT_REFRESH_SECRET must be set and at least 32 characters long.');
    }
    if (!process.env.OTP_PEPPER || process.env.OTP_PEPPER.length < 32) {
      throw new Error('FATAL CONFIGURATION ERROR: OTP_PEPPER must be set and at least 32 characters long.');
    }
    if (!process.env.NATIONAL_ID_ENCRYPTION_KEY) {
      throw new Error('FATAL CONFIGURATION ERROR: NATIONAL_ID_ENCRYPTION_KEY must be configured in production.');
    }
    if (!process.env.NATIONAL_ID_HMAC_KEY || process.env.NATIONAL_ID_HMAC_KEY.length < 32) {
      throw new Error('FATAL CONFIGURATION ERROR: NATIONAL_ID_HMAC_KEY must be set and at least 32 characters long.');
    }
  }

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '4000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    databaseUrl: process.env.DATABASE_URL,
    jwt: {
      accessSecret,
      accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
      refreshSecret,
      refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    otp: {
      pepper: otpPepper,
      cooldownSeconds: 60,
      expirationSeconds: parseInt(process.env.OTP_EXPIRATION_SECONDS || '300', 10),
      maxAttempts: 5,
      hourlyRateLimit: parseInt(process.env.OTP_RATE_LIMIT_PER_HOUR || '5', 10),
      deterministicTestOtp: process.env.DETERMINISTIC_TEST_OTP === 'true' && nodeEnv === 'test',
    },
    nationalId: {
      encryptionKey: nationalIdEncryptionKey,
      hmacKey: nationalIdHmacKey,
      keyVersion: 1,
    },
    sms: {
      provider: smsProvider,
    },
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    },
    storage: {
      driver: process.env.STORAGE_DRIVER || 'local',
      localRoot: process.env.STORAGE_LOCAL_ROOT || './uploads',
      maxFileSizeMb: parseInt(process.env.STORAGE_MAX_FILE_SIZE_MB || '10', 10),
      s3: {
        bucket: process.env.AWS_S3_BUCKET_NAME || 'edda-assets',
        region: process.env.AWS_REGION || 'me-south-1',
      },
    },
    payments: {
      provider: process.env.PAYMENT_GATEWAY_PROVIDER || 'mock',
      webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'dev_webhook_secret',
    },
  };
};
