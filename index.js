const expressions = require('expressions-js')

const PREFIX = '%'
const EXTEND = '%+'
const REPLACE = '%='

const reTemplateString = /\${([^}]+)}/g

const evaluateExpression = (expr, data) => expressions.parse(expr).call(data)

const interpolateString = (str, data) =>
  str.replace(reTemplateString, (m0, m1) => evaluateExpression(m1, data))

const controls = {}

controls.map = (arg, {as, to}, data) => {
  const arr = (typeof arg === 'string')
    ? evaluateExpression(arg, data)
    : convert(arg, data)
  return arr.map((el) => {
    const newData = Object.assign({}, data, {_: el})
    if (as != null) {
      newData[as] = el
    }
    return convert(to, newData)
  })
}

controls.filter = (arg, {where}, data) => {
  const arr = (typeof arg === 'string')
    ? evaluateExpression(arg, data)
    : convert(arg, data)
  return arr.filter((el) =>
    evaluateExpression(where, Object.assign({}, data, {_: el})))
}

controls.repeat = (arg, {body}, data) => {
  return Array.apply(null, {length: arg})
    .map((_, i) => convert(body, Object.assign({}, data, {_: i})))
}

controls.if = (arg, {then: then_, else: else_}, data) => {
  const cond = evaluateExpression(arg, data)
  return convert(cond ? then_ : else_, data)
}

const convertControl = (control, data) => {
  const key = Object.keys(control)
    .find((key) => key.startsWith(PREFIX))
  if (key == null) {
    throw new Error(`Invalid control structure: ${JSON.stringify(control)}`)
  }
  const arg = control[key]
  const id = key.substr(PREFIX.length)
  return controls[id](arg, control, data)
}

const convert = (obj, data) => {
  const type = Array.isArray(obj) ? 'array' : typeof obj
  if (type === 'string') {
    return interpolateString(obj, data)
  }
  if (type === 'array') {
    return obj.map((el, i) => convert(el, Object.assign({}, data, {_: i})))
  }
  if (type !== 'object' || obj == null) {
    return obj
  }
  const result = {}
  const mode = (obj[EXTEND] != null) ? EXTEND
    : (obj[REPLACE] != null) ? REPLACE
      : null
  if (mode != null) {
    const control = obj[mode]
    const controlResult = convertControl(control, data)
    if (mode === REPLACE) {
      return controlResult
    }
    Object.assign(result, ...controlResult)
  }
  const keys = Object.keys(obj).filter((key) => (key !== mode))
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i]
    const value = obj[key]
    const interpolatedKey = interpolateString(key, data)
    if (!result.hasOwnProperty(interpolatedKey)) {
      result[interpolatedKey] = convert(value, data)
    }
  }
  return result
}

module.exports = convert
