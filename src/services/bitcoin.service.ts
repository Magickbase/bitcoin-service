import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IBlock, ITx, RPCClient } from "src/bitcoin";
import { BitcoinConfig } from "src/config/bitcoin.config";

@Injectable()
export class BitcoinService {
  #rpc: RPCClient

  constructor(private readonly _configService: ConfigService) {
    const config = this._configService.get<BitcoinConfig>('bitcoin')
    this.#rpc = new RPCClient(config.rpc)
  }

  getBlockByBlockNumber = async (height: number): Promise<IBlock> => {
    try {
      const blockhash = await this.#rpc.getblockhash({ height })

      return this.#rpc.getblock({ blockhash, verbosity: 2 })
    } catch (e) {
      console.log(11111)
      console.error(e)
      return null
    }
  }

  getTransactionsByBlockNumber = async (height: number): Promise<ITx[]> => {
    const block = await this.getBlockByBlockNumber(height)
    console.log(block)
    if (!block) {
      return null
    }

    return block.tx
  }

  get rpc() {
    return this.#rpc
  }
}