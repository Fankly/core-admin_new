import { describe, expect, it } from 'vitest'
import jsonBigint from './index'

describe('ESM JSON bigint', () => {
  it('preserves backend long IDs as strings', () => {
    const parser = jsonBigint({ storeAsString: true })
    expect(parser.parse('{"id":9223372036854775807,"total":20}')).toEqual({ id: '9223372036854775807', total: 20 })
  })

  it('round-trips big integers through the default ESM parser and serializer', () => {
    const input = '{"id":9007199254740993}'
    expect(jsonBigint.stringify(jsonBigint.parse(input))).toBe(input)
  })

  it('handles nested values, escaped strings and signed exponents', () => {
    const input = '{"items":[[],{},null,true,false,"line\\n\\u4e2d",-1.25e+2,3e-2]}'
    expect(jsonBigint.parse(input)).toEqual(JSON.parse(input))
    expect(JSON.parse(jsonBigint.stringify(jsonBigint.parse(input))!)).toEqual(JSON.parse(input))
  })

  it('preserves native BigInt and alwaysParseAsBig options', () => {
    const parser = jsonBigint({ useNativeBigInt: true, alwaysParseAsBig: true })
    expect(parser.parse('{"id":9223372036854775807,"total":20}')).toEqual({ id: 9223372036854775807n, total: 20n })
    expect(parser.stringify(parser.parse('[20,9223372036854775807]'))).toBe('[20,9223372036854775807]')
  })

  it('retains reviver traversal and deletion', () => {
    expect(
      jsonBigint.parse('{"keep":1,"drop":2,"items":[3]}', (key, value) => {
        if (key === 'drop') return undefined
        return typeof value === 'number' ? value * 2 : value
      })
    ).toEqual({ keep: 2, items: [6] })
  })

  it('retains replacer, toJSON and indentation behavior', () => {
    const value = { date: new Date('2026-01-01T00:00:00Z'), keep: 1, drop: 2 }
    expect(jsonBigint.stringify(value, ['date', 'keep'], 2)).toBe(JSON.stringify(value, ['date', 'keep'], 2))
    const replacer = (key: string, value: unknown) => (key === 'drop' ? undefined : value)
    expect(jsonBigint.stringify(value, replacer)).toBe(JSON.stringify(value, replacer))
    expect(jsonBigint.stringify([undefined, Infinity, NaN])).toBe('[null,null,null]')
    expect(jsonBigint.stringify(undefined)).toBeUndefined()
  })

  it('rejects malformed JSON, duplicate keys in strict mode and prototype properties', () => {
    expect(() => jsonBigint.parse('{"id":}')).toThrow()
    expect(() => jsonBigint({ strict: true }).parse('{"id":1,"id":2}')).toThrow()
    expect(() => jsonBigint.parse('{"__proto__":{}}')).toThrow()
    expect(() => jsonBigint.parse('{"constructor":{}}')).toThrow()
    expect(jsonBigint({ protoAction: 'ignore', constructorAction: 'ignore' }).parse('{"__proto__":{},"constructor":{},"id":1}')).toEqual({ id: 1 })
  })
})
