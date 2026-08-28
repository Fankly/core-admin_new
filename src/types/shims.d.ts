/* eslint-disable */
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.bmp";
declare module "*.tiff";
declare module "*.gif";

declare module "*.less";
declare module "*.css";

interface Window {
  URL: any;
  Appframe: any;
  getDataCrAndFinFir: any;
  crAndFinFir: any;
  bfCrAndFinFir: any;
  getDataBfFinNode: any;
  finNode: any;
  bfFinNode: any;
}

// 本文件不是模块（没有顶层 import/export），这里的 interface 本身就是全局声明。
// 不要包 declare global：那样会触发 TS2669，且被 skipLibCheck 静默掉，augmentation 实际不生效。
interface Navigator {
  msSaveOrOpenBlob: (blob: Blob, fileName: string) => void;
  browserLanguage: string;
}

declare module "virtual:*" {
  const result: any;
  export default result;
}
