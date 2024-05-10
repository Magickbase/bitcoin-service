import { HashType } from "@ckb-lumos/lumos";

export interface NervosConfig {
  rgbpp: RGBPPConfig;
  rpc: NervosRPCConfig;
}

export interface RGBPPConfig {
  codeHash: string;
  hashType: HashType;
}

export interface NervosRPCConfig {
  url: string;
  timeout?: number;
}