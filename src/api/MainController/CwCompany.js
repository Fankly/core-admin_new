export default class cwCompany {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCompany/list', 'post', params, axiosOption, httpOption)
  }
  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCompany/add', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCompany/view', 'get', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCompany/update', 'post', params, axiosOption, httpOption)
  }
  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCompany/delete', 'post', params, axiosOption, httpOption)
  }
  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwCompany/deleteBatch', 'post', params, axiosOption, httpOption)
  }
}
