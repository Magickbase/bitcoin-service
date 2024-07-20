import { HashType } from "@ckb-lumos/lumos";

export interface NervosConfig {
  explorerUrl: string;
  rgbpp: RGBPPConfig;
  rpc: NervosRPCConfig;
  transactionLimit: number
}

export interface RGBPPConfig {
  codeHash: string;
  hashType: HashType;
}

export interface NervosRPCConfig {
  url: string;
  timeout?: number;
}