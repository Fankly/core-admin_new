import { ref } from "vue";
import { ElMessage } from "element-plus";

export interface ErrorHandlerOptions {
  showError?: boolean;
  logError?: boolean;
  defaultMessage?: string;
}

export function useErrorHandler() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const withErrorHandling = async <T>(
    asyncFunction: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    const { showError = true, logError = true, defaultMessage = "操作失败，请稍后重试" } = options;

    try {
      loading.value = true;
      error.value = null;

      const result = await asyncFunction();
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || defaultMessage;

      error.value = errorMessage;

      if (logError) {
        console.error("Error occurred:", err);
      }

      if (showError) {
        ElMessage.error(errorMessage);
      }

      return null;
    } finally {
      loading.value = false;
    }
  };

  const withLoadingState = async <T>(
    asyncFunction: () => Promise<T>,
    loadingRef: { value: boolean }
  ): Promise<T | null> => {
    try {
      loadingRef.value = true;
      return await asyncFunction();
    } catch (err: any) {
      console.error("Error in withLoadingState:", err);
      ElMessage.error(err?.message || "操作失败");
      return null;
    } finally {
      loadingRef.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    loading,
    error,
    withErrorHandling,
    withLoadingState,
    clearError
  };
}
