export default class MobileEntryController {
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/mobile/mobileEntry/list', 'post', params, axiosOption, httpOption)
  }

  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/mobile/mobileEntry/view', 'get', params, axiosOption, httpOption)
  }

  static export(sender, params, fileName) {
    return sender.download('/admin/mobile/mobileEntry/export', params, fileName)
  }

  static add(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/mobile/mobileEntry/add', 'post', params, axiosOption, httpOption)
  }

  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/mobile/mobileEntry/update', 'post', params, axiosOption, httpOption)
  }

  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/mobile/mobileEntry/delete', 'post', params, axiosOption, httpOption)
  }

  static uploadImage(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/mobile/mobileEntry/uploadImage', 'post', params, axiosOption, httpOption)
  }

  static downloadImage(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/mobile/mobileEntry/downloadImage', 'post', params, axiosOption, httpOption)
  }
}
