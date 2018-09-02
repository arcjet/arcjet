export const assert = (assertion: boolean, message: string): void => {
  if (assertion === false) throw new Error(`Assertion Error: ${message}`)
}

export const hexToBytes = (hex: string): Uint8Array => {
  const byteArray = new Uint8Array(hex.length / 2)
  for (let c = 0, h = 0; c < hex.length; c += 2, h++) {
    byteArray[h] = parseInt(hex.substr(c, 2), 16)
  }
  return byteArray
}

export const bytesToHex = (arr: Uint8Array): string => {
  const hex: string[] = []
  for (let c = 0; c < arr.length; c++) {
    hex.push(arr[c].toString(16).padStart(2, '0'))
  }
  return hex.join('')
}

export const getFixedHex = (num: number, length: number) =>
  num.toString(16).padStart(length, '0')
