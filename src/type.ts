export type ConsumedBitcoinOutput = {
  txid: string
  vin: {
    index: number
    txid: string
  }
}