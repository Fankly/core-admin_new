export default class CwProjectReserve {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectReserve/list', 'post', params, axiosOption, httpOption)
  }

  static approve(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectReserve/approve', 'post', params, axiosOption, httpOption)
  }

  static exportApply(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectReserve/exportApply', params, fileName)
  }
}
