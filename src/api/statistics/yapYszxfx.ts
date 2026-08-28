import baseService from "@/service/baseService";

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
  header?: any;
}

interface SearchData {
  attrCode: string;
  corpAttrCode: string;
  corpId: string;
  cxjb: string;
  depId: string;
  dwId: string;
  ejdw: string;
  gkbm: string;
  month: string;
  xmlxdlId: string;
  year: string;
  yjdwcx_sgsbb: string;
  ysly: string;
  zbxWwclgs: string;
}

// 动态表头
export const getDynamicColumn = (params: SearchData): Promise<Result> => {
  return baseService.post("yapyszxfx/getDynamicColumn", params);
};

// 总体情况
export const ztqk = (params: SearchData): Promise<Result> => {
  return baseService.post("yapyszxfx/ztqk", params);
};

// 获取初始化数据
export const getInitData = (spOrgId: string, orgId: string): Promise<Result> => {
  return baseService.post("yapyszxfx/getInitData", {
    orgId,
    spOrgId
  });
};

// 获取部门列表
export const getDeptList = (ejdw: string): Promise<Result> => {
  return baseService.post("yapyszxfx/getDeptList", {
    ejdw
  });
};

// 手动更新定时任务
export const updateTimer = (): Promise<Result> => {
  return baseService.post("yapyszxfx/updateZtqkMiddleTable");
};
