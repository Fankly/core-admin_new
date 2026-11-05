<template>
  <section class="aep-panel">
    <!-- 工具栏 -->
    <div class="aep-toolbar">
      <div class="aep-toolbar__left">
        <span class="aep-toolbar__bar"></span>
        <div class="aep-tabs">
          <button :class="['aep-tab', { 'is-active': activeTab === 'file' }]" @click="emit('update:activeTab', 'file')">文件列表</button>
          <button :class="['aep-tab', { 'is-active': activeTab === 'knowledge' }]" @click="emit('update:activeTab', 'knowledge')">知识管理</button>
        </div>
      </div>
      <div class="aep-toolbar__right">
        <!-- 解析与提取：仅文件列表页签显示 -->
        <!-- v-permission="'JXYTQ'" -->
        <button v-permission="'JXYTQ'" v-if="activeTab === 'file'" class="aep-btn aep-btn--plain" @click="emit('extract')">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          解析与提取
        </button>
        <!-- 审核要点确认 / 经验知识维护 / 应用：仅知识管理页签显示 -->
        <!-- v-permission="'SHYDQR'" -->
        <button v-permission="'SHYDQR'" v-if="activeTab === 'knowledge'" class="aep-btn aep-btn--plain" @click="emit('confirm')">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          审核要点确认
        </button>
        <!-- 经验知识维护：新建一条经验知识（界面与审核要点确认一致，来源默认「经验知识」） -->
        <button v-permission="'JYZSWH'" v-if="activeTab === 'knowledge'" class="aep-btn aep-btn--plain" @click="emit('maintain-experience')">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          经验知识维护
        </button>
        <!-- v-permission="'SHYDYY'" -->
        <!-- <button v-permission="'SHYDYY'" v-if="activeTab === 'knowledge'" class="aep-btn aep-btn--plain" @click="emit('apply')">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          审核要点应用
        </button> -->
        <span class="aep-divider-v"></span>
        <button class="aep-btn aep-btn--ghost" @click="emit('export')">导出</button>
        <button class="aep-btn aep-btn--ghost" @click="filterOpen = !filterOpen">
          {{ filterOpen ? '收起筛选' : '展开筛选' }}
          <svg :class="['aep-btn__chevron', { 'is-open': filterOpen }]" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button class="aep-btn aep-btn--ghost" @click="emit('toggle-fullscreen')">
          <svg v-if="!isFullscreen" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          <svg v-else width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 9V4H4m0 0h5m-5 0l5 5m11-5h-5v5m5-5l-5 5M9 15v5H4m0 0h5m-5 0l5-5m11 5l-5-5m5 5v-5m0 5h-5"
            />
          </svg>
          {{ isFullscreen ? '退出全屏' : '全屏展示' }}
        </button>
      </div>
    </div>

    <!-- 文件列表筛选 -->
    <div v-show="activeTab === 'file'" :class="['aep-filter', { 'is-open': filterOpen }]">
      <div class="aep-filter__grid aep-filter__grid--file">
        <div>
          <label class="aep-label">文件名称</label>
          <input
            class="aep-input"
            type="text"
            placeholder="请输入文件名称"
            :value="fileFilter.attachName"
            @input="setFileFilter('attachName', $event)"
          />
        </div>
        <div>
          <label class="aep-label">发布年度</label>
          <el-date-picker
            class="aep-filter__year"
            type="year"
            placeholder="选择年度"
            value-format="YYYY"
            format="YYYY"
            clearable
            :model-value="fileFilter.fwYear || null"
            @update:model-value="setFileYear($event)"
          />
        </div>
        <div>
          <label class="aep-label">发布部门</label>
          <input class="aep-input" type="text" placeholder="请输入发布部门" :value="fileFilter.fwbm" @input="setFileFilter('fwbm', $event)" />
        </div>
        <div class="aep-filter__actions">
          <button class="aep-btn aep-btn--plain" @click="emit('refresh')">查询</button>
          <button class="aep-btn aep-btn--ghost" @click="emit('reset-file-filters')">重置</button>
        </div>
      </div>
    </div>

    <!-- 知识管理筛选 -->
    <div v-show="activeTab === 'knowledge'" :class="['aep-filter', { 'is-open': filterOpen }]">
      <div class="aep-filter__grid aep-filter__grid--knowledge">
        <div>
          <label class="aep-label">文件名称</label>
          <input
            class="aep-input"
            type="text"
            placeholder="请输入文件名称"
            :value="knowledgeFilter.sourceFile"
            @input="setKnowledgeFilter('sourceFile', $event)"
          />
        </div>
        <div>
          <label class="aep-label">发布年度</label>
          <el-date-picker
            class="aep-filter__year"
            type="year"
            placeholder="选择年度"
            value-format="YYYY"
            format="YYYY"
            clearable
            :model-value="knowledgeFilter.fwYear || null"
            @update:model-value="setKnowledgeYear($event)"
          />
        </div>
        <div>
          <label class="aep-label">发布部门</label>
          <input
            class="aep-input"
            type="text"
            placeholder="请输入发布部门"
            :value="knowledgeFilter.fwbm"
            @input="setKnowledgeFilter('fwbm', $event)"
          />
        </div>
        <div>
          <label class="aep-label">审核要点</label>
          <input
            class="aep-input"
            type="text"
            placeholder="请输入审核要点"
            :value="knowledgeFilter.pointName"
            @input="setKnowledgeFilter('pointName', $event)"
          />
        </div>
        <div>
          <label class="aep-label">审核要点来源</label>
          <select class="aep-select" :value="knowledgeFilter.pointSource" @change="setKnowledgeFilter('pointSource', $event)">
            <option value="">全部</option>
            <option v-for="item in pointSourceOptions" :key="item.code" :value="item.code">{{ item.name }}</option>
          </select>
        </div>
        <div>
          <label class="aep-label">是否已确认</label>
          <select class="aep-select" :value="knowledgeFilter.isConfirm" @change="setKnowledgeFilter('isConfirm', $event)">
            <option value="">全部</option>
            <option value="1">已确认</option>
            <option value="0">待确认</option>
          </select>
        </div>
        <div>
          <label class="aep-label">是否已转化AI审核要点</label>
          <select class="aep-select" :value="knowledgeFilter.isSolidify" @change="setKnowledgeFilter('isSolidify', $event)">
            <option value="">全部</option>
            <option value="1">已转</option>
            <option value="0">未转</option>
          </select>
        </div>
        <div>
          <label class="aep-label">系统是否已实现</label>
          <select class="aep-select" :value="knowledgeFilter.isImplement" @change="setKnowledgeFilter('isImplement', $event)">
            <option value="">全部</option>
            <option value="1">已实现</option>
            <option value="0">未实现</option>
          </select>
        </div>
      </div>
      <div class="aep-filter__foot">
        <button class="aep-btn aep-btn--plain" @click="emit('refresh')">查询</button>
        <button class="aep-btn aep-btn--ghost" @click="emit('reset-knowledge-filters')">重置</button>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-show="activeTab === 'file'" ref="fileRegionRef" v-loading="loading" class="aep-table-region">
      <el-table
        class="aep-el-table"
        :data="fileRows"
        row-key="attachId"
        border
        :height="fileTableHeight || 400"
        :empty-text="loading ? '加载中…' : '暂无匹配的数据'"
        ref="fileTableRef"
      >
        <template #empty>
          <div class="aep-el-empty">
            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 12h6m-6 4h4m4 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>{{ loading ? '加载中…' : '暂无匹配的数据' }}</div>
          </div>
        </template>
        <el-table-column type="index" label="序号" width="64" fixed="left" :index="pageIndex" class-name="aep-td--index" />
        <el-table-column label="文件名称" width="360" fixed="left" class-name="aep-file-cell">
          <template #default="{ row }">
            <span class="tw-flex tw-items-center">
              <span :class="['aep-filechip', fileSuffix(row.attachName) === 'pdf' ? 'aep-filechip--pdf' : 'aep-filechip--doc']">
                {{ (fileSuffix(row.attachName) || 'doc').toUpperCase() }}
              </span>
              <ClampText class="aep-td--strong aep-clamp--nowrap aep-file-name" :text="row.attachName || '—'" />
            </span>
          </template>
        </el-table-column>
        <el-table-column label="发文字号" width="140">
          <template #default="{ row }"><ClampText class="aep-clamp--nowrap" :text="row.wjzh || '—'" /></template>
        </el-table-column>
        <el-table-column label="发布年度" width="88" class-name="aep-td--num">
          <template #default="{ row }"><ClampText :text="row.fwYear || '—'" /></template>
        </el-table-column>
        <el-table-column label="发文部门" width="92">
          <template #default="{ row }"><ClampText class="aep-clamp--nowrap" :text="row.fwbm || '—'" /></template>
        </el-table-column>
        <el-table-column label="专业" width="100">
          <template #default="{ row }"><ClampText class="aep-clamp--nowrap" :text="row.majorName || '—'" /></template>
        </el-table-column>
        <el-table-column label="提取状态" width="120">
          <template #default="{ row }">
            <span :class="['aep-badge', extractStatusClass(row.extractStatus)]">
              <span class="aep-dot" :style="{ background: extractStatusColor(row.extractStatus) }"></span>{{ extractStatusText(row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="解析时间" width="108">
          <template #default="{ row }"><ClampText class="aep-clamp--nowrap" :text="formatTime(row.extractTime, 10)" /></template>
        </el-table-column>
        <el-table-column label="提取审核要点" min-width="120">
          <template #default="{ row }"
            ><span class="aep-pill" @click="openCountList(row, '提取审核要点')">{{ row.pointCnt || 0 }} 个</span></template
          >
        </el-table-column>
        <el-table-column label="确认审核要点" min-width="120">
          <template #default="{ row }"
            ><span class="aep-pill" @click="openCountList(row, '确认审核要点')">{{ row.confirmCnt || 0 }} 个</span></template
          >
        </el-table-column>
        <el-table-column label="转化AI审核要点" min-width="130">
          <template #default="{ row }"
            ><span class="aep-pill" @click="openCountList(row, '转化AI审核要点')">{{ row.solidifyCnt || 0 }} 条</span></template
          >
        </el-table-column>
        <el-table-column label="系统已实现审核要点" min-width="180">
          <template #default="{ row }"
            ><span class="aep-pill" @click="openCountList(row, '系统已实现审核要点')">{{ row.implementCnt || 0 }} 条</span></template
          >
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <div class="aep-row-actions">
              <button class="aep-link-icon" type="button" title="预览" aria-label="预览" @click="emit('preview-file', row)">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button class="aep-link-icon" type="button" title="下载" aria-label="下载" @click="emit('download-file', row)">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </button>
              <button
                class="aep-link-danger"
                :disabled="row.extractStatus === '3'"
                :title="row.extractStatus === '3' ? '已提取的文件不能删除' : '删除'"
                @click="emit('delete-file', row)"
              >
                删除
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 知识管理 -->
    <div v-show="activeTab === 'knowledge'" ref="knowledgeRegionRef" v-loading="loading" class="aep-table-region">
      <el-table
        class="aep-el-table"
        :data="knowledgeRows"
        row-key="pointId"
        border
        :height="knowledgeTableHeight || 400"
        ref="knowledgeTableRef"
        :row-class-name="knowledgeRowClassName"
        :empty-text="loading ? '加载中…' : '暂无数据'"
        @row-click="handleKnowledgeRowClick"
      >
        <template #empty>
          <div class="aep-el-empty">
            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <div>{{ loading ? '加载中…' : '暂无数据' }}</div>
          </div>
        </template>
        <!-- 单选：勾选一行会取消上一行，故不提供表头全选；前 4 列 fixed 冻结 -->
        <el-table-column width="48" fixed="left">
          <template #default="{ row }">
            <input type="checkbox" :checked="knowledgeChecked.includes(row.pointId)" @click.stop @change="toggleKnowledgeRow(row.pointId)" />
          </template>
        </el-table-column>
        <el-table-column type="index" label="序号" width="64" fixed="left" :index="pageIndex" class-name="aep-td--index" />
        <el-table-column label="审核要点" width="200" fixed="left" class-name="aep-td--strong">
          <template #default="{ row }"><ClampText :text="row.pointName || '—'" /></template>
        </el-table-column>
        <el-table-column label="审核要点判断规则" width="260" fixed="left">
          <template #default="{ row }"><ClampText :text="row.judgementRuleDesc || '—'" /></template>
        </el-table-column>
        <el-table-column label="原文出处" min-width="160">
          <template #default="{ row }"><ClampText :text="row.originalEvidence || '—'" /></template>
        </el-table-column>
        <el-table-column label="审核要点来源" width="120">
          <template #default="{ row }"><ClampText class="aep-clamp--nowrap" :text="pointSourceName(row.pointSource) || '—'" /></template>
        </el-table-column>
        <el-table-column label="来源文件" min-width="180">
          <template #default="{ row }"><ClampText :text="row.sourceFile || '—'" /></template>
        </el-table-column>
        <el-table-column label="来源文件发布年度" width="150" class-name="aep-td--num">
          <template #default="{ row }"><ClampText :text="row.fwYear || '—'" /></template>
        </el-table-column>
        <el-table-column label="来源文件发布部门" width="160">
          <template #default="{ row }"><ClampText :text="row.fwbm || '—'" /></template>
        </el-table-column>
        <el-table-column label="专业" width="100">
          <template #default="{ row }"><ClampText class="aep-clamp--nowrap" :text="row.majorName || '—'" /></template>
        </el-table-column>
        <el-table-column label="审核要点生效状态" width="160">
          <template #default="{ row }">
            <span v-if="row.effectiveStatus === '1'" class="aep-badge aep-badge--danger">
              <span class="aep-dot" style="background: var(--aep-danger)"></span>{{ row.effectiveStatusName || '失效' }}
            </span>
            <span v-else class="aep-badge aep-badge--success">
              <span class="aep-dot" style="background: var(--aep-success)"></span>{{ row.effectiveStatusName || '生效中' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="是否已确认" width="130">
          <template #default="{ row }">
            <span v-if="row.isConfirm === '1'" class="aep-state aep-state--done">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ row.isConfirmName || '已确认' }}
            </span>
            <span v-else class="aep-state">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ row.isConfirmName || '待确认' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="确认时间" width="120">
          <template #default="{ row }"><ClampText :text="formatTime(row.confirmTime, 10)" /></template>
        </el-table-column>
        <el-table-column label="是否已转化AI审核要点" width="190">
          <template #default="{ row }">
            <span v-if="row.isSolidify === '1'" class="aep-badge aep-badge--teal">
              <span class="aep-dot" style="background: var(--aep-primary)"></span>{{ solidifyText(row.isSolidifyName, '已转') }}
            </span>
            <span v-else class="aep-badge aep-badge--gray">
              <span class="aep-dot" style="background: #94a3b8"></span>{{ solidifyText(row.isSolidifyName, '未转') }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="系统是否已实现" width="150">
          <template #default="{ row }">
            <span v-if="row.isImplement === '1'" class="aep-badge aep-badge--success">
              <span class="aep-dot" style="background: var(--aep-success)"></span>{{ row.isImplementName || '已实现' }}
            </span>
            <span v-else class="aep-badge aep-badge--gray">
              <span class="aep-dot" style="background: #94a3b8"></span>{{ row.isImplementName || '未实现' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="要点编码" min-width="140">
          <template #default="{ row }"><ClampText :text="row.auditPointCode || '—'" /></template>
        </el-table-column>
        <el-table-column label="规则编码" min-width="140">
          <template #default="{ row }"><ClampText :text="row.ruleCode || '—'" /></template>
        </el-table-column>
        <el-table-column label="规则名称" min-width="180">
          <template #default="{ row }"><ClampText :text="row.ruleName || '—'" /></template>
        </el-table-column>
        <el-table-column label="操作" width="88">
          <template #default="{ row }">
            <button
              class="aep-link-danger"
              :disabled="!canDeleteKnowledge(row)"
              :title="knowledgeDeleteTip(row)"
              @click.stop="emit('delete-knowledge', row)"
            >
              删除
            </button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页：与系统其它列表页一致（el-pagination） -->
    <div class="aep-pager">
      <el-pagination
        :current-page="page"
        background
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="emit('update:pageSize', $event)"
        @current-change="emit('update:page', $event)"
      ></el-pagination>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: 'AepListPanel'
}
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { KnowledgeFileVO, KnowledgePointVO } from '@/api/ai/automaticExtractionPoints'
import { usePointSourceDict } from '../hooks/usePointSourceDict'
import { FileFilters, KnowledgeFilters, KnowledgeListQuery, ListTab } from '../types'
import ClampText from './ClampText.vue'

const props = defineProps<{
  /** 当前页签 */
  activeTab: ListTab
  /** 文件列表数据（服务端分页后的当前页） */
  fileRows: KnowledgeFileVO[]
  /** 知识管理数据（服务端分页后的当前页） */
  knowledgeRows: KnowledgePointVO[]
  /** 当前页签总条数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 列表加载中 */
  loading: boolean
  /** 文件筛选条件 */
  fileFilter: FileFilters
  /** 知识筛选条件 */
  knowledgeFilter: KnowledgeFilters
  /** 是否处于全屏展示 */
  isFullscreen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: ListTab): void
  (e: 'update:fileFilter', filters: FileFilters): void
  (e: 'update:knowledgeFilter', filters: KnowledgeFilters): void
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'refresh'): void
  (e: 'extract'): void
  (e: 'confirm'): void
  (e: 'maintain-experience'): void
  (e: 'apply'): void
  (e: 'export'): void
  (e: 'toggle-fullscreen'): void
  (e: 'open-knowledge-list', query: KnowledgeListQuery): void
  (e: 'delete-knowledge', row: KnowledgePointVO): void
  (e: 'delete-file', row: KnowledgeFileVO): void
  (e: 'preview-file', row: KnowledgeFileVO): void
  (e: 'download-file', row: KnowledgeFileVO): void
  (e: 'reset-file-filters'): void
  (e: 'reset-knowledge-filters'): void
}>()

/** 筛选面板展开状态 */
const filterOpen = ref(false)
/** 进入全屏前的筛选展开状态：退出全屏时恢复 */
let filterOpenBeforeFullscreen = false

/** 进入全屏展示时自动展开查询条件，退出时恢复进入前的状态 */
watch(
  () => props.isFullscreen,
  (fullscreen) => {
    if (fullscreen) {
      filterOpenBeforeFullscreen = filterOpen.value
      filterOpen.value = true
    } else {
      filterOpen.value = filterOpenBeforeFullscreen
    }
  }
)

/** 知识管理勾选状态（存 pointId，字符串安全；单选，最多一条） */
const knowledgeChecked = ref<Array<string | number>>([])

/** el-table 需要数值高度才能固定表头并让空数据区留白；按表格容器实时测量 */
const fileRegionRef = ref<HTMLElement>()
const knowledgeRegionRef = ref<HTMLElement>()
const fileTableRef = ref<any>()
const knowledgeTableRef = ref<any>()
const fileTableHeight = ref(480)
const knowledgeTableHeight = ref(480)
let regionObserver: ResizeObserver | undefined
const measureTableHeights = (): void => {
  if (fileRegionRef.value) fileTableHeight.value = Math.max(0, fileRegionRef.value.clientHeight)
  if (knowledgeRegionRef.value) knowledgeTableHeight.value = Math.max(0, knowledgeRegionRef.value.clientHeight)
  // height 是响应式更新，补一次 doLayout，确保固定表头和横向滚动区域重新计算
  nextTick(() => {
    fileTableRef.value?.doLayout?.()
    knowledgeTableRef.value?.doLayout?.()
  })
}
onMounted(() => {
  measureTableHeights()
  if (typeof ResizeObserver !== 'undefined') {
    regionObserver = new ResizeObserver(measureTableHeights)
    if (fileRegionRef.value) regionObserver.observe(fileRegionRef.value)
    if (knowledgeRegionRef.value) regionObserver.observe(knowledgeRegionRef.value)
  }
})
onBeforeUnmount(() => regionObserver?.disconnect())
watch(
  () => [props.activeTab, props.isFullscreen] as const,
  () => nextTick(measureTableHeights)
)

/** el-table 序号：跟随服务端分页 */
const pageIndex = (index: number): number => (props.page - 1) * props.pageSize + index + 1

/** 知识管理行样式：单选选中态 */
const knowledgeRowClassName = ({ row }: { row: KnowledgePointVO }): string =>
  knowledgeChecked.value.includes(row.pointId) ? 'aep-row--selectable is-checked' : 'aep-row--selectable'

/** 点击行即切换单选；勾选框/删除按钮各自 stop，避免重复触发 */
const handleKnowledgeRowClick = (row: KnowledgePointVO): void => {
  toggleKnowledgeRow(row.pointId)
}

/** 审核要点来源字典：筛选下拉选项与列表展示名都由公共代码接口驱动（本地有兜底映射） */
const { pointSourceOptions, pointSourceName } = usePointSourceDict()

/** 从输入/选择事件取值 */
const eventValue = (event: Event): string => (event.target as HTMLInputElement | HTMLSelectElement).value

/**
 * 计数药丸点击：把该行文件与该列的条件一起带进知识列表弹窗
 * （提取审核要点 = 全部；确认/转化/已实现 = 对应状态为 1）
 */
const COUNT_LIST_CONDITIONS = {
  提取审核要点: { field: '', value: '', label: '' },
  确认审核要点: { field: 'isConfirm', value: '1', label: '确认审核要点（已确认）' },
  转化AI审核要点: { field: 'isSolidify', value: '1', label: '转化AI审核要点（已转化）' },
  系统已实现审核要点: { field: 'isImplement', value: '1', label: '系统已实现审核要点（已实现）' }
} as const

const openCountList = (row: KnowledgeFileVO, columnTitle: keyof typeof COUNT_LIST_CONDITIONS): void => {
  const condition = COUNT_LIST_CONDITIONS[columnTitle]
  emit('open-knowledge-list', {
    attachId: row.attachId,
    sourceFile: row.attachName,
    field: condition.field,
    value: condition.value,
    label: condition.label
  })
}

const setFileFilter = (key: keyof FileFilters, event: Event): void => {
  emit('update:fileFilter', { ...props.fileFilter, [key]: eventValue(event) })
}

const setFileYear = (value: string | null): void => {
  emit('update:fileFilter', { ...props.fileFilter, fwYear: value || '' })
}

const setKnowledgeFilter = (key: keyof KnowledgeFilters, event: Event): void => {
  emit('update:knowledgeFilter', { ...props.knowledgeFilter, [key]: eventValue(event) })
}

const setKnowledgeYear = (value: string | null): void => {
  emit('update:knowledgeFilter', { ...props.knowledgeFilter, fwYear: value || '' })
}

/** 文件后缀（pdf/doc/docx…），用于名称前的小标签 */
const fileSuffix = (name: string): string => {
  const matched = /\.([a-zA-Z0-9]+)$/.exec(name || '')
  return matched ? matched[1].toLowerCase() : ''
}

/** 提取状态文案兜底（后端 extractStatusName 优先，缺失时按编码兜底）：1 待提取 2 提取中 3 已提取 4 提取失败 */
const EXTRACT_STATUS_TEXT: Record<string, string> = { '1': '待提取', '2': '提取中', '3': '已提取', '4': '提取失败' }

/** 提取状态文案：接口 name 优先，编码兜底 */
const extractStatusText = (row: KnowledgeFileVO): string => row.extractStatusName || EXTRACT_STATUS_TEXT[String(row.extractStatus)] || '—'

/** 提取状态配色（按编码）：3 已提取青绿、2 提取中黄、4 提取失败红、其余（1 待提取）灰 */
const extractStatusClass = (code: string): string => {
  if (code === '3') return 'aep-badge--teal'
  if (code === '4') return 'aep-badge--danger'
  if (code === '2') return 'aep-badge--warning'
  return 'aep-badge--gray'
}

const extractStatusColor = (code: string): string => {
  if (code === '3') return 'var(--aep-primary)'
  if (code === '4') return 'var(--aep-danger)'
  if (code === '2') return 'var(--aep-warning)'
  return '#94a3b8'
}

/** 时间格式化：默认取到分钟，取不到显示 — */
const formatTime = (value: string, len = 16): string => {
  if (!value) return '—'
  return String(value).replace('T', ' ').slice(0, len)
}

/** 转化文案：后端返回的「已转译 / 未转译」统一显示为「已转化 / 未转化」 */
const solidifyText = (name: string, fallback: string): string => (name || fallback).replace(/转译/g, '转化')

/** 知识管理删除门槛：已确认（是否已确认 = 已确认）或已固化（是否固化为AI审核要点 = 是）都不能删 */
const canDeleteKnowledge = (row: KnowledgePointVO): boolean => row.isConfirm !== '1' && row.isSolidify !== '1'

/** 删除按钮悬浮提示：说明不能删的原因 */
const knowledgeDeleteTip = (row: KnowledgePointVO): string => {
  if (row.isConfirm === '1') return '已确认的审核要点不能删除'
  if (row.isSolidify === '1') return '已固化为AI审核要点的记录不能删除'
  return '删除'
}

/** 页签或分页变化时清空勾选，避免跨页残留 */
watch(
  () => [props.activeTab, props.page, props.pageSize] as const,
  () => {
    knowledgeChecked.value = []
  }
)

/** 知识管理勾选：单选，勾一行自动取消其它行 */
/** 单选：点行或点勾选框都走这条路径——未选中则选中该行，已选中则取消 */
const toggleKnowledgeRow = (pointId: string | number): void => {
  knowledgeChecked.value = knowledgeChecked.value.includes(pointId) ? [] : [pointId]
}

/** 供页面调用：取当前页勾选的审核要点（最多一条） */
defineExpose({
  getCheckedKnowledge: (): KnowledgePointVO[] => props.knowledgeRows.filter((x) => knowledgeChecked.value.includes(x.pointId))
})
</script>
