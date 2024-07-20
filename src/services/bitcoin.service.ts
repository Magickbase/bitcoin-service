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
      const blockhash = await this.#rpc.getblockhash({ height })

      return this.#rpc.getblock({ blockhash, verbosity: 2 })
    } catch (e) {
      logger.error(e)
      return null
    }
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