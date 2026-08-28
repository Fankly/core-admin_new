import baseService from "@/service/baseService";

//预算分解查看
export const getYsfjListPage = (params: object) => {
  return baseService.post("/yssxFj/getYssxFjPage", params);
};

//预算分解页签查看
export const getYssxFjDetail = (params: object) => {
  return baseService.post("/yssxFj/getYssxFjDetail", params);
};

//预算分解页签查看
export const yssxFjSave = (params: object) => {
  return baseService.post("/yssxFj/yssxFjSave", params);
};
