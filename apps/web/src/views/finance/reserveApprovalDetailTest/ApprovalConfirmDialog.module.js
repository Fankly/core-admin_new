export const AmountPattern = {
  pattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  message: '请输入有效的金额（非负，最多两位小数）',
  trigger: 'blur'
}
export const Subtract = (a, b) => {
  const multiplier = Math.pow(10, Math.max(a.toString().split('.')[1]?.length || 0, b.toString().split('.')[1]?.length || 0))
  return (a * multiplier - b * multiplier) / multiplier
}
