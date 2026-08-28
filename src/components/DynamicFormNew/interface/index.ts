export interface FormField {
  prop: string;
  label: string;
  type: string;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  span?: number;
  hidden?: boolean;
  newRow?: boolean;
  defaultValue?: any;
  rules?: any[];
  dependencies?: string[];
  options?: Array<{ label: string; value: any; disabled?: boolean }>;
  treeProps?: { children: string; label: string; value?: string; disabled?: boolean };
  nodeKey?: string;
  min?: number;
  max?: number;
  step?: number;
  multiple?: boolean;
  filterable?: boolean;
  dateType?: string;
  format?: string;
  valueFormat?: string;
  activeText?: string;
  inactiveText?: string;
  rows?: number;
  slotName?: string;
  loading?: boolean;
  defaultExpandAll?: boolean;
  defaultExpandKey?: string[] | number[];
  checkStrictly?: boolean;
  loadOptions?: (
    value: any,
    formData: Record<string, any>,
    dependencies?: string[]
  ) => Promise<
    Array<{
      label: string;
      value: any;
      disabled?: boolean;
    }>
  >;
  dyff: string;
  ggdm: string | null;
  uploadTitle?: string;
  uploadLimit?: number;
  uploadAccept?: string;
  uploadListType?: string;
  uploadMaxSize?: number;
  uploadAction?: string;
  uploadMultiple?: boolean;
  uploadAutoUpload?: boolean;
  uploadDisabled?: boolean;
  uploadDrag?: boolean;
  uploadStyle?: string;
  uploadButton?: string;
  uploadIcon?: string;
  uploadTableHeight?: string | number;
  uploadShowPreview?: boolean;
  uploadShowDownload?: boolean;
  uploadShowDelete?: string;
  uploadShowStatus?: boolean;
  uploadShowActions?: boolean;
  uploadChange?: (files: any) => void;
  // 日期计算相关
  dateCalculation?: {
    startDateField?: string; // 起始日期字段名
    endDateField?: string; // 结束日期字段名
    targetField?: string; // 目标计算字段名
    unit?: "days" | "months" | "years"; // 计算单位，默认为天
    validateDateOrder?: boolean; // 是否验证日期顺序，默认true
    errorMessage?: string; // 日期顺序错误提示信息
  };
  showWhen?:
    | string
    | {
        field: string;
        value: any;
        defaultValue?: any;
      };
}

export interface FormConfig {
  labelWidth: string;
  initApi?: string;
  labelPosition: string;
  gutter: number;
  colsPerRow: number;
}
