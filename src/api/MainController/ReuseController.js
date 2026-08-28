export default class ReuseController {
  static addReuse(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/app/reuse/add', 'post', params, axiosOption, httpOption)
  }
  static reuseList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/app/reuse/list', 'post', params, axiosOption, httpOption)
  }
  static statistics(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/app/reuse/statistics', 'get', params, axiosOption, httpOption)
  }
  static messageList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/app/reuse/messageList', 'get', params, axiosOption, httpOption)
  }
  static messageCount(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/app/reuse/messageCount', 'get', params, axiosOption, httpOption)
  }
}
