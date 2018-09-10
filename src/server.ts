import * as express from 'express'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'

import Store from './store'
import {NodeClient} from './node_client'
// import {homepage} from './html'

export const server = (app: express.Express, store: Store | NodeClient) => {
  const corsOptionsDelegate = (req: express.Request, cb: any) => {
    cb(null, {origin: req.headers.origin, credentials: true})
  }

  app.use(cors(corsOptionsDelegate))
  app.use(
    bodyParser.raw({
      limit: '1gb',
      type: '*/*',
    })
  )

  app.get('/', (req, res) => {
    res.status(200).send('For more, see https://github.com/arcjet/arcjet')
  })

  app.get('/store/:hash', async (req, res) => {
    if (req.params.hash.length !== store.shaLength) {
      res.sendStatus(400)
      return
    }
    try {
      const data = await store.get(req.params.hash)
      if (data) {
        res.status(200).send(data)
      } else {
        res.sendStatus(500)
      }
    } catch (err) {
      if (err === 'Record Not Found') {
        res.sendStatus(404)
      } else {
        console.error(err)
        res.status(500).send(err)
      }
    }
  })

  app.post('/store', async (req, res) => {
    try {
      const body: Buffer = req.body
      const hash = await store.set(body)
      res.statusCode = 200
      res.contentType('text/plain')
      res.send(hash)
    } catch (err) {
      console.error(err)
      res.status(500).send(err)
    }
  })

  app.get('/find', async (req, res) => {
    try {
      const records = await store.find(req.query)
      res.status(200).send(records)
    } catch (err) {
      console.error(err)
      res.sendStatus(500)
    }
  })

  return app
}
