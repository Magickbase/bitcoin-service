export type ConsumedBitcoinOutput = {
  txid: string
  vin: {
    index: number
    txid: string
  }
}

export interface Spent {
  spent: boolean,
  txid?: string,
  vin?: number,
  status?: {
    confirmed: boolean,
    block_height: number,
    block_hash: string,
    block_time: number,
  }
}