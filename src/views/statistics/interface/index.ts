export interface RowVo {
  id: string;
  yssxId: string;
  yssxbm: string;
  yssxmc: string;
  yslxctName: string;
  xmlxName: string;
  zjlyName: string;
  xmbbm: string;
  xmbmc: string;
  isYapName: string;
  sfbmdName: string;
  yjdwName: string;
  ejdwName: string;
  gkbmmc: string;
  csmc: string;
  nd: string;
  sxys: string;
  yfjys: string;
  remark: string;
  ztName: string;
  zscflag: string;
  ztimestamp: string;
  cjrName: string;
  zhggrq: string;
  zhggrName: string;
  cksj: string;
  xjjzbs: string;
  isCity?: boolean;
  sxxzName: string;
}

export interface DetailParams {
  dwId: string;
  nd: string;
  tjfs: string[];
  bmid: string;
  value: number;
}

export type TableDetailParams = DetailParams & RowVo;
