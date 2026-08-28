export default class Category {
  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/category/add', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/category/view', 'get', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/category/update', 'post', params, axiosOption, httpOption)
  }
  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/category/delete', 'post', params, axiosOption, httpOption)
  }
  static copy(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/category/copy', 'post', params, axiosOption, httpOption)
  }
  static syncDept(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/category/syncDept', 'post', params, axiosOption, httpOption)
  }
  static categorysTree(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/category/categorysTree', 'get', params, axiosOption, httpOption)
  }
}
