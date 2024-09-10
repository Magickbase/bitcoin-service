import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { BitcoinService } from './services/bitcoin.service';
import { SyncService } from './services/sync.service';
import { ExplorerService } from './services/explorer.service';
import { NervosService } from './services/nervos.service';
import { SyncLogger } from './logger/sync.logger';
import { SyncPreviousService } from './services/sync_previous.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CellOutputRepository } from './repositories/cell-output.repository';
import { CellOutputService } from './services/cell-output.service';
import { CellOutput } from './entities/cell-output.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [config] }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'ckb-staging-explorer-pg-prod.ceaqk45ceay7.ap-east-1.rds.amazonaws.com',
      port: 5432,
      username: 'postgres',
      password: 'eMECyf2datwrJEchtsRu',
      database: 'postgres',
      synchronize: false,
      entities: [
        __dirname + '/entities/*.entity{.ts,.js}',
      ],
    }),
    TypeOrmModule.forFeature([CellOutput]),
  ],
  controllers: [],
  providers: [CellOutputRepository, BitcoinService, SyncService, ExplorerService, NervosService, SyncLogger, SyncPreviousService, CellOutputService],
})
export class AppModule { }
