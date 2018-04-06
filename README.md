# Samovar

[![npm](https://img.shields.io/npm/v/samovar.svg)](https://www.npmjs.com/package/samovar) [![Dependencies](https://img.shields.io/david/timdp/samovar.svg)](https://david-dm.org/timdp/samovar) [![Build Status](https://img.shields.io/circleci/project/github/timdp/samovar/master.svg?label=build)](https://circleci.com/gh/timdp/samovar) [![Coverage Status](https://img.shields.io/coveralls/timdp/samovar/master.svg)](https://coveralls.io/r/timdp/samovar) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

A pure-JSON template language and renderer. Also supports YAML.

## Installation

```bash
yarn add samovar
```

## Usage

```js
const render = require('samovar')

const template = require('./template.json')
const data = require('./data.json')

const rendered = render(template, data)

console.log('Rendered: ' + JSON.stringify(rendered, null, 2))
```

## Syntax

Coming soon. For now, please see [the demo directory](demo/) for an example.

## Usage with YAML

While YAML isn't supported out of the box, templates can easily be mapped
between JSON and YAML. As a proof of concept, [the demo](demo/cli.js) uses
[JS-YAML](https://www.npmjs.com/package/js-yaml) to read a YAML template,
render it to JSON, and turn that back into YAML.

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
