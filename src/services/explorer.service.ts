import { ConfigService } from "@nestjs/config"
import { ProxyAgent, fetch } from 'undici'
import { NervosService } from "./nervos.service"
import { Injectable } from "@nestjs/common"
import { Cell, HexString, OutPoint, Transaction } from "@ckb-lumos/lumos"

@Injectable()
export class ExplorerService {
  #host: string = 'https://mainnet-api.explorer.nervos.org'
  constructor(private readonly _configService: ConfigService, private readonly _nervosService: NervosService) { }

  getAllRGBCell = async (): Promise<Map<HexString, { cell: Cell, outpoint: OutPoint }>> => {
    let page = 0
    const cells = []
    while (true) {
      const url = `${this.#host}/api/v2/scripts/referring_cells?code_hash=0xbc6c568a1a0d0a09f6844dc9d74ddb4343c32143ff25f727c59edf4fb72d6936&hash_type=type&page=${page}&page_size=10000`
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
          },
        })
        const data = await res.json() as any
        if (data.data.referring_cells.length === 0) {
          break
        }

        cells.push(...data.data.referring_cells)
        page++
      } catch (e) {
        console.log(e)
      }
    }
    const transactions = await this._nervosService.getMappedMultipleTransaction(cells.map(cell => cell.tx_hash))

    return cells.reduce((acc, cell) => {
      const transaction = transactions.get(cell.tx_hash)
      const args = transaction.outputs[cell.cell_index].lock.args
      return acc.set(args, { cell: transaction.outputs[cell.cell_index], outpoint: { txHash: cell.tx_hash, index: cell.cell_index } })
    }, new Map<HexString, { cell: Cell, outpoint: OutPoint }>())
  }
}
