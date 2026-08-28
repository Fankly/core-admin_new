export interface ProcessStep {
  id: string;
  name: string;
  status: "1" | "2" | "3";
  statusText?: string;
  dispOrder?: string;
}

export interface ProjectInfo {
  code: string;
  xmId: string;
  name: string;
}

export interface ProgressData {
  currentStep: number;
  steps: ProcessStep[];
}

export interface ApiResponse<T = any> {
  code: boolean;
  data: T;
  message?: string;
}

export type StepStatus = "1" | "2" | "3";
