<!-- 版本通知记录（只读列表） -->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      @search="resetTable"
      @reset="resetTable"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      row-key="id"
      ref="proTableRef"
      stripe
      :loading="loading"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/sys/versionRecord/index">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref, reactive } from 'vue'
import ProTable from '@/components/ProTablePage/index.vue'
import { versionNoticePage } from '@/api/sys/versionNotice'

// ========== 响应式状态 ==========
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const loading = ref(false)

// ========== 表格列配置 ==========
// 查询条件仅保留：版本号、通知标题
const tableColumns = reactive<any[]>([
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'versionNo',
    label: '版本号',
    // 与新增/编辑弹窗的版本号长度保持一致
    search: { el: 'input', order: 1, props: { maxlength: 64 } },
    width: 150
  },
  {
    prop: 'versionTitle',
    label: '通知标题',
    // 与新增/编辑弹窗的通知标题长度保持一致
    search: { el: 'input', order: 2, props: { maxlength: 200 } },
    width: 280
  },
  {
    prop: 'versionContent',
    label: '检修内容',
    render: ({ row }: any) => {
      // 富文本去除 HTML 标签后截取摘要展示
      const text = row.versionContent
        ? row.versionContent
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim()
        : ''
      return text
    },
    width: 400
  },
  { prop: 'releaseDate', label: '检修日期', width: 320 },
  { prop: 'noticeTime', label: '通知生效时间', width: 160 },
  { prop: 'noticeExpireTime', label: '通知失效时间', width: 160 },
  {
    prop: 'status',
    label: '状态',
    width: 90,
    enum: [
      { label: '草稿', value: '0', tagType: 'info' },
      { label: '已发布', value: '1', tagType: 'success' },
      { label: '已撤回', value: '2', tagType: 'warning' },
      { label: '已过期', value: '3', tagType: 'warning' }
    ],
    render: ({ row }: any) => {
      return row.statusName
    }
  }
])

// ========== 表格相关 ==========

const resetTable = () => {
  proTableRef.value?.getTableList()
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (params: any) => {
  loading.value = true
  return versionNoticePage(params)
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    if (isQuery) {
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
