import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SyncService } from './services/sync.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.get(SyncService).sync()
}
bootstrap();
