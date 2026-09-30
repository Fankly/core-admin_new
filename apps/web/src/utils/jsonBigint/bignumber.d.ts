// Type surface used by the bundled bignumber.js v9.1.2 implementation.
declare class BigNumber {
  constructor(value: string | number)
  toJSON(): string
  static isBigNumber(value: unknown): value is BigNumber
}

export { BigNumber }
export default BigNumber
