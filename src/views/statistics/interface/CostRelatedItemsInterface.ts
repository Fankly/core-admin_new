export interface ProTypeList {
  children: ProTypeList[];
  code: string;
  dispOrder: string;
  id: string;
  leaf: boolean;
  leafString: string;
  middleId: string;
  name: string;
  parentId: string;
  protypeId: string;
}

export interface User {
  code: string;
  id: string;
  info: string;
  name: string;
  org_id: string;
  org_name: string;
  role_id: string;
  rolename: string;
  spRoleCode: string;
  specialorgid: string;
  specialorgname: string;
  systemId: string;
  systemName: string;
}

export interface CobudgetCategory {
  code: string;
  name: string;
}

export interface Yslxct {
  ctmc: string;
  id: string;
}

export interface FromData {
  yssx: string;
  yjfl: string;
  ejfl: string;
  sjfl: string;
  zdtx: string;
  yskzlb: string;
  xmlxList: string[];
  [key: string]: string | string[];
}

export interface ClassifyData {
  code: string;
  com_code_id: number;
  disp_order: number;
  id: number;
  isleaf: number;
  name: string;
  note: null | string;
  parent_id: number;
  pcode: string;
  rec_state: number;
  rec_type: number;
}
