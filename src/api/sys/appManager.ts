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

//应用查询
export const getAppListPageData = (params: Params): Promise<Result> => {
  return baseService.post(`/sys/app/getListPageData`, params);
};

//单个应用查看
export const getAppOne = (appId: string): Promise<Result> => {
  return baseService.post(`/sys/app/getOne?appId=${appId}`);
};

//应用更新
export const appUpdate = (params: Params): Promise<Result> => {
  return baseService.post(`/sys/app/update`, params);
};
//应用保存
export const appSave = (params: Params): Promise<Result> => {
  return baseService.post(`/sys/app/save`, params);
};

//应用删除
export const appDelete = (appId: string): Promise<Result> => {
  return baseService.post(`/sys/app/delete?appId=${appId}`);
};

//应用菜单查询
export const getAppMenuListPageData = (params: Params): Promise<Result> => {
  return baseService.post(`/sys/appMenu/getListPageData`, params);
};

//单个应用菜单查看
export const getAppMenuOne = (id: string): Promise<Result> => {
  return baseService.post(`/sys/appMenu/getOne?id=${id}`);
};
//应用菜单更新
export const appMenuUpdate = (params: Params): Promise<Result> => {
  return baseService.post(`/sys/appMenu/update`, params);
};
//应用菜单保存
export const appMenuSave = (params: Params): Promise<Result> => {
  return baseService.post(`/sys/appMenu/save`, params);
};

//应用菜单删除
export const appMenuDelete = (id: string): Promise<Result> => {
  return baseService.post(`/sys/appMenu/delete?id=${id}`);
};
