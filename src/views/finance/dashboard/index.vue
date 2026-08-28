--- START OF FILE Paste June 07, 2026 - 3:10PM ---

<template>
  <div
    class="tw-flex tw-h-screen tw-w-screen tw-text-slate-800 dashboard"
    style="transform: scale(1.15); transform-origin: top left; width: 86.96%; height: 86.96%"
  >
    <main class="tw-flex-1 tw-flex tw-flex-col tw-h-full tw-relative">
      <!-- 核心工作区 -->
      <div class="tw-flex tw-flex-col tw-flex-1 tw-overflow-auto custom-scrollbar tw-gap-4">
        <!-- ================= 第1行：欢迎卡片 ================= -->
        <div class="tw-flex tw-gap-4 tw-shrink-0">
          <div class="tw-flex tw-gap-4 tw-shrink-0 tw-h-[120px] tw-w-full tw-rounded-xl">
            <!-- 欢迎界面卡片 -->
            <div
              class="tw-flex-1 tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-flex tw-items-center tw-relative tw-overflow-hidden tw-shrink-0 banner-new-style"
            >
              <!-- 1. 背景与装饰图图层 -->
              <div class="tw-absolute tw-inset-0 tw-pointer-events-none tw-overflow-hidden">
                <div class="tw-absolute tw-w-96 tw-h-96 tw-bg-blue-400/15 tw-rounded-full tw-blur-3xl -tw-top-10 tw-left-[20%]"></div>
                <div class="tw-absolute tw-w-96 tw-h-96 tw-bg-emerald-400/10 tw-rounded-full tw-blur-3xl -tw-bottom-10 tw-right-[30%]"></div>
                <!-- 右侧装饰图 -->
                <div class="tw-absolute tw-right-0 tw-top-0 tw-h-full tw-w-[320px] banner-img-mask">
                  <img
                    src="@/assets/images/banner_background.png"
                    alt="AI智审"
                    class="tw-absolute tw-right-4 tw-top-1/2 -tw-translate-y-1/2 tw-h-[85%] tw-w-auto tw-object-contain banner-img-float tw-opacity-90"
                  />
                </div>
              </div>

              <!-- 2. 内容交互层 -->
              <div class="tw-relative tw-z-10 tw-flex tw-items-end tw-justify-between tw-w-full tw-h-full tw-px-8 tw-py-4">
                <!-- 【左侧】：您好模块 (固定占据空间) -->
                <div class="tw-flex tw-flex-col tw-justify-end tw-gap-2.5 tw-shrink-0 tw-w-[320px]">
                  <h1
                    class="tw-m-0 tw-mb-4 tw-text-[24px] tw-font-bold tw-text-slate-800 tw-tracking-tight tw-leading-none tw-flex tw-items-end tw-gap-2"
                  >
                    您好，<span class="tw-text-transparent tw-bg-clip-text tw-bg-gradient-to-r tw-from-[#1d7cf2] tw-to-[#60a5fa]">{{
                      getUserMsg?.name || '用户'
                    }}</span>
                  </h1>

                  <div
                    class="tw-inline-flex tw-items-center tw-gap-2 tw-bg-white/80 tw-backdrop-blur-md tw-border tw-border-white tw-px-3.5 tw-py-1.5 tw-rounded-full tw-shadow-[0_2px_10px_rgba(0,0,0,0.03)] tw-w-fit"
                  >
                    <div
                      class="tw-w-4 tw-h-4 tw-rounded-full tw-bg-emerald-100 tw-text-emerald-500 tw-flex tw-items-center tw-justify-center tw-shrink-0"
                    >
                      <svg class="tw-w-3 tw-h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 14.41l-4.7-4.7 1.41-1.41L11 13.58l6.29-6.29 1.41 1.41z" />
                      </svg>
                    </div>
                    <p class="tw-m-0 tw-text-[12px] tw-text-slate-600 tw-font-medium tw-leading-none">
                      AI 智审模式全时运行，保障合规填报，护航储备
                    </p>
                  </div>
                </div>

                <!-- 【中间】：Slogan + 融入背景的四个标签 -->
                <div class="tw-flex-1 tw-flex tw-flex-col tw-items-center tw-justify-end tw-gap-3">
                  <!-- 顶层：Slogan 口号 (液态流光科技感) -->
                  <div class="tw-flex tw-items-center tw-gap-5 group">
                    <!-- 左侧光线：加入呼吸动画 -->
                    <div
                      class="tw-h-[1.5px] tw-w-14 tw-bg-gradient-to-r tw-from-transparent tw-via-blue-400 tw-to-blue-600 tw-rounded-full tw-shadow-[0_0_8px_rgba(59,130,246,0.6)] tw-animate-pulse"
                    ></div>

                    <!-- 流光金属实心艺术字 -->
                    <span class="tw-text-[17px] tw-font-black tw-tracking-[0.15em] slogan-shine-sweep"> AI 守底线，人工把方向 </span>

                    <!-- 右侧光线：加入呼吸动画 -->
                    <div
                      class="tw-h-[1.5px] tw-w-14 tw-bg-gradient-to-l tw-from-transparent tw-via-blue-400 tw-to-blue-600 tw-rounded-full tw-shadow-[0_0_8px_rgba(59,130,246,0.6)] tw-animate-pulse"
                    ></div>
                  </div>
                  <!-- 底层：融入背景的标签 -->
                  <div class="tw-flex tw-gap-8 tw-items-center">
                    <div class="tag-card tag-card-orange">
                      <div class="tag-icon-wrapper"
                        ><svg class="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 10h3v7H4zm6.5 0h3v7h-3zM2 19h20v3H2zm15-9h3v7h-3zm-8.5-9L2 6v2h20V6z" /></svg
                      ></div>
                      <span class="tag-label">财力保障</span>
                    </div>
                    <div class="tag-card tag-card-blue">
                      <div class="tag-icon-wrapper"
                        ><svg class="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M19 3H5L2 9l10 14L22 9l-3-6zm-7 1.5l3.29 4.5H8.71L12 4.5zm-5.71 4.5H3.63L5.5 5.51l.79 3.49zM12 19.34L4.35 10.5h15.3L12 19.34zm5.71-8.84h-2.66l.79-3.49 1.87 3.49z"
                          /></svg
                      ></div>
                      <span class="tag-label">价值创造</span>
                    </div>
                    <div class="tag-card tag-card-emerald">
                      <div class="tag-icon-wrapper"
                        ><svg class="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19zM12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1z"
                          /></svg
                      ></div>
                      <span class="tag-label">辅助决策</span>
                    </div>
                    <div class="tag-card tag-card-rose">
                      <div class="tag-icon-wrapper"
                        ><svg class="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
                          /></svg
                      ></div>
                      <span class="tag-label">风险防范</span>
                    </div>
                  </div>
                </div>

                <!-- 【右侧】：独立的玻璃态下拉框 (去除了外层死板的白框，自身毛玻璃化) -->
                <div class="tw-shrink-0 tw-flex tw-justify-end tw-pr-[160px] tw-w-[360px]">
                  <div class="tw-w-[200px]">
                    <el-select v-model="yjdwValue" placeholder="请选择" class="custom-banner-select" popper-class="custom-banner-select-popper">
                      <el-option
                        v-for="item in yjdwList"
                        :key="item.code"
                        :label="item.name"
                        :value="item.code"
                        :disabled="item.code !== defaultYjdw"
                      />
                    </el-select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ================= 主体分栏区 (纯左右结构，最大化利用高度) ================= -->
        <div class="tw-flex tw-gap-4 tw-flex-1 tw-min-h-0">
          <!-- 左半部分 -->
          <div class="tw-w-full tw-flex tw-flex-col tw-gap-4 tw-min-h-0">
            <!-- 【核心重构】AI智审中枢 (带弥散渐变 + 动态彩色光效) -->
            <div
              class="tw-flex-1 tw-relative tw-flex tw-flex-col ai-glow-edge-wrapper diffuse-bg tw-bg-white tw-shadow-sm tw-overflow-hidden tw-min-h-0"
            >
              <div class="diffuse-blob tw-w-[400px] tw-h-[300px] tw-bg-emerald-50/80 -tw-top-20 -tw-right-20"></div>
              <div class="diffuse-blob tw-w-[300px] tw-h-[300px] tw-bg-purple-50/50 tw-bottom-0 tw-left-0" style="animation-delay: 4s"></div>

              <div
                class="glass-front tw-flex tw-flex-col tw-h-full tw-rounded-xl tw-overflow-hidden tw-bg-white/40 tw-backdrop-blur-[24px] tw-border tw-border-white/60"
              >
                <!-- Header -->
                <div
                  class="tw-p-3 tw-border-b tw-border-white/60 tw-flex tw-justify-between tw-items-center tw-shrink-0 tw-bg-white/40 tw-backdrop-blur-sm"
                >
                  <div class="tw-flex tw-items-center tw-gap-2">
                    <div
                      class="tw-ml-2 tw-font-bold tw-text-slate-800 tw-text-lg tw-tracking-tight tw-flex tw-items-center tw-gap-2 tw-bg-gradient-to-r tw-from-slate-800 tw-via-slate-700 tw-to-slate-800 tw-bg-clip-text tw-text-transparent"
                    >
                      AI 智审分析中枢
                    </div>
                  </div>
                </div>

                <!-- 核心区域 -->
                <div class="tw-flex-1 tw-flex tw-flex-col tw-p-4 tw-gap-4 tw-overflow-hidden">
                  <!-- 模块 1：基础指标 + 状态分布 + AI核心指标 + 风险饼图 -->
                  <div class="tw-min-h-[140px] tw-flex tw-gap-4 tw-shrink-0">
                    <!-- 左卡片：基础指标 + 状态分布 + 风险饼图 -->
                    <div
                      class="tw-flex-1 tw-h-full tw-flex tw-items-center tw-justify-between tw-bg-white/70 tw-rounded-xl tw-p-3 tw-shadow-sm tw-border tw-border-white/80 tw-shrink-0 dashboard-card-hover"
                    >
                      <!-- 左：总数/总额 -->
                      <div class="tw-flex tw-gap-4 tw-w-[24%] tw-border-r tw-border-slate-200/50 tw-pr-4">
                        <div class="tw-flex tw-flex-col tw-gap-3 tw-w-full">
                          <div class="tw-flex tw-items-center tw-justify-between">
                            <div class="tw-ml-2 tw-flex tw-items-center tw-gap-2">
                              <div
                                class="tw-w-7 tw-h-7 tw-rounded-full tw-bg-blue-50 tw-text-blue-500 tw-flex tw-items-center tw-justify-center tw-border tw-border-blue-100 tw-shrink-0"
                              >
                                <svg
                                  class="tw-w-4 tw-h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                >
                                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                  <polyline points="2 12 12 17 22 12"></polyline>
                                </svg>
                              </div>
                              <span class="tw-text-[11px] tw-text-slate-500 tw-font-bold">申报总数</span>
                            </div>
                            <div class="tw-flex tw-items-baseline tw-gap-0.5"
                              ><span class="tw-text-lg tw-font-black tw-text-slate-800 tw-leading-none">{{
                                formatNumber(count?.applyProjectCount) || '0'
                              }}</span
                              ><span class="tw-pl-1 tw-text-[10px] tw-text-slate-400">个</span></div
                            >
                          </div>
                          <div class="tw-flex tw-items-center tw-justify-between tw-whitespace-nowrap">
                            <div class="tw-flex tw-ml-2 tw-items-center tw-gap-2 tw-shrink-0">
                              <div
                                class="tw-w-7 tw-h-7 tw-rounded-full tw-bg-blue-50 tw-text-blue-500 tw-flex tw-items-center tw-justify-center tw-border tw-border-blue-100 tw-shrink-0"
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="3"
                                  stroke-linecap="round"
                                >
                                  <path d="M6 3L12 11L18 3" />
                                  <path d="M12 11V21" />
                                  <path d="M7 14H17" />
                                  <path d="M7 18H17" />
                                </svg>
                              </div>
                              <span class="tw-text-[11px] tw-text-slate-500 tw-font-bold">申报总额</span>
                            </div>
                            <div class="tw-flex tw-items-baseline tw-gap-0.5"
                              ><span class="tw-text-lg tw-font-black tw-text-slate-800 tw-leading-none">{{
                                formatNumber(count?.applyProjectAmount) || '0'
                              }}</span
                              ><span class="tw-pl-1 tw-text-[10px] tw-text-slate-400">万元</span></div
                            >
                          </div>
                        </div>
                      </div>

                      <!-- 中：状态分布 -->
                      <div class="tw-w-[34%] tw-px-4 tw-border-r tw-border-slate-200/50 tw-flex tw-flex-col tw-justify-between tw-gap-1.5 tw-h-full">
                        <div
                          class="tw-flex tw-justify-between tw-items-center tw-bg-blue-50/80 tw-px-2.5 tw-py-1 tw-rounded tw-border tw-border-blue-100 tw-shadow-sm"
                        >
                          <span class="tw-text-[11px] tw-text-blue-700 tw-flex tw-items-center tw-gap-1 tw-font-medium"
                            ><span class="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-blue-500"></span>预审通过</span
                          >
                          <div class="tw-flex tw-flex-col tw-items-end tw-gap-0.5">
                            <div class="tw-flex tw-items-baseline tw-justify-end">
                              <span class="tw-text-sm tw-font-black tw-text-slate-800">{{ formatNumber(count?.preApproveProjectCount) || '0' }}</span>
                              <span class="tw-text-[10px] tw-text-slate-400 tw-ml-1"
                                >个，占比{{ formatPercent(count?.preApproveProjectCount, count?.applyProjectCount) }}</span
                              >
                            </div>
                            <div class="tw-flex tw-items-baseline tw-justify-end">
                              <span class="tw-text-sm tw-font-black tw-text-slate-800">{{
                                formatNumber(count?.preApproveProjectCountAmount) || '0'
                              }}</span>
                              <span class="tw-text-[10px] tw-text-slate-400 tw-ml-1"
                                >万元，占比{{ formatPercent(count?.preApproveProjectCountAmount, count?.applyProjectAmount) }}</span
                              >
                            </div>
                          </div>
                        </div>
                        <div
                          class="tw-flex tw-justify-between tw-items-center tw-bg-blue-50/80 tw-px-2.5 tw-py-1 tw-rounded tw-border tw-border-blue-100 tw-shadow-sm"
                        >
                          <span class="tw-text-[11px] tw-text-blue-700 tw-flex tw-items-center tw-gap-1 tw-font-medium"
                            ><span class="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-blue-500"></span>预审中</span
                          >
                          <div class="tw-flex tw-flex-col tw-items-end tw-gap-0.5">
                            <div class="tw-flex tw-items-baseline tw-justify-end">
                              <span class="tw-text-sm tw-font-black tw-text-slate-800">{{
                                formatNumber(count?.preApproveProjectCounting) || '0'
                              }}</span>
                              <span class="tw-text-[10px] tw-text-slate-400 tw-ml-1"
                                >个，占比{{ formatPercent(count?.preApproveProjectCounting, count?.applyProjectCount) }}</span
                              >
                            </div>
                            <div class="tw-flex tw-items-baseline tw-justify-end">
                              <span class="tw-text-sm tw-font-black tw-text-slate-800">{{
                                formatNumber(count?.preApproveProjectCountingAmount) || '0'
                              }}</span>
                              <span class="tw-text-[10px] tw-text-slate-400 tw-ml-1"
                                >万元，占比{{ formatPercent(count?.preApproveProjectCountingAmount, count?.applyProjectAmount) }}</span
                              >
                            </div>
                          </div>
                        </div>
                        <div
                          class="tw-flex tw-justify-between tw-items-center tw-bg-blue-50/80 tw-px-2.5 tw-py-1 tw-rounded tw-border tw-border-blue-100 tw-shadow-sm"
                        >
                          <span class="tw-text-[11px] tw-text-blue-700 tw-flex tw-items-center tw-gap-1 tw-font-medium"
                            ><span class="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-blue-500"></span>被驳回</span
                          >
                          <div class="tw-flex tw-flex-col tw-items-end tw-gap-0.5">
                            <div class="tw-flex tw-items-baseline tw-justify-end">
                              <span class="tw-text-sm tw-font-black tw-text-slate-800">{{
                                formatNumber(count?.preApproveProjectReject) || '0'
                              }}</span>
                              <span class="tw-text-[10px] tw-text-slate-400 tw-ml-1"
                                >个，占比{{ formatPercent(count?.preApproveProjectReject, count?.applyProjectCount) }}</span
                              >
                            </div>
                            <div class="tw-flex tw-items-baseline tw-justify-end">
                              <span class="tw-text-sm tw-font-black tw-text-slate-800">{{
                                formatNumber(count?.preApproveProjectRejectAmount) || '0'
                              }}</span>
                              <span class="tw-text-[10px] tw-text-slate-400 tw-ml-1"
                                >万元，占比{{ formatPercent(count?.preApproveProjectRejectAmount, count?.applyProjectAmount) }}</span
                              >
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 中：风险饼图 -->
                      <div class="tw-w-[42%] tw-h-full tw-relative tw-p-1">
                        <div ref="sciFiPieChart" class="tw-w-full tw-h-full tw-relative tw-z-10"></div>
                      </div>
                    </div>

                    <!-- 右卡片：AI核心指标 (融合数字滚动) -->
                    <div
                      class="tw-w-[30%] tw-h-full tw-flex tw-items-stretch tw-justify-between tw-bg-white/70 tw-rounded-xl tw-p-3 tw-shadow-sm tw-border tw-border-white/80 tw-shrink-0 dashboard-card-hover"
                    >
                      <div class="tw-flex tw-w-full tw-h-full tw-flex-col tw-justify-between">
                        <div
                          class="tw-text-[12px] tw-text-[#008566] tw-font-bold tw-flex tw-items-center tw-gap-1 tw-bg-[#e6f8f3] tw-self-start tw-px-2 tw-py-0.5 tw-rounded-full tw-border tw-border-[#008566]/20"
                        >
                          <div class="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-emerald-400 tw-shadow-[0_0_8px_#34d399] tw-animate-pulse"></div>
                          智能引擎运行中
                        </div>
                        <div class="tw-flex tw-items-end tw-justify-between">
                          <div class="tw-text-[12px] tw-text-slate-500 tw-font-bold tw-mb-0.5 tw-pl-[19px]">累计风险项发现</div>
                          <!-- 原汁原味的跳动数字 -->
                          <div class="tw-flex tw-items-start tw-h-[22px] tw-overflow-hidden tw-font-mono tw-text-2xl tw-font-black tw-text-red-500">
                            <div v-for="(char, index) in splitNumbers" :key="index" class="tw-relative tw-flex tw-items-start tw-h-full">
                              <div v-if="!isNaN(parseInt(char))" class="digit-column" :style="{ transform: `translateY(-${parseInt(char) * 10}%)` }">
                                <div v-for="num in 10" :key="num" class="digit-slot tw-leading-none" style="height: 24px">{{ num - 1 }}</div>
                              </div>
                              <div v-else class="digit-slot tw-px-[1px] symbol-fix tw-leading-none" style="height: 24px">{{ char }}</div>
                            </div>
                            <span class="tw-text-[12px] tw-text-slate-400">个</span>
                          </div>
                        </div>
                        <div class="tw-flex tw-gap-2">
                          <div
                            class="tw-flex-1 tw-flex tw-flex-col tw-justify-center tw-bg-blue-50/80 tw-border tw-border-blue-100 tw-px-1.5 tw-py-2.5 tw-rounded tw-text-center tw-shadow-sm"
                          >
                            <div class="tw-text-[12px] tw-text-slate-500 tw-mb-1.5 tw-font-bold">较人工提升效率</div>
                            <div class="tw-text-sm tw-font-black tw-text-blue-600 tw-leading-tight">+71.67%</div>
                          </div>
                          <div
                            class="tw-flex-1 tw-flex tw-flex-col tw-justify-center tw-bg-emerald-50/80 tw-border tw-border-emerald-100 tw-px-1.5 tw-py-2.5 tw-rounded tw-text-center tw-shadow-sm"
                          >
                            <div class="tw-text-[12px] tw-text-slate-500 tw-mb-1.5 tw-font-bold">预计节省时间</div>
                            <div class="tw-text-sm tw-font-black tw-text-emerald-600 tw-leading-tight"
                              >{{ count.expectSaveTime }} <span class="tw-text-[12px] tw-font-bold">h</span></div
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 下半部分：长列表 -->
                  <div
                    class="tw-flex-1 tw-flex tw-flex-col tw-bg-white/90 tw-rounded-lg tw-overflow-hidden tw-shadow-sm tw-min-h-0 tw-border tw-border-white/80 list-card-hover"
                  >
                    <div class="tw-flex tw-items-center tw-px-3 tw-py-2 tw-bg-slate-50/80 tw-border-b tw-border-slate-200/50 tw-shrink-0">
                      <div class="tw-w-[5%] tw-flex tw-justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="tw-text-[#008566]">
                          <path
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                          <circle cx="12" cy="12" r="4" fill="currentColor" />
                        </svg>
                      </div>
                      <div class="tw-w-[30%] tw-text-[11px] tw-font-bold tw-text-slate-500 tw-pl-2">项目名称</div>
                      <div class="tw-w-[20%] tw-text-[11px] tw-font-bold tw-text-slate-500">事项</div>
                      <div class="tw-w-[15%] tw-text-[11px] tw-font-bold tw-text-slate-500">归口部门</div>
                      <div class="tw-w-[15%] tw-text-[11px] tw-font-bold tw-text-slate-500">申请总额（万元）</div>
                      <div class="tw-w-[15%] tw-text-[11px] tw-font-bold tw-text-slate-500 tw-text-center">初评结论</div>
                    </div>

                    <div class="tw-flex-1 tw-overflow-hidden tw-relative scrolling-container tw-bg-white/50" ref="scrollingContainer">
                      <div class="tw-flex tw-flex-col tw-w-full tw-text-[11px]" :class="{ 'scrolling-animation': shouldScroll }">
                        <div ref="originalList" class="tw-w-full">
                          <div
                            v-for="item in aiAnalysisList"
                            :key="'orig-' + item.projectId"
                            class="tw-flex tw-items-center tw-px-3 tw-py-2 tw-border-b tw-border-slate-50 hover:tw-bg-slate-50/80 tw-transition-all tw-duration-200 hover:tw-translate-x-1 tw-cursor-pointer"
                          >
                            <div class="tw-w-[5%] tw-flex tw-justify-center">
                              <div class="tw-w-1.5 tw-h-1.5 tw-rounded-full" :class="getStatusDotClass(item.aiRiskLevel)"></div>
                            </div>
                            <div class="tw-w-[30%] tw-text-slate-700 tw-font-bold tw-truncate tw-pr-2 tw-pl-2" :title="item.name">{{
                              item.name
                            }}</div>
                            <div class="tw-w-[20%] tw-text-slate-500 tw-truncate tw-pr-2">{{ item.courseTitleName }}</div>
                            <div class="tw-w-[15%] tw-text-slate-500 tw-truncate tw-pr-2">{{ item.affiliateDeptName }}</div>
                            <div class="tw-w-[15%] tw-text-[#008566] tw-font-bold tw-font-mono">{{ item.applyTaxExclusive }}</div>
                            <div class="tw-w-[15%] tw-flex tw-justify-center">
                              <span
                                class="tw-px-1.5 tw-py-0.5 tw-rounded tw-border tw-text-[9px] tw-font-bold"
                                :class="getStatusBadgeClass(item.aiRiskLevel)"
                                >{{ getRiskLevelText(item.aiRiskLevel) }}</span
                              >
                            </div>
                          </div>
                        </div>
                        <div v-if="shouldScroll" class="tw-w-full">
                          <div
                            v-for="item in aiAnalysisList"
                            :key="'clone-' + item.projectId"
                            class="tw-flex tw-items-center tw-px-3 tw-py-2 tw-border-b tw-border-slate-50 hover:tw-bg-slate-50/80 tw-transition-all tw-duration-200 hover:tw-translate-x-1 tw-cursor-pointer"
                          >
                            <div class="tw-w-[5%] tw-flex tw-justify-center">
                              <div class="tw-w-1.5 tw-h-1.5 tw-rounded-full" :class="getStatusDotClass(item.aiRiskLevel)"></div>
                            </div>
                            <div class="tw-w-[30%] tw-text-slate-700 tw-font-bold tw-truncate tw-pr-2 tw-pl-2" :title="item.name">{{
                              item.name
                            }}</div>
                            <div class="tw-w-[20%] tw-text-slate-500 tw-truncate tw-pr-2">{{ item.courseTitleName }}</div>
                            <div class="tw-w-[15%] tw-text-slate-500 tw-truncate tw-pr-2">{{ item.affiliateDeptName }}</div>
                            <div class="tw-w-[15%] tw-text-[#008566] tw-font-bold tw-font-mono">{{ item.applyTaxExclusive }}</div>
                            <div class="tw-w-[15%] tw-flex tw-justify-center">
                              <span
                                class="tw-px-1.5 tw-py-0.5 tw-rounded tw-border tw-text-[9px] tw-font-bold"
                                :class="getStatusBadgeClass(item.aiRiskLevel)"
                                >{{ getRiskLevelText(item.aiRiskLevel) }}</span
                              >
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
// 以下 JS 逻辑代码完全保留，一字未动
import * as echarts from 'echarts'

import { CwProject, CwProjectCount, CwProjectApprove, CwProjectApply } from '@/api/mainController'

import { getYjdwFromCm, getParamValueMulti } from '@/api/common'

import { projectConfigMixin, uploadMixin, statsDateRangeMixin, cachePageMixin, cachedSinglePageMixin } from '@/core/mixins'

import { mapGetters } from 'vuex'

import { ApprovedTypeDict, StatusReserveDict } from '@/staticDict/index.js'

import exportDialog from '@/views/finance/reserveApproval/exportDialog.vue'

import similarSetting from '../components/similarSetting.vue'

// 财务首页默认一级单位的配置参数Key（如需调整请同步后台 sysParam 配置，值为一级单位 code）
const DASHBOARD_YJDW_PARAM = 'DASHBOARD_YJDW'

// --- 新增：抽离审批人通用的参数构造逻辑，避免下面的代码重复写4遍 ---
const buildApproveParams = (pageNum) => ({
  orderParam: [{ fieldName: 'createTime', asc: 1 }],
  pageParam: { pageNum: pageNum, pageSize: 20 },
  cwProjectApproveDtoFilter: {
    // 如果未来需要针对某个具体审批人传特定参数，也可以在这里处理
    status: ApprovedTypeDict.UNAPPROVED,
    noticeRunning: 1
  }
})

const strategyMap = {
  reporter: {
    apiMethod: CwProject.list,
    detailPath: 'projectDetail',
    // 填报人专属参数构造器
    getParams: (pageNum) => ({
      orderParam: [{ fieldName: 'createTime', asc: 1 }],
      pageParam: { pageNum: pageNum, pageSize: 20 },
      cwProjectDtoFilter: {
        // 填报人特有的过滤条件放这里
        reserveStatus: `${StatusReserveDict.DEPARTMENT_REVIEWING},${StatusReserveDict.FINANCE_REVIEWING},${StatusReserveDict.JOINT_REVIEWING}`,
        noticeRunning: 1
      }
    })
  },
  deptApproval: {
    vtSource: 1,
    apiMethod: CwProjectApprove.deptList,
    detailPath: 'deptApprovalDetail',
    getParams: buildApproveParams // 使用通用审批参数
  },
  financeApproval: {
    vtSource: 2,
    apiMethod: CwProjectApprove.financeList,
    detailPath: 'financeApprovalDetail',
    getParams: buildApproveParams
  },
  jysApproval: {
    vtSource: 3,
    apiMethod: CwProjectApprove.jysList,
    detailPath: 'jysApprovalDetail',
    getParams: buildApproveParams
  },
  fzbApproval: {
    vtSource: 4,
    apiMethod: CwProjectApprove.fzbList,
    detailPath: 'fzbApprovalDetail',
    getParams: buildApproveParams
  }
}

export default {
  name: '/finance/dashboard/index',
  mixins: [uploadMixin, statsDateRangeMixin, cachePageMixin, cachedSinglePageMixin, projectConfigMixin],
  data() {
    return {
      activeTab: 'audit', // 默认选中 '审核中'
      chartInstance: null,
      chartClickHandler: null,
      chartLegendSelectHandler: null,
      shouldScroll: false,
      aiLoading: {
        ratioAnalysis: true,
        assetComparison: true,
        necessityAnalysis: true
      },

      // 左侧AI实时分析长列表数据源
      aiAnalysisList: [],
      riskCount: {},
      prevRiskCount: {}, // 用于对比的旧数据
      count: {},
      // 已注释：原 AI 初审分析结论状态，结论卡不展示，仅保留代码
      // analyseReview: '',
      pollTimer: null, // 轮询定时器
      numberKey: 0, // 用于触发数字重渲染的 key
      // ========= 完全独立的 4 个页签状态对象 (修复无用引用) =========
      // 加入 total 字段以便对接接口返回的真实总数
      // ======= 加入下拉刷新状态对象 =======
      pullRefresh: {
        startY: 0,
        distance: 0,
        isDragging: false,
        isRefreshing: false,
        canPull: false,
        statusText: '下拉刷新'
      },
      auditData: {
        list: [],
        page: 1,
        loading: false,
        finished: false,
        total: 0
      },
      todoData: {
        list: [],
        page: 1,
        loading: false,
        finished: false,
        total: 0
      },
      rejectData: {
        list: [],
        page: 1,
        loading: false,
        finished: false,
        total: 0
      },
      doneData: {
        list: [],
        page: 1,
        loading: false,
        finished: false,
        total: 0
      },

      listKey: '',
      showFloatingBtn: true, // 控制悬浮球显隐
      // ======= 一级单位下拉（默认值取配置参数，仅默认值可选） =======
      yjdwList: [], // 一级单位下拉选项
      yjdwValue: '', // 当前选中（v-model）
      defaultYjdw: '' // 配置参数中的默认一级单位（唯一可选项）
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)

    // 初始化加载第一个页签
    this.triggerLoad(this.activeTab)

    // 同时加载审核中、待提交、已驳回这三个页签，以获取各自的 total
    this.triggerLoad('todo')
    this.triggerLoad('reject')

    this.getRefresh()

    // 加载一级单位下拉（默认值来自配置参数）
    this.loadYjdwOptions()

    // 【兜底】确保图表初始化 - 在DOM准备好后先尝试初始化一次
    this.$nextTick(() => {
      this.prevRiskCount = { ...this.riskCount }
      setTimeout(() => {
        this.tryInitChart()
      }, 200)
    })

    // 启动轮询
    this.startPolling()
  },
  // 👇 新增：处理 keep-alive 缓存页面的恢复逻辑
  activated() {
    window.addEventListener('resize', this.handleResize)
    this.startPolling() // 页面恢复可见时重新启动轮询
  },

  // 👇 新增：处理 keep-alive 缓存页面的挂起逻辑
  deactivated() {
    window.removeEventListener('resize', this.handleResize)
    this.stopPolling() // 页面被隐藏缓存时，务必清理定时器！
  },
  beforeUnmount() {
    // 兼容 Vue3
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
    }
    window.removeEventListener('resize', this.handleResize)
    // 停止轮询
    this.stopPolling()
  },

  beforeUnmount() {
    // 兼容 Vue2
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
    }
    window.removeEventListener('resize', this.handleResize)
    // 停止轮询
    this.stopPolling()
  },
  methods: {
    onDragStart(e) {
      // 防止误触 PC 端的按钮或输入框时触发下拉
      const isInput = e.target.closest('button, a, input, [role="button"]')
      if (isInput && e.type === 'mousedown') return

      if (this.pullRefresh.isRefreshing) return

      const activeList = this.$refs[this.activeTab + 'List']
      // 只有在滚动条位于最顶部才能触发下拉手势
      if (activeList && activeList.scrollTop > 0) {
        this.pullRefresh.canPull = false
        return
      }

      this.pullRefresh.canPull = true
      this.pullRefresh.isDragging = true
      this.pullRefresh.startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY
      this.pullRefresh.distance = 0
    },
    onDragMove(e) {
      if (!this.pullRefresh.isDragging || !this.pullRefresh.canPull) return
      const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY
      const diff = currentY - this.pullRefresh.startY

      if (diff > 0) {
        if (e.cancelable && e.type.includes('touch')) e.preventDefault() // 防止网页原生滚动
        // 使用 0.4 的阻尼系数，最大拉取高度 80px
        this.pullRefresh.distance = Math.min(diff * 0.4, 80)
        this.pullRefresh.statusText = this.pullRefresh.distance > 50 ? '释放立即刷新' : '下拉刷新'
      } else {
        this.pullRefresh.distance = 0
      }
    },
    onDragEnd() {
      if (!this.pullRefresh.isDragging) return
      this.pullRefresh.isDragging = false

      if (this.pullRefresh.distance > 50) {
        this.pullRefresh.isRefreshing = true
        this.pullRefresh.statusText = '正在刷新...'
        this.pullRefresh.distance = 50 // 悬停在刷新区

        this.executeRefresh()
          .then(() => {
            this.pullRefresh.statusText = '刷新成功'
            setTimeout(() => {
              this.pullRefresh.distance = 0
              this.pullRefresh.isRefreshing = false
            }, 500)
          })
          .catch(() => {
            this.pullRefresh.statusText = '刷新失败'
            setTimeout(() => {
              this.pullRefresh.distance = 0
              this.pullRefresh.isRefreshing = false
            }, 500)
          })
      } else {
        this.pullRefresh.distance = 0
      }
    },
    async executeRefresh() {
      try {
        this.pullRefresh.isRefreshing = true
        await this.refreshTab(this.activeTab)
        this.getRefresh() // 同步刷新左侧整体概览数据
      } catch (e) {
        console.error(e)
        throw e
      } finally {
        // PC端点击按钮刷新时收尾
        if (!this.pullRefresh.isDragging && this.pullRefresh.distance === 0) {
          this.pullRefresh.isRefreshing = false
        }
      }
    },
    // ======================================
    handleFloatingClick() {
      // 1. 隐藏悬浮球
      this.showFloatingBtn = false

      // 2. 调用弹窗
      this.$dialog
        .show(
          'AI 智能穿透分析报告',
          similarSetting,
          {
            area: ['800px', '600px'],
            end: () => {
              this.showFloatingBtn = true
            }
          },
          {
            projectId: 'AI_ANALYZE_MODE'
          }
        )
        .then(() => {})
        .catch(() => {
          this.showFloatingBtn = true
        })
    },
    handleRouterPush(path) {
      if (this.roleKey !== 'financeApproval') {
        return this.$message({
          message: '无权限',
          type: 'warning'
        })
      }
      this.routerPush({
        path
      })
    },
    getRiskChartAiRiskLevel(name) {
      const riskLevelMap = {
        问题项目: this.AIRiskLevelDict.RISK_HIGH,
        隐患项目: this.AIRiskLevelDict.RISK_MEDIUM,
        异常项目: this.AIRiskLevelDict.RISK_LOW
      }
      return riskLevelMap[name]
    },
    handleRiskChartDrilldown(name) {
      const aiRiskLevel = this.getRiskChartAiRiskLevel(name)
      if (aiRiskLevel == null) return

      this.routerPush({
        path: '/finance/reserveApproval',
        query: {
          aiRiskLevel
        }
      })
    },
    bindRiskChartEvents() {
      if (!this.chartInstance) return

      if (this.chartClickHandler) {
        this.chartInstance.off('click', this.chartClickHandler)
      }
      if (this.chartLegendSelectHandler) {
        this.chartInstance.off('legendselectchanged', this.chartLegendSelectHandler)
      }

      this.chartClickHandler = (params) => {
        if (params?.seriesType !== 'pie') return
        this.handleRiskChartDrilldown(params.name)
      }
      this.chartLegendSelectHandler = (params) => {
        this.handleRiskChartDrilldown(params.name)
      }

      this.chartInstance.on('click', this.chartClickHandler)
      this.chartInstance.on('legendselectchanged', this.chartLegendSelectHandler)
    },
    handleSetting() {
      if (this.roleKey !== 'financeApproval') {
        return this.$message({
          message: '无权限',
          type: 'warning'
        })
      }
      this.$dialog
        .show(
          '配置',
          similarSetting,
          {
            area: ['800px']
          },
          {}
        )
        .then((res) => {
          this.refreshTable(true)
        })
        .catch(() => {})
    },

    handleExport() {
      if (this.roleKey == 'reporter') {
        return this.$message({
          message: '无权限',
          type: 'warning'
        })
      }
      this.$dialog
        .show(
          '导出',
          exportDialog,
          {
            area: ['450px', 'auto']
          },
          {
            vtSource: strategyMap[this.roleKey].vtSource,
            exportOptions: ['financeApproval', 'deptApproval'].includes(this.roleKey) ? [1, 5] : [1]
          }
        )
        .then((res) => {})
        .catch((e) => {})
    },
    onDetail(id, roleKey) {
      const jsonStr = JSON.stringify(this.listKey)
      const encodedStr = encodeURIComponent(jsonStr)

      this.routerPush({
        path: `${strategyMap[roleKey || this.roleKey].detailPath}/${id}`,
        query: {
          listKey: encodedStr
        }
      })
    },
    updateSingleRowLocally(projectId) {
      const tabName = this.activeTab
      const targetData = this[`${tabName}Data`]
      if (!targetData) return

      const index = targetData.list.findIndex((item) => item.projectId === projectId || item.id === projectId)
      if (index === -1) return

      CwProject.view(this, { projectId })
        .then((res) => {
          if (res.data) {
            targetData.list.splice(index, 1, res.data)
          }
        })
        .catch((e) => {
          console.error('局部更新失败:', e)
        })
    },

    removeRowLocally(projectId) {
      const targetData = this[`${this.activeTab}Data`]
      if (!targetData) return
      const index = targetData.list.findIndex((item) => item.projectId === projectId || item.id === projectId)
      if (index !== -1) {
        targetData.list.splice(index, 1)
        if (targetData.total > 0) targetData.total--
      }
    },
    onDeleteRow(row) {
      if (+row.reserveStatus != this.ReserveTypeDict.CREATE && +row.reserveStatus != this.ReserveTypeDict.DELAYED) {
        this.$message.warning(
          `无法删除【${this.ReserveTypeDict.getValue(this.ReserveTypeDict.CREATE)}】和【${this.ReserveTypeDict.getValue(
            this.ReserveTypeDict.DELAYED
          )}】之外的数据`
        )
        return
      }
      if (
        [this.StatusRealDict.CREATE, this.StatusRealDict.CREATE_FINISH, this.StatusRealDict.REJECT_DEPT, this.StatusRealDict.REJECT_FINANCE].indexOf(
          row.status
        ) == -1
      ) {
        this.$message.warning('无法删除')
        return
      }
      const params = {
        projectIdList: [row.projectId]
      }
      this.$confirm('是否删除此数据？')
        .then((res) => {
          return CwProject.deleteBatch(this, params)
        })
        .then((res) => {
          this.$message.success('删除成功')
          this.refreshTab(this.activeTab)
          this.getRefresh()
        })
        .catch((e) => {})
    },
    handleSubmit(projectId) {
      if (!projectId) {
        return
      }
      return this.$confirm('是否提交?').then(() => {
        return CwProjectApply.submit(this, { projectId })
          .then((res) => {
            this.$message.success('提交成功')
            this.refreshTab(this.activeTab)
            this.getRefresh()
          })
          .catch((e) => {
            if (projectId) {
              this.updateSingleRowLocally(projectId)
            } else {
              this.refreshTab(this.activeTab)
            }
            this.getRefresh()
          })
      })
    },
    getRefresh() {
      // this.getChartRiskCount();
      // 已注释：原 AI 初审分析结论请求，结论卡不展示，仅保留代码
      // this.getAnalyseReview()
      this.getCount()
      this.getAiAnalysisList()
    },
    // 加载一级单位下拉：选项取 getYjdwFromCm，默认值取配置参数 DASHBOARD_YJDW_PARAM
    async loadYjdwOptions() {
      try {
        const [listRes, paramRes] = await Promise.all([getYjdwFromCm(), getParamValueMulti([DASHBOARD_YJDW_PARAM])])
        this.yjdwList = (listRes && listRes.data) || []
        const paramVal = paramRes && paramRes.data ? paramRes.data[DASHBOARD_YJDW_PARAM] : ''
        // 默认值优先取配置参数；缺省时兜底取列表第一项，保证始终有一个可选项
        this.defaultYjdw = paramVal || (this.yjdwList[0] && this.yjdwList[0].code) || ''
        this.yjdwValue = this.defaultYjdw
      } catch (e) {
        console.error('加载一级单位下拉失败:', e)
      }
    },
    getChartRiskCount() {
      CwProjectCount.riskCount(this, {}).then((res) => {
        const newData = res.data
        const isValChanged = this.checkDataChanged(this.riskCount, newData)

        if (isValChanged) {
          this.numberKey++
        }

        this.riskCount = { ...newData }
        this.initChart()
      })
    },
    checkDataChanged(prev, curr) {
      const keys = ['monthRiskCount', 'problemCount', 'hiddenDangerCount', 'exceptionCount']
      return keys.some((key) => prev[key] !== curr[key])
    },
    // 1. 优化后的启动逻辑
    startPolling() {
      // 强制清理现有的，确保不重复启动
      this.stopPolling()

      console.log('启动定时器 - 智审数据监控')

      // 立即执行一次获取最新数据
      this.getChartRiskCount()

      // 开启定时任务
      this.pollTimer = setInterval(() => {
        console.log('定时轮询中...')
        this.getChartRiskCount()
      }, 30 * 1000) // 30秒一次
    },

    // 2. 停止逻辑
    stopPolling() {
      if (this.pollTimer) {
        console.log('停止并清理定时器')
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },
    getCount() {
      CwProjectCount.count(this, {}).then((res) => {
        this.count = res.data
      })
    },
    // 已注释：原 AI 初审分析结论请求方法，结论卡不展示，仅保留代码
    // getAnalyseReview() {
    //   CwProjectCount.analyseReview(this, {}).then((res) => {
    //     this.analyseReview = res.data
    //   })
    // },
    getAiAnalysisList() {
      const params = {
        orderParam: [{ fieldName: 'createTime', asc: 1 }],
        pageParam: { pageNum: 1, pageSize: 20 },
        cwProjectDtoFilter: {
          aiRiskLevel: `${this.AIRiskLevelDict.RISK_HIGH},${this.AIRiskLevelDict.RISK_MEDIUM},${this.AIRiskLevelDict.RISK_LOW}`,
          noticeRunning: 1
        }
      }
      return new Promise((resolve, reject) => {
        CwProject.list(this, params, {
          headers: { MenuId: '1896798431855251456' }
        })
          .then((res) => {
            this.aiAnalysisList = [...res.data.dataList]
            this.$nextTick(() => {
              this.checkScrollable()
            })
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    refreshTab(tabName) {
      const targetData = this[`${tabName}Data`]
      if (!targetData) return
      targetData.list = []
      targetData.page = 1
      targetData.finished = false
      targetData.total = 0
      targetData.loading = false
      this.triggerLoad(tabName)
    },
    switchTab(tab) {
      this.activeTab = tab
      const targetData = this[`${tab}Data`]
      if (targetData && targetData.list.length === 0 && !targetData.finished) {
        this.triggerLoad(tab)
      }
    },
    handleScroll(tabName, e) {
      const { scrollTop, clientHeight, scrollHeight } = e.target
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        this.triggerLoad(tabName)
      }
    },
    triggerLoad(tabName) {
      if (tabName === 'audit' && !this.auditData.loading && !this.auditData.finished) {
        this.fetchAuditList()
      }
      if (tabName === 'todo' && !this.todoData.loading && !this.todoData.finished) {
        this.fetchTodoList()
      }
      if (tabName === 'reject' && !this.rejectData.loading && !this.rejectData.finished) {
        this.fetchRejectList()
      }
      if (tabName === 'done' && !this.doneData.loading && !this.doneData.finished) {
        this.fetchDoneList()
      }
    },
    fetchAuditList() {
      this.auditData.loading = true
      const currentStrategy = strategyMap[this.roleKey]
      const params = currentStrategy.getParams(this.auditData.page)

      return new Promise((resolve, reject) => {
        currentStrategy
          .apiMethod(this, params, { headers: { MenuId: '1896798431855251456' } }, { showMask: false })
          .then((res) => {
            const listData = res.data?.dataList || []
            this.listKey = res.data.listKey
            this.auditData.total = res.data?.totalCount || res.data?.total || 0

            const mappedList = listData.map((item) => ({
              ...item,
              aiLoading: true
            }))

            this.auditData.list.push(...mappedList)
            this.auditData.page++

            if (this.auditData.list.length >= this.auditData.total || listData.length === 0) {
              this.auditData.finished = true
            }

            this.$nextTick(() => {
              setTimeout(() => {
                mappedList.forEach((item) => {
                  item.aiLoading = false
                })
              }, 1000)
            })
            resolve(res)
          })
          .catch((e) => {
            reject(e)
          })
          .finally(() => {
            this.auditData.loading = false
          })
      })
    },
    fetchTodoList() {
      this.todoData.loading = true
      const params = {
        orderParam: [{ fieldName: 'createTime', asc: 1 }],
        pageParam: { pageNum: this.todoData.page, pageSize: 20 },
        cwProjectDtoFilter: { reserveStatus: StatusReserveDict.PENDING_SUBMIT }
      }

      return new Promise((resolve, reject) => {
        CwProject.list(this, params, { headers: { MenuId: '1896798431855251456' } }, { showMask: false })
          .then((res) => {
            const listData = res.data?.dataList || []
            this.todoData.total = res.data?.totalCount || res.data?.total || 0
            const mappedList = listData.map((item) => ({ ...item }))

            this.todoData.list.push(...mappedList)
            this.todoData.page++

            if (this.todoData.list.length >= this.todoData.total || listData.length === 0) {
              this.todoData.finished = true
            }
            resolve(res)
          })
          .catch((e) => {
            reject(e)
          })
          .finally(() => {
            this.todoData.loading = false
          })
      })
    },
    fetchRejectList() {
      this.rejectData.loading = true
      const params = {
        orderParam: [{ fieldName: 'createTime', asc: 1 }],
        pageParam: { pageNum: this.rejectData.page, pageSize: 20 },
        cwProjectDtoFilter: { reserveStatus: StatusReserveDict.REJECTED }
      }

      return new Promise((resolve, reject) => {
        CwProject.list(this, params, { headers: { MenuId: '1896798431855251456' } }, { showMask: false })
          .then((res) => {
            const listData = res.data?.dataList || []
            this.rejectData.total = res.data?.totalCount || res.data?.total || 0
            const mappedList = listData.map((item) => ({ ...item }))

            this.rejectData.list.push(...mappedList)
            this.rejectData.page++

            if (this.rejectData.list.length >= this.rejectData.total || listData.length === 0) {
              this.rejectData.finished = true
            }
            resolve(res)
          })
          .catch((e) => {
            reject(e)
          })
          .finally(() => {
            this.rejectData.loading = false
          })
      })
    },
    fetchDoneList() {
      this.doneData.loading = true
      const params = {
        orderParam: [{ fieldName: 'createTime', asc: 1 }],
        pageParam: { pageNum: this.doneData.page, pageSize: 20 },
        cwProjectDtoFilter: { reserveStatus: StatusReserveDict.PRE_REVIEW_COMPLETED }
      }

      return new Promise((resolve, reject) => {
        CwProject.list(this, params, { headers: { MenuId: '1896798431855251456' } }, { showMask: false })
          .then((res) => {
            const listData = res.data?.dataList || []
            this.doneData.total = res.data?.totalCount || res.data?.total || 0
            const mappedList = listData.map((item) => ({ ...item }))

            this.doneData.list.push(...mappedList)
            this.doneData.page++

            if (this.doneData.list.length >= this.doneData.total || listData.length === 0) {
              this.doneData.finished = true
            }
            resolve(res)
          })
          .catch((e) => {
            reject(e)
          })
          .finally(() => {
            this.doneData.loading = false
          })
      })
    },
    getAuditBorderClass(level) {
      const val = level != null ? +level : null
      const map = {
        [this.AIRiskLevelDict.RISK_HIGH]: 'tw-bg-gradient-to-b tw-from-red-500 tw-to-red-700',
        [this.AIRiskLevelDict.RISK_MEDIUM]: 'tw-bg-gradient-to-b tw-from-orange-400 tw-to-orange-600',
        [this.AIRiskLevelDict.RISK_LOW]: 'tw-bg-gradient-to-b tw-from-yellow-400 tw-to-yellow-600',
        [this.AIRiskLevelDict.UNANALYZED]: 'tw-bg-gradient-to-b tw-from-slate-300 tw-to-slate-400',
        [this.AIRiskLevelDict.ANALYZING]: 'tw-bg-gradient-to-b tw-from-blue-400 tw-to-blue-600',
        [this.AIRiskLevelDict.AI_APPROVED]: 'tw-bg-gradient-to-b tw-from-emerald-400 tw-to-emerald-600'
      }
      return map[val] || 'tw-bg-gradient-to-b tw-from-slate-300 tw-to-slate-400'
    },
    getStatusDotClass(status) {
      const map = {
        [this.AIRiskLevelDict.RISK_HIGH]: 'tw-bg-red-500 tw-shadow-[0_0_5px_red]',
        [this.AIRiskLevelDict.RISK_MEDIUM]: 'tw-bg-orange-500 tw-shadow-[0_0_5px_orange]',
        [this.AIRiskLevelDict.RISK_LOW]: 'tw-bg-yellow-400 tw-shadow-[0_0_5px_yellow]',
        [this.AIRiskLevelDict.UNANALYZED]: 'tw-bg-gray-400',
        [this.AIRiskLevelDict.ANALYZING]: 'tw-bg-blue-500',
        [this.AIRiskLevelDict.AI_APPROVED]: 'tw-bg-emerald-500'
      }
      return map[status] || map[this.AIRiskLevelDict.UNANALYZED]
    },
    getStatusBadgeClass(status) {
      if (status != null) {
        status = +status
      }
      const map = {
        [this.AIRiskLevelDict.RISK_HIGH]: 'tw-bg-red-50 tw-border-red-200 tw-text-red-600',
        [this.AIRiskLevelDict.RISK_MEDIUM]: 'tw-bg-orange-50 tw-border-orange-200 tw-text-orange-600',
        [this.AIRiskLevelDict.RISK_LOW]: 'tw-bg-yellow-50 tw-border-yellow-200 tw-text-yellow-600',
        [this.AIRiskLevelDict.UNANALYZED]: 'tw-bg-gray-50 tw-border-gray-200 tw-text-gray-600',
        [this.AIRiskLevelDict.ANALYZING]: 'tw-bg-blue-50 tw-border-blue-200 tw-text-blue-600',
        [this.AIRiskLevelDict.AI_APPROVED]: 'tw-bg-emerald-50 tw-border-emerald-200 tw-text-emerald-600'
      }
      return map[status] || map[this.AIRiskLevelDict.UNANALYZED]
    },
    getRiskLevelText(level) {
      if (level != null) {
        level = +level
      }
      return this.AIRiskLevelDict.getValue(level) || '未知'
    },
    formatNumber(num) {
      if (num == null || num === 0) return '0'
      return Number(num).toLocaleString('en-US')
    },
    formatPercent(value, total) {
      const numerator = Number(value) || 0
      const denominator = Number(total) || 0
      if (denominator === 0) return '0%'
      return Math.round((numerator / denominator) * 100) + '%'
    },
    checkScrollable() {
      this.$nextTick(() => {
        const container = this.$refs.scrollingContainer
        const list = this.$refs.originalList
        if (container && list) {
          this.shouldScroll = list.offsetHeight > container.offsetHeight
        }
      })
    },
    initChart() {
      this.$nextTick(() => {
        this.$nextTick(() => {
          setTimeout(() => {
            this.tryInitChart()
          }, 50)
        })
      })
    },
    tryInitChart(retryCount = 0) {
      // 【防泄漏校验】如果组件已被销毁，终止一切后续操作
      if (this._isDestroyed || this._isBeingDestroyed || this._isUnmounted) return

      const chartDom = this.$refs.sciFiPieChart
      if (!chartDom || chartDom.offsetHeight === 0) {
        if (retryCount < 3) {
          setTimeout(() => {
            this.tryInitChart(retryCount + 1)
          }, 100 * (retryCount + 1))
        }
        return
      }

      try {
        if (this.chartInstance) {
          this.chartInstance.setOption(this.chartOption, { notMerge: true })
          this.chartInstance.resize()
          this.bindRiskChartEvents()
          return
        }
        this.chartInstance = echarts.init(chartDom)
        this.chartTrigger++
        this.chartInstance.setOption(this.chartOption)
        this.bindRiskChartEvents()
      } catch (error) {
        console.error('图表初始化失败:', error)
      }
    },
    handleResize() {
      if (this.chartInstance) this.chartInstance.resize()
      this.checkScrollable()
    }
  },
  computed: {
    ...mapGetters(['getUserMsg']),
    // 角色判断已去除：user 对象不含 roleId，统一按 financeApproval 处理（与原本兜底行为一致）
    roleKey() {
      return 'financeApproval'
    },
    splitNumbers() {
      const numStr = this.formatNumber(this.riskCount?.monthRiskCount || 0)
      return numStr.toString().split('')
    },
    // 完全重构后的新版浅色图表配置，动态绑定原始真实数据
    chartOption() {
      const _trigger = this.chartTrigger

      // 动态获取数值
      const problem = Number(this.riskCount.problemCount) || 0
      const exception = Number(this.riskCount.exceptionCount) || 0
      const hidden = Number(this.riskCount.hiddenDangerCount) || 0
      const total = problem + exception + hidden

      const getPercent = (val) => this.formatPercent(val, total)

      return {
        tooltip: {
          trigger: 'item',
          formatter: (params) => `${params.name}: ${this.formatNumber(params.value)}个，占比${getPercent(params.value)}`,
          backgroundColor: 'rgba(255,255,255,0.95)',
          textStyle: { color: '#333', fontSize: 12 },
          borderWidth: 1,
          borderColor: '#eee'
        },
        legend: {
          orient: 'vertical',
          right: '4%',
          top: 'center',
          icon: 'circle',
          itemWidth: 8,
          itemGap: 22,
          textStyle: {
            color: '#334155',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          },
          formatter: (name) => {
            const dataMap = {
              问题项目: problem,
              异常项目: exception,
              隐患项目: hidden
            }
            const value = dataMap[name] || 0
            return `${name}   ${this.formatNumber(value)}个，占比 ${getPercent(value)}`
          }
        },
        series: [
          {
            name: '风险项目成分',
            type: 'pie',
            radius: ['52%', '95%'],
            center: ['25%', '50%'],
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: 'rgba(0, 0, 0, 0.04)',
              shadowBlur: 4
            },
            label: {
              show: true,
              position: 'center',
              formatter: '风险分布',
              fontSize: 11,
              color: '#64748b',
              fontWeight: 'bold'
            },
            labelLine: { show: false },
            data: [
              { value: problem, name: '问题项目', itemStyle: { color: '#ef4444' } },
              { value: exception, name: '异常项目', itemStyle: { color: '#eab308' } },
              { value: hidden, name: '隐患项目', itemStyle: { color: '#f97316' } }
            ],
            animationType: 'scale',
            animationEasing: 'elasticOut'
          }
        ]
      }
    }
  }
}
</script>

<style lang="scss">
.rr-view-ctx-card:has(.dashboard) {
  background: transparent;
}

/* =========================================
   一级单位下拉弹层（popper）样式
   说明：弹层会被 teleport 到 body 之外，必须放在非 scoped 块里才能命中
========================================= */
.custom-banner-select-popper.el-popper {
  border: 1px solid rgba(147, 197, 253, 0.5) !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.96) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  box-shadow: 0 12px 30px -8px rgba(29, 124, 242, 0.18), 0 4px 12px rgba(29, 124, 242, 0.08) !important;
  overflow: hidden;
  padding: 4px !important;
}

.custom-banner-select-popper .el-select-dropdown__item {
  color: #334155 !important;
  font-weight: 500 !important;
  border-radius: 8px;
  margin: 2px 4px;
  transition: all 0.2s ease;
}

.custom-banner-select-popper .el-select-dropdown__item:not(.is-disabled):hover {
  background: linear-gradient(90deg, rgba(219, 234, 254, 0.7), rgba(191, 219, 254, 0.45)) !important;
  color: #1d4ed8 !important;
}

.custom-banner-select-popper .el-select-dropdown__item.is-selected,
.custom-banner-select-popper .el-select-dropdown__item.selected {
  color: #1d4ed8 !important;
  font-weight: 700 !important;
  background: linear-gradient(90deg, rgba(219, 234, 254, 0.75), rgba(191, 219, 254, 0.55)) !important;
}

.custom-banner-select-popper .el-select-dropdown__item.is-disabled {
  color: #94a3b8 !important;
  cursor: not-allowed;
}

.custom-banner-select-popper.el-popper .el-popper__arrow::before {
  background: rgba(255, 255, 255, 0.96) !important;
  border-color: rgba(147, 197, 253, 0.5) !important;
}

/* =========================================
   Slogan 极光蓝银流光特效
========================================= */
.slogan-shine-sweep {
  /*
    底色改成了深科技蓝 (#1e3a8a)，过渡色改为冰雪蓝 (#93c5fd)，
    保留了中间扫光的高亮纯白 (#ffffff)，整字呈现极佳的深蓝到纯白的流光质感
  */
  background: linear-gradient(
    110deg,
    #1e3a8a 15%,
    /* 蓝色调底色：深邃科技蓝 */ #93c5fd 35%,
    /* 冰雪蓝过渡 */ #ffffff 50%,
    /* 扫光纯白 */ #93c5fd 65%,
    #1e3a8a 85%
  );
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;

  /* 4秒流光扫过动画 */
  animation: shine-sweep 4s linear infinite;

  /* 阴影也同步改成了更清爽的蓝光晕，完全融入你的系统环境色 */
  filter: drop-shadow(0 2px 3px rgba(15, 43, 90, 0.35)) drop-shadow(0 0 12px rgba(29, 124, 242, 0.3));
}

@keyframes shine-sweep {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}
@keyframes shine-sweep {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

@keyframes shine-sweep {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}
</style>

<style scoped>
/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}

/* 禁用文本选择 */
.custom-scrollbar,
.overflow-y-auto {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 弥散渐变背景效果 */
.diffuse-bg {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

.banner {
  background: linear-gradient(to right, #a1d8b1, #a7d8e9);
  padding: 20px;
  border-radius: 15px;
}

.diffuse-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.5;
  z-index: 0;
  animation: pulse-blob 8s infinite alternate;
}
@keyframes pulse-blob {
  0% {
    transform: scale(1) translate(0, 0);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.2) translate(10px, -10px);
    opacity: 0.6;
  }
  100% {
    transform: scale(0.9) translate(-10px, 10px);
    opacity: 0.4;
  }
}

/* 玻璃态前景容器 */
.glass-front {
  position: relative;
  z-index: 10;
}

/* 动态彩色光效边缘 */
@keyframes glowing-border {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.ai-glow-edge-wrapper {
  position: relative;
  border-radius: 12px;
  z-index: 1;
}
.ai-glow-edge-wrapper::before {
  content: '';
  position: absolute;
  inset: -2px;
  z-index: -1;
  background: linear-gradient(90deg, #a8e6cf, #dcedc1, #ffd3b6, #ffaaa5, #a8e6cf);
  background-size: 200% 200%;
  animation: glowing-border 4s linear infinite;
  border-radius: 14px;
  filter: blur(8px);
  opacity: 0.5;
}

/* 长列表滚动动画 */
@keyframes scroll-y {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}
.scrolling-animation {
  animation: scroll-y 20s linear infinite;
}
.scrolling-container:hover .scrolling-animation {
  animation-play-state: paused;
}

@keyframes breathe {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
.breathe-glow {
  animation: breathe 4s ease-in-out infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 1s linear infinite;
}

/* 数字滚动特效核心 CSS */
.digit-column {
  display: flex;
  flex-direction: column;
  transition: transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  align-self: flex-start;
  will-change: transform;
}
.digit-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.symbol-fix {
  display: flex;
  align-items: center;
  justify-content: center;
}
@keyframes digit-appear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.digit-column div {
  animation: digit-appear 0.4s ease-out backwards;
}

/* 悬浮波动动画 */
@keyframes float-animation {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-12px);
  }
  100% {
    transform: translateY(0px);
  }
}

.float-animation {
  animation: float-animation 3s ease-in-out infinite;
}

.group:hover .rounded-full {
  background-color: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
}

/* =========================================
   自定义一级单位选择框样式（蓝调融合版）
========================================= */
.custom-banner-select {
  --el-select-border-color-hover: transparent;
  --el-select-input-focus-border-color: transparent;
}

:deep(.custom-banner-select) {
  width: 100% !important;
}

/* 兼容 Element Plus 新版 .el-select__wrapper 与旧版 .el-input__wrapper */
:deep(.custom-banner-select .el-select__wrapper),
:deep(.custom-banner-select .el-input__wrapper) {
  /* 默认：极淡的蓝调玻璃，与 banner 的浅蓝渐变同色系 */
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.45), rgba(191, 219, 254, 0.28)) !important;
  border: 1px solid rgba(147, 197, 253, 0.45) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(29, 124, 242, 0.04) !important;
  border-radius: 10px !important;
  padding: 0 12px !important;
  transition: all 0.3s ease !important;
  height: 34px !important;
  min-height: 34px !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
}

/* 悬停：边框点亮、底色加深，呼应主题蓝 */
:deep(.custom-banner-select .el-select__wrapper:hover),
:deep(.custom-banner-select .el-input__wrapper:hover) {
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.7), rgba(191, 219, 254, 0.5)) !important;
  border-color: rgba(96, 165, 250, 0.7) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 4px 14px rgba(29, 124, 242, 0.12) !important;
}

/* 聚焦：边框使用主题蓝 + 柔和发光 */
:deep(.custom-banner-select .el-select__wrapper.is-focused),
:deep(.custom-banner-select .el-input__wrapper.is-focus) {
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.85), rgba(191, 219, 254, 0.6)) !important;
  border-color: #1d7cf2 !important;
  box-shadow: 0 0 0 3px rgba(29, 124, 242, 0.15), 0 4px 14px rgba(29, 124, 242, 0.18) !important;
}

:deep(.custom-banner-select .el-input__inner:hover),
:deep(.custom-banner-select .el-input__inner:focus),
:deep(.custom-banner-select .el-input__inner:active) {
  border-color: rgba(96, 165, 250, 0.7) !important;
}

/* 选中值与占位符文字 */
:deep(.custom-banner-select .el-select__placeholder),
:deep(.custom-banner-select .el-select__selection),
:deep(.custom-banner-select .el-input__inner) {
  color: #1e3a8a !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  background: transparent !important;
}

:deep(.custom-banner-select .el-select__placeholder.is-transparent) {
  color: rgba(30, 58, 138, 0.45) !important;
}

/* 下拉箭头图标 */
:deep(.custom-banner-select .el-select__caret),
:deep(.custom-banner-select .el-select__icon) {
  color: #1d7cf2 !important;
  font-weight: 700 !important;
}

/* =========================================
   Slogan 极光蓝银流光特效
========================================= */
.slogan-shine-sweep {
  background: linear-gradient(
    110deg,
    #1e3a8a 15%,
    /* 蓝色调底色：深邃科技蓝 */ #93c5fd 35%,
    /* 冰雪蓝过渡 */ #ffffff 50%,
    /* 扫光纯白 */ #93c5fd 65%,
    #1e3a8a 85%
  );
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;

  /* 4秒流光扫过动画 */
  animation: shine-sweep 4s linear infinite;
  filter: drop-shadow(0 2px 3px rgba(15, 43, 90, 0.35)) drop-shadow(0 0 12px rgba(29, 124, 242, 0.3));
}

@keyframes shine-sweep {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

/* =========================================
   统一标签卡片基础样式（极简融入背景版）
========================================= */
.tag-card {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 8px;
  background: transparent;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tag-icon-wrapper {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: transparent;
}

.tag-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  transition: color 0.3s ease;
}

/* 橙色 */
.tag-card-orange .tag-icon-wrapper {
  color: #f97316;
}
.tag-card-orange:hover {
  background-color: rgba(253, 186, 116, 0.15);
}
.tag-card-orange:hover .tag-label {
  color: #ea580c;
}

/* 蓝色 */
.tag-card-blue .tag-icon-wrapper {
  color: #3b82f6;
}
.tag-card-blue:hover {
  background-color: rgba(147, 197, 253, 0.15);
}
.tag-card-blue:hover .tag-label {
  color: #2563eb;
}

/* 闪烁保留 */
.tag-card-blue:hover .tag-icon-wrapper svg {
  animation: diamond-pulse 1.5s ease-in-out infinite;
}
@keyframes diamond-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
    filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.4));
  }
}

/* 绿色 */
.tag-card-emerald .tag-icon-wrapper {
  color: #10b981;
}
.tag-card-emerald:hover {
  background-color: rgba(110, 231, 183, 0.15);
}
.tag-card-emerald:hover .tag-label {
  color: #059669;
}
.tag-card-emerald:hover .tag-icon-wrapper svg {
  transform: rotate(45deg);
}

/* 玫瑰红 */
.tag-card-rose .tag-icon-wrapper {
  color: #f43f5e;
}
.tag-card-rose:hover {
  background-color: rgba(253, 164, 175, 0.15);
}
.tag-card-rose:hover .tag-label {
  color: #e11d48;
}

.tag-card-rose:hover .tag-icon-wrapper svg {
  animation: shield-shake 0.5s ease-in-out;
}
@keyframes shield-shake {
  0%,
  100% {
    transform: rotate(0);
  }
  20%,
  60% {
    transform: rotate(-8deg);
  }
  40%,
  80% {
    transform: rotate(8deg);
  }
}

/* 针对新版 Banner 的背景渐变 */
@keyframes mesh-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.banner-new-style {
  background: linear-gradient(135deg, #f5f9ff, #edf4ff, #e1ebff, #f2f7ff);
  background-size: 300% 300%;
  animation: mesh-shift 15s ease infinite;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.banner-new-style:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -5px rgba(29, 124, 242, 0.1), 0 8px 20px -6px rgba(29, 124, 242, 0.06);
}

/* 仪表盘卡片悬浮动效 */
.dashboard-card-hover {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.dashboard-card-hover:hover {
  background-color: rgba(255, 255, 255, 0.88) !important;
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.04) !important;
}

/* 列表卡片悬浮动效 */
.list-card-hover {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.list-card-hover:hover {
  background-color: rgba(255, 255, 255, 0.96) !important;
  box-shadow: 0 12px 28px -10px rgba(0, 0, 0, 0.06) !important;
}

/* =========================================
   Banner 新增融合特效
========================================= */

/* 简单的悬停过渡小动画 */
.transition-hover {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.transition-hover:hover {
  background-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

/* 3D 装饰图轻微呼吸漂浮 */
.banner-img-float {
  animation: float-img 6s ease-in-out infinite;
}
@keyframes float-img {
  0%,
  100% {
    transform: translateY(-50%) scale(1);
  }
  50% {
    transform: translateY(calc(-50% - 8px)) scale(1.02);
  }
}

.banner-img-mask {
  -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.3) 40%, black 70%);
  mask-image: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.3) 40%, black 70%);
}
</style>
