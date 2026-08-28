export default class CwProjectApply {
  static view(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApply/view', 'get', params, axiosOption, httpOption)
  }
  static detailTb(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApply/detailTb', 'get', params, axiosOption, httpOption)
  }
  static addTb(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApply/addTb', 'post', params, axiosOption, httpOption)
  }
  static updateTb(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApply/updateTb', 'post', params, axiosOption, httpOption)
  }
  static update(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApply/update', 'post', params, axiosOption, httpOption)
  }
  static submit(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApply/submit', 'post', params, axiosOption, httpOption)
  }
  static exportApply(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/exportApply', params, fileName)
  }
  static exportApplyMulti(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/exportApplyMulti', params, fileName)
  }
  static compareAmount(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApply/compareAmount', 'post', params, axiosOption, httpOption)
  }
  static download(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/download', params, fileName)
  }
  static exportApplyMulti2(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/exportApplyMulti2', params, fileName)
  }
  static downloadApplyMulti(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/downloadApplyMulti', params, fileName)
  }
  static exportReviewOpinionMulti(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/exportReviewOpinionMulti', params, fileName)
  }
  static exportReviewOpinion(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/exportReviewOpinion', params, fileName)
  }
  static compareHistoryAmount(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApply/compareHistoryAmount', 'post', params, axiosOption, httpOption)
  }
  static projectExportExecl(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/projectExportExecl', params, fileName)
  }
  static preliminaryExaminationExecl(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/preliminaryExaminationExecl', params, fileName)
  }
  static exportReviewOpinionCount(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/exportReviewOpinionCount', params, fileName)
  }
  static validProject(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectApply/validProject', 'post', params, axiosOption, httpOption)
  }
  static exportProposalDoc(sender, params, fileName) {
    return sender.downloadFileName('/admin/app/cwProjectApply/exportProposalDoc', params, fileName)
  }
}
