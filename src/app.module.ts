import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { BitcoinService } from './services/bitcoin.service';
import { SyncService } from './services/sync.service';
import { ExplorerService } from './services/explorer.service';
import { NervosService } from './services/nervos.service';
import { SyncLogger } from './logger/sync.logger';

@Module({
  imports: [ConfigModule.forRoot({ load: [config] })],
  controllers: [],
  providers: [BitcoinService, SyncService, ExplorerService, NervosService, SyncLogger],
})
export class AppModule { }
