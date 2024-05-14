import { HexString, Indexer, RPC, Transaction } from "@ckb-lumos/lumos";
import { TransactionWithStatus } from '@ckb-lumos/base'
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { throwIfEmpty } from "rxjs";
import { NervosConfig, RGBPPConfig } from "src/config/nervos.config";

@Injectable()
export class NervosService {
  #indexer: Indexer
  #rpc: RPC
  #rgbppConfig: RGBPPConfig
  #retryTimes = 3

  constructor(private readonly _configService: ConfigService) {
    const config = this._configService.get<NervosConfig>('nervos')
    this.#rpc = new RPC(config.rpc.url, { timeout: config.rpc.timeout })
    this.#indexer = new Indexer(config.rpc.url)
    this.#rpc.createBatchRequest()

    this.#rgbppConfig = config.rgbpp
  }

  getMultipleTransaction = async (txHashes: HexString[]): Promise<TransactionWithStatus[]> => {
    if (txHashes.length === 0) {
      return []
    }

    let retryTimes = 0;
    while (retryTimes < this.#retryTimes) {
      try {
        const txes = await this.#rpc.createBatchRequest(txHashes.map(txHash => (['getTransaction', txHash]))).exec()
        return txes
      } catch (e) {
        console.log(e)
        retryTimes++
      }
    }
  }

  getMappedMultipleTransaction = async (txHashes: HexString[]) => {
    const txes = await this.getMultipleTransaction(txHashes)
    return txes.reduce((acc, tx) => {
      return acc.set(tx.transaction.hash, tx.transaction)
    }, new Map<HexString, Transaction>())
  }
}