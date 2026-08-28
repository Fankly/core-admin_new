import { ElMessage } from "element-plus";

export const handleError = (error: Error, message = "操作失败"): void => {
  console.error(`${message}`, error);
  ElMessage({
    message: `${message}:${error.message}`,
    type: "error",
    duration: 5000
  });
};
