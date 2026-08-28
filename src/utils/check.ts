// 验证是否为数字
export const isNumber = (rule: any, value: string, callback: (arg0: Error) => void) => {
  const numberReg = /^\d+$|^\d+[.]?\d+$/
  throwError(value, callback, numberReg.test(value), '请输入整数')
}
export const isTwoPlacesNum = (rule: any, value: string, callback: (arg0: Error) => void) => {
  isNumber(rule, value, callback)
  const numberReg = /^(\d+|\d+\.\d{1,2})$/
  throwError(value, callback, numberReg.test(value), '小数位数不应该超过两位')
}
export const isPhone = (rule: any, value: string, callback: (arg0: Error) => void) => {
  throwError(value, callback, /^[1][3,4,5,6,7,8,9][0-9]{9}$/.test(value), '请输入正确的手机号')
}
export const isURL = (rule: any, value: string, callback: (arg0: Error) => void) => {
  throwError(value, callback, /^http[s]?:\/\/.*/.test(value), '请输入正确的URL')
}
export const isEmail = (rule: any, value: string, callback: (arg0: Error) => void) => {
  throwError(value, callback, /^([a-zA-Z0-9._-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,3}){1,2})$/.test(value), '请输入正确的邮箱')
}
export const idNumber = (rule: any, value: string, callback: (arg0: Error) => void) => {
  throwError(value, callback, /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(value), '请输入正确的身份证ID')
}

export const throwError = (
  value: any,
  callback: {
    (arg0: Error): void
    (arg0: Error): void
    (arg0: Error): void
    (arg0: Error): void
    (arg0: Error): void
    (arg0: Error): void
  },
  isNotError: boolean,
  info: string | undefined
) => {
  // console.log("throwError",isError)
  if (value == undefined || value == '') {
    callback(new Error(''))
  } else {
    if (!isNotError) {
      callback(new Error(info))
    } else {
      callback(new Error(''))
    }
  }
}
