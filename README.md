# Arcjet

## Example

```js
const listener = (hash, data) => {console.log(hash, data)}
store.listen(listener)
const hash = await store.set('data')
// logs: sha data
const data = await store.get(hash)
// returns data
```

## Architecture

- TypeScript
- Browser and Server
  - Browser & Server both verify SHA and MAC
- Event-Driven (Streaming)
- SHA3 512-bit Hashes
- SPHINCS Post-Quantum Cryptography for keys and signatures (using WebAssembly)

## Protocol

- Hash-Linked Ledger
- Hashed Key Identity

## Data Format

Record format (tab-delimited)

```js
const record = [
  ownerHash, // 64
  parentHash, // 64
  dataHash, // 128
  encoding.padEnd(32, ' '), // 32
  type.padEnd(32, ' '), // 32
  tag.padEnd(32, ' '), // 32
  signature, // 82256
  getFixedHex(Date.now(), 16), // 16
  data, // <1000000000 (1GB)
].join('\t')

const line = [recordHash, record].join('\t') + '\n'
```

## Owner Records

- Record Hash
- Owner ID - Points to an owner record hash, that contains a public key for that owner. That is a record used to begin a chain of records.

## Security Considerations

- Client-side verification of both hash and signature should happen for all data used.
- Need to be ever vigilant against sybil attacks

## Roadmap

- Fixed to UTF-8 encoding for now. Add encodings and mimetypes.
- Verify signature of data in GET
