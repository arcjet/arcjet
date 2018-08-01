import * as fs from 'fs'
import {promisify} from 'util'

export const open = promisify(fs.open)
export const close = promisify(fs.close)
export const read = promisify(fs.read)
export const appendFile = promisify(fs.appendFile)
