export default class CwProjectAssetDiff {
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectAssetDiff/view', 'get', params, axiosOption, httpOption)
  }
}
