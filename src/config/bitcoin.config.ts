export interface BitcoinConfig {
  rpc: BitcoinRPCConig
  startBlockNUmber: number;
  previousStartBlockNUmber: number;
  previousStopBlockNUmber: number
  blockstream: Blockstream
}

export interface Blockstream {
  rpc: string
}

export interface BitcoinRPCConig {
  url: string;
  user?: string;
  pass: string;
  port: number;
  timeout?: number;
}