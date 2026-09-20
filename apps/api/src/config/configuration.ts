export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_secret_access_key_min_32_characters!',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_secret_refresh_key_min_32_characters!',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    otpRateLimitPerHour: parseInt(process.env.OTP_RATE_LIMIT_PER_HOUR || '5', 10),
    otpExpirationSeconds: parseInt(process.env.OTP_EXPIRATION_SECONDS || '300', 10),
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
});
