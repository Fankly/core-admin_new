export default class CwProjectApprove {
  static financeList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFinance/list', 'post', params, axiosOption, httpOption)
  }
  static financeApprove(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFinance/approve', 'post', params, axiosOption, httpOption)
  }
  static deptList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveDept/list', 'post', params, axiosOption, httpOption)
  }
  static deptApprove(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveDept/approve', 'post', params, axiosOption, httpOption)
  }
  static financeView(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFinance/view', 'get', params, axiosOption, httpOption)
  }
  static deptView(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveDept/view', 'get', params, axiosOption, httpOption)
  }
  static updateConfig(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFinance/updateConfig', 'post', params, axiosOption, httpOption)
  }
  static viewConfig(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFinance/viewConfig', 'get', params, axiosOption, httpOption)
  }
  static updateDiffConfig(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFinance/updateDiffConfig', 'post', params, axiosOption, httpOption)
  }
  static viewDiffConfig(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFinance/viewDiffConfig', 'get', params, axiosOption, httpOption)
  }
  static deptPreNext(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveDept/preNext', 'post', params, axiosOption, httpOption)
  }
  static financePreNext(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFinance/preNext', 'post', params, axiosOption, httpOption)
  }
  static financeApproveBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFinance/approveBatch', 'post', params, axiosOption, httpOption)
  }
  static deptApproveBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveDept/approveBatch', 'post', params, axiosOption, httpOption)
  }
  static jysList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveJys/list', 'post', params, axiosOption, httpOption)
  }
  static jysApprove(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveJys/approve', 'post', params, axiosOption, httpOption)
  }
  static jysView(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveJys/view', 'get', params, axiosOption, httpOption)
  }
  static jysPreNext(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveJys/preNext', 'post', params, axiosOption, httpOption)
  }
  static fzbList(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFzb/list', 'post', params, axiosOption, httpOption)
  }
  static fzbApprove(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFzb/approve', 'post', params, axiosOption, httpOption)
  }
  static fzbView(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFzb/view', 'get', params, axiosOption, httpOption)
  }
  static fzbPreNext(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFzb/preNext', 'post', params, axiosOption, httpOption)
  }
  static jysApproveBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveJys/approveBatch', 'post', params, axiosOption, httpOption)
  }
  static fzbApproveBatch(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApproveFzb/approveBatch', 'post', params, axiosOption, httpOption)
  }
}
