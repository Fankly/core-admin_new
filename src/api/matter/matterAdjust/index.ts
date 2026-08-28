import baseService from "@/service/baseService";
interface Params {
  [key: string]: any;
}

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
}

//新增/修改
export const saveData = (params: Params): Promise<Result> => {
  return baseService.post("/yssxTz/add", params);
};

//根据申请单id获取实施单位及费用安排(修改申请时使用)
export const getFyxxById = (id: string): Promise<Result> => {
  return baseService.get(`/yssxTz/getFyxxById?id=${id}`);
};

//根据预算事项id获取实施单位及费用安排(新增申请时使用)
export const getFyxxByYssxId = (yssxId: string): Promise<Result> => {
  return baseService.get(`/yssxTz/getFyxxByYssxId?yssxId=${yssxId}`);
};

//查看分页列表
export const getPage = (params: Params): Promise<Result> => {
  return baseService.post("/yssxTz/getPage", params);
};

//获取申请单号
export const getSqdh = (): Promise<Result> => {
  return baseService.get("/yssxTz/getSqdh");
};

//根据申请单id获取申请单信息(修改申请时使用)
export const getSqdxxById = (id: string): Promise<Result> => {
  return baseService.get(`/yssxTz/getSqdxxById?id=${id}`);
};

//提交(默认审核通过)
export const submit = (ids: string[]): Promise<Result> => {
  return baseService.post("/yssxTz/submit", ids);
};

//提交(含工作流)
export const submitAdjust = (params: Params): Promise<Result> => {
  return baseService.post("/workflow/adjust/submitWf", params);
};

// 上传附件
export const uploadAttachList = (params: Params): Promise<Result> => {
  return baseService.post(
    `/yssxTz/uploadAttach?id=${params.id}&name=${params.name}`,
    params.formData
  );
};

// 附件列表
export const getAttachList = (id: string): Promise<Result> => {
  return baseService.get(`/yssxTz/getAttachList?id=${id}`);
};

// 附件列表下载
export const downloadAttachList = (uuid: string): Promise<Result> => {
  return baseService.export(`/yssxTz/downloadAttach?uuid=${uuid}`);
};

// 删除列表下载
export const deleteAttachList = (id: string): Promise<Result> => {
  return baseService.post(`/yssxTz/deleteAttach?id=${id}`);
};
