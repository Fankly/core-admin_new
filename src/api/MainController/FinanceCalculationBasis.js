export default class FinanceCalculationBasis {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeCalculationBasis/list', 'post', params, axiosOption, httpOption)
  }
  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeCalculationBasis/add', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeCalculationBasis/view', 'get', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeCalculationBasis/update', 'post', params, axiosOption, httpOption)
  }
  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeCalculationBasis/delete', 'post', params, axiosOption, httpOption)
  }
  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeCalculationBasis/deleteBatch', 'post', params, axiosOption, httpOption)
  }
  static download(sender, params, methos) {
    return sender.downloadFileName('/admin/app/financeCalculationBasis/download', params, methos)
  }
  static import(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeCalculationBasis/import', 'post', params, axiosOption, httpOption)
  }
  static downloadTemplate(sender, params, methos) {
    return sender.downloadFileName('/admin/app/financeCalculationBasis/downloadTemplate', params, methos)
  }

  static cwAssetDirectoryCompareList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAssetDirectoryCompare/list', 'post', params, axiosOption, httpOption)
  }
}
