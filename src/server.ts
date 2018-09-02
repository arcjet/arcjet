import * as express from 'express'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import {strict as assert} from 'assert'

import Store from './store'
import {NodeClient} from './node_client'
// import {homepage} from './html'

export const server = (app: express.Express, store: Store | NodeClient) => {
  const corsOptionsDelegate = (req: express.Request, cb: any) => {
    cb(null, {origin: req.headers.origin, credentials: true})
  }

  app.use(cors(corsOptionsDelegate))
  app.use(
    bodyParser.text({
      defaultCharset: 'utf-8',
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
        res.status(404).send('Not Found')
      } else {
        console.error(err)
        res.status(500).send(err)
      }
    }
  })

  app.post('/store', async (req, res) => {
    try {
      if (req.body) {
        const hash = await store.set(req.body)
        res.statusCode = 200
        res.contentType('text/plain')
        res.send(hash)
      } else {
        const chunks: Buffer[] = []

        req.on('data', (data: Buffer) => {
          chunks.push(data)
        })

        req.on('end', async () => {
          try {
            const hash = await store.set(Buffer.concat(chunks).toString('utf8'))
            res.statusCode = 200
            res.contentType('text/plain')
            res.send(hash)
          } catch (err) {
            console.error(err)
            res.status(500).send(err)
          }
        })
      }
    } catch (err) {
      console.error(err)
      res.status(500).send(err)
    }
  })

  app.get('/find/:owner/:tag', async (req, res) => {
    try {
      const {owner, tag} = req.params
      const records = await store.findByTag(owner, tag)
      res.status(200).send(records)
    } catch (err) {
      console.error(err)
      res.sendStatus(500)
    }
  })

  app.get('/find/:owner/:tag/:limit', async (req, res) => {
    try {
      const {owner, tag, limit} = req.params
      const records = await store.findByTag(owner, tag, limit)
      res.status(200).send(records)
    } catch (err) {
      console.error(err)
      res.sendStatus(500)
    }
  })

  app.get('/find/:owner/:tag/:limit/:offset', async (req, res) => {
    try {
      const {owner, tag, limit, offset} = req.params
      const records = await store.findByTag(owner, tag, limit, offset)
      res.status(200).send(records)
    } catch (err) {
      console.error(err)
      res.sendStatus(500)
    }
  })

  return app
}
