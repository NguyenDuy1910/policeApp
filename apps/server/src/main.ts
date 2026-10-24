import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { loadLocalEnvironment } from './load-environment';

loadLocalEnvironment();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`VNPolice Care NestJS API listening on http://0.0.0.0:${port}/api`);
}

void bootstrap();
