export interface PurchaseData {
  code: string;
  name: string;
}

export interface PurchaseDatas {
  wzlb: Array<PurchaseData>;
  fwlb: Array<PurchaseData>;
}

export interface SuppliesForm {
  cglb: string;
}

export interface RulesForm {
  cglx: string;
  cgsqh: string;
  hxmh: Number;
  cglxName?: string;
}
