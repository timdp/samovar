# Samovar

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
