import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SyncService } from './services/sync.service';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger(),
  });
  await app.get(SyncService).sync()
}
bootstrap();
