# Arcjet Network Server & Client Library

[![npm version](https://badge.fury.io/js/arcjet.svg)](https://badge.fury.io/js/arcjet)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Farcjet%2Farcjet.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Farcjet%2Farcjet?ref=badge_shield)

Be sure to check out our progress on our project board: https://github.com/arcjet/arcjet/projects/1

## Background

Most every current system has points of centralization. Even decentralized systems need interfaces to commonly centralized networks. These centralized networks are massive single points of failure. Failure of these systems would often result in widespread network outages and would be front-page news. This process of centralization would also result in the accumulation of wealth by centralized server operators to a degree that our civilization has never seen before.

In an effort to move away from centralized systems, the Decentralized App, or "DApp" ecosystem was created. DApps were notoriously hard to develop, expensive to use, and presented a high barrier-to-entry to users.

Previous implementations of Distributed Hash Table\*, or DHT-based object stores were problematic in that they had the potential to result in eventual data loss of less popular data due to their focus on MRU (most-recently used) data. One thing that's important to acknowledge in any DApp ecosystem is that the utility of these decentralized systems is lost when data loss is a potential risk of using those networks. Since they are free to use, they don't provide any storage guarantees.

After working with a few DHT-based networks, such as IPFS and Swarm, it was determined that current efforts are under-serving DApp developers, and a new approach might be warranted.

Arcjet is a DHT network written to incentivize operators to grow their systems as demand grows and as data gets stored long-term. Contracts are also meant to always be cheaper than traditional cloud storage operators.

The Arcjet Client runs the same algorithms used by the servers, compiled to WebAssembly thanks to developers on the Cyph project, and verifies all data it receives for veracity and integrity.

It's important to note that, currently the Arcjet Network runs behind a Gateway Server that proxies all requests from networks that require the use of Internet Protocol and the Domain Name System. This is a point of centralization that is necessary for working with current browsers. It is our hope that browser vendors will work to establish interfaces to distributed systems like Arcjet so direct Peer-to-Peer connections are possible to serve requests to "Internet 3" traffic. This would result in truly Distributed Apps, not just Decentralized Apps, or the DApp 2.0.

\* A hash table is a means of storing and retrieving a data record by the hash of its data. A hash is a very large number that is a representation of that data produced by an algorithm that processes the data itself, that can consistently provide the same number given the same data, and a different number with different data. The result of a cryptographic hash cannot be predicted beforehand; it must be run over the data to retrieve it.

## Goals

1. Provide a database that can be operated by anyone while DApp Owners can still trust the integrity of their data.
1. Allow Server Operators to build a robust network while running their servers on inexpensive consumer-grade hardware.
1. Provide a sufficiently distributed network with a high enough replication factor to prevent outages.
1. Track Server Operator contributions and periodically obligate DApp Owners to pay operators to incentivize growth of the network.
1. Reward serving least-recently used content to incentivize storage of older records and prevent data loss.
1. Use the latest in security advancements in order to future-proof the network, with security being just as important as performance.
1. Build towards full decentralization of the network while maintaining trust and the veracity of operator rewards.
1. Work with browser clients to fully decentralize internet traffic to DApps.
1. Maintain an optional content blacklist as a guideline to server operators to allow them to operate distributed networks safely.
1. Make useful tools that help DApp developers #BUIDL.

## Rationale

Arcjet is written in TypeScript so as to keep the project approachable to traditional web developers, instead of keeping the technology behind the locked doors of a class of benevolent techno-priests where only they are able to decipher and maintain the code for their users.

Arcjet doesn't use a centralized blockchain, in order to help provide for the scale desired. Minichains of records are created for each Owner Record. All data has an owner with a key, and that owner is expected to pay for that data. Users trusted by a site can have their data paid for on behalf of a Site Owner, if that Site Owner adopts Owner records associated with their owner parent record.

The Arcjet network means to solve a few problems in adversarial networks. However, there still exists a few problems with this approach, and this is the best we've been able to come up with so far. It's important and good to acknowledge the weaknesses of all solutions, including this one. Arcjet is meant to solve a few security problems with the techniques used, but there are still possible vulnerabilities that will be important to solve.

1. Birthday attacks - The idea behind the the Birthday attack is that if your hashes use too small a number, and are predictable enough, one could wind up with the same hash as another record and impersonate that record with something malicious. This is a truly hard problem of computer science. As with most security mechanisms, it's just helped by making it extremely difficult for attackers to perform by using fantastically large numbers. Maybe quantum computers will be a little better at solving these problems, but the difficulty of implementing a modern cryptographic hashing algorithm on quantum hardware, in addition to the fantastically large number, should make this very, very, difficult to do. Further, with a network of sufficient size, only a few users would be affected by Birthday attackers impersonating records.
1. DDoS attacks - A traditional DDoS is possible, as is the possibility to flood the network with garbage data. Hopefully risk of DDoS would be reduced as the network grows and peer-to-peer connections are made. Site Owners don't have as much to worry about DDoS as Server Operators, due to LRU pricing. If the network runs out of space, records can be freed at the end of the payment period after the next; if they're not paid for after two payment periods, they are removed and storage is freed.
1. Double-spend - Arcjet's version of double-spend is that currently our gateway server keeps track of all traffic through our server, allowing us to reward server operators and grow the network. A Server Operator, if operating their own gateway, could lie and say Site Owners owe them a zillion dollars, and hold a portion of their records hostage. If site operators could pick and choose who they paid, that'd also present a problem. One possible solution in a fully distributed network is for clients to make several requests for the same resource, and have Site Operators keep track of others' activities, using an operator's number of proven transactions as a means of preventing sybil attacks somehow. This could be called Proof of Transaction, and it's likely something that solveable and could be solved soon.
1. The Sybil-attack might be a problem, but it more falls into the above considerations, than just a traditional multiple-user attack. This network was designed to accommodate a large number of users, and no special privileges are given to users until they do work, such as serving a transaction, at which point, they wouldn't be that adversarial.

## Architecture

- TypeScript
- Browser and Server
  - Browser & Server both verify SHA and MAC
- Event-Driven (Streaming)

## Protocol

- Linked Record "Minichains"
- Owner Record Public Key

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
  data, // <1000000000 (1GB)
].join('\t')

const line = [recordHash, record].join('\t') + '\n'
```

## Owner Records

- Record Hash
- Owner ID - Points to an owner record hash, that contains a public key for that owner. That is a record used to begin a chain of records.

## Find Records

Arcjet finds records by keeping track of the most recent hash an record owner has contributed. This is then used to work backwards through all records that match the tag they've specified.

Tag indexes will be added soon.

### Find by Owner & Tag

`/find/{64-character ownerHash}/{<=32-character tag}/{limit}/{skip}`

(limit and skip are optional; omit them if you want all records)

### Find by Data Hash

`/find/{64-character ownerHash}/{128-character dataHash}`

## Roadmap

- Fixed to UTF-8 encoding for now. Add encodings and mimetypes.
- More event-driven / stream features
- Image resizing

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Farcjet%2Farcjet.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Farcjet%2Farcjet?ref=badge_large)
