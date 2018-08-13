import * as express from 'express'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
// import {DateTime, Duration} from 'luxon'
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

const getCookieOptions = (domain: string) => ({
  // path: '/register',
  // domain,
  // expires: DateTime.utc()
  //   .plus(Duration.fromObject({years: 10}))
  //   .toJSDate(),
  httpOnly: false,
  sameSite: false,
  secure: process.env.NODE_ENV === 'production',
})

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

    var corsOptionsDelegate = function(req: express.Request, cb: any) {
      cb(null, {origin: req.headers.origin, credentials: true})
    }

    app.use(cors(corsOptionsDelegate))
    app.use(cookieParser())
    app.use(
      bodyParser.text({
        defaultCharset: 'utf-8',
        limit: '1gb',
        type: '*/*',
      })
    )

    app.get('/', (req, res) => {
      res.status(200).send(homepage(hasCookies(req.cookies)))
    })

    app.post('/generate', async (req, res) => {
      try {
        const {
          ARCJET_PRIVATE_KEY,
          ARCJET_PUBLIC_KEY,
          ARCJET_OWNER_HASH,
        } = req.cookies

        const cookieOptions = getCookieOptions(req.headers.host as string)

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
          res.sendStatus(200)
          // res.redirect(req.headers.origin as string)
          // .status(200)
          // .send(generate({privateKey, publicKey, hash}))
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
          const encoding = req.acceptsCharsets(['utf-8'])
          const type = req.accepts(['text/plain'])

          if (req.body) {
            const hash = await store.set(
              req.body,
              req.cookies,
              ifFalseReturnUndefined(encoding),
              ifFalseReturnUndefined(type),
              req.params.tag
            )
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
          }
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

    app.get('/owner', async (req, res) => {
      res.status(200).send(req.cookies.ARCJET_OWNER_HASH)
    })

    app.listen(port, () => {
      resolve()
    })
  })
