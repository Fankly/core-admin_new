// 最多两位小数数字
export const decimal2 = /^((([1-9]\d*)|(\d))(\.\d{1,2})?)$/
// 最多六位小数数字
export const decimal6 = /^((([1-9]\d*)|(\d))(\.\d{1,6})?)$/
// 整数
export const integer = /^(([1-9]\d+)|(\d))$/

enum ruleMap {
  decimal2 = 'decimal2',
  decimal6 = 'decimal6',
  integer = 'integer'
}
const patternMap: {
  [key in ruleMap]: any
} = {
  decimal2: {
    pattern: decimal2,
    message: '只能小数不超过2位的数字'
  },
  decimal6: {
    pattern: decimal6,
    message: '只能小数不超过6位的数字'
  },
  integer: {
    pattern: integer,
    message: '只能输入非负整数'
  }
}
export const patternRules = (map: ruleMap, message?: string, config?: any) => {
  return [
    {
      ...patternMap[map],
      ...(message ? { message } : {}),
      ...config
    }
  ]
}
export const decimal2Rules = (message?: string, config?: any) => {
  return patternRules(ruleMap.decimal2, message, config)
}

export const decimal6Rules = (message?: string, config?: any) => {
  return patternRules(ruleMap.decimal6, message, config)
}

export const integerRules = (message?: string, config?: any) => {
  return patternRules(ruleMap.integer, message, config)
}
