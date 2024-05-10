export interface BitcoinConfig {
  rpc: BitcoinRPCConig
  startBlockNUmber: number;
}

export interface BitcoinRPCConig {
  url: string;
  user?: string;
  pass: string;
  port: number;
  timeout?: number;
}