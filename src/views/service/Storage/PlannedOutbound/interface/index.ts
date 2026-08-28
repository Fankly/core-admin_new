export interface RowVo {
  amount: number; // 申报金额（万元）
  applyCenter: string; //成本中心
  aqscfylx: string; //安全生产费用类型
  bfbjsfssm: string; //百分比说明
  dydj: string; //电压等级
  ejdw: string; //二级单位
  ejfl: string; //二级分类
  id: string; //会议编码
  jhssnd: string; //计划实施年份
  jryftrbfb: string; //研发投入百分比
  ky: number; //可研（数量）
  pfwj: number; //批复文件（数量）
  protypeId: string;
  protypeName: string; //项目类型
  remark: string; //预算事项说明
  sfaqsc: string; //是否安全生产
  sgkbm: string; //省归口部门
  sjfl: string; //三级分类
  ssbm: string; //实施部门
  ssnr: string; //项目实施内容
  xllx: string; //线路类型
  xmbm: string; //项目编码
  xmjys: number; //项目建议书（数量）
  xmmc: string; //项目名称
  xmssr: string; //项目实施人
  yjdw: string; //一级单位
  yjfl: string; //一级分类
  zdtx: string; //重点投向
  zyfjftrtjfw: string; //研发投入统计范围
  zyqcgbm: string; //预期成果
  zyssxmc: string; //预算事项名称
  flowStatus: string; //工作流状态
}
