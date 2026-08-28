/*  */ export default class CwProjectCompanyDiff {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCompanyDiff/list', 'post', params, axiosOption, httpOption)
  }
  static approvalLog(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCompanyDiff/approvalLog', 'post', params, axiosOption, httpOption)
  }
  static stats(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCompanyDiff/stats', 'post', params, axiosOption, httpOption)
  }
  static export(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectCompanyDiff/export', params, fileName)
  }
  static statsSubtract(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCompanyDiff/statsSubtract', 'post', params, axiosOption, httpOption)
  }
  static getStatistics(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCompanyDiff/getStatistics', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCompanyDiff/view', 'get', params, axiosOption, httpOption)
  }

  static preNext(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCompanyDiff/preNext', 'post', params, axiosOption, httpOption)
  }
}
