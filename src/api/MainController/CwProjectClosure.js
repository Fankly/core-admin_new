export default class CwProjectClosure {
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectClosure/view', 'get', params, axiosOption, httpOption)
  }
  static upload(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectClosure/upload', 'post', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectClosure/update', 'post', params, axiosOption, httpOption)
  }
  static submit(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectClosure/submit', 'post', params, axiosOption, httpOption)
  }
  static download(sender, params, methos) {
    return sender.downloadFileName('/admin/app/cwProjectClosure/download', params, methos)
  }
}
