import test from 'ava'
import indentString from 'indent-string'
import { bold } from 'chalk'
import fs from 'fs'
import path from 'path'
import render from '../'

const debug = (process.env.DEBUG === '1')

const FIXTURES_PATH = path.join(__dirname, 'fixtures')

const testIds = fs.readdirSync(FIXTURES_PATH)
  .filter(name => fs.statSync(path.join(FIXTURES_PATH, name)).isDirectory())
  .sort()

const dump = (prefix, obj) => {
  console.log(prefix +
    indentString(JSON.stringify(obj, null, 2), 2).substr(1))
  console.log()
}

for (const testId of testIds) {
  test(testId, t => {
    const dir = path.join(FIXTURES_PATH, testId)
    const template = require(path.join(dir, 'template.json'))
    const data = require(path.join(dir, 'data.json'))
    const result = render(template, data)
    t.snapshot(result)
    if (debug) {
      console.log(bold(testId))
      console.log()
      dump('T', template)
      dump('D', data)
      dump('O', result)
      console.log()
    }
  })
}
