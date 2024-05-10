import { Injectable } from "@nestjs/common";
import { BitcoinService } from "./bitcoin.service";
import { scheduler } from 'node:timers/promises';
import { ExplorerService } from "./explorer.service";
import { buildRgbppLockArgs } from '@rgbpp-sdk/ckb'
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SyncService {
  #startBlock: number
  constructor(
    private readonly _bitcoinService: BitcoinService,
    private readonly _explorerService: ExplorerService,
    private readonly _configService: ConfigService,
  ) {
    this._configService.get('nervos.startBlock')
  }

  sync = async () => {
    while (true) {
      const cells = await this._explorerService.getAllRGBCell()
      const transactions = await this._bitcoinService.getTransactionsByBlockNumber(this.#startBlock)
      const unbindTransaction = transactions.filter(tx =>
        tx.vin.some(vin => cells.has(buildRgbppLockArgs(vin.vout, vin.txid)))
      )
      // TODO: report to explorer
      if (!transactions) {
        await scheduler.wait(5 * 60 * 1000)
        continue
      }

      this.#startBlock++
    }
  }
}