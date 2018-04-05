const convert = require('../')

const template = require('./template.json')
const data = require('./data.json')

const result = convert(template, data)

console.log(JSON.stringify(result, null, 2))
