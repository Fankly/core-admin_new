export default class SysUserController {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/upms/sysUser/list', 'post', params, axiosOption, httpOption)
  }

  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/upms/sysUser/view', 'get', params, axiosOption, httpOption)
  }

  static export(sender, params, fileName) {
    return sender.download('admin/upms/sysUser/export', params, fileName)
  }

  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/upms/sysUser/add', 'post', params, axiosOption, httpOption)
  }

  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/upms/sysUser/update', 'post', params, axiosOption, httpOption)
  }

  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/upms/sysUser/delete', 'post', params, axiosOption, httpOption)
  }

  static validChangePwd(sender, params, axiosOption, httpOption) {
    return sender.doUrl('admin/upms/sysUser/validChangePwd', 'get', params, axiosOption, httpOption)
  }

  static exportExcel(sender, params, fileName) {
    return sender.downloadFileName('admin/upms/sysUser/exportExcel', params, fileName)
  }
}
