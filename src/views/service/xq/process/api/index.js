// 模拟API调用，实际项目中替换为真实的API请求

import { getAppByGroupCode, zlxmQuickSearch } from "@/api/service/zl";

/**
 * 获取流程步骤配置
 */
export const getProcessSteps = async () => {
  // 模拟API请求延迟
  const res = await getAppByGroupCode("ZLXM");
  // 图标数组，每四个循环
  const icons = ["1", "2", "3", "4"];

  return {
    code: res.success,
    data: res.data.map((step, index) => ({
      ...step,
      icon: icons[index % icons.length] // 每四个图标循环
    }))
  };
};

/**
 * 获取表格配置
 */
export const getTableConfig = async () => {
  return {
    code: true,
    data: {
      columns: [
        { key: "xmbm", label: "租赁需求编码" },
        { key: "xmmc", label: "租赁需求名称" },
        { key: "requestor", label: "承租人" },
        { key: "czf", label: "出租方" },
        { key: "zrzcjtmc", label: "租赁物" },
        { key: "prjSdate", label: "起租日" },
        { key: "prjEdate", label: "结束日" },
        {
          key: "actions",
          label: "操作",
          type: "action",
          action: "progress_query",
          actionText: "进度查询"
        }
      ]
    }
  };
};

/**
 * 获取表格数据
 */
export const getTableData = async (params = {}) => {
  const res = await zlxmQuickSearch(params.search, params.userInfo.dwId);
  return {
    code: res.success,
    data: {
      list: res.data,
      total: res.data.length
    }
  };
};

/**
 * 处理流程步骤操作
 */
export const handleStepAction = async (actionId, stepId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log(`执行操作: ${actionId}, 步骤: ${stepId}`);

  return {
    code: 200,
    message: "操作执行成功"
  };
};
