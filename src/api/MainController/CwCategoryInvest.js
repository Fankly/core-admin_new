export default class CwCategoryInvest {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCategoryInvest/list', 'post', params, axiosOption, httpOption)
  }
  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCategoryInvest/add', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCategoryInvest/view', 'get', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCategoryInvest/update', 'post', params, axiosOption, httpOption)
  }
  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCategoryInvest/delete', 'post', params, axiosOption, httpOption)
  }
}
