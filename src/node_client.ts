import * as Peer from 'peerjs'
import * as uuidv4 from 'uuid/v4'

export class NodeClient {
  private peer: Peer
  private peers = new Map()
  private requests = new Map()

  public shaLength = 128

  constructor(host: string, port: number) {
    this.peer = new Peer({host, port, path: '/peers'})
  }

  private message(data: {}): Promise<string> {
    const id = uuidv4()
    const promise: Promise<string> = new Promise(resolve => {
      this.requests.set(id, resolve)
    })

    // TODO DHT don't message all peers
    this.peers.forEach(peer => {
      peer.send({
        id,
        data,
      })
    })

    return promise
  }

  public setPeer(id: string, userRecord: string, range: string) {
    const peer = this.peer.connect(id)
    peer.on('data', ({id, data}) => {
      this.requests.get(id)(data)
      this.requests.delete(id)
    })
    this.peers.set(id, peer)
  }

  public unsetPeer(id: string) {
    this.peers.delete(id)
  }

  public set(record: string): Promise<string> {
    return this.message({type: 'SET', record})
  }

  public get(hash: string): Promise<string> {
    return this.message({type: 'GET', hash})
  }

  public findByTag(
    owner: string,
    tag: string,
    limit: number = 0,
    offset: number = 0
  ) {
    return this.message({type: 'TAG', owner, tag, limit, offset})
  }
}
