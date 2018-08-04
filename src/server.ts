import * as express from 'express'
import * as bodyParser from 'body-parser'

import Store from './store'

export const server = (store: Store, port: number) =>
  new Promise((resolve, reject) => {
    const app = express()

    app.use(
      bodyParser.raw({
        type: '*/*',
        limit: '1gb',
      })
    )

    app.get('/:hash', async (req, res) => {
      try {
        const {data, error} = await store.get(req.params.hash)
        if (error && error === 'NOTFOUND') {
          res.status(404).send('Not Found')
        } else if (data) {
          res.statusCode = 200
          data.pipe(res)
        } else {
          res.status(500).send('Internal Server Error')
        }
      } catch (err) {
        console.error(err)
        res.status(500).send(err)
      }
    })

    app.post('/', async (req, res) => {
      try {
        const hash = await store.set(req.body.toString('utf8'))
        res.statusCode = 200
        res.contentType('text/plain')
        res.send(hash)
      } catch (err) {
        console.error(err)
        res.status(500).send(err)
      }
    })

    app.listen(port, () => {
      resolve()
    })
  })
