export default class CwProjectDiffAll {
  // 总体指标
  static stats(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAll/stats', 'get', params, axiosOption, httpOption)
  }
  // 相似组清单
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAll/list', 'post', params, axiosOption, httpOption)
  }

  static approveBack(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAll/approveBack', 'post', params, axiosOption, httpOption)
  }

  // 批量回滚
  static approveMultiBack(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAll/approveMultiBack', 'post', params, axiosOption, httpOption)
  }

  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAll/view', 'get', params, axiosOption, httpOption)
  }

  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAll/add', 'post', params, axiosOption, httpOption)
  }

  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAll/update', 'post', params, axiosOption, httpOption)
  }

  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAll/delete', 'post', params, axiosOption, httpOption)
  }

  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAll/deleteBatch', 'post', params, axiosOption, httpOption)
  }

  // 相似组清单详情
  static itemList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAllItem/list', 'post', params, axiosOption, httpOption)
  }

  // 相似分析详情
  static itemView(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectDiffAllItem/view', 'get', params, axiosOption, httpOption)
  }
}
