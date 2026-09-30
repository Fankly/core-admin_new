import { describe, expect, it } from 'vitest'
import {
  checkFloatTwo,
  CheckMoneyres,
  checkMoney,
  checkPercentage,
  checkHypjf,
  checkProgress,
  checkProgressDecimal,
  isValidPositiveInteger
} from './validate'

function validate(validator: typeof checkFloatTwo, value: string | number | null | undefined) {
  const results: Array<Error | undefined> = []
  validator({}, value, (error) => results.push(error))
  expect(results).toHaveLength(1)
  return results[0]
}

describe('TypeScript form validators', () => {
  it.each([
    [checkFloatTwo, '1234567890.12', '12345678901.12'],
    [CheckMoneyres, '12345678.123456', '12345678.1234567'],
    [checkMoney, '123.45', '123.456'],
    [checkPercentage, '100.00', '100.01'],
    [checkHypjf, '0.01', '100.01'],
    [checkProgress, '100', '0'],
    [checkProgressDecimal, '12.34', '01.23'],
    [isValidPositiveInteger, '0', '-1']
  ] as const)('preserves %s validation rules', (validator, valid, invalid) => {
    expect(validate(validator, valid)).toBeUndefined()
    expect(validate(validator, invalid)).toBeInstanceOf(Error)
  })

  it.each([checkFloatTwo, CheckMoneyres, checkMoney, checkPercentage, checkHypjf, checkProgress, checkProgressDecimal, isValidPositiveInteger])(
    'accepts numeric form values in %s',
    (validator) => expect(validate(validator, 25)).toBeUndefined()
  )

  it.each(['', null, undefined])('accepts empty optional percentages without throwing: %s', (value) => {
    expect(validate(checkPercentage, value)).toBeUndefined()
  })

  it.each(['', null, undefined])('rejects empty progress without throwing: %s', (value) => {
    expect(validate(checkProgress, value)).toBeInstanceOf(Error)
  })
})
