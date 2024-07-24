import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { BitcoinConfig } from "src/config/bitcoin.config"
import { ConsumedBitcoinOutput, Spent } from "src/type"

@Injectable()
export class BitcoinBlockstream {
  #rpc: string

  constructor(private readonly _configService: ConfigService) {
    const config = this._configService.get<BitcoinConfig>('bitcoin')
    this.#rpc = config.blockstream.rpc
  }

  isVoutSpent = async (txid: string, vout: number): Promise<{ consumed: boolean, consumedBy?: ConsumedBitcoinOutput }> => {
    const url = `${this.#rpc}/api/tx/${txid}/outspend/${vout}`
    const res = await fetch(url)

    const data = await res.json() as Spent

    return {
      consumed: data.spent,
      consumedBy: data.spent ? {
        txid: data.txid,
        vin: {
          index: data.vin,
          txid: data.txid
        }
      } : undefined
    }
  }
}