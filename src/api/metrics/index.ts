import baseService from "@/service/baseService";

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
  header?: any;
}
interface Params {
  [key: string]: any;
}
export interface ImportOther {
  excelFormData: any;
}
// 指标数据-列表查询
export const xmIndicatorDataPage = (params: Params): Promise<Result> => {
  return baseService.post(`xmIndicatorData/page`, params);
};
// 指标数据-导出
export const xmIndicatorDataExport = (formData: Params): Promise<Result> => {
  return baseService.export(`/xmIndicatorData/export`, formData);
};

//定时任务锁-列表查询
export const processLockList = (): Promise<Result> => {
  return baseService.post(`processLock/list`);
};
//定时任务锁-删除
export const processLockRemove = (id: any): Promise<Result> => {
  return baseService.post(`processLock/remove?id=${id}`);
};
//定时任务锁-保存
export const processLockSave = (params: any): Promise<Result> => {
  return baseService.post(`processLock/save`, params);
};

//定时任务锁-调用
export const processLockInvoke = (id: any): Promise<Result> => {
  return baseService.get(`processLock/invoke?id=${id}`);
};

//菜单帮助配置-菜单树
export const menuList = (): Promise<Result> => {
  return baseService.get(`sys/menu/list?type=0`);
};

//菜单帮助配置-根据菜单ID获取菜单配置
export const getConfigByMenuId = (menuId: any): Promise<Result> => {
  return baseService.get(`sys/menuConfig/getConfigByMenuId?menuId=${menuId}`);
};
//菜单帮助配置-根据菜单ID获取附件列表
export const listFj = (menuId: any): Promise<Result> => {
  return baseService.get(`sys/menuConfig/listFj?menuId=${menuId}`);
};

//菜单帮助配置-保存菜单配置
export const saveConfig = (params: any): Promise<Result> => {
  return baseService.post(`sys/menuConfig/saveConfig`, params);
};
//菜单帮助配置-删除附件
export const deleteFj = (fjId: any): Promise<Result> => {
  return baseService.post(`sys/menuConfig/deleteFj?fjId=${fjId}`);
};

//菜单帮助配置-下载附件
export const downloadFj = (parma: any): Promise<Result> => {
  return baseService.exportGet(
    `sys/menuConfig/downloadFj?fileName=${parma.fileName}&uuid=${parma.uuid}`
  );
};

//菜单帮助配置-发布/取消发布
export const updateConfigStatus = (params: any): Promise<Result> => {
  return baseService.post(`sys/menuConfig/updateConfigStatus`, params);
};
//菜单帮助配置-上传图片
export const uploadAttachOnly = (params: any): Promise<Result> => {
  return baseService.post(`fy/attach/uploadAttachOnly`, params);
};

//预算单位配置-获取配置树
export const getNodeTree = (params: any): Promise<Result> => {
  return baseService.get(`/ysStatDwConfig/getNodeTree?nd=${params.nd}&busiType=${params.busiType}`);
};

//预算单位配置-获取配置树
export const ysStatDwConfigSaveConfig = (params: any): Promise<Result> => {
  return baseService.post(`/ysStatDwConfig/saveConfig`, params);
};

//预算单位配置-获取单位树
export const ysStatDwConfigGetDwTree = (): Promise<Result> => {
  return baseService.post(`/ysStatDwConfig/getDwTree`);
};

//预算单位配置-获取配置列表
export const getConfigList = (params: any): Promise<Result> => {
  return baseService.get(
    `/ysStatDwConfig/getConfigList?nd=${params.nd}&busiType=${params.busiType}&parentId=${params.parentId}`
  );
};

//预算单位配置-获取绑定数据明细
export const getDataDetail = (params: any): Promise<Result> => {
  return baseService.get(`/ysStatDwConfig/getDataDetail?configId=${params.configId}`);
};

//预算单位配置-删除绑定数据明细
export const deleteDataDetail = (params: any): Promise<Result> => {
  return baseService.post(`/ysStatDwConfig/deleteDataDetail?detailIds=${params.detailIds}`);
};

//预算单位配置-删除
export const batchDeleteConfig = (params: any): Promise<Result> => {
  return baseService.post(`/ysStatDwConfig/batchDeleteConfig?configIds=${params.configIds}`);
};

//预算单位配置-复制预算报表统计配置
export const copyStatConfig = (params: any): Promise<Result> => {
  return baseService.post(
    `/ysStatDwConfig/copyStatConfig?sourceNd=${params.sourceNd}&busiType=${params.busiType}&targetNd=${params.targetNd}`
  );
};

//结算率确认-获取临时表数据(statType:1.单位 2.项目类型)
export const getTempData = (params: any): Promise<Result> => {
  return baseService.get(
    `/ysjsltj/getTempData?nd=${params.nd}&yd=${params.yd}&statType=${params.statType}`
  );
};
//结算率确认-同步到临时表(statType:1.单位 2.项目类型)
export const syncToTemp = (params: any): Promise<Result> => {
  return baseService.get(`/ysjsltj/syncToTemp?nd=${params.nd}&yd=${params.yd}`);
};
//结算率确认-更新临时表数据
export const saveTempData = (params: any): Promise<Result> => {
  return baseService.post(`/ysjsltj/saveTempData`, params);
};
//结算率确认-获取导入模板(statType:1.单位 2.项目类型)
export const getImportTemplate = (params: any): Promise<Result> => {
  return baseService.exportGet(
    `/ysjsltj/getImportTemplate?nd=${params.nd}&yd=${params.yd}&statType=${params.statType}`
  );
};
//结算率确认-导入临时表数据(statType:1.单位 2.项目类型)
export const importTempData = (params: any): Promise<Result> => {
  return baseService.post(
    `/ysjsltj/importTempData?nd=${params.nd}&yd=${params.yd}&statType=${params.statType}`,
    params.excelFormData
  );
};

//结算率确认-同步到正式表(statType:1.单位 2.项目类型)
export const syncToOfficial = (params: any): Promise<Result> => {
  return baseService.get(
    `/ysjsltj/syncToOfficial?nd=${params.nd}&yd=${params.yd}&statType=${params.statType}`
  );
};
//结算率确认-获取明细表数据(statType:1.单位 2.项目类型)
export const getDetailData = (params: any): Promise<Result> => {
  return baseService.get(
    `/ysjsltj/getDetailData?nd=${params.nd}&yd=${params.yd}&statType=${params.statType}`
  );
};

//结算率确认-统计并保存明细数据(statType:1.单位 2.项目类型)
export const statAndSaveDetailData = (params: any): Promise<Result> => {
  return baseService.get(`/ysjsltj/statAndSaveDetailData?nd=${params.nd}&yd=${params.yd}`);
};

//结算率确认-获取正式表数据(statType:1.单位 2.项目类型)
export const getOfficialData = (params: any): Promise<Result> => {
  return baseService.get(
    `/ysjsltj/getOfficialData?nd=${params.nd}&yd=${params.yd}&statType=${params.statType}`
  );
};

//结算率确认-导出明细表数据(statType:1.单位 2.项目类型)
export const exportDetailData = (params: any): Promise<Result> => {
  return baseService.exportGet(
    `/ysjsltj/exportDetailData?nd=${params.nd}&yd=${params.yd}&statType=${params.statType}`
  );
};

//结算率确认-导出临时表数据(statType:1.单位 2.项目类型)
export const exportTempData = (params: any): Promise<Result> => {
  return baseService.exportGet(
    `/ysjsltj/exportTempData?nd=${params.nd}&yd=${params.yd}&statType=${params.statType}`
  );
};
//结算率确认-导出正式表数据(statType:1.单位 2.项目类型)
export const exportOfficialData = (params: any): Promise<Result> => {
  return baseService.exportGet(
    `/ysjsltj/exportOfficialData?nd=${params.nd}&yd=${params.yd}&statType=${params.statType}`
  );
};

// 业扩数据统计-获取动态表头-按类型
export const getDynamicColumnByType = (params: any): Promise<Result> => {
  return baseService.post(`/yksjtj/getDynamicColumnByType`, params);
};
// 业扩数据统计-获取统计数据-按类型
export const getStatDataByType = (params: any): Promise<Result> => {
  return baseService.post(`/yksjtj/getStatDataByType`, params);
};

// 业扩数据统计-获取动态表头-按单位
export const getDynamicColumnByDw = (params: any): Promise<Result> => {
  return baseService.post(`/yksjtj/getDynamicColumnByDw`, params);
};
// 业扩数据统计-获取统计数据-按单位
export const getStatDataByDw = (params: any): Promise<Result> => {
  return baseService.post(`/yksjtj/getStatDataByDw`, params);
};
// 业扩数据统计-按单位穿透
export const yksjtjPageXmInfo = (params: any): Promise<Result> => {
  return baseService.post(`/yksjtj/pageXmInfo`, params);
};

export const exportXmInfo = (params: Params): Promise<Result> => {
  return baseService.export(`/yksjtj/exportXmInfo`,params);
};
