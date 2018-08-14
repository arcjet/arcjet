export const hexToBytes = (hex: string): Uint8Array => {
  console.log(hex.length / 2)
  const byteArray = new Uint8Array(hex.length / 2)

  for (let c = 0, h = 0; c < hex.length; c += 2, h++) {
    byteArray[h] = parseInt(hex.substr(c, 2), 16)
  }

  console.log(byteArray)

  return byteArray
}

export const bytesToHex = (arr: number[]): string =>
  arr.map((i: number): string => '0' + i.toString(16).slice(-2)).join('')
