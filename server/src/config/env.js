import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root if running locally
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_URL: z.string().url(),
    ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
    PORT: z.coerce.number().default(4000),
    API_BASE_URL: z.string().default('http://localhost:4000/api'),
    APP_TIMEZONE: z.string().default('Europe/Bucharest'),

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    MONGODB_DB: z.string().default('ucv_prod'),

    BREVO_SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
    BREVO_SMTP_PORT: z.coerce.number().default(587),
    BREVO_SMTP_USER: z.string().default(''),
    BREVO_SMTP_KEY: z.string().default(''),
    MAIL_FROM_EMAIL: z.string().default('no-reply@ucv.ro'),
    MAIL_FROM_NAME: z.string().default('UCV International Student Community'),
    MAIL_TRANSPORT: z.enum(['smtp', 'console']).default('smtp'),
    EMAIL_DAILY_LIMIT: z.coerce.number().default(280),
    EMAIL_NOTIFICATION_SHARE: z.coerce.number().default(200),

    CRON_SECRET: z.string().min(1, 'CRON_SECRET is required'),
    ADMIN_EMAIL: z.string().email().default('admin@ucv.ro'),
    ADMIN_NAME: z.string().default('Staff Administrator'),
    ADMIN_PASSWORD: z.string().default('ChangeMeImmediately123!')
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.APP_URL.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'APP_URL must use https:// in production',
          path: ['APP_URL']
        });
      }
      if (data.MAIL_TRANSPORT === 'console') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MAIL_TRANSPORT=console is not allowed in production',
          path: ['MAIL_TRANSPORT']
        });
      }
      if (!data.BREVO_SMTP_USER) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'BREVO_SMTP_USER is required in production',
          path: ['BREVO_SMTP_USER']
        });
      }
      if (!data.BREVO_SMTP_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'BREVO_SMTP_KEY is required in production',
          path: ['BREVO_SMTP_KEY']
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missingOrInvalid = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error('Environment validation failed:\n' + missingOrInvalid);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Fatal: Invalid production environment configuration:\n' + missingOrInvalid);
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: process.env.NODE_ENV || 'development',
      APP_URL: process.env.APP_URL || 'http://localhost:5173',
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',
      PORT: Number(process.env.PORT) || 4000,
      API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:4000/api',
      APP_TIMEZONE: 'Europe/Bucharest',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ucv_dev',
      MONGODB_DB: process.env.MONGODB_DB || 'ucv_dev',
      BREVO_SMTP_HOST: 'smtp-relay.brevo.com',
      BREVO_SMTP_PORT: 587,
      BREVO_SMTP_USER: '',
      BREVO_SMTP_KEY: '',
      MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL || 'no-reply@ucv.ro',
      MAIL_FROM_NAME: 'UCV International Student Community',
      MAIL_TRANSPORT: 'console',
      EMAIL_DAILY_LIMIT: 280,
      EMAIL_NOTIFICATION_SHARE: 200,
      CRON_SECRET: 'dev-secret-cron-key',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@ucv.ro',
      ADMIN_NAME: process.env.ADMIN_NAME || 'Staff Administrator',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || ''
    };
