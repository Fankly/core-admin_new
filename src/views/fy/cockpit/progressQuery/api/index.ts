import type { ApiResponse, ProgressData } from "../types";
import { getXmqgcByXmid } from "@/api/service/zl";

/**
 * 获取项目进度数据
 * @param projectCode 项目编码
 * @returns Promise<ApiResponse<ProgressData>>
 */
export const fetchProgressData = async (
  projectCode: string
): Promise<ApiResponse<ProgressData>> => {
  // 模拟API延迟
  const res = await getXmqgcByXmid(projectCode);
  // 获取对应项目的数据，如果没有则使用默认数据
  const projectData = res.data;

  return {
    code: res.success,
    data: projectData
  };
};
