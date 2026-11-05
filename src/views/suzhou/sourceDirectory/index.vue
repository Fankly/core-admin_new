<!-- 智能审核规则管理 -->
<template>
  <div class="container">
    <ProTable
      @search="resetTable"
      @reset="resetTable"
      @row-click="handleClickRow"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="ruleId"
      ref="proTableRef"
      stripe
      :loading="loading"
    >
      <template #tableHeader>
        <el-button size="mini" @click="handleExport" plain type="primary">导 出</el-button>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="tsx" name="/suzhou/sourceDirectory/index">
import { ref, reactive, nextTick, h } from 'vue'
import ProTable from '@/components/ProTablePage/index.vue'
import { materialSourceGetPage, materialSourceExportData } from '@/api/suzhou/sourceDirectory'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { apiExportHandle } from '@/utils/export'

// ========== 响应式状态 ==========
const proTableRef = ref<any>(null)
const loading = ref(false)
const paramsPage = ref<any>()

// ========== 表格列配置 ==========
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { prop: 'xh', label: '序号', width: 100 },
  {
    prop: 'category',
    label: '原固定资产目录',
    _children: [
      { prop: 'bigCategoryDesc', label: '大类描述', width: 180 },
      { prop: 'bigCategoryCode', label: '大类编码', width: 100 },
      { prop: 'middleCategoryDesc', label: '中类描述', width: 100 },
      { prop: 'middleCategoryCode', label: '中类编码', width: 100 },
      { prop: 'smallCategoryDesc', label: '小类描述', width: 100 },
      { prop: 'smallCategoryCode', label: '小类编码', width: 100 },
      { prop: 'subCategoryDesc', label: '细类描述', width: 100 },
      { prop: 'subCategoryCode', label: '细类编码', width: 100 },
      { prop: 'zyzcsb', label: '重要组成设备', width: 100 },
      { prop: 'assetDirRemark', label: '备注', width: 180 }
    ]
  },
  {
    prop: 'dir',
    label: '同源目录',
    _children: [
      { prop: 'level1DirDesc', label: 'Ⅰ级目录（科目披露维度）', width: 180 },
      { prop: 'level1DirCode', label: 'Ⅰ级目录编码', width: 100 },
      { prop: 'level2DirDesc', label: 'Ⅱ级目录（折旧功能定位）', width: 180 },
      { prop: 'level2DirCode', label: 'Ⅱ级目录编码', width: 100 },
      {
        prop: 'level3DirDesc',
        label: 'Ⅲ级目录（价值核算单元）',
        width: 180,
        search: {
          el: 'input',
          order: 2
        }
      },
      {
        prop: 'level3DirCode',
        label: 'Ⅲ级目录编码',
        width: 100,
        search: {
          order: 1,
          render: (scope: any) => {
            return h(ReMultipleText, {
              modelValue: scope.modelValue
            })
          }
        }
      },
      {
        prop: 'level4DirDesc',
        label: 'Ⅳ级目录（实物管理单元）',
        width: 180,
        search: {
          el: 'input',
          order: 3
        }
      },
      { prop: 'zjglbs', label: '组件管理标识', width: 100 },
      { prop: 'sourceDirRemark', label: '备注', width: 180 }
    ]
  }
])

// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (params: any) => {
  loading.value = true
  params['level3DirCodeList'] = params['level3DirCode'] ? params['level3DirCode'].split(',') : []
  paramsPage.value = { ...params }
  return materialSourceGetPage(params)
}

// 导出
const handleExport = () => {
  const params = { ...paramsPage.value }
  const fileName = '在线测算项目清单'
  apiExportHandle(params, fileName, materialSourceExportData)
}
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
