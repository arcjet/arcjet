import * as express from 'express'
import * as cors from 'cors'

import {ExpressPeerServer} from 'peer'
import * as Peer from 'peerjs'
import uuidv4 from 'uuid/v4'

export class Gateway {
  private peers = new Map()
  private requests = new Map()

  public init = (gatewayPort: number, peerPort: number) =>
    new Promise(resolve => {
      const app = express()

      const corsOptionsDelegate = function(req: express.Request, cb: any) {
        cb(null, {origin: req.headers.origin, credentials: true})
      }

      app.use(cors(corsOptionsDelegate))

      const peerserver = ExpressPeerServer({port: peerPort, path: '/peers'})
      const peer = new Peer({host: 'localhost', port: peerPort, path: '/peers'})

      peerserver.on('connection', (id: string) => {
        this.peers.set(id, [0, 15])
        console.log('peer connected:', id)
      })

      peerserver.on('disconnect', (id: string) => {
        console.log('peer disconnected:', id)
      })

      app.use('/peers', peerserver)

      app.listen(gatewayPort, () => {
        resolve()
      })
    })
}
