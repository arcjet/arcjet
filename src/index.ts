import * as express from 'express'
const { ExpressPeerServer } = require('peer')

import * as cors from 'cors'
import * as bodyParser from 'body-parser'

export const server = (app: express.Express) => {
  const corsOptionsDelegate = (req: express.Request, cb: any) => {
    cb(null, { origin: req.headers.origin, credentials: false })
  }

  app.use(cors(corsOptionsDelegate))
  app.use(
    bodyParser.text({
      limit: '100mb',
      type: '*/*',
    }),
  )

  app.get('*', (req: express.Request, res: express.Response) => {})

  return app
}

const peers = new Map<string, boolean>()

export const gateway = ({ gatewayPort = 8080 }) =>
  new Promise(resolve => {
    const app = express()
    const peerServer = ExpressPeerServer(app, {})

    app.use('/api', peerServer)

    peerServer.on('connection', (id: string) => {
      peers.set(id, true)
      console.log('peer connected:', id)
    })

    peerServer.on('disconnect', (id: string) => {
      peers.delete(id)
      console.log('peer disconnected:', id)
    })

    app.get('/peers', (_req, res) => {
      res.json(Object.keys(peerServer._clients.peerjs))
    })

    server(app)

    app.listen(gatewayPort, async () => {
      console.log(`Arcjet Peer Server running on port ${gatewayPort}`)
      resolve()
    })
  })

gateway({ gatewayPort: 8080 })
