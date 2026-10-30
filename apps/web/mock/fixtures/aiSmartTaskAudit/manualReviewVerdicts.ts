/**
 * 按审核要点 detailId 配置人工复核签章；未配置的要点保持未复核（不盖章）。
 *
 * 为什么这样配：
 * - 「人工复核」按钮只在 AI 结论为 **不通过(0) / 待复核(2)** 的要点上出现，
 *   签章又挂在按钮正下方，因此这里只给这两类要点配数据，保证「按钮 + 章」成对出现。
 * - 经济性 / 必要性 / 合规性三个分类都配了样例，切换分类页签同样能看到章。
 *
 * 字段口径与线上 listRuleReview 一致（详见 src/api/ai/smartTaskAudit/index.ts 的 RuleReviewPoint）：
 * - rgReviewOpinion：0 不通过 / 1 通过（前端签章以码值为准）
 * - rgReviewOpinionName：码值缺失时的兜底判据，必须**精确**等于「通过」或「不通过」
 * - rgReviewConclude：人工填写的复核结论
 *
 * 一个要点只会有一条复核记录，所以每条配置只对应**一枚**章。
 *
 * 键名规则：createRule 生成的要点 detailId 为 `${规则detailId}-point-${序号}`（序号从 1 开始）；
 * 直接复用真实返回样例的规则（createSuppliedRule / 附件完整性检查）则使用样例自己的 detailId。
 */
export interface MockManualReviewVerdict {
  rgReviewOpinion: '0' | '1'
  rgReviewOpinionName: '通过' | '不通过'
  rgReviewConclude: string
}

export const MANUAL_REVIEW_VERDICTS: Record<string, MockManualReviewVerdict> = {
  /* ---------------- 经济性：价格类规则 ---------------- */

  // 协议库存/国网商城单价对比：两个要点都被判不通过，复核分别通过 / 不通过
  'mock-detail-price-001-point-1': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '已补充询价单与价格论证材料，人工核对差异原因合理，同意通过。'
  },
  'mock-detail-price-001-point-2': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '同规格商品比价口径一致，申报单价偏差仍超出阈值，复核不通过。'
  },
  // 规格不唯一、待复核：两个要点人工复核均通过
  'mock-detail-price-002-point-1': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '已补充频段与接口形式，商城可唯一匹配同规格商品，人工确认后通过。'
  },
  'mock-detail-price-002-point-2': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '已补充通信模块频段与接口信息，人工确认历史成交商品规格一致，同意通过。'
  },
  // 历史成交价异常上浮：两个要点复核均维持不通过
  'mock-detail-price-004-point-1': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '近三年成交均价趋势复核无误，申报单价上浮幅度仍显著偏离趋势线，复核不通过。'
  },
  'mock-detail-price-004-point-2': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '补充材料中仍未见原材料、运输或技术规范升级的成本依据，复核不通过。'
  },
  // 单位换算口径待复核：业务确认换算系数后复核通过
  'mock-detail-price-006-point-2': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '技术规范已载明 1 组 = 2 件单体，换算系数可追溯，按新口径重算后通过。'
  },

  /* ---------------- 必要性 ---------------- */

  // 真实返回样例「预期成效检查」：规则级待复核，直接复用样例 detailId 作为要点键
  '2102948418046570516': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '效益指标缺少量化测算依据，人工复核维持不通过，需补充量化说明后重新申报。'
  },
  // 建设规模与投资金额匹配性：两个要点都不通过，复核一通过一不通过
  'mock-detail-info-002-point-1': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '补充的工程量测算说明与本地区同类项目口径不一致，复核不通过。'
  },
  'mock-detail-info-002-point-2': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '已补充工程量测算依据并经业务确认，同意通过。'
  },
  // 历史项目相似性分析：待复核，人工确认差异维度后通过
  'mock-detail-info-30005-point-1': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '相似项目差异集中在建设规模维度，已核对属合理范围，人工复核通过。'
  },

  /* ---------------- 合规性 ---------------- */

  // 申报内容完整性检查（真实返回样例，规则内只有一个要点）：AI 不通过，人工复核后通过
  '2102948418046570510': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '缺失附件已补齐，人工核对申报内容完整，同意通过。'
  },
  // 附件版本一致性：待复核，人工确认最终有效版本后通过
  'mock-detail-document-002-point-1': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '已确认可研报告为最终有效版本，版本号与估算书一致，复核通过。'
  },
  // 前置审批资料完整性：初设批复待复核，人工确认可先行申报后通过
  'mock-detail-compliance-002-point-2': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '初设批复流转中，按管理规定允许先行申报，人工复核通过。'
  },
  // 建议书与估算书一致性：工作内容一致性待复核，人工核对后不通过
  'mock-detail-compliance-cya001-point-2': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '估算书漏列终端与主站联调消缺工作内容，人工复核维持不通过。'
  },

  /*
   * ---------------- 规则级键（联合会审「AI审核意见」列表用） ----------------
   *
   * 联合会审的 AiAuditOpinion 调 listRuleReview 时**不带 categoryRuleId**（只带
   * taskId + reviewOpinions），mock 在这种情况下按规则下发，行上的 detailId 是**规则**的
   * detailId，不是上面那些 `-point-N` 的要点 detailId。
   * 因此这里再配一份规则级键，保证专家预审 / 线下评审 / 线下退回评审三页的
   * AI审核意见列表同样能在「人工复核」下方看到章。
   */

  // 规则级键：专家预审 / 线下评审 / 线下退回评审三页的 AI审核意见列表按规则级 detailId 取数
  'mock-detail-price-001': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '两个要点均已补充依据，规则整体复核通过。'
  },
  'mock-detail-price-002': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '规格与历史成交口径已补充，人工复核通过。'
  },
  'mock-detail-price-004': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '价格上浮缺少成本依据，人工复核维持不通过。'
  },
  'mock-detail-price-006': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '换算系数已在技术规范中载明，人工复核通过。'
  },
  // 真实返回样例「预期成效检查」：规则级 detailId 即样例自身的 rgs 键
  'mock-category-2098473010999132161': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '效益指标缺少量化测算依据，人工复核维持不通过。'
  },
  'mock-detail-info-002': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '工程量测算说明口径不一致，人工复核维持不通过。'
  },
  'mock-detail-info-30005': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '差异集中在建设规模维度，属合理范围，人工复核通过。'
  },
  'mock-detail-compliance-002': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '初设批复流转中，按管理规定允许先行申报，人工复核通过。'
  },
  // 申报内容完整性检查（规则级 detailId，与上面两个要点级键并存）
  'mock-detail-document-001': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '缺失附件已补齐，人工核对申报内容完整，同意通过。'
  },
  'mock-detail-document-002': {
    rgReviewOpinion: '1',
    rgReviewOpinionName: '通过',
    rgReviewConclude: '已确认可研报告为最终有效版本，复核通过。'
  },
  'mock-detail-compliance-cya001': {
    rgReviewOpinion: '0',
    rgReviewOpinionName: '不通过',
    rgReviewConclude: '估算书漏列联调消缺工作内容，人工复核维持不通过。'
  }
}
