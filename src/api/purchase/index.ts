import baseService from "@/service/baseService";

// 获取物资采购类型
export const getCglx = (cglx: string) => {
  return baseService.get(`/process49/getCglx?cglx=${cglx}`);
};

// 获取当前项目关联的采购信息
export const getCgxxByXmid = (params: object) => {
  return baseService.post(`/process49/getCgxxByXmid`, params);
};

// 根据项目id和type获取采购类型(查看或修改时使用)
export const getCglxByXmid = (params: object) => {
  return baseService.post(`/process49/getCglxByXmid`, params);
};

// 获取采购类型下拉
export const getChildCglx = (cglxbm: string) => {
  return baseService.get(`/process49/getChildCglx?cglxbm=${cglxbm}`);
};

// 根据采购申请号、行项目号获取数据
export const getDataByCgsq = (params: object) => {
  return baseService.post("/process49/getDataByCgsq", params);
};

// 列表查询
export const getPage = (params: object) => {
  return baseService.post("/process49/getPage", params);
};

// 获取待处理下拉
export const getDcl = () => {
  return baseService.get(`/process49/getDcl`);
};

// 新增或保存采购信息
export const save = (params: object) => {
  return baseService.post("/process49/save", params);
};

// 导出物资采购信息
export const exportWz = (params: object) => {
  return baseService.export("/process49/exportWz", params);
};

// 导出项目信息
export const exportXm = (params: object) => {
  return baseService.export("/process49/exportXm", params);
};