import stringifyModule from './stringify'
import jsonParse from './parse'
import type { JsonBigintOptions } from './types'

export type { JsonBigintOptions, JsonReviver, JsonReplacer, JsonValue } from './types'

const jsonStringify = stringifyModule.stringify

function jsonBigint(options?: JsonBigintOptions) {
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
