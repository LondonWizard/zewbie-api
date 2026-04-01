/** Central configuration factory loaded by @nestjs/config ConfigModule. */
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
  apiVersion: process.env.API_VERSION ?? '1.0.0',

  database: {
    primary: process.env.DATABASE_URL,
    analytics: process.env.ANALYTICS_DATABASE_URL,
    audit: process.env.AUDIT_DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    expiry: process.env.JWT_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  },

  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION ?? 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET ?? 'zewbie-media',
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM ?? 'noreply@zewbie.com',
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
});
