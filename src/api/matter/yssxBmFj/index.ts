import baseService from "@/service/baseService";

//预算分解查看
export const getYssxBmFjPage = (params: any) => {
  return baseService.post("/yssxBmFj/getYssxBmFjPage", params);
};

//预算分解页签查看
export const getBmFjDetail = (params: any) => {
  return baseService.post("/yssxBmFj/getBmFjDetail", params);
};

//预算分解页签保存
export const yssxBmFjSave = (params: any[]) => {
  return baseService.post("/yssxBmFj/save", params);
};

//预算分解自动建项
export const autoBuildPro = (bmId: string) => {
  return baseService.post(`/yssxBmFj/zdjx?bmid=${bmId}`);
};
