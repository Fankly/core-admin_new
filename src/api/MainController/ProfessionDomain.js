export default class CwNegativeDomain {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegativeDomain/list', 'post', params, axiosOption, httpOption)
  }
  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegativeDomain/add', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegativeDomain/view', 'get', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegativeDomain/update', 'post', params, axiosOption, httpOption)
  }
  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegativeDomain/delete', 'post', params, axiosOption, httpOption)
  }
  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegativeDomain/deleteBatch', 'post', params, axiosOption, httpOption)
  }
}
