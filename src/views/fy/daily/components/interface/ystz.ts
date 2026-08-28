import { VxeTablePropTypes } from "vxe-table";

export interface YstzInfo {
  isCity: boolean;
  title: string;
  flag: string;
  nd: string;
  xsws: string;
  kmlx: string;
  dwId: string;
  busiType: string;
  yskm?: any;
  width?: string;
  height?: string;
  requestApi: (params: any) => Promise<any>;
  dynamicColumnApi: (params: any) => Promise<any>;
  yskmPath?: any[];
  operation: string;
}

export interface DwList {
  code: string;
  name: string;
}

export interface Columns {
  columnKey: string;
  columnValue: string;
  fixed: boolean;
  eidt: boolean;
  hidden: boolean;
  needSum: boolean;
  dwDetailId: string | null;
}

export interface TableInfo {
  rowConfig: VxeTablePropTypes.RowConfig;
  columns: Columns[];
  sumColumns?: Columns[];
  tableData: any[];
  editConfig: VxeTablePropTypes.EditConfig;
  treeConfig: VxeTablePropTypes.TreeConfig;
  loading?: boolean;
}

export interface SaveData {
  nd: string;
  xsws: string;
  specialorgid: string;
  kmlx: string;
  dwIds: string;
  yskmId: string;
  flag: string;
}
