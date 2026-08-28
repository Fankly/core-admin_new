export default class FinanceReserveNotice {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeReserveNotice/list', 'post', params, axiosOption, httpOption)
  }
  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeReserveNotice/add', 'post', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeReserveNotice/update', 'post', params, axiosOption, httpOption)
  }
  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeReserveNotice/delete', 'post', params, axiosOption, httpOption)
  }
  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeReserveNotice/deleteBatch', 'post', params, axiosOption, httpOption)
  }
  static getCwCategoryDict(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeReserveNotice/getCwCategoryDict', 'post', params, axiosOption, httpOption)
  }
  static merge(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeReserveNotice/merge', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeReserveNotice/view', 'get', params, axiosOption, httpOption)
  }
  static yearList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/financeReserveNotice/yearList', 'post', params, axiosOption, httpOption)
  }
}
