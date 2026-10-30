<!--
  AI 智能审核首页（三）。
  版式照 docs/1009/智能工作台v0.3 - 副本.html 复刻：顶部一块「品牌栏 + 智能审核路径导览」
  （2026-10-13 由两张卡并成一张，中间一条渐变细线分隔）+ 四张带图的指标卡 + 清单。
  取数一律走真实接口（见 hooks/useSmartReviewHomeThree.ts），原型里的写死数据只用来定版式。

  与原型的三处有意为之的差异（都是「原型是静态演示、这里是真页面」带来的）：
  1. 四张卡的统计口径按接口字段落位（原型的演示数字没有对应接口，例如环图给的是「审核意见分布」
     而不是「按问题类型」），因此卡2/卡4 不带维度下拉 —— 没有第二个维度可切。
  2. 原型清单里的「AI预算结果」三点指示、「AI意见」两列没有数据源，不摆空壳。
  3. 页头不做 1670px 固定宽：宽屏按 1600 居中，窄屏跟着收缩，避免在布局里被裁掉右半边。
-->
<template>
  <div v-if="isShowPage" class="srh3-viewport">
    <div class="page">
      <!-- ========================= 顶部品牌栏 + 智能审核路径导览（合并为一块） ========================= -->
      <!-- 照 docs/1009/智能工作台v0.3 - 副本.html：两者同处一个 panel，中间用一条渐变细线分隔；
           导览只是「看一眼走到哪」的说明块，不再单独占一张卡 -->
      <header class="panel topbar">
        <div class="topbar-glow" aria-hidden="true"></div>

        <!-- 品牌栏（照原型 2026-10-14 版）：logo + 特性标签在左，主标题绝对居中（渐变色突出），
             数据统计期 + 刷新数据在右；窄屏时主标题回到文档流独占一行（见 .brand-title 的媒体查询） -->
        <div class="topbar-row">
          <div class="topbar-left">
            <span class="icon-chip chip-teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="m9 14 2 2 4-4" />
              </svg>
            </span>
            <span v-for="tag in FEATURE_TAGS" :key="tag.text" class="pill" :class="`pill--${tag.tone}`">{{ tag.text }}</span>
          </div>

          <span class="brand-title">
            <span class="brand-title-text">{{ PAGE_TITLE }}</span>
          </span>

          <div class="topbar-actions">
            <!-- 数据统计期：这个区间喂给指标卡与四个面板（点右侧「刷新数据」才生效，见 queryByDate）
                 起止必须同年：结束日期的可选范围锁在开始日期所在年
                 （文案 2026-10-13 由原型里的「数据截止」改为「数据统计期」，用户要求保持不变） -->
            <span class="pill pill--gray date-pill">
              统计期间
              <input v-model="dateRange.start" class="date-input" type="date" aria-label="统计开始日期" />
              <span class="date-sep">至</span>
              <input v-model="dateRange.end" class="date-input" type="date" aria-label="统计结束日期" :min="endBounds.min" :max="endBounds.max" />
            </span>

            <button class="btn" type="button" @click="queryByDate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
              刷新数据
            </button>
          </div>
        </div>

        <!-- 品牌栏与路径导览之间的分隔线（照原型：左端青绿、向右淡出的 1px 细线） -->
        <div class="topbar-divider" aria-hidden="true"></div>

        <!-- 智能审核路径导览（纯导览动画：进入页面从头播一轮，走完停在终态，不代表任何接口状态） -->
        <div class="guide-head">
          <h1 class="guide-title">
            <i class="title-bar"></i>智能审核路径导览
            <!-- <span class="count-chip">{{ REVIEW_STEPS.length }} 个环节</span> -->
          </h1>
          <!-- 角色图例：环节标签里那枚小图标 = 谁执行（照原型放右上角，各项独立分开） -->
          <div class="step-legend">
            <span v-for="item in stepLegends" :key="item.label" class="step-legend-item" :title="item.name">
              <span class="role-icon" :class="`role-icon--${item.tone}`">
                <component :is="item.icon" :size="9" :stroke-width="2.2" aria-hidden="true" />
              </span>
              {{ item.label }}
            </span>
          </div>
        </div>

        <div class="stepper-scroll">
          <div class="stepper" :class="{ 'is-finished': isGuideFinished }">
            <div
              v-for="(step, index) in reviewSteps"
              :key="step.label"
              class="step"
              :class="{ active: guideStep === index + 1, completed: guideStep > index + 1 }"
            >
              <div class="step-circle">
                <span class="step-num">{{ index + 1 }}</span>
                <svg
                  class="step-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <!-- 连线画在圆点右半边：最后一步没有下一段，所以 CSS 里对 :last-child 隐藏 -->
              <div class="step-line"><i :style="{ width: guideStep >= index + 1 ? '100%' : '0%' }"></i></div>
              <!-- 环节名 + 责任角色小图标（照原型内联在标签前）：谁执行由图标说明，图例在标题行右上角 -->
              <span class="step-label">
                <span v-if="step.role" class="role-icon" :class="`role-icon--${step.role.tone}`" :title="step.role.name">
                  <component :is="step.icon" :size="9" :stroke-width="2.2" aria-hidden="true" />
                </span>
                {{ step.label }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- ========================= 四张指标卡 ========================= -->
      <section class="stats">
        <!-- 卡1：AI预审项目 —— 归口部门柱状图（点柱按归口部门筛下方清单，两个维度各取一次接口） -->
        <div class="panel card">
          <div class="card-head">
            <div class="card-head-left">
              <span class="icon-chip chip-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
                </svg>
              </span>
              <h3 class="panel-title">AI预审项目</h3>
            </div>
            <select v-model="barDim" class="mini-select" aria-label="AI预审项目统计维度">
              <option value="count">按数量</option>
              <option value="amount">按金额</option>
            </select>
          </div>

          <div class="stat-tile">
            <div class="stat-cell">
              <div class="stat-k">项目数量</div>
              <div class="stat-v stat-v--teal"
                >{{ metric('project')?.value || '0' }}<span>{{ metric('project')?.unit || '个' }}</span></div
              >
            </div>
            <div class="stat-sep"></div>
            <div class="stat-cell">
              <div class="stat-k">申报金额</div>
              <div class="stat-v stat-v--teal"
                >{{ metric('amount')?.value || '0' }}<span>{{ metric('amount')?.unit || '万元' }}</span></div
              >
            </div>
          </div>

          <!-- 卡1 严格照原型：stat-tile 只有「标签 + 数值」，没有「本周新增」；柱图也没有「单位：xx」表头，
               单位随悬浮提示给（原型 tooltip 就是「部门 / 数值 单位」） -->
          <div class="chart chart--vbar" :class="{ filtering: deptFiltering }">
            <div v-if="deptBars.length" class="vbar-plot">
              <div class="vbar-grid"><span v-for="n in 5" :key="n"></span></div>
              <div
                v-for="(dept, index) in deptBars"
                :key="dept.name"
                class="vbar-col"
                :class="{ on: activeDept === dept.name }"
                role="button"
                tabindex="0"
                :title="barTip(dept)"
                :aria-label="`按「${dept.name}」筛选下方清单`"
                @click="pickDept(dept)"
                @keydown.enter="pickDept(dept)"
                @keydown.space.prevent="pickDept(dept)"
              >
                <div class="vbar-slot">
                  <div class="vbar-track"></div>
                  <div class="vbar-rect" :style="{ height: `${deptBarPercents[index]}%`, background: deptBarGradient(index) }">
                    <span class="vbar-num">{{ barDim === 'amount' ? dept.amountText : dept.countText }}</span>
                  </div>
                </div>
                <div class="vbar-name" :title="dept.name">{{ dept.name }}</div>
              </div>
            </div>
            <div v-else class="chart-empty">暂无数据</div>
          </div>
        </div>

        <!-- 卡2：AI识别问题项目 —— 审核意见分布环形图（点环段/图例按 reviewOpinion 筛清单）
             （需求 2026-10-13：卡名由「AI识别异常项目」改回「AI识别问题项目」） -->
        <div class="panel card">
          <div class="card-head">
            <div class="card-head-left">
              <span class="icon-chip chip-red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </span>
              <h3 class="panel-title">AI识别问题项目</h3>
            </div>
            <!-- 原型这一格的维度下拉（按专业）。「按专业细分问题项目」的接口未落地，
                 所以暂时只有这一个选项；接口到位后在这里加第二项并接上取数即可。 -->
            <select class="mini-select" aria-label="AI识别问题项目的统计维度" :value="ABNORMAL_DIMENSIONS[0].value">
              <option v-for="opt in ABNORMAL_DIMENSIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <!-- 卡2 严格照原型：stat-tile 两格是「问题项目 / 不通过率」，且不带「本周新增」。
               两格都取接口四 getAuditProblemTask 的数（problemCnt / unpassRatio），不再拿指标卡凑 -->
          <div class="stat-tile alert">
            <div class="stat-cell">
              <div class="stat-k">问题项目</div>
              <div class="stat-v stat-v--rose">{{ problemStat.count.toLocaleString() }}<span>个</span></div>
            </div>
            <div class="stat-sep"></div>
            <div class="stat-cell">
              <div class="stat-k">不通过率</div>
              <div class="stat-v stat-v--rose">{{ problemStat.ratioText }}<span>%</span></div>
            </div>
          </div>

          <div class="chart chart--donut" :class="{ filtering: !!activeDept }">
            <template v-if="donutSegments.length">
              <div class="donut-box">
                <svg class="donut" :viewBox="`0 0 ${DONUT_GEOMETRY.size} ${DONUT_GEOMETRY.size}`" role="img" aria-label="问题项目的归口部门分布">
                  <!-- 环段渐变（需求 2026-10-12：风格照原型）——原型环图每段用的是
                       竖向 LinearGradient（浅→深），这里用 SVG 线性渐变表达；
                       id 带上段名，多页复用也不串色 -->
                  <defs>
                    <linearGradient
                      v-for="seg in donutSegments"
                      :id="`srh3-donut-${seg.code || seg.name}`"
                      :key="`def-${seg.name}`"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" :stop-color="seg.light" />
                      <stop offset="100%" :stop-color="seg.color" />
                    </linearGradient>
                  </defs>
                  <!-- 圆默认从 3 点方向顺时针画，转 -90° 让第一段从 12 点开始（与原型一致） -->
                  <g :transform="`rotate(-90 ${DONUT_GEOMETRY.size / 2} ${DONUT_GEOMETRY.size / 2})`">
                    <!-- 环段只接受鼠标点击，**不给 tabindex**：SVG 拿到焦点时浏览器会套一个焦点框，
                         而环段是异形，那个方框很难看也很难压掉。键盘可达性由右侧图例行承担
                         （同样的动作 + 可读的名称）。 -->
                    <circle
                      v-for="seg in donutSegments"
                      :key="seg.name"
                      class="donut-seg"
                      :class="{ on: activeDept === seg.name }"
                      :cx="DONUT_GEOMETRY.size / 2"
                      :cy="DONUT_GEOMETRY.size / 2"
                      :r="DONUT_GEOMETRY.radius"
                      fill="none"
                      :stroke="`url(#srh3-donut-${seg.code || seg.name})`"
                      :stroke-width="DONUT_GEOMETRY.stroke"
                      :stroke-dasharray="seg.dash"
                      :stroke-dashoffset="seg.offset"
                      @click="pickProblemSlice(seg)"
                    >
                      <title>{{ seg.name }} · {{ seg.count.toLocaleString() }}个 · 占比 {{ seg.percentText }}%</title>
                    </circle>
                  </g>
                </svg>
                <div class="donut-center">
                  <b>{{ problemTotal.toLocaleString() }}</b>
                  <!-- 中心文案 2026-10-13 由「归口部门」改为「问题项目」（环段仍是按归口部门切分） -->
                  <span>问题项目</span>
                </div>
              </div>

              <div class="legend">
                <div
                  v-for="seg in donutSegments"
                  :key="seg.name"
                  class="lg"
                  :class="{ on: activeDept === seg.name }"
                  role="button"
                  tabindex="0"
                  :aria-label="`按「${seg.name}」筛选下方清单`"
                  @click="pickProblemSlice(seg)"
                  @keydown.enter="pickProblemSlice(seg)"
                  @keydown.space.prevent="pickProblemSlice(seg)"
                >
                  <div class="lg-row">
                    <span class="lg-dot" :style="{ background: barGradient(seg.light, seg.color) }"></span>
                    <span class="lg-name">{{ seg.name }}</span>
                    <span class="lg-val">{{ seg.count.toLocaleString() }}<em>个</em></span>
                    <span class="lg-pct">{{ seg.percentText }}%</span>
                  </div>
                  <div class="lg-bar"><i :style="{ width: `${seg.percent}%`, background: barGradient(seg.light, seg.color) }"></i></div>
                </div>
              </div>
            </template>
            <div v-else class="chart-empty">暂无数据</div>
          </div>
        </div>

        <!-- 卡3：审核要点异动排名 —— 要点横向条（点条按 ruleId 筛清单） -->
        <div class="panel card">
          <div class="card-head">
            <div class="card-head-left">
              <span class="icon-chip chip-violet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M21 7h-6M21 7v6" />
                </svg>
              </span>
              <h3 class="panel-title">审核要点异动排名</h3>
            </div>
          </div>

          <div class="stat-tile">
            <div class="stat-cell">
              <div class="stat-k">审核要点</div>
              <div class="stat-v stat-v--slate">{{ rankSummary.pointCount }}<span>项</span></div>
            </div>
            <div class="stat-sep"></div>
            <div class="stat-cell">
              <div class="stat-k">异动总计</div>
              <div class="stat-v stat-v--slate">{{ rankSummary.total.toLocaleString() }}<span>次</span></div>
            </div>
          </div>

          <div class="chart chart--hbar scroll-thin" :class="{ filtering: !!activeRuleId }">
            <div
              v-for="(item, index) in rankRows"
              :key="item.name"
              class="hbar-row"
              :class="{ on: activeRuleId === item.name }"
              role="button"
              tabindex="0"
              :title="item.hint"
              :aria-label="`按「${item.name}」筛选下方清单`"
              @click="pickRank(item)"
              @keydown.enter="pickRank(item)"
              @keydown.space.prevent="pickRank(item)"
            >
              <div class="hbar-label" :title="item.name">{{ item.name }}</div>
              <div class="hbar-track">
                <div class="hbar-fill" :style="{ width: `${rankPercents[index]}%`, background: barGradient(item.from, item.to) }"></div>
              </div>
              <div class="hbar-val">{{ item.value }}</div>
            </div>
            <div v-if="!rankRows.length" class="chart-empty">暂无数据</div>
          </div>
        </div>

        <!-- 卡4：审核要点复核情况 —— 要点横向条，点条按 ruleId 筛清单；
             右上角下拉在「按复核数量 / 按复核率」之间切换条宽与数值（切换不重新请求） -->
        <div class="panel card">
          <div class="card-head">
            <div class="card-head-left">
              <span class="icon-chip chip-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12a9 9 0 1 1-5.6-8.3" />
                </svg>
              </span>
              <h3 class="panel-title">审核要点复核情况</h3>
            </div>
            <select v-model="reviewDim" class="mini-select" aria-label="审核要点复核的统计维度">
              <option v-for="opt in POINT_REVIEW_DIM_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <!-- 卡4 的两格照原型：人工复核数量 / 平均复核率，取接口五 getManualReviewRule 的两个汇总数 -->
          <div class="stat-tile ok">
            <div class="stat-cell">
              <div class="stat-k">人工复核数量</div>
              <div class="stat-v stat-v--teal">{{ manualReviewStat.count }}<span>个</span></div>
            </div>
            <div class="stat-sep"></div>
            <div class="stat-cell">
              <div class="stat-k">平均复核率</div>
              <div class="stat-v stat-v--teal">{{ manualReviewStat.rate }}<span>%</span></div>
            </div>
          </div>

          <div class="chart chart--hbar scroll-thin" :class="{ filtering: !!activeReviewPoint }">
            <div
              v-for="(item, index) in pointReviewRows"
              :key="item.name"
              class="hbar-row"
              :class="{ on: activeReviewPoint === item.name }"
              role="button"
              tabindex="0"
              :title="item.hint"
              :aria-label="`按「${item.name}」筛选下方清单`"
              @click="pickReview(item)"
              @keydown.enter="pickReview(item)"
              @keydown.space.prevent="pickReview(item)"
            >
              <div class="hbar-label" :title="item.name">{{ item.name }}</div>
              <div class="hbar-track">
                <div class="hbar-fill" :style="{ width: `${pointReviewPercents[index]}%`, background: barGradient(item.from, item.to) }"></div>
              </div>
              <div class="hbar-val">{{ reviewDim === 'count' ? item.countText : item.rateText }}</div>
            </div>
            <!-- 空态带上当前维度：接口协议未落地期间（数据为空）也能看出下拉确实切了 -->
            <div v-if="!pointReviewRows.length" class="chart-empty">
              {{ reviewDim === 'count' ? '按复核数量暂无数据' : '按复核率暂无数据' }}
            </div>
          </div>
        </div>
      </section>

      <!-- ========================= 智能审核项目清单 ========================= -->
      <!-- 全屏时整个 section（含查询条件与列表）铺满视口，按钮就留在 sec-head 里，随时能退出 -->
      <section class="panel section" :class="{ 'is-fullscreen': isListFullscreen }">
        <div class="sec-head">
          <h3 class="sec-title"><i class="title-bar"></i>智能审核项目清单</h3>

          <div class="sec-actions">
            <!-- 智能审核轨迹：「先挑一个项目」的交互照智能审核任务管理的「任务进度」——
                 轨迹弹窗是单任务维度（smartTaskProgress 只收一个 taskId），所以要求**恰好勾选 1 条**，
                 未选中时按钮禁用并给出原因气泡（勾选条数不再单独显示，需求 2026-10-13） -->
            <el-tooltip content="请先在下方清单勾选一个项目" placement="bottom" :disabled="hasSelectedOne">
              <span class="sec-action-wrap">
                <button class="btn" type="button" :disabled="!hasSelectedOne" @click="openProgressModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  智能审核轨迹
                </button>
              </span>
            </el-tooltip>
            <!-- 折叠筛选：面板与原型同名同形（原型没有接出来的筛选表单，这里保留本页原有的全部条件） -->
            <button class="btn" :class="{ 'is-on': isFilterOpen }" type="button" :aria-expanded="isFilterOpen" @click="toggleFilter">
              {{ isFilterOpen ? '收起筛选' : '展开筛选' }}
              <svg
                class="btn-caret"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              class="btn btn-primary"
              type="button"
              :aria-label="isListFullscreen ? '退出全屏' : '全屏显示查询条件与列表'"
              :aria-pressed="isListFullscreen"
              @click="toggleListFullscreen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path v-if="!isListFullscreen" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                <path v-else d="M9 3v4a2 2 0 0 1-2 2H3m18 0h-4a2 2 0 0 1-2-2V3m0 18v-4a2 2 0 0 1 2-2h4M3 15h4a2 2 0 0 1 2 2v4" />
              </svg>
              {{ isListFullscreen ? '退出全屏' : '全屏展示' }}
            </button>
          </div>
        </div>

        <!-- 折叠筛选面板（照原型的 展开筛选；选项与入参一律用**码值**，中文名只用于展示） -->
        <div class="filter-panel" :class="{ open: isFilterOpen }">
          <div class="filter-inner">
            <div class="fitem">
              <!-- 四个下拉都改成 el-select 且 clearable：下拉项里不再放「全部」占位项，
                   清空改用 EP 的清除按钮（×）——原生 select 没有「无选项也能清空」的能力。
                   选项值仍是码值，中文名只用于展示。 -->
              <label>一级单位</label>
              <el-select
                v-model="filterForm.yjdw"
                class="fitem-select"
                aria-label="一级单位"
                clearable
                filterable
                placeholder="请选择"
                @change="onYjdwChange"
              >
                <el-option v-for="opt in yjdwOptions" :key="opt.code" :label="opt.name" :value="opt.code" />
              </el-select>
            </div>
            <div class="fitem">
              <!-- 与「智能审核任务管理」一致：选项由所选一级单位联动带出，未选一级单位时为空 -->
              <label>二级单位</label>
              <el-select
                v-model="filterForm.ejdw"
                class="fitem-select"
                aria-label="二级单位"
                clearable
                filterable
                :disabled="!filterForm.yjdw"
                :placeholder="filterForm.yjdw ? '请选择' : '请先选一级单位'"
              >
                <el-option v-for="opt in ejdwOptions" :key="opt.code" :label="opt.name" :value="opt.code" />
              </el-select>
            </div>
            <div class="fitem">
              <label>归口部门</label>
              <el-select v-model="filterForm.dept" class="fitem-select" aria-label="归口部门" clearable filterable placeholder="请选择">
                <el-option v-for="opt in gkbmOptions" :key="opt.code" :label="opt.name" :value="opt.code" />
              </el-select>
            </div>
            <div class="fitem">
              <!-- 预算事项按输入的名称模糊查（不再要求从候选里挑一个），值原样交给接口 yssxName -->
              <label for="srh3-f-budget">预算事项</label>
              <input id="srh3-f-budget" v-model="filterForm.budget" type="text" placeholder="请输入预算事项名" />
            </div>
            <div class="fitem">
              <!-- 项目编码：与 smartTaskAudit 一致，用 ReMultipleText 批量输入，传 xmbmList 数组 -->
              <label for="srh3-f-xmbm">项目编码</label>
              <ReMultipleText
                id="srh3-f-xmbm"
                v-model="filterForm.xmbm"
                class="project-code-input"
                dialog-title="项目编码"
                tooltip-text="项目编码"
                placeholder="请输入项目编码"
              />
            </div>
            <div class="fitem">
              <label for="srh3-f-xmmc">项目名称</label>
              <input id="srh3-f-xmmc" v-model="filterForm.xmmc" type="text" placeholder="请输入项目名称" />
            </div>
            <div class="fitem fitem--tree">
              <!-- 项目类型：与 views/ai/document 的查询控件保持一致——
                   同一个 ElTreeSelect + 同一棵 protypeTree/getSubprotypeTree 树（节点键 middleId），
                   勾中的值整组传给 getTaskPage 的 proTypeList（入参名不变）；位置也照它（紧跟在项目名称后）。
                   本页的 .filter-panel 是 overflow: hidden 的折叠容器，下拉要挂到 body 才点得开。 -->
              <label>项目类型</label>
              <ElTreeSelect
                v-model="filterForm.proTypes"
                class="fitem-tree-select"
                popper-class="srh3-pro-type-popper"
                clearable
                :data="proTypeTree"
                :props="PRO_TYPE_TREE_PROPS"
                :multiple="true"
                :show-checkbox="true"
                :collapse-tags="true"
                :check-on-click-node="false"
                node-key="middleId"
                :popper-append-to-body="true"
                placeholder="请选择"
              />
            </div>
            <div class="fitem fitem--tree">
              <!-- 项目状态：树形字典 commonCode/getFlowStatusTree，多选（与 views/ai/document 的项目状态一致）。
                   选中的 code 数组整组当 flowStatusList 传给 getTaskPage；
                   与「项目类型」同一个 ElTreeSelect 组件，下拉同样挂到 body。 -->
              <label>项目状态</label>
              <ElTreeSelect
                v-model="filterForm.flowStatusList"
                class="fitem-tree-select"
                popper-class="srh3-flow-status-popper"
                clearable
                :data="flowStatusOptions"
                :props="FLOW_STATUS_TREE_PROPS"
                :multiple="true"
                :show-checkbox="true"
                :collapse-tags="true"
                :check-on-click-node="false"
                node-key="code"
                :popper-append-to-body="true"
                placeholder="请选择"
              />
            </div>
            <div class="fitem">
              <!-- 计划实施年度：选项来自 comPz/getNdTreeNode（码值 yearCode），选中的 code 当 jhssnd 传给 getTaskPage -->
              <label>计划实施年度</label>
              <el-select v-model="filterForm.jhssnd" class="fitem-select" aria-label="计划实施年度" clearable filterable placeholder="请选择">
                <el-option v-for="opt in yearOptions" :key="opt.code" :label="opt.name" :value="opt.code" />
              </el-select>
            </div>
            <!-- ai预审结论（需求 2026-10-12，2026-10-14 由「AI预审意见」改名）：选项取字典 AI_AUDIT_TASK_RESULT_COM（getData?code=…），
                 选中的码值当 getTaskPage 的 result 传（与清单「AI预审结论」列同源）。
                 位置 2026-10-13 调到「计划实施年度」之后（最后一排：计划实施年度 → ai预审意见 → AI审核时间） -->
            <div class="fitem">
              <label>AI预审结论</label>
              <el-select v-model="filterForm.result" class="fitem-select" aria-label="AI预审结论" clearable filterable placeholder="请选择">
                <el-option v-for="opt in auditResultOptions" :key="opt.code" :label="opt.name" :value="opt.code" />
              </el-select>
            </div>
            <!-- 人工复核状态（需求 2026-10-20）：码值 1 待复核 / 2 部分复核 / 3 全部复核（后端已确认），
                 选中的码值当 getTaskPage 的 manualReviewStatus 传；位置紧随 AI预审结论 -->
            <div class="fitem">
              <label>人工复核状态</label>
              <el-select
                v-model="filterForm.manualReviewStatus"
                class="fitem-select"
                aria-label="人工复核状态"
                clearable
                filterable
                placeholder="请选择"
              >
                <el-option v-for="opt in manualReviewStatusOptions" :key="opt.code" :label="opt.name" :value="opt.code" />
              </el-select>
            </div>
            <div class="fitem">
              <label for="srh3-f-audit-start">AI审核时间</label>
              <div class="date-range">
                <input id="srh3-f-audit-start" v-model="filterForm.auditStart" type="date" />
                <span class="sep">~</span>
                <input id="srh3-f-audit-end" v-model="filterForm.auditEnd" type="date" />
              </div>
            </div>
            <!-- 需求 2026-09-30：「AI审核结论」查询条件先隐藏（恢复时把这段解开即可）。
                 相关逻辑没动：点「AI识别异常项目」环图筛清单照常工作（它写的是 filterForm.conclusion
                 + appliedFilters.conclusion，只是没有这个下拉可回显了）。 -->
            <!--
            <div class="fitem">
              <label>AI审核结论</label>
              <el-select v-model="filterForm.conclusion" class="fitem-select" aria-label="AI审核结论" clearable filterable placeholder="请选择">
                <el-option v-for="opt in conclusionOptions" :key="opt.code" :label="opt.name" :value="opt.code" />
              </el-select>
            </div>
            -->
            <div class="filter-actions">
              <button class="fbtn reset" type="button" @click="filterReset">重置</button>
              <button class="fbtn submit" type="button" @click="filterSubmit">查询</button>
              <!-- 导出紧挨着查询（同一组动作）：次要动作走描边 + 主色字，不抢实心主色 -->
              <button class="fbtn export" type="button" @click="filterExport">导出</button>
            </div>
          </div>
        </div>

        <!-- 清单表：Element Plus 表格 + 服务端分页
             高度走 el-table 的 **height**（数值，见脚本里 tableMaxHeight 的说明）：表头固定、表体内部滚动。
             常规版式固定成「表头 + 7 行」的高度（需求 2026-10-21）；全屏按容器实测撑满。
             ⚠️ 这个值**任何时候都必须是数值**：EP 的 setHeight 在值为 null/undefined 时**不清理**内联样式，
             一旦传空，表格会一直维持上一次的高度（全屏↔常规切换时尤其明显，踩过）。 -->
        <div ref="tableWrapRef" class="table-wrap" :class="{ 'is-filtering': isFiltering }">
          <el-table
            ref="tableRef"
            class="srh3-table"
            :data="auditRows"
            :height="tableMaxHeight"
            border
            stripe
            :empty-text="emptyText"
            @selection-change="syncSelectedRows"
          >
            <!-- 勾选列（固定在最左）：智能审核轨迹要先选中一个项目才能打开，交互照智能审核任务管理 -->
            <el-table-column type="selection" width="46" align="center" fixed="left" />
            <!-- 序号跨页连续：按分页偏移算，不能用行下标 -->
            <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" fixed="left" />
            <!--
              AI预审状态：三个圆点，取值与右侧「AI预审结论」列同源（接口 resultName + result）。
              列窄、内容轻，放在首位并固定，横向滚动时与项目身份列一起留在视野里。
              （需求 2026-10-12：列名由「AI预算结果」改为「AI预审状态」）
            -->
            <el-table-column label="AI预审状态" width="104" align="center" fixed="left">
              <template #default="{ row }">
                <span v-if="row.resultNameBadge" class="dots" :class="`dots--${row.resultNameBadge.tone}`" :title="row.resultNameBadge.text">
                  <i></i><i></i><i></i>
                </span>
                <template v-else>–</template>
              </template>
            </el-table-column>
            <!--
              列序照原型（身份 → 组织 → 分类 → 状态 → 金额 → 时间 → 结论 → 操作）。
              列宽策略：除序号/操作固定外都用 min-width（不写 width），
              el-table 会把「表格宽 - 各列 min-width 之和」的余量按比例分给这些弹性列，
              所以整行铺满、且各列 min-width 都留得下自己的表头（表头不换行）。
              每列都开 show-overflow-tooltip：内容超长时截断 + 悬浮看全文。
              「序号 ~ 一级单位」几列固定：列多、横向滚动时这几列留在视野里，便于对位。
            -->
            <el-table-column prop="xmbm" label="项目编码" min-width="140" align="center" show-overflow-tooltip fixed="left" />
            <el-table-column prop="xmmc" label="项目名称" min-width="190" align="center" show-overflow-tooltip fixed="left" />
            <el-table-column prop="dept" label="归口部门" min-width="100" align="center" show-overflow-tooltip fixed="left" />
            <el-table-column prop="yjdw" label="一级单位" min-width="110" align="center" show-overflow-tooltip fixed="left" />
            <el-table-column prop="ejdw" label="二级单位" min-width="130" align="center" show-overflow-tooltip />
            <el-table-column prop="proType" label="项目类型" min-width="100" align="center" show-overflow-tooltip />
            <el-table-column prop="budget" label="预算事项" min-width="125" align="center" show-overflow-tooltip />
            <!-- 项目状态 / 任务状态用状态徽标呈现（语义位见 data.ts 的 StatusTone，色值见下方 .badge--*） -->
            <el-table-column label="项目状态" min-width="100" align="center" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.flowStatusBadge" class="badge" :class="`badge--${row.flowStatusBadge.tone}`">
                  <i></i>{{ row.flowStatusBadge.text }}
                </span>
                <template v-else>–</template>
              </template>
            </el-table-column>
            <!-- 金额列右对齐 + 等宽数字（DESIGN.md 的 Tnum Rule） -->
            <el-table-column prop="amount" label="申报金额(万元)" min-width="150" align="right" show-overflow-tooltip class-name="cell-amount" />
            <el-table-column prop="jhssnd" label="计划实施年度" min-width="118" align="center" show-overflow-tooltip />
            <el-table-column prop="auditTime" label="AI审核时间" min-width="180" align="center" show-overflow-tooltip :formatter="auditTimeFormatter" />
            <!-- AI预审结论（需求 2026-10-14 由「AI预审意见」改名，接口 resultName + result）：
                 配色见下方 .badge--gray|red|orange|amber（同时决定首列三点指示的颜色） -->
            <el-table-column label="AI预审结论" min-width="118" align="center" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.resultNameBadge" class="badge" :class="`badge--${row.resultNameBadge.tone}`">
                  <i></i>{{ row.resultNameBadge.text }}
                </span>
                <template v-else>–</template>
              </template>
            </el-table-column>
            <!-- 审核要点复核统计（需求 2026-10-20，接口返参 passCnt / failCnt / pendingCnt / reviewedCnt）：
                 四个数值列紧跟 AI预审结论；人工复核状态用徽标（码值 1 待复核 / 2 部分复核 / 3 全部复核） -->
            <el-table-column prop="passCnt" label="审核要点通过数" min-width="120" align="center" show-overflow-tooltip />
            <el-table-column prop="failCnt" label="审核要点不通过数" min-width="130" align="center" show-overflow-tooltip />
            <el-table-column prop="pendingCnt" label="审核要点待复核数" min-width="130" align="center" show-overflow-tooltip />
            <el-table-column prop="reviewedCnt" label="审核要点复核数" min-width="120" align="center" show-overflow-tooltip />
            <el-table-column label="人工复核状态" min-width="118" align="center" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.manualReviewBadge" class="badge" :class="`badge--${row.manualReviewBadge.tone}`">
                  <i></i>{{ row.manualReviewBadge.text }}
                </span>
                <template v-else>–</template>
              </template>
            </el-table-column>
            <el-table-column label="任务状态" min-width="100" align="center" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.taskStatusBadge" class="badge" :class="`badge--${row.taskStatusBadge.tone}`">
                  <i></i>{{ row.taskStatusBadge.text }}
                </span>
                <template v-else>–</template>
              </template>
            </el-table-column>
            <!-- 需求 2026-10-12：删掉原来这列「AI预审」（只要有审核结果就显示「已预审」）——
                 它的信息与「AI预审结论」列重复；筛选改用查询条件里的「ai预审结论」（参数 result） -->
            <el-table-column label="操作" width="75" align="center">
              <!-- 跳转逻辑与智能审核任务管理一致：打开同一个智能审核详情弹窗（DetailModal → AuditDetailWorkbench） -->
              <template #default="{ row }">
                <a
                  class="lnk"
                  role="button"
                  tabindex="0"
                  :aria-label="`查看「${row.xmmc || '该项目'}」的智能审核详情`"
                  @click="openDetailModal(row)"
                  @keydown.enter="openDetailModal(row)"
                  @keydown.space.prevent="openDetailModal(row)"
                >
                  查看
                </a>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-pager">
            <span class="pager-total">
              显示第 {{ pageable.total ? (pageable.current - 1) * pageable.size + 1 : 0 }} -
              {{ Math.min(pageable.current * pageable.size, pageable.total) }} 条，共 <b>{{ pageable.total.toLocaleString() }}</b> 条
            </span>
            <el-pagination
              background
              layout="sizes, prev, pager, next, jumper"
              :current-page="pageable.current"
              :page-size="pageable.size"
              :page-sizes="[5, 10, 20, 50, 100]"
              :total="pageable.total"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- 角色选择：前三个接口要 dwId/bmId，角色确认（loadCompany）后才渲染页面并取数 -->
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="handleRoleReady" />

  <!-- 智能审核详情：直接复用智能审核任务管理的弹窗，两处入口进的是同一个工作台 -->
  <DetailModal :modal="detailModal" :detail-row="detailRow" @close="closeDetailModal" />

  <!-- 智能审核轨迹：也是复用智能审核任务管理那个「任务进度」弹窗（同一组件、同一个 getProcessProgress） -->
  <smartTaskProgress ref="progressModal" />
</template>

<script lang="ts">
export default {
  // 必须等于路由 path（AGENTS.md：keep-alive 缓存依赖此约定）
  name: '/ai/smartReviewHomeThree/index'
}
</script>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
// 环节责任角色图标的底图（lucide，项目里 AI 区已在用，见 views/ai/businessWorkbench）：
// 4 个角色 3 种图标 —— 专家/复核「单人」、运营「双人」、AI「闪光」，照原型；色位与图标在 ROLE_ICONS 里配对。
import { Sparkles, User, Users } from '@lucide/vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import ElTreeSelect from '@/components/ElTreeSelect'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import DetailModal from '../smartTaskAudit/components/DetailModal.vue'
import smartTaskProgress from '../smartTaskAudit/components/smartTaskProgress.vue'
import { exportTask } from '@/api/ai/smartReviewHomeThree'
import { apiExportHandle } from '@/utils/export'
import {
  DONUT_GEOMETRY,
  DEPT_BAR_GRADIENTS,
  FEATURE_TAGS,
  PAGE_TITLE,
  ABNORMAL_DIMENSIONS,
  POINT_REVIEW_DIM_OPTIONS,
  REVIEW_STEP_LEGENDS,
  REVIEW_STEPS,
  REVIEW_STEP_ROLES,
  barGradient,
  buildBarPercents,
  buildDeptBarPercents,
  buildDonutSegments,
  buildPointReviewPercents,
  buildRankSummary
} from './data'
import type { AuditRow, BarItem, DeptBar, DeptBarDim, DonutSegment, MetricKey, PointReviewBar, PointReviewDim, ReviewStepRole } from './data'
import { useSmartReviewHomeThree } from './hooks/useSmartReviewHomeThree'
import type { OptionItem } from './hooks/useSmartReviewHomeThree'

/** 导出文件名的兜底（后端响应头带了 content-disposition 就用服务端给的） */
const EXPORT_FILE_NAME = '智能审核项目清单'

/**
 * 角色 + 取数都在 hook 里：前三个接口要 dwId/bmId，必须等 UserRoleSelector 把角色写进 currentUserRole。
 * 交互状态（日期区间、折叠筛选、点柱联动）留在本文件。
 */
const {
  isShowPage,
  userRoleSelectorRef,
  getRoleHandle,
  metrics,
  deptBars,
  problemStat,
  problemSlices,
  rankRows,
  manualReviewStat,
  pointReviewBars,
  auditRows,
  auditTotal,
  yjdwOptions,
  ejdwOptions,
  gkbmOptions,
  conclusionOptions,
  auditResultOptions,
  flowStatusOptions,
  yearOptions,
  proTypeTree,
  roleParams,
  loadEjdwOptions,
  clearEjdwOptions,
  loadBoard,
  loadAuditRows
} = useSmartReviewHomeThree()

// --- 指标卡取值 ---
/**
 * 按 key 取一张指标卡。
 * 四卡布局与 METRIC_CARD_METAS 的数组顺序解耦：模板要哪张取哪张，指标增减不必同步改模板下标。
 * 接口没回来时返回 undefined，模板里以 '0' / 默认单位兜底（首屏不闪空白）。
 */
const metric = (key: MetricKey) => metrics.value.find((item) => item.key === key)

// --- 图表几何：由数据算，不写死 ---
/** 卡2 环图：按**归口部门**的问题任务数占比切环段（含 dasharray / offset） */
const donutSegments = computed(() => buildDonutSegments(problemSlices.value))
/** 环心数字：各归口部门的问题任务数之和（= 接口的 problemCnt） */
const problemTotal = computed(() => problemSlices.value.reduce((sum, item) => sum + (Number(item.count) || 0), 0))
/** 卡3 横向条宽度 */
const rankPercents = computed(() => buildBarPercents(rankRows.value))
/** 卡3 的两个汇总数（异动总计 / 涉及要点），由接口出参现算，不额外请求 */
const rankSummary = computed(() => buildRankSummary(rankRows.value))

// --- 卡4 的维度切换（按复核数量 / 按复核率）---
// 两条量纲在同一份出参里（行上同时有 count 与 rate），切换只换读哪个字段，不再请求。
const reviewDim = ref<PointReviewDim>('count')
/**
 * 卡4 的行：按当前维度**从大到小**排序（需求 2026-10-14）——
 * 切「按复核数量 / 按复核率」时顺序跟着变，第一条就是当前维度最大的那个要点。
 * 排序在**副本**上做（接口给的原始顺序留在 hook 里，不就地改它）。
 */
const pointReviewRows = computed(() => {
  const metric = (item: PointReviewBar) => (reviewDim.value === 'rate' ? Number(item.rate) || 0 : Number(item.count) || 0)
  return pointReviewBars.value.slice().sort((a, b) => metric(b) - metric(a))
})
/** 条宽同样按当前维度算（最大的一条占满），所以用排序后的那份，索引才对得上 */
const pointReviewPercents = computed(() => buildPointReviewPercents(pointReviewRows.value, reviewDim.value))

/**
 * 卡1 柱体渐变色。
 * 按柱序循环取色而不是写死在 CSS 的 nth-child 上 —— 归口部门数量由接口决定，
 * 写死的话第 5 根以后的柱子（以及部门只剩两三个时的配色）都会落空。
 */
const deptBarGradient = (index: number) => {
  const pair = DEPT_BAR_GRADIENTS[index % DEPT_BAR_GRADIENTS.length]
  return barGradient(pair.light, pair.deep)
}

/** 柱子的悬浮提示：原型 tooltip 是「部门 / 数值 单位」（单位不在图上单独标了，跟它保持一致） */
const barTip = (dept: DeptBar) => (barDim.value === 'amount' ? `${dept.name} / ${dept.amountText} 万元` : `${dept.name} / ${dept.countText} 个`)

// --- 卡1 的维度切换（按金额 / 按数量）---
// 两个维度各有自己的接口入参（mode=2 金额 / mode=1 数量），hook 里已各取一次，切换只换读哪个字段。
const barDim = ref<DeptBarDim>('amount')
const deptBarPercents = computed(() => buildDeptBarPercents(deptBars.value, barDim.value))

// --- 点柱 ↔ 清单联动 ---
// 原型直接操作 DOM（querySelector + classList.toggle），这里改成响应式状态。
const activeDept = ref('')

/** 折叠筛选面板是否展开 */
const isFilterOpen = ref(false)

/**
 * 清单区（查询条件 + 列表）是否全屏。
 * 做法是给 `.section` 加一个 `position: fixed; inset: 0` 的类，而不是用浏览器的 Fullscreen API：
 * 后者要用户手势授权、退出还得监听 fullscreenchange，而这个页面只是要求「区域铺满」，
 * 用 CSS 就够，且能按 Esc 退出（见 onListFullscreenKeydown）。
 */
const isListFullscreen = ref(false)
/** 表格实例：全屏后容器宽度变了但窗口没变，el-table 不会自己重算列宽，要手动 doLayout */
const tableRef = ref<any>()
/** 列表外层容器：全屏时用它算表格还剩多少高度（见 syncTableMaxHeight） */
const tableWrapRef = ref<HTMLElement | null>(null)

/**
 * 表格高度（`el-table` 的 `height`，两个版式都给**数值**）。
 *
 * ⚠️ 任何时候都必须是数值：EP 的 setHeight 在值为 null/undefined 时**不清理**内联样式，
 *    传空的话表格会一直维持上一次的高度（全屏 ↔ 常规切换时尤其明显，实测踩到）。
 *    传字符串（如 '60vh'）同样不行：会被原样写到根元素的 style 上，表体拿不到高度，
 *    根元素 overflow:hidden 把超出的行直接**裁掉**（滚也滚不到）。
 *
 * 两个版式：
 * - 常规：固定成「表头 + 7 行」的高度（`TABLE_SEVEN_ROWS_H`），不随数据条数/窗口变化 ——
 *   需求 2026-10-21：表高按 7 行给（每页仍是 10 条，超出的 3 条在表体内滚动）。
 * - 全屏：按容器实测撑满（`wrap` 是 flex:1，取「容器高 − 分页条(含上边距) − 5px 余量」）。
 */
const tableMaxHeight = ref(327)
/** 常规版式固定表高 = 表头 38 + 7 行 × 40 + 横向滚动条占位 9 ≈ 327 */
const TABLE_SEVEN_ROWS_H = 327
/** 全屏时给分页条下方留的余量，避免贴在视口底边 */
const TABLE_FULLSCREEN_GAP = 5
const syncTableMaxHeight = () => {
  if (!isListFullscreen.value) {
    tableMaxHeight.value = TABLE_SEVEN_ROWS_H
    return
  }
  const wrap = tableWrapRef.value
  const pager = wrap?.querySelector('.table-pager') as HTMLElement | null
  const pagerStyle = pager ? getComputedStyle(pager) : null
  // 分页条自身高度 + 上边距都要扣掉：漏掉 margin-top 的话表 + 分页刚好顶满容器，分页会贴底/被压
  const pagerH = (pager?.offsetHeight || 30) + (pagerStyle ? parseFloat(pagerStyle.marginTop) || 0 : 0)
  const available = (wrap?.clientHeight || window.innerHeight) - pagerH - TABLE_FULLSCREEN_GAP
  tableMaxHeight.value = Math.max(TABLE_SEVEN_ROWS_H, Math.round(available))
}
/**
 * 筛选区的展开/收起是 280ms 的过渡（.filter-panel 的 max-height），
 * 过渡中量到的高度是中间值，所以等它走完再量一次表高。
 */
const TABLE_HEIGHT_SETTLE_MS = 320
let tableHeightTimer: number | undefined
const scheduleTableHeightSync = () => {
  if (tableHeightTimer !== undefined) window.clearTimeout(tableHeightTimer)
  tableHeightTimer = window.setTimeout(() => {
    tableHeightTimer = undefined
    syncTableMaxHeight()
    tableRef.value?.doLayout?.()
  }, TABLE_HEIGHT_SETTLE_MS)
}

const toggleListFullscreen = () => {
  isListFullscreen.value = !isListFullscreen.value
  /*
   * 进全屏就把筛选区展开：全屏的用处就是把空间让给「条件 + 列表」，
   * 如果进去还是收起的，第一件事得再点一下「展开筛选」，白给一次操作。
   *
   * 退出全屏时把筛选区**收起**（需求 2026-10-12）：回到常规版式后，收起筛选能让
   * 列表多出一屏左右的高度；要继续筛再点「展开筛选」即可。
   */
  isFilterOpen.value = isListFullscreen.value
  /*
   * 全屏与常规版式的每页条数来回切换（需求 2026-10-13；常规版式默认条数 2026-10-19 改为 10）：
   * 进全屏 → 20 条（一屏能看下的行数远多于常规版式的 10 条，不改的话进来第一件事就是翻页）；
   * 退出全屏 → 还原 10 条（与初始默认值一致；列表回到卡片里，20 条会把卡片撑得过高）。
   * 两边都回到第 1 页 —— 条数一变，原来的页码没有意义。
   */
  const FULLSCREEN_PAGE_SIZE = 20
  const NORMAL_PAGE_SIZE = 10
  const nextSize = isListFullscreen.value ? FULLSCREEN_PAGE_SIZE : NORMAL_PAGE_SIZE
  if (pageable.size !== nextSize) {
    pageable.size = nextSize
    pageable.current = 1
    void reloadRows()
  }
  void nextTick(() => {
    syncTableMaxHeight()
    scheduleTableHeightSync()
  })
}

/** 全屏时 Esc 退出：与按钮同一个出口，键盘用户不用去够按钮 */
const onListFullscreenKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isListFullscreen.value) toggleListFullscreen()
}

/* ---------------- 智能审核路径导览（纯演示动画） ---------------- */

/**
 * 角色色位 → 图标：与图例共用一套映射（4 个角色 3 种图标，照原型；
 * 「专家 / 复核」都是单人，「运营」双人，「AI」闪光，靠色位区分）。
 */
const ROLE_ICONS: Record<ReviewStepRole['tone'], typeof User> = { violet: User, blue: Users, teal: Sparkles, gray: User }

/**
 * 导览的 8 步（第 8 步「升级审核能力」是原型 2026-10-14 版新增），把「文案 + 责任角色 + 角色图标」在这里配好，
 * 模板只负责渲染 —— 三份数据必须同序，写成一个数组就不会各改各的。
 */
const reviewSteps = REVIEW_STEPS.map((label, index) => {
  const role = REVIEW_STEP_ROLES[index]
  return { label, role, icon: role ? ROLE_ICONS[role.tone] : User }
})
// 角色表与环节表必须等长：少写一条不会报错，只会在界面上静默空掉一格
if (REVIEW_STEP_ROLES.length !== REVIEW_STEPS.length) {
  console.warn(`[smartReviewHomeThree] REVIEW_STEP_ROLES(${REVIEW_STEP_ROLES.length}) 与 REVIEW_STEPS(${REVIEW_STEPS.length}) 数量不一致`)
}

/** 导览标题行右上角的图例（4 个角色各一枚），图标同样按色位取 */
const stepLegends = REVIEW_STEP_LEGENDS.map((item) => ({ ...item, icon: ROLE_ICONS[item.tone] }))

/** 当前高亮的环节序号（1..8）；0 = 已归零，等待第一拍；8 = 全部走完（终态） */
const guideStep = ref(0)
/**
 * 一轮是否已走完（终态）。终态下 8 个圆点统一进「点亮」态（见 .stepper.is-finished 的样式），
 * 前 7 个不再显示打勾 —— 需求 2026-10-14。
 */
const isGuideFinished = computed(() => guideStep.value >= REVIEW_STEPS.length)
/**
 * 每步停留。原型是 STEP_DURATION 400，速度偏快；需求方 2026-10-13 两次要求放慢：
 * 先 700，再放慢到 1000 —— 8 个环节走完约 8 秒，逐环节的连线动画能看清。
 *
 * **只播一轮**（需求 2026-10-13）：走满 8 步就停在「全部完成」的终态，
 * 不再像原型那样停顿后循环重来；重新进入页面（含 keep-alive 页签切回来）也只再播一次。
 */
const GUIDE_STEP_MS = 1500
let guideTimer: number | undefined

const stopGuide = () => {
  if (guideTimer !== undefined) {
    window.clearTimeout(guideTimer)
    guideTimer = undefined
  }
}

/** 链式 setTimeout：每拍走一步；走到最后一步就停表（终态，不循环） */
const scheduleGuide = () => {
  guideTimer = window.setTimeout(() => {
    if (guideStep.value < REVIEW_STEPS.length) {
      guideStep.value += 1
      scheduleGuide()
    }
  }, GUIDE_STEP_MS)
}

/**
 * 从第 0 步起播一轮（页面上没有手动重播入口，调用点只有「初次挂载 / 重新进入页面 / 从后台切回来」）。
 *
 * ⚠️ **不读系统的 `prefers-reduced-motion`**（需求方 2026-10-10）：这一块是演示型导览，
 *    内网机器常因「调整为最佳性能」/组策略/远程桌面上报 `reduce`，一旦降级就整块定格、看不出效果，
 *    而内网演示恰恰是这个动画的主要用途。所以这里是**无条件播放**。
 *    代价是不再跟随系统的无障碍偏好 —— 要恢复降级时，把下面 startGuide 里
 *    「默认值 + 一次 matchMedia 判定」加回即可（原实现：读 reduce → guideStep 钉到 7 并 return）。
 */
const startGuide = () => {
  stopGuide()
  guideStep.value = 0
  scheduleGuide()
}

/**
 * 页面不可见时停表（没必要在后台走表）。
 * 回到前台时**只续播没走完的那一轮**（step 在 0..7 之间）；已经走完（终态 7）就保持终态不再重播 ——
 * 需求是「只播一次」，切到别的窗口再回来不算一次新的进入。
 */
const onGuideVisibilityChange = () => {
  if (document.hidden) {
    stopGuide()
    return
  }
  if (guideStep.value > 0 && guideStep.value < REVIEW_STEPS.length) scheduleGuide()
}

/** 面板里条件的「输入中」状态；下拉一律存**码值**，中文名只用于展示 */
const filterForm = reactive({
  yjdw: '',
  ejdw: '',
  dept: '',
  /**
   * 项目类型（protypeTree/getSubprotypeTree 的 middleId，多选）——
   * 控件口径与 views/ai/document 一致；下发时映射成接口入参名 `proTypeList`
   */
  proTypes: [] as string[],
  budget: '',
  xmbm: '',
  xmmc: '',
  /** 项目状态（树形字典 commonCode/getFlowStatusTree，多选） */
  flowStatusList: [] as string[],
  /** ai预审意见（字典 AI_AUDIT_TASK_RESULT_COM 的码值，接口入参 result） */
  result: '',
  /** 人工复核状态（1 待复核 / 2 部分复核 / 3 全部复核，接口入参 manualReviewStatus） */
  manualReviewStatus: '',
  /** 计划实施年度（comPz/getNdTreeNode 的 yearCode） */
  jhssnd: '',
  auditStart: '',
  auditEnd: '',
  conclusion: ''
})

/**
 * 已生效的筛选条件 —— 只有点「查询」才从 filterForm 拷过来，并据此向 getTaskPage 发请求。
 * 原型是边改边过滤，这里按面板上「查询」按钮的语义做成显式提交：**筛选改由服务端执行**。
 */
const appliedFilters = reactive({
  yjdw: '',
  ejdw: '',
  dept: '',
  proTypes: [] as string[],
  budget: '',
  xmbm: '',
  xmmc: '',
  flowStatusList: [] as string[],
  /** ai预审意见的码值（接口入参 result） */
  result: '',
  /** 人工复核状态码值（接口入参 manualReviewStatus：1 待复核 / 2 部分复核 / 3 全部复核） */
  manualReviewStatus: '',
  jhssnd: '',
  auditStart: '',
  auditEnd: '',
  conclusion: '',
  /** 规则 id —— 「审核要点异动排名」点条筛清单用它（行都是审核要点） */
  ruleId: '',
  /**
   * 审核结论**多值** —— 只有点「审核要点异动排名」面板时才带（固定 `['0','2']`，即不通过 + 待复核）。
   * 空数组 = 不传；点其它面板 / 用表单查询 / 重置都会清掉它（见 resetPanelFilters）。
   */
  reviewOpinionList: [] as string[],
  /**
   * 任务 id 清单 —— 「审核要点复核情况」（卡4）点条筛清单用它（接口 2026-10-14 新增 `taskIdList` 返参）。
   * 卡4 不再借 `ruleId + reviewOpinionList` 反推：柱子给哪批任务，清单就显示哪批。
   */
  taskIdList: [] as string[],
  /**
   * 「AI识别问题项目」（卡2）穿透时**写死**的审核结果码值（`'20'` = 问题项目）。
   * 单独一个字段而不是复用表单的 `result`：表单的「AI预审结论」是用户自己选的，两者不能互相覆盖；
   * 下发给 getTaskPage 时它**优先于**表单值（点面板是最新动作），并且和其它面板条件一样，
   * 走表单查询/重置/点其它面板时会被清掉（见 resetPanelFilters）。
   */
  problemResult: ''
})

/** 卡2 的固定审核结果码值：字典 AI_AUDIT_TASK_RESULT_COM 的 20 = 问题项目（这张卡统计的就是它） */
const PROBLEM_RESULT_CODE = '20'

/**
 * 人工复核状态筛选选项（需求 2026-10-20）。
 * 码值以后端返参为准：1 待复核 / 2 部分复核 / 3 全部复核（docs/默认模块.md 同口径）；
 * 展示顺序按需求给的「全部复核 → 部分复核 → 待复核」。
 */
const manualReviewStatusOptions = [
  { code: '3', name: '全部复核' },
  { code: '2', name: '部分复核' },
  { code: '1', name: '待复核' }
]

/** 「审核要点异动排名」面板点选时固定下发的审核意见范围（不通过 + 待复核） */
const RANK_REVIEW_OPINIONS = ['0', '2']
/** 预算事项提交后的展示名 */
const appliedBudgetName = ref('')

/** 四张卡各自的选中项（只服务高亮；请求条件在 appliedFilters 里）。
 *  卡2 的环形图按归口部门统计，高亮与卡1 柱子共用 activeDept，所以这里没有它的独立状态。 */
const activeRuleId = ref('')
/** 卡4 的选中项。它与卡3 一样是**要点**维度，但两张卡各自的选中态要独立，不能共用一个 ref */
const activeReviewPoint = ref('')

/**
 * 归口部门柱图自己的「已选中」态。
 * ⚠️ 只能用 activeDept，**不能**用下面的 isFiltering —— 那张图的压暗样式是
 * `.vbar-chart.filtering .vbar-col { opacity: .35 }`，它没有 `.on` 的柱子会一起变灰；
 * 之前这里串了全页的 isFiltering，于是点别的面板会把左边这张柱图整片压暗，看着像它也被选中了。
 */
const deptFiltering = computed(() => !!activeDept.value)

/** 页面级「有条件生效中」：只给清单的淡入动画用（.table-wrap.is-filtering），与各卡的压暗无关 */
const isFiltering = computed(
  () =>
    !!activeDept.value ||
    !!activeRuleId.value ||
    !!activeReviewPoint.value ||
    Object.values(appliedFilters).some((v) => (Array.isArray(v) ? v.length > 0 : !!v))
)

/** 清单空态文案：优先说清是哪个条件筛空的（点卡筛过也一样能看出来） */
const emptyText = computed(() => {
  if (activeRuleId.value) return `「${activeRuleId.value}」暂无匹配的审核项目记录`
  if (activeReviewPoint.value) return `「${activeReviewPoint.value}」暂无匹配的审核项目记录`
  return activeDept.value ? `「${activeDept.value}」暂无匹配的审核项目记录` : '暂无匹配的审核项目记录'
})

/* ---------------- 项目类型树（ElTreeSelect，与 views/ai/document 的查询控件一致） ---------------- */

/**
 * 树的字段映射：与 views/ai/document 的 projectTypeProps 逐字一致
 * （`protypeTree/getSubprotypeTree` 的节点是 `{ middleId, name, children? }`，
 * 值取 middleId —— 清单里任务行的 proType 就是这一套码值）。
 */
const PRO_TYPE_TREE_PROPS = { label: 'name', children: 'children', value: 'middleId' }
/** 项目状态树的字段映射（同 views/ai/document 的 flowStatusProps：码值取 code） */
const FLOW_STATUS_TREE_PROPS = { children: 'children', label: 'name', value: 'code' }

/** 清空项目类型（重置时用；下拉自身的清空/删标签由 ElTreeSelect 维护 v-model，不用手动同步树） */
const clearProType = () => {
  filterForm.proTypes = []
}

/* ---------------- 清单取数（服务端筛选 + 服务端分页） ---------------- */

/** 分页状态；total 由接口返参回填（见下面的 watch）。默认每页 10 条（需求 2026-10-19） */
const pageable = reactive({ current: 1, size: 10, total: 0 })

/** 序号跨页连续：el-table 的 index 列只给行下标，要自己叠加前面页的条数 */
const indexMethod = (index: number) => (pageable.current - 1) * pageable.size + index + 1

/**
 * AI审核时间列只显示年月日：finishTime 后端下发形如 "2026-10-21 19:25:37"，
 * 截前 10 位即 "2026-10-21"。空值原样返回空串，el-table 会走 empty-text/– 兜底。
 * 只截显示，不改数据层 auditTime（导出等仍用完整时间）。
 */
const auditTimeFormatter = (row: AuditRow, _column: unknown, cellValue: string) => {
  const value = String(cellValue ?? '').trim()
  return value ? value.slice(0, 10) : ''
}

/** 按码值在下拉项里取中文名 */
const nameOf = (options: OptionItem[], code: string) => options.find((item) => item.code === code)?.name || ''

/**
 * 清单与导出**共用**的查询条件（不含分页）。
 * 抽出来是为了让「导出」和屏幕上看到的清单走同一份条件——两边各写一份迟早会走偏。
 */
const buildConditionParams = () => ({
  yjdw: appliedFilters.yjdw || undefined,
  ejdwList: appliedFilters.ejdw ? [appliedFilters.ejdw] : undefined,
  gkbm: appliedFilters.dept || undefined,
  // 项目类型：值口径与 views/ai/document 一致（protypeTree/getSubprotypeTree 的 middleId 数组），
  // 但**入参名沿用文档/后端的 `proTypeList`**（用户 2026-10-12 确认：入参不变）
  proTypeList: appliedFilters.proTypes.length ? appliedFilters.proTypes : undefined,
  // 卡3「审核要点异动排名」点条：按 ruleId 筛（并固定带上不通过+待复核）
  ruleId: appliedFilters.ruleId || undefined,
  reviewOpinionList: appliedFilters.reviewOpinionList.length ? appliedFilters.reviewOpinionList : undefined,
  // 卡4「审核要点复核情况」点条：直接用柱子给的任务 id 清单（2026-10-14 起不再下发 ruleId/reviewOpinionList）
  taskIdList: appliedFilters.taskIdList.length ? appliedFilters.taskIdList : undefined,
  // 预算事项改按输入的名称模糊查：接口文档只定义了 ID 口径（yssxNewId），
  // 这里先把文本交给 yssxName，后端支持名称过滤后按实际入参名对一下即可（接缝就这一处）
  yssxName: appliedFilters.budget || undefined,
  xmbmList: appliedFilters.xmbm
    ? appliedFilters.xmbm
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined,
  xmmc: appliedFilters.xmmc || undefined,
  flowStatusList: appliedFilters.flowStatusList.length ? appliedFilters.flowStatusList : undefined,
  // AI预审结论：字典 AI_AUDIT_TASK_RESULT_COM 的码值，按需求给的入参名 `result` 传。
  // 卡2 穿透时写死的 `problemResult`（'20'）优先于表单选择 —— 点面板是最新动作，两者共存时以面板为准
  result: appliedFilters.problemResult || appliedFilters.result || undefined,
  // 人工复核状态（后端 2026-10-20 新增入参）：1 待复核 / 2 部分复核 / 3 全部复核
  manualReviewStatus: appliedFilters.manualReviewStatus || undefined,
  jhssnd: appliedFilters.jhssnd || undefined,
  reviewOpinion: appliedFilters.conclusion || undefined,
  auditTimeStart: appliedFilters.auditStart || undefined,
  auditTimeFinish: appliedFilters.auditEnd || undefined
})

/** 组装 getTaskPage 的入参：空值一律不传（= 不限）；项目类型是多选，非空时整组传 */
const buildListParams = () => ({
  page: pageable.current,
  limit: pageable.size,
  ...buildConditionParams()
})

/**
 * 清单勾选（需求 2026-10-13）：「智能审核轨迹」要先在清单里勾选一个项目。
 * 轨迹弹窗是单任务维度的，所以只认「恰好 1 条」——多选时按钮同样禁用。
 */
const selectedRows = shallowRef<AuditRow[]>([])
const syncSelectedRows = (rows: AuditRow[]) => {
  selectedRows.value = Array.isArray(rows) ? rows : []
}
const hasSelectedOne = computed(() => selectedRows.value.length === 1)

/**
 * 重查清单。
 * `resetPage` 只给「改条件」的入口用（改完条件必须回到第 1 页，否则会停在一个空页上）；
 * 翻页/改每页条数走默认值，页码由分页组件自己维护。
 *
 * 换页/换条件后旧的勾选行已经不在表里，顺手清掉 —— 否则「轨迹」按钮会对着一条看不见的行保持可用。
 */
const reloadRows = ({ resetPage = false } = {}) => {
  if (resetPage) pageable.current = 1
  tableRef.value?.clearSelection?.()
  selectedRows.value = []
  return loadAuditRows(buildListParams())
}

const handlePageChange = (page: number) => {
  pageable.current = page
  void reloadRows()
}

const handleSizeChange = (size: number) => {
  pageable.size = size
  pageable.current = 1
  void reloadRows()
}

/** 接口返参的总条数同步给分页组件 */
watch(auditTotal, (value) => {
  pageable.total = Number(value) || 0
})

/**
 * 导出：把**已生效**的条件（与清单同源，见 buildConditionParams）交给后端生成文件。
 * 未点「查询」的改动不会被带出去——导出范围与屏幕上看到的清单一致。
 * 落盘交给 apiExportHandle：响应头带 content-disposition 时用服务端给的文件名。
 */
const filterExport = async () => {
  try {
    await apiExportHandle({ ...roleParams(), ...buildConditionParams() }, EXPORT_FILE_NAME, exportTask)
  } catch (e) {
    ElMessage.error((e as Error)?.message || '导出失败')
  }
}

/* ---------------- 折叠筛选面板的交互 ---------------- */

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value
  // 筛选区一展开/收起，全屏下面表格能占的高度就变了，等过渡走完重量一次
  if (isListFullscreen.value) scheduleTableHeightSync()
}

/**
 * 一级单位变更：清空二级单位并按其联动重取选项。
 * 写法对齐智能审核任务管理（useAiSmartTaskAuditPage.searchYjdwChangeHandle）：
 * 先清已选值与旧选项，再按新的一级单位拉子级；闭包里捕获本次取值，
 * 交给 hook 判断响应是否已过期（连点/来回切时只认最后一次）。
 */
const onYjdwChange = () => {
  const yjdw = filterForm.yjdw
  filterForm.ejdw = ''
  void loadEjdwOptions(yjdw, () => filterForm.yjdw === yjdw)
}

/**
 * 清掉四个卡下发的筛选条件与高亮。
 *
 * 四张卡的条件是**互斥**的（需求 2026-09-28）：点任一卡时先调它，只让当前点击的那个生效。
 * 否则点过两三个卡后，这些条件会被一起传给 getTaskPage，AND 出一份谁也没预期的清单。
 * 注意只清卡下发的条件（归口部门 / 审核结论 / 规则id / 项目类型名），表单里的
 * 一级单位、二级单位、项目类型（树）、预算事项、审核时间不动。
 */
const resetPanelFilters = () => {
  activeDept.value = ''
  filterForm.dept = ''
  appliedFilters.dept = ''
  filterForm.conclusion = ''
  appliedFilters.conclusion = ''
  activeRuleId.value = ''
  appliedFilters.ruleId = ''
  // 异动排名卡附带的固定审核意见范围，只跟着它一起生效
  appliedFilters.reviewOpinionList = []
  // 复核情况卡下发的任务 id 清单 / 问题项目卡下发的固定审核结果，同理只跟着它一起生效
  appliedFilters.taskIdList = []
  appliedFilters.problemResult = ''
  activeReviewPoint.value = ''
}

/** 点查询：把卡里的输入提交为生效条件，再让服务端按这些条件重查清单 */
const filterSubmit = () => {
  const budgetName = filterForm.budget.trim()
  appliedFilters.yjdw = filterForm.yjdw
  appliedFilters.ejdw = filterForm.ejdw
  appliedFilters.dept = filterForm.dept
  appliedFilters.proTypes = [...filterForm.proTypes]
  appliedFilters.budget = budgetName
  appliedBudgetName.value = budgetName
  appliedFilters.xmbm = filterForm.xmbm
  appliedFilters.xmmc = filterForm.xmmc
  appliedFilters.flowStatusList = [...filterForm.flowStatusList]
  appliedFilters.result = filterForm.result
  appliedFilters.manualReviewStatus = filterForm.manualReviewStatus
  appliedFilters.jhssnd = filterForm.jhssnd
  appliedFilters.auditStart = filterForm.auditStart
  appliedFilters.auditEnd = filterForm.auditEnd
  appliedFilters.conclusion = filterForm.conclusion
  // 与柱状图联动：卡里选了部门就让对应的柱高亮，没选就取消高亮（柱状图存的是名称）
  activeDept.value = nameOf(gkbmOptions.value, filterForm.dept)
  // 走表单查询时，「只由卡下发」的条件（规则id / 任务id清单）在表单里没有对应输入，
  // 留着会变成看不见的额外筛选，所以一并清掉（互斥规则同样适用）；reviewOpinionList 同理
  appliedFilters.ruleId = ''
  activeRuleId.value = ''
  appliedFilters.reviewOpinionList = []
  appliedFilters.taskIdList = []
  appliedFilters.problemResult = ''
  activeReviewPoint.value = ''
  void reloadRows({ resetPage: true })
}

/**
 * 重置：清空全部条件并恢复默认视图。
 * 日期留空（= 不限）而不是回填演示用的固定区间——那种回填一到真实数据就会被默默挡掉。
 */
const filterReset = () => {
  filterForm.yjdw = ''
  filterForm.ejdw = ''
  clearEjdwOptions()
  clearProType()
  filterForm.budget = ''
  filterForm.xmbm = ''
  filterForm.xmmc = ''
  filterForm.flowStatusList = []
  filterForm.result = ''
  filterForm.manualReviewStatus = ''
  filterForm.jhssnd = ''
  filterForm.auditStart = ''
  filterForm.auditEnd = ''
  // 四张卡下发的条件与高亮一并清掉（含表单里的归口部门/审核结论）
  resetPanelFilters()
  filterSubmit()
}

/**
 * 点柱：柱状图与卡里的归口部门互相同步。
 *
 * `gkbm` 直接用统计接口返回的 **`zgkbm_id`**（此前是拿柱子的中文名去字典反查码值、
 * 查不到就把中文名原样传给 getTaskPage，后端按 id 查自然查不到）。
 * 点它之前先把其它三张卡的条件清掉（卡条件互斥，见 resetPanelFilters）。
 *
 * `problemOnly`（卡2 专用，需求 2026-10-14）：卡2 统计的是「问题任务」（RESULT = '20'），
 * 所以从它穿透要额外把 `result` 写死成 **'20'**，否则同一个部门下会把通过/待复核的记录也带出来，
 * 与环段上的数字对不上。用独立字段 `appliedFilters.problemResult` 存，不占用表单的「AI预审结论」。
 */
const pickDept = (bar: { id: string; name: string }, options: { problemOnly?: boolean } = {}) => {
  const next = activeDept.value === bar.name ? '' : bar.name
  resetPanelFilters()
  activeDept.value = next
  if (next) {
    filterForm.dept = bar.id
    appliedFilters.dept = bar.id
    if (options.problemOnly) appliedFilters.problemResult = PROBLEM_RESULT_CODE
  }
  void reloadRows({ resetPage: true })
}

/**
 * 卡2「AI识别问题项目」点环段/图例：按**归口部门**筛清单（与卡1 柱体同一条路，不另起状态），
 * 并额外带上写死的 `result: '20'`（见 pickDept 的 problemOnly）。
 */
const pickProblemSlice = (seg: DonutSegment) => pickDept({ id: seg.code, name: seg.name }, { problemOnly: true })

/**
 * 卡3「审核要点异动排名」点条：按 **ruleId** 筛清单（接口按 id 查；名称可能重复，不能拿名称当条件）。
 *
 * 额外固定带上 `reviewOpinionList: ['0','2']`：这张卡统计的是「异常」，口径就是不通过 + 待复核，
 * 不下发这个范围的话点条会带出通过/不执行的记录，和柱子上的数字对不上。
 * 再点一次取消；点它之前先清掉其它三张卡的条件（互斥）。
 */
const pickRank = (item: BarItem) => {
  const next = activeRuleId.value === item.name ? '' : item.name
  resetPanelFilters()
  activeRuleId.value = next
  if (next) {
    appliedFilters.ruleId = item.ruleId || ''
    appliedFilters.reviewOpinionList = [...RANK_REVIEW_OPINIONS]
  }
  void reloadRows({ resetPage: true })
}

/**
 * 卡4「审核要点复核情况」点条：按**该柱子给的任务 id 清单**筛清单（需求 2026-10-14）。
 *
 * 原来这里下发的是 `ruleId + reviewOpinionList(['0','2'])`（拿规则 id 加审核意见范围反推），
 * 现在接口（getManualReviewRule）直接回每根柱子的 `taskIdList`，整组当 getTaskPage 的 taskIdList 传 ——
 * 列表就是这根柱子统计到的那批任务，不用再猜口径，也不会带出柱子没算的任务。
 * 再点一次取消；点它之前先清掉其它三张卡的条件（互斥）。
 */
const pickReview = (item: PointReviewBar) => {
  const next = activeReviewPoint.value === item.name ? '' : item.name
  resetPanelFilters()
  activeReviewPoint.value = next
  if (next) appliedFilters.taskIdList = [...(item.taskIdList || [])]
  void reloadRows({ resetPage: true })
}

// --- 顶栏「数据截止」区间 ---
// 两份状态的**字段名不同**，别混：
//   dateRange    = 输入框的形态 { start, end }
//   appliedRange = 接口的入参形态 { startDate, endDate }，会被直接展开进看板接口
//   混用的后果：请求里发出 start/end 这种后端不认的键，区间条件被静默忽略（看起来「查询没生效」）。
/** 两位补零，用于拼 YYYY-MM-DD */
const pad2 = (n: number) => String(n).padStart(2, '0')

/** AI审核时间只显示年月日：后端 finishTime 形如 "YYYY-MM-DD HH:mm:ss"，取前 10 位；无值显示 - */
const formatAuditTime = (_row: any, _column: any, cellValue: unknown) => {
  if (cellValue === null || cellValue === undefined || cellValue === '') return '-'
  const str = String(cellValue)
  return str.length >= 10 ? str.slice(0, 10) : str
}/**
 * 默认区间：本年度 1 月 1 日 ~ 今天。
 * 原型把区间写死在 HTML 里，这里改成按当天算，免得每年要来改代码。
 */
const today = new Date()
const dateRange = reactive({
  start: `${today.getFullYear()}-01-01`,
  end: `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`
})

/** 已提交的区间，字段名与接口一致（startDate / endDate），可直接作为 loadBoard 的入参 */
const appliedRange = ref({ startDate: dateRange.start, endDate: dateRange.end })

/**
 * 下方筛选区的「AI审核时间」默认值跟顶栏区间保持一致。
 * 只写*输入值*（filterForm），不写已生效条件（appliedFilters）——与其他条件一样，
 * 要不要按它过滤由用户点下方「查询」决定，免得一进页面就被默认区间悄悄筛掉历史数据。
 */
filterForm.auditStart = dateRange.start
filterForm.auditEnd = dateRange.end

/**
 * 顶栏区间改动 → 同步下方「AI审核时间」（**单向**）。
 * 反向不做：下方「AI审核时间」只影响清单的查询条件，改它不回写顶栏区间——
 * 否则两条时间条件互相覆盖，用户改任一处都不知道最终按哪个区间查。
 */
watch(
  () => [dateRange.start, dateRange.end],
  ([start, end]) => {
    filterForm.auditStart = start
    filterForm.auditEnd = end
  }
)

/**
 * 起止必须同年 —— 以「开始日期所在年」为准，把结束日期的可选范围锁在同年。
 * 用原生 min/max：日期选择器里直接选不到跨年的日子。
 */
const endBounds = computed(() => {
  const year = dateRange.start.slice(0, 4)
  return /^\d{4}$/.test(year) ? { min: `${year}-01-01`, max: `${year}-12-31` } : { min: '', max: '' }
})

/** 把 YYYY-MM-DD 挪到指定年份，月日不变；2/29 遇到非闰年时退到当月最后一天 */
const moveToYear = (iso: string, year: number): string => {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d || !year) return iso
  const dt = new Date(year, m - 1, d)
  // Date 会把 2/29 顺延到 3/1，这时回退到上月最后一天
  if (dt.getMonth() !== m - 1) dt.setDate(0)
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

/**
 * 改开始日期时，把结束日期一并拉进同一年（保持月日）。
 * 少了这一步，用户把开始年份从 2024 改到 2025 后，结束日期会留在上一年成为非法值——
 * 原生 min/max 只把它标成非法，并不会阻止旧值停留或手动输入。
 */
watch(
  () => dateRange.start,
  (val) => {
    const year = Number(val.slice(0, 4))
    if (!year) return
    if (Number(dateRange.end.slice(0, 4)) !== year) dateRange.end = moveToYear(dateRange.end, year)
  }
)

/**
 * 顶栏「刷新数据」：校验后提交区间，重拉看板 + 清单。
 * 两条规则都要挡：跨年不支持（选择器的 min/max 只能标记非法，手动输入能绕过），
 * 以及开始日期不能晚于结束日期。
 *
 * 这个区间喂给**指标卡 + 四张卡的图**（getIndicatorStat / getAuditProStatByZgkbm / 三个
 * project-review 接口）；清单的「AI审核时间」是由它同步过去的**输入值**（见上面的 watch），
 * 但当次查询仍以「点下方查询时已生效的条件」为准，且下方改时间不会回写这里。
 */
const queryByDate = () => {
  const { start, end } = dateRange
  if (!start || !end) {
    ElMessage.warning('请选择完整的日期区间')
    return
  }
  // 先判先后：倒置区间无论跨不跨年都是错的，先报这条更能直接指出问题
  if (start > end) {
    ElMessage.warning('开始日期不能晚于结束日期')
    return
  }
  if (start.slice(0, 4) !== end.slice(0, 4)) {
    ElMessage.warning('不支持跨年查询，起止日期请选在同一年内')
    return
  }
  // 提交：落到接口口径的 appliedRange 上，再原样丢给 loadBoard（别再另造一份对象，键名容易走偏）
  appliedRange.value = { startDate: start, endDate: end }
  void Promise.all([loadBoard(appliedRange.value), reloadRows()])
}

/* ---------------- 智能审核详情 / 智能审核轨迹（跳转逻辑照智能审核任务管理） ---------------- */

const detailModal = reactive({ visible: false, loading: false })
const detailRow = ref<Record<string, any>>({})

/** 任务进度弹窗（复用智能审核任务管理的组件，内部按 taskId 调 getProcessProgress） */
const progressModal = ref()

/**
 * 智能审核轨迹：按**清单里勾选的那一条**打开任务进度弹窗（需求 2026-10-13 恢复「先选项目」的限制）。
 *
 * 弹窗是单任务维度的（`smartTaskProgress` 只收一个 taskId），所以要求恰好勾选 1 条 ——
 * 未选中时按钮本身是禁用的（见模板里的 el-tooltip），这里的提示只兜底键盘/程序触发。
 * 项目名一并带上：弹窗标题是「智能审核规则(项目名)」。
 */
const openProgressModal = () => {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请先在清单里勾选一个项目')
    return
  }
  const row = selectedRows.value[0]
  const taskId = String((row?.raw as Record<string, any>)?.taskId ?? '').trim()
  if (!taskId) {
    ElMessage.warning('所选项目缺少任务ID')
    return
  }
  progressModal.value?.acceptParams({ taskId, projectName: row.xmmc })
}

/** 打开详情：先把行数据写进去再开弹窗，避免弹窗内的首次请求读到空 taskId/proId */
const openDetailModal = (row: AuditRow) => {
  detailRow.value = (row?.raw as Record<string, any>) || {}
  detailModal.visible = true
}

/**
 * 只关弹窗、不清空 detailRow：关闭瞬间弹窗内的异步组件可能还在请求，
 * 同步置空会丢掉 taskId/proId 导致接口报错（与智能审核任务管理的处理一致），下次打开会覆盖。
 */
const closeDetailModal = () => {
  detailModal.visible = false
}

/**
 * 角色确认后：先拉下拉项（hook 里做），再拉看板与清单。
 * 前三个接口要 dwId/bmId，所以取数必须放在这里，不能在 onMounted 里先发。
 */
const handleRoleReady = async () => {
  await getRoleHandle()
  if (!isShowPage.value) return
  await Promise.all([loadBoard(appliedRange.value), reloadRows()])
}

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
  window.addEventListener('keydown', onListFullscreenKeydown)
  window.addEventListener('resize', syncTableMaxHeight)
  document.addEventListener('visibilitychange', onGuideVisibilityChange)
  syncTableMaxHeight()
  if (isShowPage.value) startGuide()
})

// 角色就绪后页面才真正渲染（角色选择器之前整块是 v-if 掉的），动画等它露面再开始
watch(isShowPage, (visible) => {
  if (visible) startGuide()
  else stopGuide()
})

/**
 * keep-alive 页签再次进入：也从头播**一次**（需求 2026-10-13「重新进入页面后也只需要播放一次」）。
 * 首次挂载时 onMounted 已经起过一轮，而 onActivated 紧随其后也会触发 —— 用标志位跳过那一回，
 * 免得刚播两拍又被打回第 0 步。
 */
let guideStartedOnMount = false

onActivated(() => {
  if (!isShowPage.value) return
  if (!guideStartedOnMount) {
    guideStartedOnMount = true
    return
  }
  startGuide()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onListFullscreenKeydown)
  window.removeEventListener('resize', syncTableMaxHeight)
  document.removeEventListener('visibilitychange', onGuideVisibilityChange)
  stopGuide()
})
</script>

<style scoped>
/*
 * 本页是一块「工作台」，版式自成一系（照 docs/智能工作台-美化版.html）：
 * 多色相的状态语义、18px 大卡、柔和阴影与 hover 抬升，都与 DESIGN.md 的
 * 「单一深青绿 + 无阴影 + 12px 上限」不同——这是原型明确要求的方向，不是漏改。
 * 站内其它页面仍按 DESIGN.md 走。
 */

.srh3-viewport {
  position: relative;
  /*
   * 页面根节点必须是**自己的滚动容器**。
   *
   * 后台布局把内容区压成固定高（这里实测 970px = 视口 - 顶栏 - tab 栏 - 内容区 padding），
   * 而承载页面的 .el-card 是 `height: 100%` + `overflow: hidden` —— 页面比它高出来的部分会被
   * 直接裁掉；祖先链上 `.rr-view-ctx` / `.el-main` 的高度又正好等于容器，自己不会溢出，也就不会滚。
   * 两者相加的结果是：内容多出来的那一截既看不见、也滚不到。
   * 本页是纵向长页面（顶栏 + 导览 + 四卡 + 清单，约 1250px），所以滚动必须由自己承担。
   */
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  /* 纵向 flex：让 .page 能撑满剩余高度，清单卡才能一路贴到底（不留一截页面底色） */
  display: flex;
  flex-direction: column;
  /*
   * 左右内边距 0：卡片直接贴到内容区两侧。
   * 上边距 8px 只留一点呼吸（原 16px 偏大，标题块离顶太远）。
   * 底边也是 0：清单卡一路贴到底。
   *
   * ⚠️ 内容区两侧仍各有 10px 空白，那是共享布局 `.rr-view-ctx` 的 padding，
   *    不是本页的 —— 它作用于全部 800+ 个页面，不能为了这一页改；
   *    而承载页面的 .el-card 是 overflow: hidden，页内用负 margin 抵消也只会被裁掉。
   */
  padding: 0 0 0;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'HarmonyOS Sans SC', system-ui, sans-serif;
  color: #0f172a;
  /* 背景光晕直接落在页面上（原型的 .app-bg 是 fixed 负层级，套在后台白卡里会看不见） */
  background: radial-gradient(900px 520px at 6% -10%, rgba(13, 148, 136, 0.14), transparent 62%),
    radial-gradient(820px 500px at 94% -6%, rgba(37, 99, 235, 0.12), transparent 62%),
    radial-gradient(760px 520px at 55% 112%, rgba(124, 58, 237, 0.08), transparent 60%),
    linear-gradient(180deg, #f8fafc 0%, #f2f5fa 55%, #eef2f8 100%);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
/* 自带的滚动条：底部内边距会被滚动区吃掉一截，补回来一点呼吸感 */
.srh3-viewport::-webkit-scrollbar {
  width: 8px;
}
.srh3-viewport::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border: 2px solid transparent;
  border-radius: 99px;
  background-clip: content-box;
}
.srh3-viewport::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
  background-clip: content-box;
}

.page {
  /* 原型是 1670px 固定宽（body 横向滚动）；改成流式：宽屏按 1600 居中，窄屏跟着收缩。
     表格自己会在容器内横向滚动（列表允许有滚动条）。 */
  display: flex;
  flex-direction: column;
  /* 块间距（品牌栏 / 导览 / 四卡 / 清单）14 → 6 → **4px**：
     2026-10-12 需求「每块间距缩小」；2026-10-14 再收 2px，是为了补回分页那条 5px 间距
     （`.table-pager` 的 margin-top）——让 900 高的窗口里「卡头 + 5 行表格 + 分页」仍整块进屏 */
  gap: 4px;
  /* 撑满 .srh3-viewport 的剩余高度：多出来的空间全部给最后一块（清单卡），
     否则页面底部会留一截底色 —— 看着像清单卡「没铺到底」。
     **0 收缩**：装不下时交给 .srh3-viewport 出滚动条，不靠压扁子项来凑。 */
  flex: 1 0 auto;
  width: 100%;
  /* 不再限宽居中（原型是 max-w-[1600px] mx-auto）：宽屏下那圈居中留白也算「左右间距」，
     去掉后卡片铺满内容区。窄屏本来就在 1600 以下，不受影响。 */
  margin: 0;
}

/*
 ⚠️ 顶部（品牌栏 + 导览）/ 四卡一律 `flex: none` —— **不允许被压缩**。
 .page 是 flex 列，flex 子项默认 flex-shrink: 1：容器高度不够时浏览器会按比例压这些块，
 而它们都是 `overflow: hidden` 的卡片，一压就直接**裁掉内容** —— 导览的步进条就是这么被切掉半行的
 （实测容器 970 时导览只拿到 161px，而内容需要 192px）。
 这些块按内容排布即可；真装不下时让 .srh3-viewport 出滚动条，而不是把内容切掉。
 页面高度够用时，多出来的空间由 .page 与清单卡的 flex-grow 收下，底部不会留底色。
*/
.topbar,
.stats {
  flex: none;
}

/* 数字一律等宽对齐（DESIGN.md 的 Tnum Rule） */
.num,
.stat-v,
.hbar-val,
.lg-val,
.lg-pct,
.pager-total b,
.step-num,
.date-input {
  font-variant-numeric: tabular-nums;
}

/* ============ 面板基座 ============ */
.panel {
  position: relative;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 14px 30px -22px rgba(16, 24, 40, 0.22);
  transition: box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.35s ease;
}
/*
 hover 只强调描边与阴影，**不做位移**（原型是 translateY(-3px) 的抬升）。
 原因：内容区一整块跟着光标上移，正在看的那一行会跑；长清单上尤其明显。
 站内 DESIGN.md 也明确「不给命令按钮加 transform 位移」，这里一并统一。
*/
.panel:hover {
  border-color: rgba(13, 148, 136, 0.28);
  box-shadow: 0 2px 6px rgba(16, 24, 40, 0.05), 0 22px 44px -24px rgba(13, 148, 136, 0.3);
}

/* 图标底盘：4 个色相（照原型 chip-teal / chip-red / chip-blue / chip-violet） */
.icon-chip {
  display: flex;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  color: #fff;
}
.icon-chip svg {
  width: 16px;
  height: 16px;
}
.chip-teal {
  background: linear-gradient(135deg, #5eead4, #0d9488);
  box-shadow: 0 6px 14px -8px rgba(13, 148, 136, 0.8);
}
.chip-red {
  background: linear-gradient(135deg, #fda4af, #e11d48);
  box-shadow: 0 6px 14px -8px rgba(225, 29, 72, 0.8);
}
.chip-blue {
  background: linear-gradient(135deg, #93c5fd, #2563eb);
  box-shadow: 0 6px 14px -8px rgba(37, 99, 235, 0.8);
}
.chip-violet {
  background: linear-gradient(135deg, #c4b5fd, #7c3aed);
  box-shadow: 0 6px 14px -8px rgba(124, 58, 237, 0.8);
}

/* ============ 顶部品牌栏 + 智能审核路径导览（同一张卡，照 1009/智能工作台v0.3） ============ */
.topbar {
  /* 四段竖排：品牌行 / 分隔线 / 导览标题行 / 步进条；品牌行自己是一行 flex（.topbar-row） */
  padding: 14px 20px 16px;
  overflow: hidden;
  /* 主标题「居中 or 回退独占一行」按**卡片自己的宽度**判定：原型那条断点按视口写，
     而我们的内容区比原型少 240px 侧栏，照抄会在 1280 这类宽度上让标题压住右侧日期与刷新按钮 */
  container-type: inline-size;
}
/* 右上角柔光：与原型同一处（-right-24 -top-24 的径向青绿） */
.topbar-glow {
  position: absolute;
  top: -96px;
  right: -96px;
  width: 288px;
  height: 288px;
  pointer-events: none;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(13, 148, 136, 0.14), transparent 70%);
  filter: blur(48px);
}
.topbar-row {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  /* 原型 gap-x-3 gap-y-2 */
  column-gap: 12px;
  row-gap: 8px;
}
/* 品牌行与导览之间的分隔线：左端青绿、向右淡出（原型是一条内联渐变背景的 h-px） */
.topbar-divider {
  position: relative;
  height: 1px;
  margin: 12px 0;
  background: linear-gradient(90deg, rgba(13, 148, 136, 0.3), rgba(226, 232, 240, 0.9) 45%, rgba(226, 232, 240, 0.5));
}
/* 左：logo + 特性标签（贴在一起；右侧是日期与刷新，标题绝对居中） */
.topbar-left {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
/*
 品牌位图标与下方四张卡片的图标**同尺寸**（需求 2026-10-14）：就是 .icon-chip 基座的 30px，
 不再单独放大（原型品牌位是 36px，这里按需求方口径统一成卡片那档）。
*/
.topbar .icon-chip {
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 10px;
}
.topbar .icon-chip svg {
  width: 16px;
  height: 16px;
}
/*
 主标题（照原型 2026-10-14 版）：绝对居中、不参与点击（pointer-events: none），
 文字走渐变色填充（.brand-title-text）—— 这是原型指定的突出方式。
 卡片不够宽时（放不下「左组 + 居中标题 + 右组」三块）回到文档流、独占一行居中，
 免得标题压住右边的日期与刷新按钮 —— 原型的意图如此，断点改成按卡片宽度（容器查询）判定。
 需要的宽度 = 标题宽(≈240) + 2 ×（右组宽(≈450) + 间距）≈ 1180px。
*/
.brand-title {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  display: flex;
  align-items: center;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
}
.brand-title-text {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0.08em;
  color: transparent;
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 42%, #2563eb 118%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
@container (max-width: 1179px) {
  .brand-title {
    position: static;
    order: -1;
    width: 100%;
    justify-content: center;
    transform: none;
  }
}
.topbar-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

/* 特性标签 / 数据统计期：胶囊底（原型 2026-10-14 版去掉了标签里的脉冲圆点） */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 11.5px;
  line-height: 16px;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 999px;
}
.pill--teal {
  color: #0f766e;
  background: #f0fdfa;
  border-color: #ccfbf1;
}
.pill--blue {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #dbeafe;
}
.pill--violet {
  color: #6d28d9;
  background: #f5f3ff;
  border-color: #ede9fe;
}
.pill--gray {
  color: #64748b;
  background: #f8fafc;
  border-color: #f1f5f9;
}

/* 数据统计期里的两个日期输入：默认隐身，hover/focus 才显出边框（胶囊内边距照原型 px-3 py-1 / gap 6px） */
.date-pill {
  gap: 6px;
  padding: 4px 12px;
}
.date-sep {
  color: #cbd5e1;
  font-size: 11px;
}
.date-input {
  padding: 2px 6px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 8px;
  outline: none;
  transition: all 0.18s ease;
}
.date-input:hover {
  color: #0f766e;
  background: #f0fdfa;
  border-color: rgba(13, 148, 136, 0.45);
}
.date-input:focus {
  color: #0f766e;
  background: #f0fdfa;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.14);
}
.date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.55;
}
.date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* ============ 通用按钮 ============ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  color: #475569;
  white-space: nowrap;
  cursor: pointer;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  transition: all 0.2s ease;
}
.btn svg {
  width: 14px;
  height: 14px;
}
/* hover 只换底色/描边/字色，不做位移（与 .panel:hover 同一原则） */
.btn:hover {
  color: #0f766e;
  background: #f0fdfa;
  border-color: rgba(13, 148, 136, 0.55);
}
.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  border-color: transparent;
  box-shadow: 0 8px 18px -10px rgba(13, 148, 136, 0.9);
}
.btn-primary:hover {
  color: #fff;
  background: linear-gradient(135deg, #0d9488, #0f766e);
  border-color: transparent;
}
.btn.is-on {
  color: #0f766e;
  background: #f0fdfa;
  border-color: rgba(13, 148, 136, 0.55);
}
/* 前置条件未满足（如「智能审核轨迹」还没勾选项目）：压成灰底，且不再响应 hover */
.btn:disabled,
.btn:disabled:hover {
  color: #94a3b8;
  cursor: not-allowed;
  background: #f8fafc;
  border-color: #e2e8f0;
  box-shadow: none;
}
.btn-caret {
  width: 13px;
  height: 13px;
  transition: transform 0.2s ease;
}
.btn.is-on .btn-caret {
  transform: rotate(180deg);
}

/* ============ 智能审核路径导览（顶部卡的下半段） ============ */
.guide-head {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  /* 导览标题与步进条之间照原型 mb-3 = 12px */
  margin-bottom: 12px;
}
.guide-title {
  display: flex;
  align-items: center;
  margin: 0;
  /* 品牌栏是主标题，导览是它下面的说明块：字号降一档（照原型 text-[14px]） */
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}
/* 标题前的渐变竖条：清单卡标题同款（原型 w-1.5 h-3.5 mr-2 = 6×14px、右间距 8px） */
.title-bar {
  display: inline-block;
  width: 6px;
  height: 14px;
  margin-right: 8px;
  border-radius: 2px;
  background: linear-gradient(180deg, #2dd4bf, #0d9488);
}
.count-chip {
  margin-left: 8px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 999px;
}
/*
 角色图例（导览标题行右侧）：环节标签里那枚 14px 小图标 = 谁执行，图例把它翻译成角色名。
 4 项各自独立成胶囊（照原型），颜色跟着**角色**走，与环节的进行状态无关 ——
 状态色只讲「走到哪了」，角色色讲「谁来干」，两套语义不互相覆盖。
 色值与顶栏特性标签(.pill--*)、表格徽标(.badge--*)同源，全页一套语义色。
*/
.step-legend {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
}
.step-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px 3px 6px;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 999px;
  transition: all 0.22s ease;
}
.step-legend-item:hover {
  background: #fff;
  border-color: #e2e8f0;
  box-shadow: 0 2px 6px -3px rgba(15, 23, 42, 0.25);
}
/* 图例里的小图标照原型比环节标签里的再小一号（8px svg vs 9px） */
.step-legend .role-icon svg {
  width: 8px;
  height: 8px;
}
/*
 角色图标底盘：环节标签内联 + 标题行图例共用（原型是两套 8/9px 的同色小方块，这里合成一套）。
 4 个色位对应 4 个角色；图标本体是 lucide 组件，尺寸由这里压到 9px。
*/
.role-icon {
  display: inline-flex;
  flex: 0 0 14px;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 4px;
}
.role-icon svg {
  width: 9px;
  height: 9px;
}
.role-icon--violet {
  color: #7c3aed;
  background: #f5f3ff;
}
.role-icon--blue {
  color: #2563eb;
  background: #eff6ff;
}
.role-icon--teal {
  color: #0d9488;
  background: #f0fdfa;
}
.role-icon--gray {
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.stepper-scroll {
  position: relative;
  width: 100%;
  padding-bottom: 4px;
  padding-top: 2px;
  overflow-x: auto;
}
.stepper-scroll::-webkit-scrollbar {
  display: none;
}
.stepper-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.stepper {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  min-width: 900px;
}
.step {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
}
.step-circle {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 尺寸照原型（.stepper-circle 26px / 字号 11px；原来是 30/12，看着比原型重） */
  width: 26px;
  height: 26px;
  font-size: 11px;
  font-weight: 700;
  color: #a3aec0;
  background: #fff;
  border: 2px solid #dbe3ec;
  border-radius: 50%;
  /* 阴影/脉冲半径照原型（0 2px 5px -2px / 扩散 8px；原来是 6px -3px、扩散 10px） */
  box-shadow: 0 2px 5px -2px rgba(15, 23, 42, 0.2);
  /* 与一拍同步放缓：0.9s = GUIDE_STEP_MS(1500ms) 的 0.6 倍（原 1000ms 配 0.6s） */
  transition: all 0.9s cubic-bezier(0.4, 0, 0.2, 1);
}
.step-check {
  display: none;
  width: 13px;
  height: 13px;
}
.step.completed .step-num {
  display: none;
}
.step.completed .step-check {
  display: block;
}
.step.completed .step-circle {
  color: #0f766e;
  background: #ecfdf5;
  border-color: #34d399;
  box-shadow: none;
}
.step.active .step-circle {
  color: #fff;
  /*
   当前步（点亮）的底色用**纯色** #14b8a6（需求方 2026-10-14 定稿）：
   试过两版渐变都退回纯色 —— 26px 的小圆上，渐变（无论 #2dd4bf→#0d9488 还是色差更小的 #2dd4bf→#14b8a6）
   都会在圆边留下深浅分界，看着就是「一圈描边」。描边置透明、光晕去掉 —— 只剩纯色底 + 脉冲环。
  */
  background: #14b8a6;
  border-color: transparent;
  box-shadow: none;
  animation: step-pulse 1.6s infinite;
}
/*
 一轮全部走完（终态）：8 个圆点**统一**进「点亮」态 —— 纯青绿底 + 白字，前 7 个不再显示打勾
 （需求 2026-10-14：终态要「绿色点亮」而不是打勾）。
 描边 / 光晕 / 渐变全部去掉（需求 2026-10-14 追加两轮，逐层排查的结论）：
 - 描边用 `transparent` 而不是删 `border`，圆点尺寸/内边距与其它状态完全一致；
 - 光晕 `rgba(13,148,136,.95)` 是深青色、95% 不透明、贴着圆形轮廓，看着就是一圈外描边；
 - 最后一层「描边」其实来自**渐变**：深色半边贴边 —— 所以点亮态一律用纯色，不做任何渐变。
 纯色取中调青绿 **`#14b8a6`**（脉冲光环同色）：深端 `#0d9488` 拍平后观感偏深
 （反馈「颜色变深了」）、浅端 `#2dd4bf` 压不住白字；只有纯色才完全不出「边」。
 脉冲一并关掉（终态会一直挂着，8 个脉冲环同时在跳太吵）；要恢复把这行删了即可。
*/
.stepper.is-finished .step-circle,
.stepper.is-finished .step.completed .step-circle,
.stepper.is-finished .step.active .step-circle {
  color: #fff;
  background: #14b8a6;
  border-color: transparent;
  box-shadow: none;
  animation: none;
}
.stepper.is-finished .step.completed .step-num {
  display: block;
}
.stepper.is-finished .step.completed .step-check {
  display: none;
}
.stepper.is-finished .step-label,
.stepper.is-finished .step.completed .step-label,
.stepper.is-finished .step.active .step-label {
  font-weight: 700;
  color: #0f766e;
}
/*
 当前步的脉冲：只扩散一圈淡青光环（`0 0 0 Npx`）。
 原来还叠着那条深青光晕（`0 6px 14px -6px rgba(13,148,136,.95)`），
 它会在圆点外侧压出一圈深色 —— 与「点亮态不要深色边缘」冲突，已从关键帧里去掉（2026-10-14）。
*/
@keyframes step-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.45);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(20, 184, 166, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(20, 184, 166, 0);
  }
}
/* 连线画在圆点右半边：top 取圆点中线（26px 圆点 → 12px），宽度 100% 伸到下一步 */
.step-line {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 1;
  width: 100%;
  height: 2.5px;
  overflow: hidden;
  background: #e8edf4;
  border-radius: 2px;
}
.step:last-child .step-line {
  display: none;
}
.step-line i {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #60a5fa, #2dd4bf, #0d9488);
  background-size: 200% 100%;
  /* 每拍 1500ms（GUIDE_STEP_MS）：连线用一拍的 0.8 倍时间（1.2s）走完，收尾留点余量 */
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: line-flow 2.2s linear infinite;
}
@keyframes line-flow {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
.step-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  /* 间距/字号照原型（.stepper-label margin-top 8px / 11.5px） */
  margin-top: 8px;
  font-size: 11.5px;
  font-weight: 500;
  color: #9aa5b5;
  text-align: center;
  white-space: nowrap;
  letter-spacing: 0.2px;
  /* 同上：标签的配色/位移过渡（0.8s，跟着一拍的比例走） */
  transition: all 0.8s ease;
}
.step.active .step-label {
  font-weight: 700;
  color: #0f766e;
}
.step.completed .step-label {
  color: #475569;
}
/* 标签里那枚角色图标跟着环节状态走：高亮时放大一点，走过的暗下去（照原型） */
.step .role-icon {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.step.active .role-icon {
  transform: scale(1.15);
  box-shadow: 0 2px 6px -2px rgba(13, 148, 136, 0.45);
}
.step.completed .role-icon {
  opacity: 0.55;
}
/*
 这里原先有一条 `@media (prefers-reduced-motion: reduce)`，把脉冲/流光/过渡一并关掉。
 需求方 2026-10-10 要求**内外网表现一致**，已删除 —— 内网机器常上报 reduce（性能优先方案 / 组策略 / 远程桌面），
 会导致导览整块定格、看不出效果，而内网演示正是这个动画的主要用途。
 要恢复无障碍降级：把这条媒体查询加回，并在脚本的 startGuide 里补一次 matchMedia 判定。
*/

/* ============ 指标卡 ============ */
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  /* 卡片之间的间距 16 → 12px（需求 2026-10-12：每块间距缩小） */
  gap: 12px;
}
.card {
  display: flex;
  flex-direction: column;
  padding: 14px;
}
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.card-head-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.panel-title {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #0f172a;
  /* 卡片标题是短标签，折行只会把卡头撑高、看着像坏了（窄屏时「审核要点复核情况」会断成两行） */
  white-space: nowrap;
}

/* 维度下拉（照原型 .mini-select） */
.mini-select {
  flex: 0 0 auto;
  padding: 3px 22px 3px 10px;
  font-family: inherit;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  background-color: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 7px center;
  background-size: 12px;
  transition: all 0.2s ease;
}
.mini-select:hover {
  color: #0f766e;
  background-color: #f0fdfa;
  border-color: rgba(13, 148, 136, 0.5);
}

/* 指标小卡：左数值 / 分隔线 / 右数值 */
.stat-tile {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.09), rgba(148, 163, 184, 0.03));
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: 12px;
}
.stat-tile.alert {
  background: linear-gradient(135deg, rgba(225, 29, 72, 0.1), rgba(225, 29, 72, 0.02));
  border-color: rgba(225, 29, 72, 0.12);
}
.stat-tile.ok {
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.11), rgba(13, 148, 136, 0.02));
  border-color: rgba(13, 148, 136, 0.14);
}
.stat-cell {
  flex: 1;
  min-width: 0;
}
.stat-k {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.3px;
  color: #64748b;
  white-space: nowrap;
}
.stat-v {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.3px;
  white-space: nowrap;
}
.stat-v span {
  margin-left: 2px;
  font-size: 11px;
  font-weight: 500;
  opacity: 0.75;
}
.stat-v--teal {
  color: #0f766e;
}
.stat-v--rose {
  color: #e11d48;
}
.stat-v--slate {
  color: #1f2937;
}
.stat-sep {
  width: 1px;
  background: rgba(15, 23, 42, 0.08);
}

/* ============ 图表容器 ============ */
/* 190px 是原型的尺寸；这里压到 140px，把纵向空间还给清单（需求：一屏尽量看全）。
   四张图各自的内部尺寸都跟着收过：环形图盒子 118px、横向条行高 20px，都仍在一屏内排得下。 */
.chart {
  height: 140px;
  margin-top: 8px;
}
.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12.5px;
  color: #94a3b8;
}
/* 细滚动条（数据多时图表内部滚，不把条压扁） */
.scroll-thin {
  overflow-y: auto;
  overflow-x: hidden;
}
.scroll-thin::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.scroll-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border: 2px solid transparent;
  border-radius: 99px;
  background-clip: content-box;
}
.scroll-thin::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
  background-clip: content-box;
}
.scroll-thin::-webkit-scrollbar-track {
  background: transparent;
}

/* ===== 卡1：纵向柱状图 ===== */
.chart--vbar {
  display: flex;
  flex-direction: column;
}
.vbar-plot {
  position: relative;
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: space-around;
  min-height: 0;
  padding: 0 2px;
}
/* 浅色水平网格线（5 条）：只铺柱体区，底部让出名称行的高度 */
.vbar-grid {
  position: absolute;
  top: 15px;
  right: 2px;
  bottom: 19px;
  left: 2px;
  z-index: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}
.vbar-grid span {
  display: block;
  width: 100%;
  height: 0;
  border-top: 1px dashed #eef2f7;
}
.vbar-col {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 22%;
  max-width: 56px;
  height: 100%;
  cursor: pointer;
  border-radius: 4px;
  transition: opacity 0.18s ease;
}
.vbar-col:focus-visible {
  outline: 2px solid #0f6f60;
  outline-offset: 2px;
}
/* 柱体区：顶部留 15px 给数值标签，底部的名称行在 .vbar-plot 里另占高度 */
.vbar-slot {
  position: relative;
  display: flex;
  flex: 1;
  align-items: flex-end;
  min-height: 0;
  padding-top: 15px;
}
.vbar-track {
  position: absolute;
  top: 15px;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 7px 7px 0 0;
}
.vbar-rect {
  position: relative;
  width: 100%;
  min-height: 4px;
  border-radius: 7px 7px 2px 2px;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.18s ease;
}
.vbar-num {
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-bottom: 1px;
  font-size: 10.5px;
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
  transform: translateX(-50%);
  transition: color 0.15s ease;
}
.vbar-name {
  height: 15px;
  margin-top: 4px;
  overflow: hidden;
  font-size: 11px;
  line-height: 15px;
  color: #64748b;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: color 0.15s ease;
}
/* 柱 ↔ 清单 联动：选中的柱高亮，其余压暗 */
.chart--vbar.filtering .vbar-col {
  opacity: 0.35;
}
.chart--vbar.filtering .vbar-col.on {
  opacity: 1;
}
.vbar-col.on .vbar-name {
  font-weight: 700;
  color: #0f766e;
}
.vbar-col.on .vbar-num {
  color: #0f766e;
}
.vbar-col.on .vbar-rect {
  filter: brightness(1.06) saturate(1.1);
}

/* ===== 卡2：环形图 + 图例 ===== */
.chart--donut {
  display: flex;
  align-items: center;
  gap: 12px;
}
.donut-box {
  position: relative;
  flex: 0 0 118px;
  width: 118px;
  height: 118px;
}
.donut {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.donut-seg {
  cursor: pointer;
  transition: opacity 0.18s ease;
}
.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.donut-center b {
  font-size: 18px;
  font-weight: 800;
  line-height: 22px;
  color: #0f172a;
}
.donut-center span {
  font-size: 10px;
  line-height: 14px;
  color: #94a3b8;
}
.legend {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}
.lg {
  cursor: pointer;
  transition: opacity 0.18s ease;
}
.lg:focus-visible {
  outline: 2px solid #0f6f60;
  outline-offset: 2px;
}
.lg-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.lg-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 999px;
}
.lg-name {
  overflow: hidden;
  font-size: 11.5px;
  color: #475569;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.lg-val {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
}
.lg-val em {
  margin-left: 1px;
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  color: #94a3b8;
}
.lg-pct {
  flex: 0 0 38px;
  font-size: 10px;
  color: #94a3b8;
  text-align: right;
}
.lg-bar {
  height: 3px;
  margin: 3px 0 0 13px;
  overflow: hidden;
  background: #f1f5f9;
  border-radius: 99px;
}
.lg-bar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  transition: width 0.5s ease;
}
/* 点选联动：选中的强调，其余压暗（只在有选中项时生效，平时不做灰度化） */
.chart--donut.filtering .donut-seg,
.chart--donut.filtering .lg {
  opacity: 0.35;
}
.chart--donut.filtering .donut-seg.on,
.chart--donut.filtering .lg.on {
  opacity: 1;
}
.lg.on .lg-name {
  font-weight: 700;
  color: #0f766e;
}

/* ===== 卡3 / 卡4：横向条 ===== */
.chart--hbar {
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  gap: 6px;
  padding-right: 2px;
}
.hbar-row {
  display: flex;
  flex: 0 0 20px;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.18s ease;
}
.hbar-row:focus-visible {
  outline: 2px solid #0f6f60;
  outline-offset: 2px;
}
.hbar-label {
  flex: 0 0 124px;
  overflow: hidden;
  font-size: 11px;
  color: #4b5563;
  text-align: right;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.hbar-track {
  flex: 1;
  min-width: 0;
  height: 10px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 99px;
}
.hbar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s ease, filter 0.18s ease;
}
.hbar-val {
  flex: 0 0 42px;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-align: left;
  white-space: nowrap;
}
.chart--hbar.filtering .hbar-row {
  opacity: 0.35;
}
.chart--hbar.filtering .hbar-row.on {
  opacity: 1;
}
.hbar-row.on .hbar-label {
  font-weight: 700;
  color: #0f766e;
}
.hbar-row.on .hbar-val {
  color: #0f766e;
}
.hbar-row.on .hbar-fill {
  filter: brightness(1.06) saturate(1.1);
}

/* ============ 智能审核项目清单 ============ */
.section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 吃页面剩余高度但**不吃亏欠**：flex-grow 让卡片铺到底（底部不留底色），
     flex-shrink 为 0 保证高度不够时不会被压扁裁表 */
  flex: 1 0 auto;
}
.sec-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  /* 标题区高度收紧（需求 2026-10-13：14 → 10px；2026-10-14 再收到 6px ——
     为的是「卡头 + 表格 + 分页」整块能落进首屏，别让分页被页面下沿切掉） */
  padding: 6px 20px;
  background: linear-gradient(180deg, #fbfcfe, #f8fafc);
  border-bottom: 1px solid #f1f5f9;
}
.sec-title {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.sec-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}
/* 禁用按钮外面套一层（el-tooltip 要有真实 DOM 承载 hover）：不改变行内布局 */
.sec-action-wrap {
  display: inline-flex;
}
/*
 清单区全屏：整个 .section（标题栏 + 查询条件 + 列表 + 分页）铺满视口。
 z-index 取 900 —— 低于 Element Plus 下拉/日期面板（2000+）与 vxe 弹窗（1000+），
 所以全屏后筛选区的下拉、点「查看」开的详情弹窗都还能盖在它上面。
 标题栏留在容器内，退出全屏的按钮一直可见、可点。
*/
.section.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 900;
  height: auto;
  margin: 0;
  background: #fff;
  border: 0;
  border-radius: 0;
  overflow: auto;
}
.section.is-fullscreen .table-wrap {
  flex: 1;
  min-height: 0;
}

/* ===== 折叠筛选 ===== */
.filter-panel {
  max-height: 0;
  overflow: hidden;
  background: #f8fafc;
  border-bottom: 0 solid #f1f5f9;
  transition: max-height 0.28s ease, border-color 0.28s ease;
}
/* 展开高度必须大于内容：筛选区是「11 项 / 4 列」的网格，列数在窄屏会降级（见文末媒体查询），
   行数随之翻倍 —— 这个值只是过渡上界，不参与布局，按最宽的行数估即可。 */
.filter-panel.open {
  max-height: 300px;
  border-bottom: 1px solid #f1f5f9;
}
.filter-inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 18px;
  padding: 16px 20px;
}
.fitem {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.fitem label {
  flex: 0 0 80px;
  overflow: hidden;
  font-size: 12.5px;
  line-height: 30px;
  color: #64748b;
  text-align: right;
  white-space: nowrap;
}
.fitem select,
.fitem input[type='date'],
.fitem input[type='text'] {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  font-family: inherit;
  font-size: 12.5px;
  color: #334155;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.fitem select:hover,
.fitem input:hover {
  border-color: rgba(13, 148, 136, 0.5);
}
.fitem select:focus,
.fitem input:focus {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.14);
}
.fitem .date-range {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.fitem .date-range input {
  flex: 1;
  min-width: 0;
}
.fitem .date-range .sep {
  font-size: 12px;
  color: #cbd5e1;
}
/*
 筛选面板里的 EP 下拉（一级单位 / 二级单位 / 归口部门 / 计划实施年度 + 两个树选择器）。
 EP 默认是 32px 高、灰色描边、4px 圆角、13px 字，与同排的原生控件（30px / 10px 圆角 / 12.5px）差一截，
 排在一行里会明显参差，所以这里把它们压到与原生控件一致（含 hover / focus 态）。
*/
.filter-inner :deep(.el-select) {
  flex: 1;
  min-width: 0;
}
.filter-inner :deep(.el-select .select-trigger),
.filter-inner :deep(.el-select .el-input),
.filter-inner :deep(.el-select .el-input__inner) {
  height: 30px;
  min-height: 30px;
  font-size: 12.5px;
  line-height: 30px;
}
.filter-inner :deep(.el-select .el-input__inner) {
  padding: 0 26px 0 10px;
  color: #334155;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.filter-inner :deep(.el-select .el-input__inner:hover) {
  border-color: rgba(13, 148, 136, 0.5);
}
.filter-inner :deep(.el-select .el-input.is-focus .el-input__inner),
.filter-inner :deep(.el-select .el-input__inner:focus) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.14);
}
/* 多选（项目类型 / 项目状态）里的标签与清除图标也要跟着压矮，否则会顶高整行 */
.filter-inner :deep(.el-select .el-select__tags) {
  height: 30px;
  line-height: 30px;
}
.filter-inner :deep(.el-select .el-tag) {
  height: 22px;
  padding: 0 6px;
  font-size: 12px;
  line-height: 20px;
}
.filter-inner :deep(.el-select .el-input__suffix),
.filter-inner :deep(.el-select .el-input__suffix-inner),
.filter-inner :deep(.el-select .el-input__icon) {
  height: 30px;
  line-height: 30px;
}
.filter-actions {
  display: flex;
  grid-column: 1 / -1;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}
/* 重置 / 查询 / 导出：与页头按钮同一套形状，尺寸略收 */
.fbtn {
  height: 30px;
  padding: 0 18px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.15s ease;
}
.fbtn.reset {
  color: #475569;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.12);
}
.fbtn.reset:hover {
  color: #0f766e;
  background: #f0fdfa;
  border-color: rgba(13, 148, 136, 0.5);
}
.fbtn.submit {
  color: #fff;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  border: none;
  box-shadow: 0 8px 18px -10px rgba(13, 148, 136, 0.9);
}
.fbtn.submit:hover {
  background: linear-gradient(135deg, #0d9488, #0f766e);
}
.fbtn.export {
  color: #0f766e;
  background: #fff;
  border: 1px solid rgba(13, 148, 136, 0.45);
}
.fbtn.export:hover {
  background: #f0fdfa;
}

/* ===== 表格 ===== */
.table-wrap {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  /* 列表左右不再留白（需求 2026-10-12）：表格与分页铺满卡片宽度，横向多出来的是可见列宽 */
  padding: 0;
}
/* 表格本体不参与压缩：高度不够时宁可让外层滚动，也不要把行挤没 */
.srh3-table {
  flex: none;
}
/* 条件生效时列表淡入，给一次"数据变了"的反馈 */
.table-wrap.is-filtering {
  animation: table-fadein 0.2s ease;
}
@keyframes table-fadein {
  from {
    opacity: 0.45;
  }
  to {
    opacity: 1;
  }
}
.srh3-table {
  width: 100%;
}

/*
 * ⚠️ 覆盖 element-plus 表格样式，三条坑都踩过：
 * 1) **` :deep()` 必须写在顶层、显式带上父类名**（`.srh3-table :deep(...)`）。
 *    写进 LESS 嵌套里时 SFC 编译会留下字面量 `&`，整个块变成非法选择器、后面所有规则被解析器吞掉。
 * 2) 本项目装的是 1.0.2-beta.71，这一版的 th/td **没有 `el-table__cell` 类**（后续版本才有），
 *    带着那个类名写选择器一条都命不中。
 * 3) 这些属性 EP 自己的选择器特异性不低（如 `.el-table--small td`），所以关键项仍用 `!important`。
 */
.srh3-table :deep(.el-table) {
  --el-table-border-color: #f1f5f9;
  --el-table-header-background-color: #f8fafc;
  --el-table-header-font-color: #64748b;
  --el-table-font-color: #475569;
  --el-table-row-hover-background-color: #f0fdfa;
  --el-table-current-row-background-color: #ecfdf5;
  font-size: 13px;
}

/* 表头：原型是 11.5px/600 的 slate 字 + 极浅底 + 下边线；这里保持一致，并且**不换行** */
.srh3-table :deep(.el-table__header-wrapper th) {
  height: 38px !important;
  padding: 0 !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
  color: #64748b !important;
  letter-spacing: 0.4px;
  background: #f8fafc !important;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07) !important;
}
.srh3-table :deep(.el-table__header-wrapper th .cell) {
  white-space: nowrap;
  word-break: keep-all;
}

.srh3-table :deep(.el-table__body td) {
  height: 40px !important;
  padding: 0 !important;
  color: #475569 !important;
  border-bottom: 1px solid #f1f5f9 !important;
}

/* 斑马纹：原型 #fcfdfe（比 EP 默认那条更淡，用变量覆盖不到，直接写规则） */
.srh3-table :deep(.el-table__body tr.el-table__row--striped td) {
  background: #fcfdfe !important;
}
.srh3-table :deep(.el-table__body tr:hover > td) {
  background: #f0fdfa !important;
}
/* hover 行的首列加一道青绿竖条（原型的 inset box-shadow），固定在左侧的行也跟着有 */
.srh3-table :deep(.el-table__body tr:hover > td:first-child) {
  box-shadow: inset 3px 0 0 #14b8a6;
}
.srh3-table :deep(.el-table__body tr.el-table__row--striped:hover > td) {
  background: #f0fdfa !important;
}

.srh3-table :deep(.el-table__empty-text) {
  font-size: 13px;
  color: #94a3b8;
}

/* 边框统一成细浅灰，不要 Element 默认的深色线 */
.srh3-table :deep(.el-table--border),
.srh3-table :deep(.el-table--border th),
.srh3-table :deep(.el-table--border td) {
  border-color: #f1f5f9 !important;
}
/* 固定列的分隔阴影也调浅（默认那条偏重） */
.srh3-table :deep(.el-table__fixed-right),
.srh3-table :deep(.el-table__fixed) {
  box-shadow: 6px 0 10px -8px rgba(15, 23, 42, 0.18);
}

/* 金额列：右对齐 + 等宽数字（全局的 .cell-amount 由 class-name 挂上） */
.srh3-table :deep(.cell-amount .cell) {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

/* 状态徽标：雾面底 + 同色圆点 + 深一档的字（照原型的 .badge.b-*） */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
  border-radius: 999px;
}
.badge i {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 999px;
}
.badge--ok {
  color: #0f766e;
  background: #ecfdf5;
}
.badge--ok i {
  background: #14b8a6;
}
.badge--run {
  color: #1d4ed8;
  background: #eff6ff;
}
.badge--run i {
  background: #3b82f6;
}
.badge--wait {
  color: #b45309;
  background: #fffbeb;
}
.badge--wait i {
  background: #f59e0b;
}
.badge--fail {
  color: #b91c1c;
  background: #fef2f2;
}
.badge--fail i {
  background: #ef4444;
}
.badge--neutral {
  color: #475569;
  background: #f1f5f9;
}
.badge--neutral i {
  background: #94a3b8;
}
/*
 AI 预审意见（resultName）的四个色位。
 语义档与 StatusTone 是两套取值，但色相共用同一套 slate/red/orange/amber，所以页面里只有一种红、一种橙。
 灰的三档（未分析 / 分析中 / AI已预审）合用一个 gray —— 它们表达的都是「还没出结论」，不值得再分三种颜色。
*/
.badge--gray {
  color: #475569;
  background: #f1f5f9;
}
.badge--gray i {
  background: #94a3b8;
}
.badge--red {
  color: #b91c1c;
  background: #fef2f2;
}
.badge--red i {
  background: #ef4444;
}
.badge--orange {
  color: #c2410c;
  background: #fff7ed;
}
.badge--orange i {
  background: #f97316;
}
.badge--amber {
  color: #b45309;
  background: #fffbeb;
}
.badge--amber i {
  background: #f59e0b;
}

/*
 AI预审状态列的三点指示：**同色三点**，颜色跟「AI预审结论」徽标一致
 （两列都由 resultName 派生，色位也共用上面那四个类）。
 白描边是为了行 hover / 斑马纹变化时圆点边缘不糊在一起（照原型 .dots 的做法）。
*/
.dots {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.dots i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
}
.dots--gray i {
  background: #94a3b8;
}
.dots--red i {
  background: #ef4444;
}
.dots--orange i {
  background: #f97316;
}
.dots--amber i {
  background: #f59e0b;
}
.cell-muted {
  font-size: 12px;
  color: #94a3b8;
}
.lnk {
  color: #0d9488;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}
.lnk:hover {
  color: #0f766e;
  text-decoration: underline;
}

/* ===== 分页 ===== */
.table-pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  /* 分页**紧跟表格**，不再用 margin-top:auto 顶到卡片底部：那条 auto 外边距会把多出来的高度
     全垫在表格与分页之间（视口越高垫得越多），分页也容易被页面下沿切掉；
     现在多出来的空间留在卡片最下面（需求 2026-10-14）。 */
  margin-top: 5px;
}
.pager-total {
  font-size: 11.5px;
  color: #64748b;
}
.pager-total b {
  font-weight: 700;
  color: #334155;
}
.table-pager :deep(.el-pagination) {
  /* 全局 app.less 给 el-pagination 带了 `margin-top: 10px !important`，等于在表格和分页之间
     多垫 10px；这里必须同样带 !important 才盖得住（需求 2026-10-14：把这段间距清掉） */
  margin: 0 !important;
  /* 控件自带 2px 上下内边距，一并去掉：分页这一行再矮 4px（按钮本体 30px 不变） */
  padding: 0 5px;
  --el-pagination-bg-color: #fff;
  --el-pagination-button-bg-color: #fff;
  --el-pagination-button-color: #475569;
  --el-pagination-hover-color: #0f766e;
  --el-pagination-font-size: 12.5px;
  flex-wrap: wrap;
  gap: 4px;
  color: #64748b;
}
.table-pager :deep(.el-pagination.is-background .btn-prev),
.table-pager :deep(.el-pagination.is-background .btn-next),
.table-pager :deep(.el-pagination.is-background .el-pager li) {
  min-width: 30px;
  height: 30px;
  margin: 0 2px;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 30px;
  color: #475569;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
}
.table-pager :deep(.el-pagination.is-background .el-pager li:not(.disabled):not(.is-active):not(.active):hover),
.table-pager :deep(.el-pagination.is-background .btn-prev:not(:disabled):hover),
.table-pager :deep(.el-pagination.is-background .btn-next:not(:disabled):hover) {
  color: #0f766e;
  background: #f0fdfa;
  border-color: rgba(13, 148, 136, 0.5);
}
/* 当前页：这个 EP 版本用的是 li.active（不是 li.is-active），两种都写以兼容升级 */
.table-pager :deep(.el-pagination.is-background .el-pager li:not(.disabled).active),
.table-pager :deep(.el-pagination.is-background .el-pager li:not(.disabled).is-active) {
  color: #fff;
  font-weight: 600;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  border-color: transparent;
}
.table-pager :deep(.el-pagination.is-background .btn-prev:disabled),
.table-pager :deep(.el-pagination.is-background .btn-next:disabled),
.table-pager :deep(.el-pagination.is-background .el-pager li.disabled) {
  color: #cbd5e1;
  background: #f8fafc;
  border-color: #f1f5f9;
}
.table-pager :deep(.el-pagination__total),
.table-pager :deep(.el-pagination__sizes),
.table-pager :deep(.el-pagination__jump) {
  height: 30px;
  font-size: 12px;
  line-height: 30px;
  color: #64748b;
}
.table-pager :deep(.el-pagination__sizes .el-input__inner),
.table-pager :deep(.el-pagination__jump .el-input__inner) {
  height: 30px;
  font-size: 12px;
  line-height: 30px;
  color: #334155;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
}
.table-pager :deep(.el-pagination__sizes) {
  margin-right: 8px;
}
.table-pager :deep(.el-pagination__jump) {
  margin-left: 8px;
}

/* ============ 响应式 ============
   原型是 1600 固定宽；这里按列数降级：四卡 → 两卡 → 一卡，导览本身横向滚动。
   窄屏只重排，不隐藏任何内容。 */
@media (max-width: 1400px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .filter-inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  /* 筛选区变 2 列 → 行数翻倍，展开高度上限跟着放（下同） */
  .filter-panel.open {
    max-height: 420px;
  }
}
@media (max-width: 900px) {
  .srh3-viewport {
    /* 与桌面端一致：左右 0、底部 0，只留一点上边距 */
    padding: 12px 0 0;
  }
  .stats {
    grid-template-columns: minmax(0, 1fr);
  }
  .filter-inner {
    grid-template-columns: minmax(0, 1fr);
  }
  .filter-panel.open {
    max-height: 640px;
  }
  .topbar {
    padding-right: 16px;
    padding-left: 16px;
  }
  /* 窄屏时列表同样不留左右白（与宽屏一致；标题栏 .sec-head 仍保留内边距） */
  .sec-head {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>

<!-- 下拉挂在 body 上，scoped 样式够不着，单独放一个非 scoped 块（用 popper-class 命名空间隔离）-->
<style lang="less">
/* 项目类型 tree-select 的下拉：必须写在这里（非 scoped）——下拉默认挂到 body，
   scoped / :deep() 都够不着；用 popper-class 命名空间隔离，避免影响其它页面。
   对齐 views/budget-process/process-42.vue 的 .setstyle：承载树的那个 option 要按内容撑开，
   否则 el-select 给 option 的固定行高会把树裁掉（实测只露 1 行）。 */
.srh3-pro-type-popper .el-select-dropdown__item.fitem-tree-option {
  height: auto;
  padding: 0 0 10px;
  margin: 0;
  line-height: 1.5;
  cursor: default;
}

/* 树的滚动交给下拉自己，超出时在树内部滚 */
.srh3-pro-type-popper .el-tree {
  max-height: 260px;
  padding-right: 4px;
  overflow-y: auto;
}

.srh3-pro-type-popper .el-tree-node__content {
  height: 30px;
}
</style>
