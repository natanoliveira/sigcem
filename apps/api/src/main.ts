import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // T-047 — headers de segurança HTTP
  const helmet = await import('helmet');
  app.use(helmet.default({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite URL assinada do MinIO
    contentSecurityPolicy: false, // gerenciado pelo Next.js
  }));

  // Rotas públicas usam prefixo diferente — não incluir em /api/v1
  app.setGlobalPrefix('api/v1', {
    exclude: ['api/public/v1/(.*)'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // public DTOs sem decorators não falham
      transform: true,
    }),
  );

  const allowedOrigins = [
    process.env.NEXTAUTH_URL ?? 'http://localhost:3002',
    'http://localhost:3002',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Permite requests sem origin (mobile/curl) e origins permitidas
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS não permitido'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}/api/v1`);
  console.log(`Portal público em http://localhost:${port}/api/public/v1`);
}

bootstrap();
