export default class CwAuditPrompt {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/list', 'post', params, axiosOption, httpOption)
  }

  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/view', 'get', params, axiosOption, httpOption)
  }

  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/add', 'post', params, axiosOption, httpOption)
  }

  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/update', 'post', params, axiosOption, httpOption)
  }

  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/delete', 'post', params, axiosOption, httpOption)
  }

  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/deleteBatch', 'post', params, axiosOption, httpOption)
  }

  static saveNew(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/saveNew', 'post', params, axiosOption, httpOption)
  }
  static score(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/score', 'post', params, axiosOption, httpOption)
  }
  static historyList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/historyList', 'post', params, axiosOption, httpOption)
  }
  static releaseNew(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/releaseNew', 'post', params, axiosOption, httpOption)
  }
  static deleteList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/deleteList', 'post', params, axiosOption, httpOption)
  }
  static saveEdit(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/saveEdit', 'post', params, axiosOption, httpOption)
  }
  static getActiveVersionBySceneId(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwAuditPrompt/current', 'get', params, axiosOption, httpOption)
  }
}
