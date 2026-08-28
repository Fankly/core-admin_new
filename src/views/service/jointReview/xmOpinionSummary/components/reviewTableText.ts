export const EMPTY_TABLE_TEXT = '-'

export const formatReviewTableText = (value: unknown) => {
  if (typeof value === 'undefined' || value === null || value === '') return EMPTY_TABLE_TEXT
  return String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
}
