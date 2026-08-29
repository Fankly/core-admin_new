import { ElMessage } from 'element-plus'

// 金额的验证规则（金额小数点前10位，小数点后2位
export function checkFloatTwo(rule, value, callback) {
  const reg = /^[0-9]{1,10}([.][0-9]{1,2})?$/
  if (!reg.test(value) && value) {
    callback(new Error('请输入正确金额，金额最多精确到小数点前10位,金额最多精确到小数点后2位！'))
  } else {
    callback()
  }
}
// 金额的验证规则（金额小数点前8位，小数点后6位）
export function CheckMoneyres(rule, value, callback) {
  const reg = /^[0-9]{1,8}([.][0-9]{1,6})?$/
  if (!reg.test(value) && value) {
    callback(new Error('请输入正确金额，金额最多精确到小数点前8位,金额最多精确到小数点后6位！'))
  } else {
    callback()
  }
}
// 金额的验证规则
export function checkMoney(rule, value, callback) {
  const reg = /((^[1-9]\d*)|^0)(\.\d{1,2}){0,1}$/
  if (!reg.test(value) && value) {
    callback(new Error('只允许输入数字和小数,小数点后最多只能输入2位小数！'))
  } else {
    callback()
  }
}
// 百分比验证
export function checkPercentage(rule, value, callback) {
  // export function checkNumber(rule, value, callback) {
  const reg = /^\d\.([1-9]{1,2}|[0-9][1-9])$|^[1-9]\d{0,1}(\.\d{1,2}){0,1}$|^100(\.0{1,2}){0,1}$/
  if (!reg.test(value) && value) {
    callback(new Error('只能输入小数点前两位，小数点后两位数字！'))
  } else {
    if (value.includes('.') && value.indexOf('.') === value.length - 1) {
      callback(new Error('只能输入数字！'))
    } else {
      callback()
    }
  }
}

// 会议平均分（大于0小于等于100，最多小数点后两位
export function checkHypjf(rule, value, callback) {
  const reg = /^\d\.([1-9]{1,2}|[0-9][1-9])$|^[1-9]\d{0,1}(\.\d{1,2}){0,1}$|^100(\.0{1,2}){0,1}$/
  if (!reg.test(value) && value) {
    callback(new Error('请输入正确项目平均分，平均分大于0小于等于100，平均分最多精确到小数点后2位！'))
  } else {
    callback()
  }
}
// 大于0小于100的正整数，不能输入小数
export function checkProgress(rule, value, callback) {
  const reg = /^((?!0)\d{1,2}|100)$/
  if (!value.match(reg)) {
    callback(new Error('请输入大于0小于等于100的整数'))
  } else {
    callback()
  }
}
// 大于0小于100的数，可以输入小数（小数点后两位），不能是01
export function checkProgressDecimal(rule, value, callback) {
  const reg = /^(?:0|[1-9][0-9]?|100)(\.[0-9]{0,2})?$/
  if (!value.match(reg)) {
    callback(new Error('请输入大于0小于等于100的整数或小数，精确到小数点后2位！'))
  } else {
    callback()
  }
}

export function isValidPositiveInteger(rule, value, callback) {
  // const reg = /^\d+$/
  const reg = /^([1-9]\d*|0)?$/
  if (!value.match(reg)) {
    callback(new Error('请输入大于等于0的正整数！'))
  } else {
    callback()
  }
}

