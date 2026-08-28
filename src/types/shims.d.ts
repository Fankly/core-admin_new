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

declare global {
  interface Navigator {
    msSaveOrOpenBlob: (blob: Blob, fileName: string) => void;
    browserLanguage: string;
  }

  interface ImportMeta {
    env: Record<string, unknown>;
    globEager<T = unknown>(globPath: string): Record<string, T>;
  }
}

declare module "virtual:*" {
  const result: any;
  export default result;
}
