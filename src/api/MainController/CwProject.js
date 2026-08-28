export default class CwProject {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/list', 'post', params, axiosOption, httpOption)
  }

  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/view', 'get', params, axiosOption, httpOption)
  }

  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/add', 'post', params, axiosOption, httpOption)
  }

  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/update', 'post', params, axiosOption, httpOption)
  }

  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/delete', 'post', params, axiosOption, httpOption)
  }
  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/deleteBatch', 'post', params, axiosOption, httpOption)
  }
  static reserveStatus(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/reserveStatus', 'post', params, axiosOption, httpOption)
  }
  static categorys(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/categorys', 'get', params, axiosOption, httpOption)
  }
  static exportTemplate(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProject/exportTemplate', params, fileName)
  }
  static approvalLog(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/approvalLog', 'post', params, axiosOption, httpOption)
  }
  static cwProjectNameList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectNamesDiffData/list', 'post', params, axiosOption, httpOption)
  }
  static cwProjectNecessityView(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectNecessity/view', 'get', params, axiosOption, httpOption)
  }
  static submitBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/submitBatch', 'post', params, axiosOption, httpOption)
  }
  static changeBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/changeBatch', 'post', params, axiosOption, httpOption)
  }
  static cwProjectThreeOneDiffView(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectThreeOneDiff/view', 'get', params, axiosOption, httpOption)
  }
  static promptCaseList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProject/promptCaseList', 'post', params, axiosOption, httpOption)
  }
}
