import { ConfigService } from "@nestjs/config"
import { ProxyAgent, fetch } from 'undici'
import { NervosService } from "./nervos.service"
import { ConsoleLogger, Injectable } from "@nestjs/common"
import { Cell, HashType, HexString, OutPoint, Transaction } from "@ckb-lumos/lumos"
import { ConsumedBitcoinOutput } from "src/type"
import { RGBPPConfig } from "src/config/nervos.config"
import { SyncLogger } from "src/logger/sync.logger"

@Injectable()
export class ExplorerService {
  #host: string;
  #rgbppConfig: RGBPPConfig
  #transactionCountLimit: number
  #retryTimes = 3;

  constructor(private readonly _configService: ConfigService, private readonly _nervosService: NervosService) {
    this.#host = this._configService.get('nervos.explorerUrl')
    this.#rgbppConfig = this._configService.get('nervos.rgbpp')
    this.#transactionCountLimit = this._configService.get('nervos.transactionLimit')
  }

  getTotalLiveCellCount = async (codeHash: HexString, hashType: HashType, logger: SyncLogger): Promise<number> => {
    let retryTimes = 0
    while (retryTimes < this.#retryTimes) {
      try {
        const url = `${this.#host}/api/v2/rgb_live_cells?code_hash=${codeHash}&hash_type=${hashType}&page=1&page_size=1`

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
          },
        })

        const data = await res.json() as any
        return data.meta.total
      } catch (e) {
        logger.error(e)
        retryTimes++
      }
    }
  }

  getTotalLiveCells = async (codeHash: HexString, hashType: HashType, logger: SyncLogger): Promise<Cell[]> => {
    const totalCells = await this.getTotalLiveCellCount(codeHash, hashType, logger)
    logger.log(`total cells: ${totalCells}`)

    let page = 1;
    let cellsOutpoint: { txHash: string; cellIndex: number }[] = []
    // const outpointPromises: Promise<{ txHash: HexString, cellIndex: number }[]>[] = []
    const totalPage = totalCells / 1000 + 1
    while (page <= totalPage) {
      logger.log(`get live cells page: ${page}, total: ${totalPage}`)
      cellsOutpoint = cellsOutpoint.concat(await this.getLiveCellsOutPoint(page, 1000, codeHash, hashType, logger))
      page++
    }

    // const cellsPromises: Promise<Map<string, Transaction>>[] = []
    let transactions = new Map<string, Transaction>();
    for (let i = 0; i < cellsOutpoint.length; i += this.#transactionCountLimit) {
      logger.log(`get transactions from ${i} to ${i + this.#transactionCountLimit}, total: ${cellsOutpoint.length}`)
      const transactionsRes = await this._nervosService.getMappedMultipleTransaction(cellsOutpoint.slice(i, i + this.#transactionCountLimit).map(cell => cell.txHash), logger);
      transactions = new Map([...transactions, ...transactionsRes]);
    }
    // const transactionsRes = await Promise.all(cellsPromises)
    // console.log(transactionsRes)
    // const transactions = transactionsRes.reduce((acc, cur) => {
    //   return new Map([...acc, ...cur])
    // }, new Map<string, Transaction>())

    return cellsOutpoint.map(cell => {
      const transaction = transactions.get(cell.txHash)

      return {
        cellOutput: transaction.outputs[cell.cellIndex],
        data: transactions.get(cell.txHash).outputsData[cell.cellIndex],
        outPoint: {
          txHash: cell.txHash,
          index: cell.cellIndex.toString(),
        }
      }
    })
  }

  getLiveCellsOutPoint = async (page: number, pageSize: number, codeHash: HexString, hashType: HashType, logger: SyncLogger): Promise<{ txHash: HexString, cellIndex: number }[]> => {
    let retryTimes = 0
    while (retryTimes < this.#retryTimes) {
      try {
        const url = `${this.#host}/api/v2/rgb_live_cells?code_hash=${codeHash}&hash_type=${hashType}&page=${page}&page_size=${pageSize}`

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
          },
        })

        const data = await res.json() as any
        return data.cells.map(cell => {
          return {
            txHash: cell.tx_hash,
            cellIndex: cell.cell_index,
          }
        })
      } catch (e) {
        logger.error(e)
        retryTimes++
      }
    }

    return []
  }

  getCells = async (cells: { txHash: HexString, cellIndex: number }[], logger: SyncLogger): Promise<Cell[]> => {
    const transactions = await this._nervosService.getMappedMultipleTransaction(cells.map(cell => cell.txHash), logger)

    return cells.map(cell => {
      const transaction = transactions.get(cell.txHash)

      return {
        cellOutput: transaction.outputs[cell.cellIndex],
        data: transactions.get(cell.txHash).outputsData[cell.cellIndex],
        outPoint: {
          txHash: cell.txHash,
          index: cell.cellIndex.toString(),
        }
      }
    })
  }

  getLiveCells = async (page: number, pageSize: number, codeHash: HexString, hashType: HashType, logger: SyncLogger): Promise<Cell[]> => {
    let retryTimes = 0
    while (retryTimes < this.#retryTimes) {
      try {
        const url = `${this.#host}/api/v2/rgb_live_cells?code_hash=${codeHash}&hash_type=${hashType}&page=${page}&page_size=${pageSize}`

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
          },
        })

        const data = await res.json() as any
        const cells = data.cells as Array<any>
        const transactions = await this._nervosService.getMappedMultipleTransaction(cells.map(cell => cell.tx_hash), logger)

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
        logger.error(e)
        retryTimes++
      }
    }

    return []
  }

  filterUnbindCell = async (bitcoinTransactions: Map<HexString, ConsumedBitcoinOutput>, logger: SyncLogger): Promise<{ consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[]> => {
    const filtered: { consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[] = []
    const liveCells = await this.getTotalLiveCells(this.#rgbppConfig.codeHash, this.#rgbppConfig.hashType, logger)
    liveCells.forEach(cell => {
      const consumedBy = bitcoinTransactions.get(cell.cellOutput.lock.args)
      if (consumedBy) {
        filtered.push({ consumedBy, outpoint: cell.outPoint })
      }
    })

    return filtered
    // const totalCells = await this.getTotalLiveCellCount(this.#rgbppConfig.codeHash, this.#rgbppConfig.hashType)

    // let page = 1;
    // const promises: Promise<{ consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[]>[] = []
    // while (page <= totalCells / 100 + 1) {
    //   promises.push(this.filterUnbindCellPerPage(page, bitcoinTransactions))
    //   page++
    // }

    // const res = await Promise.all(promises)

    // return res.reduce((acc, cur) => {
    //   return acc.concat(cur)
    // }, [])
  }

  filterUnbindCellPerPage = async (page: number, bitcoinTransactions: Map<HexString, ConsumedBitcoinOutput>, logger: SyncLogger): Promise<{ consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[]> => {
    const filtered: { consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }[] = []

    const cells = await this.getTotalLiveCells(this.#rgbppConfig.codeHash, this.#rgbppConfig.hashType, logger)

    cells.forEach(cell => {
      const consumedBy = bitcoinTransactions.get(cell.cellOutput.lock.args)
      if (consumedBy) {
        filtered.push({ consumedBy, outpoint: cell.outPoint })
      }
    })

    return filtered
  }

  reportUnbind = async (unbind: { consumedBy: ConsumedBitcoinOutput, outpoint: OutPoint }, logger: ConsoleLogger) => {
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

    logger.log(`report unbind: ${JSON.stringify(params)}`)
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      })

      logger.log(`${res.status}`)
    } catch (e) {
      logger.error(e)
    }
  }
}
