export interface RowVo {
  [key: string]: any
}

export interface Project {
  [key: string]: any;
}

export interface PublicCode {
  code: string;
  name: string;
}

export interface Tree {
  name: string;
  leaf?: boolean;
}

export interface ProjectGroup {
  xmid: string;
  xmmc: string;
  expanded?: boolean;
  projects?: Project[];
  selected?: boolean;
}

export interface SpanInfo {
  rowIndex: number;
  rowspan: number;
  colspan: number;
}

export interface PublicParams {
  bmId: string;
  dwId: string;
  nd: string;
  xmlxId: string;
  userId: string;
  specialorgcode: string;
  spRoleId: string;
}

export interface AcceptParams {
  selectedRowData: RowVo[];
  searchPage: any;
  limitNum: number;
  publicParams: PublicParams;
  sfgmb: string;
}
