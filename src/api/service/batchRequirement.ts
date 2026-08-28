import baseService from "@/service/baseService";

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
  header?: any;
}

interface ImportTemplateDownloadParams {
  currentUserBmId: string;
  currentUserDwId: string;
  proTypeId: string;
  [key: string]: any;
}

interface XmImportData {
  currentUserId: string;
  currentUserName: string;
  file: FormData;
  currentUserBmName: string;
  currentUserDwName: string;
  currentUserDwId: string;
  currentUserBmId: string;
  [key: string]: any;
}

interface XmExcelVerifyData {
  file: FormData;
  currentUserDwId: string;
  proTypeId: string;
  currentUserBmId: string;
}

// 模板下载
export const importTemplateDownload = (formData: ImportTemplateDownloadParams): Promise<Result> => {
  return baseService.export(`/xmBatchEntry/importTemplateDownload`, formData);
};

// 校验
export const xmExcelVerify = (xmExcelVerifyData: XmExcelVerifyData): Promise<Result> => {
  return baseService.post(
    `/xmBatchEntry/xmExcelVerify?currentUserBmId=${xmExcelVerifyData.currentUserBmId}&currentUserDwId=${xmExcelVerifyData.currentUserDwId}&proTypeId=${xmExcelVerifyData.proTypeId}`,
    xmExcelVerifyData.file
  );
};

// 导入
export const xmImport = (xmImportData: XmImportData): Promise<Result> => {
  const queryParams = new URLSearchParams();
  for (const key in xmImportData) {
    if (xmImportData[key] !== undefined && xmImportData[key] !== null && key !== "file") {
      queryParams.append(key, xmImportData[key]);
    }
  }
  return baseService.post(`/xmBatchEntry/xmImport?${queryParams.toString()}`, xmImportData.file);
};
