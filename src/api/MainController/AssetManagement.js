export default class AssetManagement {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/assetManagement/list', 'post', params, axiosOption, httpOption)
  }
  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/assetManagement/add', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/assetManagement/view', 'get', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/assetManagement/update', 'post', params, axiosOption, httpOption)
  }
  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/assetManagement/delete', 'post', params, axiosOption, httpOption)
  }
  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/assetManagement/deleteBatch', 'post', params, axiosOption, httpOption)
  }
  static exportTemplate(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/assetManagement/exportTemplate', params, fileName)
  }
  static searchPull(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/assetManagement/searchPull', 'post', params, axiosOption, httpOption)
  }
}
