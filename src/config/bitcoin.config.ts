export interface BitcoinConfig {
  rpc: BitcoinRPCConig
  startBlockNUmber: number;
  previousStartBlockNUmber: number;
  previousStopBlockNUmber: number
  previousStep: number
}

export interface BitcoinRPCConig {
  url: string;
  user?: string;
  pass: string;
  port: number;
  timeout?: number;
}