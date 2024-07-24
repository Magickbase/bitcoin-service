import { HexString } from "@ckb-lumos/lumos";
import { leToU32, reverseHex } from "@rgbpp-sdk/ckb";

export const parseBTCUTXO = (args: HexString) => {
  const prueHex = args.slice(2)
  const vout = leToU32(prueHex.slice(0, 8))
  const txid = reverseHex(prueHex.slice(8))

  return { vout, txid }
}