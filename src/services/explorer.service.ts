import { ConfigService } from "@nestjs/config"
import { ProxyAgent, fetch } from 'undici'
import { NervosService } from "./nervos.service"
import { Injectable } from "@nestjs/common"
import { Cell, HashType, HexString, OutPoint } from "@ckb-lumos/lumos"
import { ConsumedBitcoinOutput } from "src/type"
import { RGBPPConfig } from "src/config/nervos.config"

@Injectable()
export class ExplorerService {
  #host: string;
  #rgbppConfig: RGBPPConfig
  #retryTimes = 3;

  constructor(private readonly _configService: ConfigService, private readonly _nervosService: NervosService) {
    this.#host = this._configService.get('nervos.explorerUrl')
    this.#rgbppConfig = this._configService.get('nervos.rgbpp')
  }

  getTotalLiveCellCount = async (codeHash: HexString, hashType: HashType): Promise<number> => {
    let retryTimes = 0
    while (retryTimes < this.#retryTimes) {
      try {
        const url = `${this.#host}/api/v2/scripts/referring_cells?code_hash=${codeHash}&hash_type=${hashType}&page=1&page_size=1`

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
          },
        })

        const data = await res.json() as any
        return data.data.meta.total
      } catch (e) {
        console.log(e)
        retryTimes++
      }
    }
  }

  getLiveCells = async (page: number, pageSize: number, codeHash: HexString, hashType: HashType): Promise<Cell[]> => {
    let retryTimes = 0
    while (retryTimes < this.#retryTimes) {
      try {
        const url = `${this.#host}/api/v2/scripts/referring_cells?code_hash=${codeHash}&hash_type=${hashType}&page=${page}&page_size=${pageSize}`

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
          },
        })

        const data = await res.json() as any
        const cells = data.data.referring_cells as Array<any>
        const transactions = await this._nervosService.getMappedMultipleTransaction(cells.map(cell => cell.tx_hash))

        return cells.map(cell => {
          const transaction = transactions.get(cell.tx_hash)

          return {
            cellOutput: transaction.outputs[cell.cell_index],
            data: transactions.get(cell.tx_hash).outputsData[cell.cell_index],
            outPoint: {
              txHash: cell.tx_hash,
              index: cell.cell_index,
            }
          }
        })
      } catch (e) {
        console.log(e)
        retryTimes++
      }
    }

    return []
  }

  filterUnbindCell = async (bitcoinTransactions: Map<HexString, ConsumedBitcoinOutput>): Promise<{ consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[]> => {
    const totalCells = await this.getTotalLiveCellCount(this.#rgbppConfig.codeHash, this.#rgbppConfig.hashType)

    let page = 1;
    const promises: Promise<{ consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[]>[] = []
    while (page <= totalCells / 100 + 1) {
      promises.push(this.filterUnbindCellPerPage(page, bitcoinTransactions))
      page++
    }

    const res = await Promise.all(promises)


    return res.reduce((acc, cur) => {
      return acc.concat(cur)
    }, [])
  }

  filterUnbindCellPerPage = async (page: number, bitcoinTransactions: Map<HexString, ConsumedBitcoinOutput>): Promise<{ consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[]> => {
    const filtered: { consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[] = []

    const cells = await this.getLiveCells(page, 100, this.#rgbppConfig.codeHash, this.#rgbppConfig.hashType)

    cells.forEach(cell => {
      const consumedBy = bitcoinTransactions.get(cell.cellOutput.lock.args)
      if (consumedBy) {
        filtered.push({ consumedBy, outpoint: cell.outPoint })
      }
    })

    return filtered
  }

  reportUnbind = async (unbind: { consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }) => {
    const url = `${this.#host}/api/v2/bitcoin_vouts/verify`

    const params = {
      outpoint: {
        tx_hash: unbind.outpoint.txHash,
        index: unbind.outpoint.index,
      },
      consumed_by: {
        txid: unbind.consumedBy.txid,
        vin: {
          txid: unbind.consumedBy.vin.txid,
          index: unbind.consumedBy.vin.index,
        }
      }
    }

    console.log(`report unbind: ${JSON.stringify(params)}`)
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      })

      console.log(await res.text(), res.status)
    } catch (e) {
      console.log(e)
    }
  }
}
