import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { fetchProgressData } from "../api";
import type { ProcessStep, ProjectInfo, StepStatus } from "../types";

export function useProgressQuery() {
  const route = useRoute();

  // 响应式状态
  const loading = ref(false);
  const processSteps = ref<ProcessStep[]>([]);
  const currentProgress = ref(0);

  // 项目信息
  const projectInfo = ref<ProjectInfo>({
    code: "",
    xmId: "",
    name: ""
  });

  // 计算属性
  const hasProjectInfo = computed(() => Boolean(projectInfo.value.code));

  const completedSteps = computed(
    () => processSteps.value.filter((step) => step.status === "1").length
  );

  const totalSteps = computed(() => processSteps.value.length);

  const progressPercentage = computed(() =>
    totalSteps.value > 0 ? Math.round((completedSteps.value / totalSteps.value) * 100) : 0
  );

  /**
   * 根据状态生成状态文本
   */
  const getStatusText = (status: StepStatus): string => {
    const statusMap: Record<StepStatus, string> = {
      "1": "已完成",
      "2": "进行中",
      "3": "待处理"
    };
    return statusMap[status] || "未知";
  };

  /**
   * 初始化步骤数据
   */
  const initializeSteps = (apiData: any): void => {
    processSteps.value = apiData.map((step: any) => ({
      id: step.gcCode,
      name: step.gcName,
      status: step.status as StepStatus,
      disOrder: step.disOrder,
      statusText: getStatusText(step.status)
    }));
    currentProgress.value = 0;
  };

  /**
   * 加载进度数据
   */
  const loadProgressData = async (): Promise<void> => {
    if (!projectInfo.value.code) return;
    try {
      loading.value = true;
      const result = await fetchProgressData(projectInfo.value.xmId);

      if (result.code) {
        initializeSteps(result.data);
        console.log("进度数据加载成功:", processSteps.value);
      }
    } catch (error) {
      console.error("加载进度数据失败:", error);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 初始化项目信息
   */
  const initializeProjectInfo = (): void => {
    projectInfo.value.code = (route.params.code as string) || "";
    projectInfo.value.name = (route.query.name as string) || "";
    projectInfo.value.xmId = (route.query.xmId as string) || "";
    console.log("进度查询页面已加载", projectInfo.value);
  };

  /**
   * 重新加载数据
   */
  const reload = async (): Promise<void> => {
    initializeProjectInfo();
    await loadProgressData();
  };

  return {
    // 状态
    loading,
    processSteps,
    currentProgress,
    projectInfo,

    // 计算属性
    hasProjectInfo,
    completedSteps,
    totalSteps,
    progressPercentage,

    // 方法
    loadProgressData,
    initializeProjectInfo,
    reload,
    getStatusText
  };
}
