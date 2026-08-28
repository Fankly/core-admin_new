/* eslint-disable */
import stringifyModule from './stringify.js'
import jsonParse from './parse.js'

const jsonStringify = stringifyModule.stringify

function jsonBigint(options) {
  return {
    parse: jsonParse(options),
    stringify: jsonStringify
  }
}

// create the default method members with no options applied for backwards compatibility
jsonBigint.parse = jsonParse()
jsonBigint.stringify = jsonStringify

export const parse = jsonBigint.parse
export const stringify = jsonBigint.stringify
export default jsonBigint
