export default class CwProjectItemDiff {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectItemDiff/list', 'post', params, axiosOption, httpOption)
  }
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectItemDiff/view', 'get', params, axiosOption, httpOption)
  }
}
