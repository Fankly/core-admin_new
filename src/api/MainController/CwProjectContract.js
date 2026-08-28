export default class cwProjectContract {
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContract/view', 'get', params, axiosOption, httpOption)
  }
  static upload(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContract/upload', 'post', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContract/update', 'post', params, axiosOption, httpOption)
  }
  static submit(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContract/submit', 'post', params, axiosOption, httpOption)
  }
  static preNext(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContract/preNext', 'post', params, axiosOption, httpOption)
  }
  static download(sender, params, methos) {
    return sender.downloadFileName('/admin/app/cwProjectContract/download', params, methos)
  }
  static down(sender, params, methos) {
    return sender.downloadFileName('/admin/app/cwProjectContract/down', params, methos)
  }

  static delete(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContract/delete', 'post', params, axiosOption, httpOption)
  }
  static deleteBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContract/deleteBatch', 'post', params, axiosOption, httpOption)
  }
  static list(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContract/list', 'post', params, axiosOption, httpOption)
  }

  static viewDiff(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContractDiff/view', 'get', params, axiosOption, httpOption)
  }
  static review(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContractDiff/review', 'post', params, axiosOption, httpOption)
  }
  static approve(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectContractDiff/approve', 'post', params, axiosOption, httpOption)
  }
}
