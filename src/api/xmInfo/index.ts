import baseService from "@/service/baseService";

interface Params {
  xmmc: string;
  gwxmbm: string[];
  xmlx: string[];
  yjdw: string;
  ejdw: string;
  nd: string;
  specialorgid: string;
  limit: number;
  page: number;
}

interface SaveData {
  dncwzc: number;
  dnsj: number;
  id: number;
  ljfsz: number;
  ljsj: number;
  xmid: number;
}

export const exportXmFszInfo = (params: Params) => {
  return baseService.export(`/xmInfo/bzcb/exportXmFszInfo`, params);
};

export const getXmFszInfo = (params: Params) => {
  return baseService.post(`/xmInfo/bzcb/getXmFszInfo`, params);
};

export const getXmFszInfoTemplate = () => {
  return baseService.export(`/xmInfo/bzcb/getXmFszInfoTemplate`);
};

export const importXmFszInfo = (params: any) => {
  return baseService.post(
    `/xmInfo/bzcb/importXmFszInfo?specialorgid=${params.specialorgid}`,
    params.excelFormData
  );
};

export const saveXmFszInfo = (params: SaveData[]) => {
  return baseService.post(`/xmInfo/bzcb/saveXmFszInfo`, params);
};
