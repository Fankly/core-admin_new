import Mock from 'mockjs'
import './xhr'

// 全局响应延迟，模拟真实网络（可按需调整）
Mock.setup({ timeout: '200-600' })

// 各业务模块 mock，新增模块后在此 import 注册
import './modules/aiDocument'
import './modules/aiChat'
import './modules/budgetChanges'
import './modules/aiSmartTaskAudit'
import './modules/materialPriceLibrary'
import './modules/aiSmartReviewHome'
import './modules/aiAuditInuseRange'
import './modules/outsourceAdaptList'
import './modules/ownRealEstate'
import './modules/assetDetails'
import './modules/annualKeyTask'
import './modules/xmysylb'
import './modules/jointReview'
import './modules/aiReviewWorkBench'
import './modules/provinceTarget'
import './modules/goalValueVersion'
import './modules/goalValueVersionDetail'
import './modules/matterBasic'
// 集中修改需复用 budgetChanges(单位/分类联动)、aiSmartTaskAudit(修改弹窗动态表单 fixture),
// 故放在这两个模块之后注册
import './modules/centralizedModification'
// 需求明细查询复用 centralizedModification 的查询列/表头/列表数据，故放在其之后注册
import './modules/requireDetailSearch'
// 需求录入「设备资产信息」步骤：需先于 requirementEntry 注册，才能覆盖它的 getTabColumns 步骤配置（mockjs 取首个匹配）
import './modules/requirementAssetDetails'
import './modules/requirementEntry'
import './modules/overview'
import './modules/versionNotice'
// 用户手册（首页卡片 + 顶栏入口，menuUrl=/mainPage）：接口正则均按 mainPage/menuId/uuid 前缀收窄，注册顺序无关
import './modules/userManual'
// 菜单收藏（侧栏星标）：toggle / list 两个接口，无路径参数收窄冲突
import './modules/menuFavorite'
// 外壳用户资料（/sys/getUserInfo）：顶栏头像旁的姓名与基准组织，菜单仍走真实后端
import './modules/userProfile'
// 预算统计配置页的 getNodeTree 收窄规则需先于宽泛的项目类别树注册（mockjs 按注册顺序取首个匹配）
import './modules/budgetStatisticsConfig'
// 预算执行分析（yszxylb / customYapProjectExecutionByType）依赖 budgetChanges 扩充的公共代码与参数，需在其后注册
import './modules/budgetExecutionAnalysis'
// 分析报告（FxbgModal）文案：yszxfx / yszxfxtb / yszxfxhb / yszxfxbg 前缀各自收窄，注册顺序无关
import './modules/statisticsReport'
// 业务工作台的 getAppMenuData 由 aiReviewWorkBench 合并返回（该模块已 import 本模块，此处显式注册仅为可发现性）
import './modules/businessWorkbench'
// 工作流待办（queryWorkItemsByEmployee）：首页待办卡片 / 待办事宜页共用，URL 无参数可收窄，dev 下联合会审徽标会读到同一份数据
import './modules/workflowTodo'
