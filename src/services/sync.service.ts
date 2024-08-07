import { Injectable } from "@nestjs/common";
import { BitcoinService } from "./bitcoin.service";
import { scheduler } from 'node:timers/promises';
import { ExplorerService } from "./explorer.service";
import { buildRgbppLockArgs } from '@rgbpp-sdk/ckb'
import { ConfigService } from "@nestjs/config";
import { HexString } from "@ckb-lumos/lumos";
import { ConsumedBitcoinOutput } from "src/type";

@Injectable()
export class SyncService {
  #startBlock: number
  constructor(
    private readonly _bitcoinService: BitcoinService,
    private readonly _explorerService: ExplorerService,
    private readonly _configService: ConfigService,
  ) {
    this.#startBlock = this._configService.get('bitcoin.startBlockNUmber')
  }

  sync = async () => {
    while (true) {
      console.log(this.#startBlock)
      console.log(`getBTCTransactions start: ${Date.now().toString()}`)
      const transactions = await this._bitcoinService.getTransactionsByBlockNumber(this.#startBlock)
      console.log(`getBTCTransactions stop: ${Date.now().toString()}`)
      if (!transactions) {
        await scheduler.wait(5 * 60 * 1000)
        continue
      }

      const unbindTransaction = transactions.reduce((acc, cur) => {
        cur.vin.forEach(vin => {
          if (vin.txid && vin.vout !== undefined && vin.vout !== null) {
            acc.set(
              buildRgbppLockArgs(vin.vout, vin.txid),
              { txid: cur.txid, vin: { index: vin.vout, txid: vin.txid } },
            )
          }
        })
        return acc
      }, new Map<HexString, ConsumedBitcoinOutput>)

      console.log(`filterUnbindCell start: ${Date.now().toString()}`)
      const filtered = await this._explorerService.filterUnbindCell(unbindTransaction)
      console.log(`filterUnbindCell stop: ${Date.now().toString()}`)
      console.log(filtered)
      for (const record of filtered) {
        await this._explorerService.reportUnbind(record)
      }

      this.#startBlock++
    }
  }
}