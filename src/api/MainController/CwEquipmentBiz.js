export default class CwEquipmentBiz {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwEquipmentBiz/list', 'post', params, axiosOption, httpOption)
  }

  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwEquipmentBiz/view', 'get', params, axiosOption, httpOption)
  }

  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwEquipmentBiz/add', 'post', params, axiosOption, httpOption)
  }

  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwEquipmentBiz/update', 'post', params, axiosOption, httpOption)
  }

  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwEquipmentBiz/delete', 'post', params, axiosOption, httpOption)
  }
  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwEquipmentBiz/deleteBatch', 'post', params, axiosOption, httpOption)
  }
}
