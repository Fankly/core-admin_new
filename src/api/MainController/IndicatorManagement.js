export default class IndicatorManagement {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/indicatorManagement/list', 'post', params, axiosOption, httpOption)
  }
  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/indicatorManagement/add', 'post', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/indicatorManagement/update', 'post', params, axiosOption, httpOption)
  }
  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/indicatorManagement/delete', 'post', params, axiosOption, httpOption)
  }
  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/indicatorManagement/deleteBatch', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/indicatorManagement/view', 'get', params, axiosOption, httpOption)
  }
}
