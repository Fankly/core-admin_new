export const RESERVE_APPROVAL_RETURN_FILTER_STORAGE_PREFIX = 'finance.reserveApproval.returnFilter:'

export function buildReserveApprovalReturnFilterStorageKey(routeFullPath) {
  return `${RESERVE_APPROVAL_RETURN_FILTER_STORAGE_PREFIX}${encodeURIComponent(routeFullPath)}`
}

export function saveReserveApprovalReturnFilter(storage, routeFullPath, formFilter) {
  if (!storage || !routeFullPath) return

  try {
    storage.setItem(buildReserveApprovalReturnFilterStorageKey(routeFullPath), JSON.stringify(clonePlainObject(formFilter)))
  } catch (e) {}
}

export function takeReserveApprovalReturnFilter(storage, routeFullPath) {
  if (!storage || !routeFullPath) return null

  const storageKey = buildReserveApprovalReturnFilterStorageKey(routeFullPath)
  let rawValue = null

  try {
    rawValue = storage.getItem(storageKey)
    storage.removeItem(storageKey)
  } catch (e) {
    return null
  }

  if (rawValue == null) return null

  try {
    const value = JSON.parse(rawValue)
    return isPlainObject(value) ? value : null
  } catch (e) {
    return null
  }
}

function clonePlainObject(value) {
  if (!isPlainObject(value)) return {}
  return JSON.parse(JSON.stringify(value))
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}
