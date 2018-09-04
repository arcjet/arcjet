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

export const shortBytesToStr = (arr: Uint8Array): string =>
  String.fromCharCode(...arr).trim()

export const bytesToStr = (arr: Uint8Array): string => {
  const strArr: string[] = []
  for (let i = 0, ii = arr.length; i < ii; i++) {
    strArr.push(String.fromCharCode(arr[i]))
  }
  return strArr.join('').trim()
}

export const strToBytes = (str: string, len?: number) => {
  const arr = new Uint8Array(len || str.length)
  for (let i = 0, ii = str.length; i < ii; i++) {
    arr[i] = str.charCodeAt(i)
  }
  return arr
}

export const numToBytes = (num: number, len: number): Uint8Array =>
  hexToBytes(getFixedHex(num, len))

export const bytesToInt = (bytes: Uint8Array): number =>
  parseInt(bytesToHex(bytes), 16)

export const bytesEquals = (
  bytesA: Uint8Array,
  bytesB: Uint8Array
): boolean => {
  if (bytesA.length === bytesB.length) {
    for (let i = 0, ii = bytesA.length; i < ii; i++) {
      if (bytesA[i] !== bytesB[i]) {
        return false
      }
    }
    return true
  }
  return false
}

export const blobToBytes = async (blob: Blob): Promise<{}> =>
  new Promise(
    (resolve, reject): void => {
      const fr = new FileReader()
      fr.onload = evt => (evt.target ? resolve(fr.result as {}) : reject())
      fr.onerror = evt => reject(evt)
      fr.readAsArrayBuffer(blob)
    }
  )

export const bytesToBlob = (arr: Uint8Array, type: string) =>
  new Blob([arr], {type})
