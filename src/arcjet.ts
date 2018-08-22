#!/usr/bin/env node
import * as program from 'caporal'
import * as fs from 'fs'
import * as path from 'path'
import * as got from 'got'

import Store from './store'
import {server} from './server'
const pkg = require('../package.json')

const DEFAULT_PORT = 3000

program.version(pkg.version)

program
  .command('start', 'Start server with a database file')
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
      await server(store, parseInt(options.port, 10) || DEFAULT_PORT)
      logger.info(`Arcjet started on port ${options.port || DEFAULT_PORT}`)
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

program.command('gateway')

program.parse(process.argv)
