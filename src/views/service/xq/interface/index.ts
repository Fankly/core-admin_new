import { FormField } from "@/components/DynamicForm/interface";

export interface RowVo {
  id: number;
  protypeId: number;
  sfzs: string;
  sortCode: number;
  stepName: string;
  stepType: string;
}

export interface Params {
  [key: string]: any;
}

export interface FormItems {
  stepId: string;
  stepName: string;
  stepType: string;
  columns: FormField[];
}

export interface Config {
  labelWidth: string;
  labelPosition: string;
  gutter: number;
  colsPerRow: number;
}

export interface Configs {
  code: string;
  dependOnColumn: string;
  dyff: string;
  ggdm: string;
  id: string;
  link: boolean;
  name: string;
  type: string;
  placeholder: string;
  nodeKey: string;
  disabled: boolean;
  clearable: boolean;
  filterable: boolean;
  multiple: boolean;
  defaultValue?: any;
  options: any[];
  treeProps?: { children: string; label: string; value: string };
}

export interface MenuConfig {
  createDate: string;
  creator: null | string;
  frameSrc: null | string;
  icon: null | string;
  id: string;
  isFrame: number;
  isShow: number;
  name: string;
  openStyle: number;
  outsideMenu: string;
  parentName: null;
  permissions: null;
  pid: string;
  sort: number;
  type: number;
  updateDate: 1742451385000;
  updater: null | string;
  url: string;
}
