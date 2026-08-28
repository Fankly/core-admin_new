export interface QueryForm {
  xmlx: Array<string>;
  gkbm: string;
  nd: string;
  yssxmc: string;

  [key: string]: string | Array<string>;
}

export interface QueryFormProcess {
  xmlx: Array<string>;
  gkbm: string;
  nd: string;
  yssx: string;
  dwIds: Array<string>;
  [key: string]: string | Array<string>;
}

export interface QueryFormRe extends QueryForm {
  dwIds: Array<string>;
}

export interface CellStyle {
  row: any;
  column: any;
  rowIndex: number;
  columnIndex: number;
}
