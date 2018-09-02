#!/usr/bin/env node
import * as program from 'caporal'
import * as fs from 'fs'
import * as path from 'path'
import * as got from 'got'
import * as express from 'express'

import Store from './store'
import {server} from './server'
import {gateway} from './gateway'
const pkg = require('../package.json')

export const DEFAULT_PORT = 3000
export const GATEWAY_PORT = 6000
export const PEER_PORT = 9000

program.version(pkg.version)

program
  .command('standalone', 'Start a standalone server with a database file')
  .argument('<file>', 'File to start the database with')
  .option(
    '--port <port>',
    'Port number to listen on',
    program.INT,
    DEFAULT_PORT,
    true
  )
  .action(async (args, options, logger) => {
    try {
      const store = new Store()
      await store.init(args.file)
      const app = server(express(), store)
      app.listen(parseInt(options.port, 10) || DEFAULT_PORT, () => {
        logger.info(`Arcjet started on port ${options.port || DEFAULT_PORT}`)
      })
    } catch (err) {
      logger.error(err)
    }
  })

program
  .command('set', 'Add a file to the Arcjet network')
  .argument('<file>', 'File to add to the network')
  .option('--port <port>', 'Port number to connect to', program.INT, 3000, true)
  .action(async (args, options, logger) => {
    try {
      const request = got.stream(
        `http://127.0.0.1:${options.port || DEFAULT_PORT}/`,
        {
          method: 'POST',
          encoding: 'utf8',
        }
      )

      const stream = fs.createReadStream(
        path.resolve(process.cwd(), args.file),
        'utf8'
      )

      stream.pipe(request)

      request.on('response', response => {
        response.on('data', data => {
          logger.info(data.toString())
        })
      })
    } catch (err) {
      logger.error(err)
    }
  })

program
  .command('gateway', 'Start a gateway server')
  .argument('<file>', 'File to start the database with')
  .argument('<host>', 'Hostname')
  .option(
    '--gateway-port <gateway_port>',
    'Gateway port number to listen on',
    program.INT,
    GATEWAY_PORT,
    true
  )
  .option(
    '--peer-port <peer_port>',
    'Peer port number to listen on',
    program.INT,
    PEER_PORT,
    true
  )
  .action(async (args, options, logger) => {
    try {
      await gateway(
        parseInt(options.gateway_port, 10) || GATEWAY_PORT,
        parseInt(options.peer_port, 10) || PEER_PORT,
        args.host
      )
      logger.info(
        `Arcjet started on ports ${options.gateway_port ||
          GATEWAY_PORT} & ${options.peer_port || PEER_PORT}`
      )
    } catch (err) {
      logger.error(err)
    }
  })

program.parse(process.argv)
