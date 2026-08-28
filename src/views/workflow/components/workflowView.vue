<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import baseService from '@/service/baseService'
import { loadUserWfInfo } from '@/api/workflow'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

onMounted(() => {
  document.querySelector('body')?.setAttribute('style', 'background-color: white;')
  document.querySelector('html')?.setAttribute('style', 'height: 100%;background-color: white;}')

  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = data.wfData
      workItemIdString.value = workItemId
      wfInstIdString.value = data.wfInstId
      wfCodeString.value = data.wfCode
      searchHandle()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
})

const store = useStore()
const workItemIdString = ref<string>('')
const wfInstIdString = ref<string>('')
const wfCodeString = ref<string>('')

const columns = ref<
  {
    columnKey: string
    columnName: string
  }[]
>([])

const columnsData = ref([])

//工作流用户信息
const userInfo = ref({
  id: '',
  spOrgId: '',
  spRoleId: '',
  cropId: ''
})
//工作流全局变量
const wfDataString = ref({
  SXIDS: ''
})

// 分页
const page = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

const getQueryString = (name: string): string => {
  const allParams = window.location.href.split('?').reduce((acc, part) => {
    const params = new URLSearchParams(part.split('#')[0])
    params.forEach((value, k) => acc.set(k, value))
    return acc
  }, new Map())

  if (window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1]
    new URLSearchParams(hashQuery).forEach((value, k) => allParams.set(k, value))
  }
  return allParams.get(name)
}

// 查询
const searchHandle = () => {
  if (wfCodeString.value === 'WF_MATTERDECLARELC') {
    baseService
      .get('/workflow/declare/getDynamicColumn', {
        userId: store.getters.getUserMsg.id
      })
      .then((res) => {
        columns.value = res.data
      })
    baseService
      .post('/workflow/declare/getPage', {
        limit: 10,
        page: 1,
        id: wfDataString.value.SXIDS.split(','),
        specialorgid: userInfo.value.spOrgId
      })
      .then((res) => {
        columnsData.value = res.data.records
      })
  } else if (wfCodeString.value === 'WF_MATTEROUTBOUNDLC') {
    baseService
      .get('/workflow/outbound/getDynamicColumn', {
        userId: store.getters.getUserMsg.id
      })
      .then((res) => {
        columns.value = res.data
      })
    baseService
      .post('/workflow/outbound/getPage', {
        limit: 10,
        page: 1,
        id: wfDataString.value.SXIDS.split(','),
        specialorgid: userInfo.value.spOrgId
      })
      .then((res) => {
        columnsData.value = res.data.records
      })
  }
}
</script>

<template>
  <div class="table-box">
    <div class="table-operation">
      <!-- <el-button type="primary" plain>查 看</el-button> -->
    </div>
    <div class="table-main">
      <el-table height="690px" :data="columnsData" fit border stripe>
        <template v-for="item in columns" :key="item.columnKey">
          <el-table-column show-overflow-tooltip width="160" :label="item.columnName" :prop="item.columnKey"></el-table-column>
        </template>
      </el-table>
      <el-pagination></el-pagination>
    </div>
    <div class="pagination">
      <el-pagination
        :current-page="page.page"
        background
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
  </div>
</template>

<style scoped lang="less">
.table-box {
  box-sizing: border-box;
  padding: 10px;

  .table-operation {
    padding-bottom: 10px;
  }
}
</style>
