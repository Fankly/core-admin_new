import { describe, expect, it } from 'vitest'
import jsonBigint from './index.js'

describe('ESM JSON bigint', () => {
  it('preserves backend long IDs as strings', () => {
    const parser = jsonBigint({ storeAsString: true })
    expect(parser.parse('{"id":9223372036854775807,"total":20}')).toEqual({ id: '9223372036854775807', total: 20 })
  })

  it('round-trips big integers through the default ESM parser and serializer', () => {
    const input = '{"id":9007199254740993}'
    expect(jsonBigint.stringify(jsonBigint.parse(input))).toBe(input)
  })
})
