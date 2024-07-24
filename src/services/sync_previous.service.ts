import { Injectable } from "@nestjs/common";
import { BitcoinService } from "./bitcoin.service";
import { ExplorerService } from "./explorer.service";
import { ConfigService } from "@nestjs/config";
import { Cell, HexString, OutPoint } from "@ckb-lumos/lumos";
import { ConsumedBitcoinOutput } from "src/type";
import { SyncLogger } from "src/logger/sync.logger";
import { RGBPPConfig } from "src/config/nervos.config";
import { parseBTCUTXO } from "src/utils";
import { BitcoinBlockstream } from "./bitcoin-blockstream.service";
import { SyncPreviousLogger } from "src/logger/sync-previous.logger";

@Injectable()
export class SyncPreviousService {
  #startBlock: number
  #rgbppConfig: RGBPPConfig
  constructor(
    private readonly _explorerService: ExplorerService,
    private readonly _bitcoinBlockstreamService: BitcoinBlockstream,
    private readonly _configService: ConfigService,
  ) {
    this.#rgbppConfig = this._configService.get('nervos.rgbpp')
  }

  sync = async () => {
    const liveCells = await this._explorerService.getTotalLiveCells(this.#rgbppConfig.codeHash, this.#rgbppConfig.hashType, new SyncLogger(this.#startBlock))
    for (const index in liveCells) {
      const cell = liveCells[index]
      const logger = new SyncPreviousLogger(liveCells.length, parseInt(index, 10))
      const { txid, vout } = parseBTCUTXO(cell.cellOutput.lock.args)
      const consumedStatus = await this._bitcoinBlockstreamService.isVoutSpent(txid, vout)
      if (consumedStatus.consumed) {
        this._explorerService.reportUnbind({ outpoint: cell.outPoint, consumedBy: consumedStatus.consumedBy }, logger)
      }
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