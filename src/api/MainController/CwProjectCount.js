export default class CwProjectCount {
  static riskCount(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCount/riskCount', 'post', params, axiosOption, httpOption)
  }
  static count(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCount/count', 'post', params, axiosOption, httpOption)
  }
  static analyseReview(sender, params, axiosOption, httpOption) {
    return sender.doUrl('/admin/app/cwProjectCount/analyseReview', 'post', params, axiosOption, httpOption)
  }
}
