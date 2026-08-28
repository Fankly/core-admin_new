export type InitParams = {
  specialorgid: string;
  roleCode: string;
  tabType?: number;
  sfxg?: string;
};

export interface List {
  [key: string]: any;
}

export type DialogData = {
  title: string;
  isShowPage: boolean;
  isShowAdjustFormDialog?: boolean;
};

export type MsgData = {
  code: string;
  name: string;
  unicode?: string;
};

export type isData = {
  label: string;
  value: string;
};

export type DefaultProps = {
  children: string;
  label: string;
};

export interface ProjectType {
  defaultProps: DefaultProps;
  projectType: any[];
}

export type BaseMsgData = {
  yjdwListData?: MsgData[];
  isYapListData?: isData[];
  projectTypeData: ProjectType;
  roleCode?: string;
  operationFlag?: string;
  selectedData: List;
  tabType?: string | number;
  specialOrgId: string;
  jd?: string;
  yssxbm?: string;
  type?: string;
  isShowButton?: boolean;
};
