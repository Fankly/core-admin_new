export default class SysCommonBizController {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/commonext/bizwidget/list', 'post', params, axiosOption, httpOption)
  }

  static viewByIds(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/commonext/bizwidget/view', 'post', params, axiosOption, httpOption)
  }
}
