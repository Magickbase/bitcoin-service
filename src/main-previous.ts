import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger } from '@nestjs/common';
import { SyncPreviousService } from './services/sync_previous.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger(),
  });
  await app.get(SyncPreviousService).sync()
}
bootstrap();
