interface SelectedData {
  [key: string]: any;
}

export interface ModalProps {
  title: string;
  opType: "ADD" | "EDIT" | "DELETE" | "VIEW";
  rowMsg?: SelectedData;
}

export interface RowVo {
  astname: string; //资产名称
  astnum: string; //资产编码
  asttime: string; //资本化日期
  djdjName: string; //
  equipcode: string; //PMS设备编号
  erpequipcode: string; //ERP设备编号
  erpequipname: string; // ERP设备名称;
  erpzcmxl: string; //ERP资产明细类;
  erpzcmxlmc: string; //ERP资产明细类名称;
  iszzsb: string; //是否用户资产未移交;
  materialname: string; // PMS设备名称;
  materialtype: string; //设备类型;
  mcppd: string; //名称匹配度;
  netastvalue: number; //资产净值（万元）
  originalequipvalue: number; //资产原值（万元）
  zcsx: string; //资产属性
}
