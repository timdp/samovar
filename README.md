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

### Template Strings (`${}` expressions)

You can use ES2015 template string syntax in all keys and string-typed values.
Here's an example:

Template:

```json
{
  "foo": "bar",
  "user${user.id}": {
    "name": "${user.firstName} ${user.lastName}"
  }
}
```

Data:

```json
{
  "user": {
    "id": 42,
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

Output:

```json
{
  "foo": "bar",
  "user42": {
    "name": "John Doe"
  }
}
```

### Two Modes

#### Assignment Mode (the `<-` operator)

In assignment mode, the return value of a control structure is assigned to an
object key. It basically does "put this one thing here".

It's best explained using an example. Let's say you have an array of user
information as data, and you want to produce an array containing just their
names. In JavaScript, you'd probably use the array's `map()` function. Samovar
has a `_map_` control structure which actually calls `map()` under the hood. It
assigns the current array element to the `_` variable, so you can use it in the
return value. Once you have the desired array, you assign it to the `userNames`
key using the `<-` operator.

Template:

```json
{
  "userNames": {
    "<-": {
      "_map_": "users",
      "to": "${_.firstName} ${_.lastName}"
    }
  }
}
```

Data:

```json
{
  "users": [
    {
      "id": 42,
      "firstName": "John",
      "lastName": "Doe"
    },
    {
      "id": 43,
      "firstName": "Jane",
      "lastName": "Doe"
    }
  ]
}
```

Output:

```json
{
  "userNames": [
    "John Doe",
    "Jane Doe"
  ]
}
```

#### Extension Mode (the `++` operator)

Sometimes, you want to inline multiple values into a parent object. For example,
you may want to merge multiple arrays, or assign multiple key-value pairs to an
object defined in the template. That's where extension mode comes in.

Using the same array of users above, you could produce an object that maps a
user's ID to their full name. This time, you'd `_map_` each user to a
single-key object, which maps their ID to their full name. In JavaScript, if you
wanted to merge all those single-key objects into one, you'd use
`Object.assign()` starting from an empty object, and that's precisely what the
`++` operator does.

Template:

```json
{
  "usersById": {
    "++": {
      "_map_": "users",
      "to": {
        "${_.id}": "${_.firstName} ${_.lastName}"
      }
    }
  }
}
```

Data:

```json
{
  "users": [
    {
      "id": 42,
      "firstName": "John",
      "lastName": "Doe"
    },
    {
      "id": 43,
      "firstName": "Jane",
      "lastName": "Doe"
    }
  ]
}
```

Output:

```json
{
  "42": "John Doe",
  "43": "Jane Doe"
}
```

Additionally, you don't _have_ to start from an empty object. Any keys that
exist alongside `++` will get merged into the result.

You can also use `++` with arrays. For example, if you have two arrays of users,
you can easily `_map_` and then concatenate them, as illustrated below. Note
that with arrays, you do have to create an intermediate object that holds the
`++` key, which is flattened into the array. With objects, as shown above, you
can just include `++` into the destination object itself.

Template:

```json
{
  "userNames": [
    {
      "++": {
        "_map_": "users",
        "to": "${_.firstName} ${_.lastName}"
      }
    },
    {
      "++": {
        "_map_": "superusers",
        "to": "${_.firstName} ${_.lastName}"
      }
    }
  ]
}
```

Data:

```json
{
  "users": [
    {
      "id": 42,
      "firstName": "John",
      "lastName": "Doe"
    },
    {
      "id": 43,
      "firstName": "Jane",
      "lastName": "Doe"
    }
  ],
  "superusers": [
    {
      "id": 0,
      "firstName": "Flying",
      "lastName": "Spaghetti Monster"
    }
  ]
}
```

Output:

```json
{
  "userNames": [
    "John Doe",
    "Jane Doe",
    "Flying Spaghetti Monster"
  ]
}
```

### Control Structures

In the examples above, we always used a `_map_` structure. There's more where
that came from.

#### Map

A `_map_` structure models `Array#map()`, mapping each element of an array to
the projection expression defined by the `as` option. You can reference the
current array element as `_` and the current index (zero-based) as `_index`.

Options:

* `_map_`: input array
* `to`: projection expression
* `as`: additional identifier for the current array element
* `index`: additional identifier for the current index

You would mainly use `as` and `index` in nested structures, as each structure
will override the parent's `_` and `index` references.

#### Filter

A `_filter_` structure models `Array#filter()`, only returning array elements
for which the expression given by the `where` option returns a true value.
You can reference the current array element as `_` and the current index
(zero-based) as `_index`.

Options:

* `_filter_`: input array
* `where`: filter expression
* `as`: additional identifier for the current array element
* `index`: additional identifier for the current index

You would mainly use `as` and `index` in nested structures, as each structure
will override the parent's `_` and `_index` references.

#### Repeat

If you just need to repeat an expression a fixed number of times without
providing an array as input, you can use the `_repeat_` structure. Think of it
as shorthand for `_map_` with an array from 0 to the number of iterations minus
one. The `_index` variable references the current index.

Options:

* `_repeat_`: number of iterations
* `body`: projection expression
* `index`: additional identifier for the current index

You would mainly use `index` in nested structures, as each structure will
override the parent's `_index` reference.

#### If

While `_map_`, `_filter`, and `_repeat_` always produce an array, you can use
`_if_` to write conditional structures that result in a scalar value. If the
expression passed to `_if_` results in a true value, the structure will
evaluate to the expression in the `then` option; otherwise, the `else` option
applies.

Options:

* `_if_`: conditional expression
* `then`: result if condition is true
* `else`: result if condition is false

## Deep Dive

To gain a deeper understanding, the tests can also serve as examples. To run
them, clone the repository and run `DEBUG=1 yarn test`. This will render a
series of templates and dump each of them to the console.

Of course, you're also welcome to look at the code and maybe even submit a pull
request for a bug fix or a cool new feature. Thanks!

## Usage with YAML

While YAML isn't supported out of the box, templates can easily be mapped
between JSON and YAML. As a proof of concept, [the demo](demo/cli.js) uses
[JS-YAML](https://www.npmjs.com/package/js-yaml) to read a YAML template,
render it to JSON, and turn that back into YAML.

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
