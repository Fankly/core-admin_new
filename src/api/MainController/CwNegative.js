export default class CwNegative {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegative/list', 'post', params, axiosOption, httpOption)
  }

  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegative/add', 'post', params, axiosOption, httpOption)
  }

  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegative/view', 'get', params, axiosOption, httpOption)
  }

  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegative/update', 'post', params, axiosOption, httpOption)
  }

  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegative/delete', 'post', params, axiosOption, httpOption)
  }

  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegative/deleteBatch', 'post', params, axiosOption, httpOption)
  }

  static importExcel(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwNegative/importExcel', 'post', params, axiosOption, httpOption)
  }
}
