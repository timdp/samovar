const expressions = require('expressions-js')

const CONTROL_CHAR = '_'
const EXTEND = '++'
const REPLACE = '<-'

const reTemplateString = /\${([^}]+)}/g

const evaluateExpression = (expr, data) => expressions.parse(expr).call(data)

const interpolateString = (str, data) =>
  str.replace(reTemplateString, (m0, m1) => evaluateExpression(m1, data))

const controls = {}

controls.map = (arg, {as, to}, data) => {
  const arr = (typeof arg === 'string')
    ? evaluateExpression(arg, data)
    : convert(arg, data)
  return [
    true,
    arr.map((el) => {
      const newData = Object.assign({}, data, {_: el})
      if (as != null) {
        newData[as] = el
      }
      return convert(to, newData)
    })
  ]
}

controls.filter = (arg, {where}, data) => {
  const arr = (typeof arg === 'string')
    ? evaluateExpression(arg, data)
    : convert(arg, data)
  return [
    true,
    arr.filter(
      (el) => evaluateExpression(where, Object.assign({}, data, {_: el})))
  ]
}

controls.repeat = (arg, {body}, data) => {
  const times = (typeof arg === 'string')
    ? evaluateExpression(arg, data)
    : arg
  return [
    true,
    Array.apply(null, {length: times})
      .map((_, i) => convert(body, Object.assign({}, data, {_: i})))
  ]
}

controls.if = (arg, control, data) => {
  const cond = evaluateExpression(arg, data)
  return [
    false,
    convert(cond ? control.then : control.else, data)
  ]
}

const isControlKey = (key) =>
  (key.length > 3 && key.startsWith(CONTROL_CHAR) && key.endsWith(CONTROL_CHAR))

const convertControl = (control, data) => {
  const key = Object.keys(control).find(isControlKey)
  if (key == null) {
    throw new Error(`Invalid control structure: ${JSON.stringify(control)}`)
  }
  const arg = control[key]
  const id = key.substring(1, key.length - 1)
  return controls[id](arg, control, data)
}

const getMode = (obj) =>
  (obj[EXTEND] != null) ? EXTEND : (obj[REPLACE] != null) ? REPLACE : null

const convert = (obj, data) => {
  const type = Array.isArray(obj) ? 'array' : typeof obj
  if (type === 'string') {
    return interpolateString(obj, data)
  }
  if (type === 'array') {
    const mapped = obj.map((el, i) => {
      const mode = getMode(el)
      if (mode === EXTEND) {
        const [isList, result] = convertControl(el[mode], data)
        return isList ? result : [result]
      } else {
        return [convert(el, Object.assign({}, data, {_: i}))]
      }
    })
    return [].concat(...mapped)
  }
  if (type !== 'object' || obj == null) {
    return obj
  }
  const mode = getMode(obj)
  let result, keys
  if (mode === REPLACE) {
    const [, result] = convertControl(obj[mode], data)
    return result
  } else if (mode === EXTEND) {
    result = {}
    const [isList, controlResult] = convertControl(obj[mode], data)
    if (isList) {
      Object.assign(result, ...controlResult)
    } else {
      Object.assign(result, controlResult)
    }
    keys = Object.keys(obj).filter((key) => key !== mode)
  } else {
    result = {}
    keys = Object.keys(obj)
  }
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
