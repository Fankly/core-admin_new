import baseService from "@/service/baseService";

interface Result {
    code: number;
    data: any;
    msg: string;
    success: boolean;
    header?: any;
}

// ERP消耗明细查询报表-分页查询
export const erpXhDetailPage = (params: any): Promise<Result> => {
    return baseService.post(`/erpXhDetail/page`, params);
};
// ERP消耗明细查询报表-导出
export const erpXhDetailExport = (formData: any): Promise<Result> => {
    return baseService.export(`/erpXhDetail/export`, formData);
};

// 项目成本占用明细查询报表-分页查询
export const xmcbzyDetailPage = (params: any): Promise<Result> => {
    return baseService.post(`/xmcbzyDetail/page`, params);
};
// 项目成本占用明细查询报表-导出
export const xmcbzyDetailExport = (formData: any): Promise<Result> => {
    return baseService.export(`/xmcbzyDetail/export`, formData);
};

// 费用单位分解明细查询报表-分页查询
export const fyfjDetailPageByDw = (params: any): Promise<Result> => {
    return baseService.post(`/fyfjDetail/pageByDw`, params);
};
// 费用单位分解明细查询报表-导出
export const fyfjDetailExportByDw = (formData: any): Promise<Result> => {
    return baseService.export(`/fyfjDetail/exportByDw`, formData);
};

// 费用部门分解明细查询报表-分页查询
export const fyfjDetailPageByBm = (params: any): Promise<Result> => {
    return baseService.post(`/fyfjDetail/pageByBm`, params);
};
// 费用部门分解明细查询报表-导出
export const fyfjDetailExportByBm = (formData: any): Promise<Result> => {
    return baseService.export(`/fyfjDetail/exportByBm`, formData);
};

// 费用单位平衡调整明细查询报表-分页查询
export const fyfjDetailPageByDwph = (params: any): Promise<Result> => {
    return baseService.post(`/fyfjDetail/pageByDwph`, params);
};
// 费用单位平衡调整明细查询报表-导出
export const fyfjDetailExportByDwph = (formData: any): Promise<Result> => {
    return baseService.export(`/fyfjDetail/exportByDwph`, formData);
};


