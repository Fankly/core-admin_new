import baseService from "@/service/baseService";

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
}

interface Params {
  [key: string]: any;
}

// 获取房屋资产关联列表
export const getFwzcGlPage = (params: Params): Promise<Result> => {
  return baseService.post("/process48/getFwzcGlPage", params);
};

// 获取房屋资产列表
export const getFwzcPage = (params: Params): Promise<Result> => {
  return baseService.post("/process48/getFwzcPage", params);
};

// 获取项目列表
export const getXmPage = (params: Params): Promise<Result> => {
  return baseService.post("/process48/getXmPage", params);
};

// 获取项目关联列表
export const getXmGlPage = (params: Params): Promise<Result> => {
  return baseService.post("/process48/getXmGlPage", params);
};

// 获取左侧树
export const getTreeData = (params: Params): Promise<Result> => {
  return baseService.post("/process48/getTreeData", params);
};

// 关联项目
export const glxm = (params: Params): Promise<Result> => {
  return baseService.post("/process48/glxm", params);
};

// 关联房屋资产
export const glzc = (params: Params): Promise<Result> => {
  return baseService.post("/process48/glzc", params);
};

// 取消关联项目
export const qxglxm = (params: Params): Promise<Result> => {
  return baseService.post("/process48/qxglxm", params);
};

// 取消关联资产
export const qxglzc = (params: Params): Promise<Result> => {
  return baseService.post("/process48/qxglzc", params);
};

// 关联项目-导出
export const glxmExport = (params: Params): Promise<Result> => {
  return baseService.export("/process48/exportXm", params);
};

// 关联资产-导出
export const glzcExport = (params: Params): Promise<Result> => {
  return baseService.export("/process48/exportZc", params);
};

// 关联项目-获取导入模板
export const getImportXmTemplate = (params: Params): Promise<Result> => {
  return baseService.export("/process48/getImportXmTemplate", params);
};

// 关联资产-获取导入模板
export const getImportZcTemplate = (params: Params): Promise<Result> => {
  return baseService.export("/process48/getImportZcTemplate", params);
};

// 关联项目-导入
export const importXm = (params: Params): Promise<Result> => {
  return baseService.post(
    `/process48/importXm?specialorgid=${params.specialorgid}`,
    params.excelFormData
  );
};

// 关联资产-导入
export const importZc = (params: Params): Promise<Result> => {
  return baseService.post(
    `/process48/importZc?specialorgid=${params.specialorgid}`,
    params.excelFormData
  );
};

// 日志
export const getLogPage = (params: Params): Promise<Result> => {
  return baseService.post(`/process48/getLog?id=${params.id}&logType=${params.logType}`);
};

export const getLogByGds = (params: Params): Promise<Result> => {
  return baseService.post(`/process48/getLogByGds`, params);
};
