import baseService from "@/service/baseService";

interface Params {
  [key: string]: any;
}

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
  header?: any;
}

// 导出
export const exportZlxmExcel = (formData: Params): Promise<Result> => {
  return baseService.export(`/xmAttributeConfig/exportZlxmExcel`, formData);
};

// 列表
export const getExportZlxmData = (formData: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/getExportZlxmData`, formData);
};

// 获取项目类别
export const getXmlb = (formData: Params): Promise<Result> => {
  return baseService.post(`/zlxqszynew/getXmlb`, formData)
}