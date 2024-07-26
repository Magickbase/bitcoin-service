import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IBlock, ITx, RPCClient } from "src/bitcoin";
import { BitcoinConfig } from "src/config/bitcoin.config";
import { SyncLogger } from "src/logger/sync.logger";

@Injectable()
export class BitcoinService {
  #rpc: RPCClient

  constructor(private readonly _configService: ConfigService) {
    const config = this._configService.get<BitcoinConfig>('bitcoin')
    this.#rpc = new RPCClient(config.rpc)
  }

  getBlockByBlockNumber = async (height: number, logger: SyncLogger): Promise<IBlock> => {
    try {
      logger.log(`get block by block number: ${height}`)
      const blockhash = await this.#rpc.getblockhash({ height })

      return this.#rpc.getblock({ blockhash, verbosity: 2 })
    } catch (e) {
      logger.error(e)
      return null
    }
  }

  getMultipleBlockByBlockNumber = async (from: number, to: number, logger: SyncLogger): Promise<ITx[]> => {
    let promises: Promise<ITx[]>[] = []
    for (let i = from; i <= to; i++) {
      promises.push(this.getTransactionsByBlockNumber(i, logger))
    }
    const txs = await Promise.all(promises)

    return txs.reduce((acc, cur) => {
      return acc.concat(cur)
    }, [])
  }

  getTransactionsByBlockNumber = async (height: number, logger: SyncLogger): Promise<ITx[]> => {
    const block = await this.getBlockByBlockNumber(height, logger)
    if (!block) {
      return null
    }

    return block.tx
  }

  get rpc() {
    return this.#rpc
  }
}