/*  */ export default class CwProjectStats {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectStats/list', 'post', params, axiosOption, httpOption)
  }
  static approvalLog(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectStats/approvalLog', 'post', params, axiosOption, httpOption)
  }
  static stats(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectStats/stats', 'post', params, axiosOption, httpOption)
  }
  static export(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectStats/export', params, fileName)
  }
  static statsSubtract(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectStats/statsSubtract', 'post', params, axiosOption, httpOption)
  }
}
