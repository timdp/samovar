const expressions = require('expressions-js')

const CONTROL_CHAR = '_'
const EXTEND = '++'
const REPLACE = '<-'

const reTemplateString = /\${([^}]+)}/g

const evaluateExpression = (expr, data) => expressions.parse(expr).call(data)

const interpolateString = (str, data) =>
  str.replace(reTemplateString, (m0, m1) => evaluateExpression(m1, data))

const augmentData = (data, current, index, currentRef, indexRef) =>
  Object.assign({},
    data,
    { _: current, _index: index },
    (currentRef != null) ? { [currentRef]: current } : null,
    (indexRef != null) ? { [indexRef]: index } : null)

const controls = {}

controls.map = (arg, { as, index, to }, data) => {
  const arr = (typeof arg === 'string')
    ? evaluateExpression(arg, data)
    : render(arg, data)
  return [
    true,
    arr.map((el, idx) =>
      render(to, augmentData(data, el, idx, as, index)))
  ]
}

controls.filter = (arg, { as, index, where }, data) => {
  const arr = (typeof arg === 'string')
    ? evaluateExpression(arg, data)
    : render(arg, data)
  return [
    true,
    arr.filter((el, idx) =>
      evaluateExpression(where, augmentData(data, el, idx, as, index)))
  ]
}

controls.repeat = (arg, { body }, data) => {
  const times = (typeof arg === 'string')
    ? evaluateExpression(arg, data)
    : arg
  return [
    true,
    Array.apply(null, { length: times })
      .map((_, i) => render(body, Object.assign({}, data, { _: i })))
  ]
}

controls.if = (arg, control, data) => {
  const cond = evaluateExpression(arg, data)
  return [
    false,
    render(cond ? control.then : control.else, data)
  ]
}

const isControlKey = key =>
  (key.length > 2 && key.startsWith(CONTROL_CHAR) && key.endsWith(CONTROL_CHAR))

const renderControl = (control, data) => {
  const key = Object.keys(control).find(isControlKey)
  const arg = control[key]
  const id = key.substring(1, key.length - 1)
  return controls[id](arg, control, data)
}

const getMode = obj =>
  (obj == null || typeof obj !== 'object') ? null
    : (obj[EXTEND] != null) ? EXTEND
      : (obj[REPLACE] != null) ? REPLACE
        : null

const render = (obj, data) => {
  const type = Array.isArray(obj) ? 'array' : typeof obj
  if (type === 'string') {
    return interpolateString(obj, data)
  }
  if (type === 'array') {
    const mapped = obj.map((el, i) => {
      const mode = getMode(el)
      if (mode === EXTEND) {
        const [isList, result] = renderControl(el[mode], data)
        return isList ? result : [result]
      } else {
        return [render(el, Object.assign({}, data, { _: i }))]
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
    const [, result] = renderControl(obj[mode], data)
    return result
  } else if (mode === EXTEND) {
    result = {}
    const [isList, controlResult] = renderControl(obj[mode], data)
    if (isList) {
      Object.assign(result, ...controlResult)
    } else {
      Object.assign(result, controlResult)
    }
    keys = Object.keys(obj).filter(key => key !== mode)
  } else {
    result = {}
    keys = Object.keys(obj)
  }
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i]
    const value = obj[key]
    const interpolatedKey = interpolateString(key, data)
    if (!result.hasOwnProperty(interpolatedKey)) {
      result[interpolatedKey] = render(value, data)
    }
  }
  return result
}

module.exports = render
