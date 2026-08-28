export default class CwProjectClosureApprove {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectClosureApprove/list', 'post', params, axiosOption, httpOption)
  }

  static approve(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectClosureApprove/approve', 'post', params, axiosOption, httpOption)
  }
}
