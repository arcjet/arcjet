export const parseRecord = (record: string) => {
  const [
    recordHash,
    ownerHash,
    parentHash,
    dataHash,
    encoding,
    type,
    tag,
    signature,
    data,
  ] = record.split('\t')

  return {
    recordHash,
    ownerHash,
    parentHash,
    dataHash,
    encoding: encoding.trim(),
    type: type.trim(),
    tag: tag.trim(),
    signature,
    data,
  }
}
