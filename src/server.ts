import * as express from 'express'
import * as cors from 'cors'
import * as cookieParser from 'cookie-parser'
const sphincs = require('sphincs')

import Store from './store'
import {homepage, generate} from './html'
import {arrToHex} from './utils'
import {ArcjetCookies, FalsyString} from './types'

const genKeys = async () => {
  const keyPair = await sphincs.keyPair()
  const privateKey = arrToHex(keyPair.privateKey)
  const publicKey = arrToHex(keyPair.publicKey)
  return {privateKey, publicKey}
}

const cookieOptions = {
  httpOnly: true,
  sameSite: true,
  secure: process.env.NODE_ENV === 'production',
}

const hasCookies = ({
  ARCJET_PRIVATE_KEY,
  ARCJET_PUBLIC_KEY,
  ARCJET_OWNER_HASH,
}: ArcjetCookies) =>
  !!(ARCJET_PRIVATE_KEY && ARCJET_PUBLIC_KEY && ARCJET_OWNER_HASH)

const ifFalseReturnUndefined = (value: FalsyString) =>
  value === false ? undefined : value

export const server = (store: Store, port: number) =>
  new Promise((resolve, reject) => {
    const app = express()

    app.use(cors())
    app.use(cookieParser())

    app.get('/', (req, res) => {
      res.status(200).send(homepage(hasCookies(req.cookies)))
    })

    app.get('/generate', async (req, res) => {
      try {
        const {
          ARCJET_PRIVATE_KEY,
          ARCJET_PUBLIC_KEY,
          ARCJET_OWNER_HASH,
        } = req.cookies

        if (ARCJET_PRIVATE_KEY && ARCJET_PUBLIC_KEY && ARCJET_OWNER_HASH) {
          res.status(200).send(
            generate({
              privateKey: ARCJET_PRIVATE_KEY,
              publicKey: ARCJET_PUBLIC_KEY,
              hash: ARCJET_OWNER_HASH,
            })
          )
        } else {
          const {privateKey, publicKey} = await genKeys()
          const cookies = hasCookies(req.cookies)
            ? req.cookies
            : {
                ARCJET_PRIVATE_KEY: privateKey,
                ARCJET_PUBLIC_KEY: publicKey,
                ARCJET_OWNER_HASH: '0'.repeat(64),
              }
          const hash = await store.set(
            publicKey,
            cookies,
            undefined,
            undefined,
            'owner'
          )
          res.cookie('ARCJET_PRIVATE_KEY', privateKey, cookieOptions)
          res.cookie('ARCJET_PUBLIC_KEY', publicKey, cookieOptions)
          res.cookie('ARCJET_OWNER_HASH', hash, cookieOptions)
          res.status(200).send(generate({privateKey, publicKey, hash}))
        }
      } catch (err) {
        console.error(err)
        res.sendStatus(500)
      }
    })

    app.get('/store/:hash', async (req, res) => {
      if (req.params.hash.length !== 64) {
        return
      }
      try {
        const {data, error} = await store.get(req.params.hash)
        if (error && error === 'NOTFOUND') {
          res.status(404).send('Not Found')
        } else if (data) {
          res.statusCode = 200
          data.pipe(res)
        } else {
          res.sendStatus(500)
        }
      } catch (err) {
        console.error(err)
        res.status(500).send(err)
      }
    })

    app.post('/store/:tag', async (req, res) => {
      if (!hasCookies(req.cookies)) {
        res.sendStatus(401)
      } else {
        try {
          const chunks: Buffer[] = []

          req.on('data', (data: Buffer) => {
            chunks.push(data)
          })

          req.on('end', async () => {
            const encoding = req.acceptsCharsets(['utf-8'])
            const type = req.accepts(['text/plain'])

            try {
              const hash = await store.set(
                Buffer.concat(chunks).toString('utf8'),
                req.cookies as ArcjetCookies,
                ifFalseReturnUndefined(encoding),
                ifFalseReturnUndefined(type),
                req.params.tag
              )
              res.statusCode = 200
              res.contentType('text/plain')
              res.send(hash)
            } catch (err) {
              console.error(err)
              res.sendStatus(500)
            }
          })
        } catch (err) {
          console.error(err)
          res.sendStatus(500)
        }
      }
    })

    app.get('/find/:owner/:tag', async (req, res) => {
      try {
        const {owner, tag} = req.params
        const records = await store.findByTag(owner, tag)
        res.status(200).json(records)
      } catch (err) {
        console.error(err)
        res.sendStatus(500)
      }
    })

    app.listen(port, () => {
      resolve()
    })
  })
