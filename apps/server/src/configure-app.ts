import type { INestApplication } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import { HttpErrorFilter } from './common/http-error.filter';

export function configureApp(app: INestApplication): void {
  const allowedOrigins = (process.env.ADMIN_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  });
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(
    session({
      name: 'vnpc.admin',
      secret: process.env.SESSION_SECRET ?? 'local-demo-secret-change-before-sharing',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true',
        maxAge: 8 * 60 * 60 * 1000,
      },
    }),
  );
  app.use(
    '/api/reports',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 12,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skip: (request) => request.method !== 'POST',
      message: { error: 'RATE_LIMITED', message: 'Bạn đã gửi quá nhiều tin. Vui lòng thử lại sau.' },
    }),
  );
  app.use(
    '/api/places',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skip: (request) => request.method !== 'POST' || !request.originalUrl.endsWith('/reviews'),
      message: { error: 'RATE_LIMITED', message: 'Bạn đã gửi quá nhiều đánh giá. Vui lòng thử lại sau.' },
    }),
  );
  app.use(
    '/api/admin/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'RATE_LIMITED', message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau.' },
    }),
  );
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpErrorFilter());
}
