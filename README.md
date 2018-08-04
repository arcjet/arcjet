# Arcjet

## Streaming

```js
const listener = (hash, data) => {console.log(hash, data)}
store.listen(listener)
const hash = await store.set('data')
// logs: sha data
```

## Architecture

- TypeScript
- Browser and Server
  - Browser & Server both verify SHA and MAC
- Event-Driven (Streaming)
- SHA3 256-bit Hashes
- KMAC 256-bit MAC

### Architecture Questions

- Should a binary / buffer-based data format be used instead of uft8? Would that be as secure?

## Protocol

- Hash-Linked Ledger
- Hashed Key Identity

Record format (quotes added for clarity):

```
"record sha"\t"owner sha"\t"message mac"\t"...data"\n # record
```
