import { VxeTablePropTypes } from "vxe-table";

export interface BaseInfo {
  specialorgid: string;
  nd: string;
  kmlx: string;
  busiType: string;
}

export interface UserInfo {
  orgId: string;
  orgName: string;
}

export interface TableInfo {
  treeConfig: VxeTablePropTypes.TreeConfig;
  editConfig: VxeTablePropTypes.EditConfig;
  loading: boolean;
  rowConfig: VxeTablePropTypes.RowConfig;
}

interface Columns {
  columnKey: string;
  columnValue: string;
  dataType: string;
  dwDetailId: number;
  eidt: boolean;
  fixed: boolean;
  hidden: boolean;
  needSum: boolean;
}

export interface TableMsg extends TableInfo {
  columns: Columns[];
  tableData: any[];
}
