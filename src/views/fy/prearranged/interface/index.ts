import { VxeTablePropTypes } from "vxe-table";

export interface Columns {
  columnKey: string;
  columnValue: string;
  eidt?: boolean;
  hidden?: boolean;
  fixed?: boolean;
  width?: string;
  dwDetailId: string;
  needSum?: string;
  visible: boolean;
  detail?: boolean;
}

export interface NdList {
  yearName: string;
  yearCode: string;
}

export interface PublicList {
  name: string;
  code: string;
}

export interface DwList {
  code: string;
  name: string;
  unicode?: string;
}

export interface TableMsg {
  xsws: string;
  nd: string;
  tableData: any;
  ndData?: any;
  columns?: Columns[];
  ndColumns?: Columns[];
  headers?: Headers[];
  zyTreeConfig?: VxeTablePropTypes.TreeConfig;
  ndTreeConfig?: VxeTablePropTypes.TreeConfig;
  editConfig?: VxeTablePropTypes.EditConfig;
  rowConfig: VxeTablePropTypes.RowConfig;
}

export interface FormParams {
  nd: string;
  xsws: string;
  ndList: NdList[];
  xswsList: PublicList[];
}
export interface DwDataMsg {
  dwList: DwList[];
  dwId: string;
  oldDwId?: string;
}

export interface KmDataMsg {
  kmList: DwList[];
  kmId: any[];
}
