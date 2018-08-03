import * as express from 'express'

import Store from './store'

export const server = (store: Store) => {
  const app = express()

  app.get('/:hash', async (req, res) => {
    try {
      const {data, error} = await store.get(req.params.hash)
      if (error && error === 'NOTFOUND') {
        res.status(404).send('Not Found')
      } else {
        res.status(200).send(data)
      }
    } catch (err) {
      console.error(err)
      res.status(500).send(err)
    }
  })

  app.post('/', async (req, res) => {
    try {
      const hash = await store.set(req.body)
      res.status(200).send(hash)
    } catch (err) {
      console.error(err)
      res.status(500).send(err)
    }
  })

  app.listen(process.env.NODE_ENV === 'production' ? 80 : 3000)
}
