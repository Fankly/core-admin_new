export default class CwProjectDiffAllJobs {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAllJobs/list', 'post', params, axiosOption, httpOption)
  }

  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAllJobs/view', 'get', params, axiosOption, httpOption)
  }

  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAllJobs/add', 'post', params, axiosOption, httpOption)
  }

  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAllJobs/update', 'post', params, axiosOption, httpOption)
  }

  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAllJobs/delete', 'post', params, axiosOption, httpOption)
  }

  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAllJobs/deleteBatch', 'post', params, axiosOption, httpOption)
  }
}
