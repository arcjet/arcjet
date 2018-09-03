import * as express from 'express'
import * as cors from 'cors'

import {ExpressPeerServer} from 'peer'
import {NodeClient} from './node_client'
import {server} from '.'

export const gateway = (
  gatewayPort: number,
  peerPort: number,
  host: string = 'localhost'
) =>
  new Promise(resolve => {
    const app = express()

    const nodeClient = new NodeClient(host, peerPort)

    const peerserver = ExpressPeerServer({port: peerPort, path: '/peers'})

    peerserver.on('connection', (id: string) => {
      nodeClient.setPeer(id, '0', '7')
      console.log('peer connected:', id)
    })

    peerserver.on('disconnect', (id: string) => {
      nodeClient.unsetPeer(id)
      console.log('peer disconnected:', id)
    })

    app.use('/peers', peerserver)

    server(app, nodeClient)

    app.listen(gatewayPort, async () => {
      resolve()
    })
  })
