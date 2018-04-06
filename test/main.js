import test from 'ava'
import fs from 'fs'
import path from 'path'
import render from '../'

const FIXTURES_PATH = path.join(__dirname, 'fixtures')

const testIds = fs.readdirSync(FIXTURES_PATH)
  .filter(name => fs.statSync(path.join(FIXTURES_PATH, name)).isDirectory())
  .sort()

for (const testId of testIds) {
  test(testId, t => {
    const dir = path.join(FIXTURES_PATH, testId)
    const template = require(path.join(dir, 'template.json'))
    const data = require(path.join(dir, 'data.json'))
    const result = render(template, data)
    t.snapshot(result)
  })
}
