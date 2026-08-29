// 联合会审 mock 汇总入口
//
// 注册顺序有讲究：mockjs 命中"第一个匹配的正则"（按注册先后），
// 且 1.1.0 不支持逐请求透传（URL 命中即拦截）。本模块内各文件的 URL 不重叠，
// 但共用接口（pageExpertReviewInfo / pageXmHistoryReviewRecord / getReviewStage）
// 统一在 expert.ts 注册一次，review.ts 不重复注册。
import './common' // 公共代码字典、组织信息、全局登录链路（按 busicode 收窄）
import './entry' // 入口页：专家信息、评审概览、会议列表
import './expert' // 专家清单页 + 共用接口 + 佐证材料 / 更多意见
import './review' // 线下会审 / 线下会审退回清单页
import './summary' // 项目意见汇总：会议、动态表头、项目意见明细
import './meeting' // 会议管理 CRUD / 待已纳入 / 评审分工 / 组长终评 / 导出模板
import './stats' // 驾驶舱统计 lhhsStat / 应用菜单 LHHSK / 省公司权限
import './flowQuery' // 会审流转情况查询 lhhs/lzqk + 动态查询列
