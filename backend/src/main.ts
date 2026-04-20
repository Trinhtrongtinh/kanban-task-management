import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors';
import { AllExceptionsFilter } from './common/filters';
import { appConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Enable raw body for Stripe webhook signature verification
    rawBody: true,
  });

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Register global response interceptor
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));

  const appSettings = app.get(appConfig.KEY);
  const frontendUrl = appSettings.frontendUrl;
  const port = appSettings.port;

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Required for reading auth cookies from requests.
  app.use(cookieParser());

  // Ensure secure cookies work correctly when running behind reverse proxies.
  app.set('trust proxy', 1);

  await app.listen(port);
}
bootstrap();
