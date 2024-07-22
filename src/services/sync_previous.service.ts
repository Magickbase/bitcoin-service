import { Injectable } from "@nestjs/common";
import { BitcoinService } from "./bitcoin.service";
import { scheduler } from 'node:timers/promises';
import { ExplorerService } from "./explorer.service";
import { buildRgbppLockArgs } from '@rgbpp-sdk/ckb'
import { ConfigService } from "@nestjs/config";
import { Cell, HexString, OutPoint } from "@ckb-lumos/lumos";
import { ConsumedBitcoinOutput } from "src/type";
import { SyncLogger } from "src/logger/sync.logger";
import { RGBPPConfig } from "src/config/nervos.config";

@Injectable()
export class SyncPreviousService {
  #startBlock: number
  #stopBlock: number
  #rgbppConfig: RGBPPConfig
  constructor(
    private readonly _bitcoinService: BitcoinService,
    private readonly _explorerService: ExplorerService,
    private readonly _configService: ConfigService,
  ) {
    this.#startBlock = this._configService.get('bitcoin.previousStartBlockNUmber')
    this.#stopBlock = this._configService.get('bitcoin.previousStopBlockNUmber')
    this.#rgbppConfig = this._configService.get('nervos.rgbpp')
  }

  sync = async () => {
    const liveCells = await this._explorerService.getTotalLiveCells(this.#rgbppConfig.codeHash, this.#rgbppConfig.hashType, new SyncLogger(this.#startBlock))
    while (this.#startBlock <= this.#stopBlock) {
      const logger = new SyncLogger(this.#startBlock)
      logger.log('start')
      logger.log(`getBTCTransactions start: ${Date.now().toString()}`)
      const transactions = await this._bitcoinService.getTransactionsByBlockNumber(this.#startBlock, logger)
      logger.log(`getBTCTransactions stop: ${Date.now().toString()}`)

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

      await this.report(unbindTransaction, liveCells, logger)

      this.#startBlock++
      logger.log('end')
    }
  }

  report = async (bitcoinTransactions: Map<HexString, ConsumedBitcoinOutput>, liveCells: Cell[], logger: SyncLogger) => {
    logger.log(`filterUnbindCell start: ${Date.now().toString()}`)
    const filtered: { consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[] = []
    liveCells.forEach(cell => {
      const consumedBy = bitcoinTransactions.get(cell.cellOutput.lock.args)
      if (consumedBy) {
        filtered.push({ consumedBy, outpoint: cell.outPoint })
      }
    })
    logger.log(`filterUnbindCell stop: ${Date.now().toString()}`)
    logger.log(JSON.stringify(filtered))
    for (const record of filtered) {
      await this._explorerService.reportUnbind(record, logger)
    }
    logger.log('reported')
  }
}