import type BigNumber from './bignumber.js'
import type { IObject } from '@/types/interface'

export interface JsonBigintOptions {
  strict?: boolean
  storeAsString?: boolean
  alwaysParseAsBig?: boolean
  useNativeBigInt?: boolean
  protoAction?: 'error' | 'ignore' | 'preserve'
  constructorAction?: 'error' | 'ignore' | 'preserve'
}

export type JsonValue = null | boolean | string | number | bigint | BigNumber | JsonValue[] | IObject<JsonValue>
export type JsonReviver = (this: object, key: string, value: unknown) => unknown
export type JsonReplacer = ((this: object, key: string, value: unknown) => unknown) | ReadonlyArray<string | number> | null
