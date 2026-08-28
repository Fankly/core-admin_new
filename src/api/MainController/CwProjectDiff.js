export default class CwProjectDiff {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/list', 'post', params, axiosOption, httpOption)
  }
  static sameItemProjectList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/sameItemProjectList', 'post', params, axiosOption, httpOption)
  }

  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/view', 'get', params, axiosOption, httpOption)
  }

  static assistCheck(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/assistCheck', 'get', params, axiosOption, httpOption)
  }

  static assistCheckList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/assistCheckList', 'get', params, axiosOption, httpOption)
  }

  static retryDiff(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/retryDiff', 'post', params, axiosOption, httpOption)
  }

  static getPrompt(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/getPrompt', 'post', params, axiosOption, httpOption)
  }
  static execDiffWithPrompt(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/execDiffWithPrompt', 'post', params, axiosOption, httpOption)
  }
  static retryDiffProject(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/retryDiffProject', 'post', params, axiosOption, httpOption)
  }
  static projectRiskInfo(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiff/projectRiskInfo', 'post', params, axiosOption, httpOption)
  }
}
