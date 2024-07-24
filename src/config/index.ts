import { HashType } from "@ckb-lumos/lumos"
import { BitcoinConfig } from "./bitcoin.config"
import { NervosConfig } from "./nervos.config"

interface Config {
  retryTimes: number
  bitcoin: BitcoinConfig
  nervos: NervosConfig
}

export default (): Config => {
  let hashType: HashType = 'type'
  switch (process.env.NERVOS_RGBPP_HASH_TYPE) {
    case 'type':
      hashType = 'type'
      break
    case 'data':
      hashType = 'data'
      break
    case 'data1':
      hashType = 'data1'
      break
    default:
      hashType = 'type'
  }

  return {
    retryTimes: parseInt(process.env.RETRY_TIMES, 10) || 3,
    bitcoin: {
      blockstream: {
        rpc: process.env.BITCOIN_BLOCKSTREAM_RPC || 'https://blockstream.info/api',
      },
      previousStartBlockNUmber: parseInt(process.env.BITCOIN_PREVIOUS_START_BLOCK_NUMBER, 10) || 0,
      previousStopBlockNUmber: parseInt(process.env.BITCOIN_PREVIOUS_STOP_BLOCK_NUMBER, 10) || 0,
      startBlockNUmber: parseInt(process.env.BITCOIN_START_BLOCK_NUMBER, 10) || 0,
      rpc: {
        url: process.env.BITCOIN_RPC_URL || 'http://localhost',
        user: process.env.BITCOIN_RPC_USER,
        pass: process.env.BITCOIN_RPC_PASS,
        port: process.env.BITCOIN_RPC_PORT ? parseInt(process.env.BITCOIN_RPC_PORT, 10) : undefined,
        timeout: parseInt(process.env.BITCOIN_RPC_TIMEOUT, 10) || 30000,
      }
    },
    nervos: {
      transactionLimit: parseInt(process.env.NERVOS_TRANSACTION_LIMIT, 10) || 100,
      explorerUrl: process.env.NERVOS_EXPLORER_URL || 'https://mainnet-api.explorer.nervos.org',
      rgbpp: {
        codeHash: process.env.NERVOS_RGBPP_CODE_HASH || '0x61ca7a4796a4eb19ca4f0d065cb9b10ddcf002f10f7cbb810c706cb6bb5c3248',
        hashType,
      },
      rpc: {
        url: process.env.NERVOS_RPC_URL || 'http://localhost',
        timeout: parseInt(process.env.NERVOS_RPC_TIMEOUT, 10) || 30000,
      }
    }
  }
}