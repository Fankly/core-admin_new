
<template>
  <div class="container" v-show="isShowPage">
    <div class="operation" v-if="isShowPage">
      <div class="left">
        <el-button
          :loading="loading"
          :disabled="isDisabled"
          plain
          size="mini"
          type="primary"
          @click="searchHandle"
          v-permission="'SEARCH'"
        >查 询</el-button>
        <el-button
          :loading="loading"
          :disabled="isDisabled"
          plain
          size="mini"
          type="primary"
          @click="addOrEditHandle('ADD')"
          v-permission="'ADD'"
        >新 增</el-button>
        <el-button
          :loading="loading"
          :disabled="isDisabled"
          plain
          size="mini"
          type="primary"
          @click="addOrEditHandle('EDIT')"
          v-permission="'EDIT'"
        >修 改</el-button>
        <el-button
          :loading="loading"
          :disabled="isDisabled"
          plain
          size="mini"
          type="primary"
          v-permission="'DELETE'"
          @click="deleteHandle()"
        >删 除</el-button>
        <el-button
          :loading="loading"
          :disabled="isDisabled"
          plain
          size="mini"
          type="primary"
          v-permission="'VIEW'"
          @click="addOrEditHandle('VIEW')"
        >查 看</el-button>
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <!-- 搜索条件区域 -->
    <div class="search">
      <el-form ref="formRef" :model="searchDatas" label-position="right">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="统驭科目" label-width="100px">
              <el-input
                placeholder="请输入统驭科目"
                v-model="searchDatas.akont"
                style="width: 100%"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="公司代码" label-width="100px">
              <el-input
                placeholder="请输入公司代码"
                v-model="searchDatas.bukrs"
                style="width: 100%"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="编号" label-width="80px">
              <el-input
                placeholder="请输入编号"
                v-model="searchDatas.lifnr"
                style="width: 100%"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="名称" label-width="80px">
              <el-input
                placeholder="请输入名称"
                v-model="searchDatas.name1"
                style="width: 100%"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="table">
      <vxe-table
        resizable
        ref="tableRef"
        border
        stripe
        show-overflow
        align="center"
        header-align="center"
        :row-config="{
          height: 32
        }"
        :data="tableDataList"
        height="100%"
        :loading="loading"
      >
        <vxe-column width="50" type="checkbox"></vxe-column>
        <vxe-column field="akont" title="统驭科目"></vxe-column>
        <vxe-column field="bukrs" title="公司代码"></vxe-column>
        <vxe-column field="lifnr" title="编号"></vxe-column>
        <vxe-column field="name1" title="名称"></vxe-column>
      </vxe-table>
    </div>
    <div class="pager">
      <el-pagination
        :current-page="page.page"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <GyssjpzBasicOperation
    @save-data="searchHandle"
    :selectedData="selectedData"
    :matterBasicMsg="matterBasicMsg"
    ref="GyssjpzBasicOperationRef"
  />
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/matter/gyssjpz'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import {
  gyspzDelete,
  getList
} from '@/api/matter/matterBasic'
import GyssjpzBasicOperation from '@/views/matter/components/GyssjpzBasicOperation/index.vue'
import VXETable from 'vxe-table'

interface InitParams {
  [key: string]: string
}

const searchDatas = ref<any>({
  akont: '',
  bukrs: '',
  lifnr: '',
  name1: ''
})
const userDialogRef = ref()
const helpModalRef = ref()
const loading = ref(false)
const isShowPage = ref(false)

const isDisabled = computed(() => loading.value)
const initParams = ref<InitParams>({})

const matterBasicMsg = reactive({
  title: '新增',
  opType: 'ADD'
})

const tableDataList = ref()

const page = reactive({
  total: 0,
  limit: 20,
  page: 1
})

const formRef = ref()
const tableRef = ref()
const GyssjpzBasicOperationRef = ref()
const selectedData = ref(null)

// 查询
const searchHandle = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.page,
      limit: page.limit,
      ...searchDatas.value
    }
    const res = await getList(params)
    if (res.success) {
      tableDataList.value = res.data.records
      page.total = res.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 重置
const resetHandle = () => {
  formRef.value.resetFields()
  searchHandle()
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

const getRoleHandle = () => {
  loading.value = false
  initParams.value.specialorgid = userDialogRef.value.specialorgid
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
    searchHandle()
  }
}

// 新憎
const addOrEditHandle = (flag: string) => {
  matterBasicMsg.opType = flag
  if (flag === 'ADD') {
    matterBasicMsg.title = '新增'
  } else if (flag === 'EDIT') {
    matterBasicMsg.title = '编辑'
  } else if (flag === 'VIEW') {
    matterBasicMsg.title = '查看'
  }
  if (['EDIT', 'VIEW'].includes(flag)) {
    const records: any = tableRef.value.getCheckboxRecords()
    if (records && records.length !== 1) {
      ElMessage.warning('请选择一条数据进行编辑!')
      return
    }
    selectedData.value = records[0]
  }

  GyssjpzBasicOperationRef.value.isShowModal = true
}

// 删除
const deleteHandle = async () => {
  const records = tableRef.value.getCheckboxRecords()
  if (records && records.length === 0) {
    ElMessage.warning('请至少选择一条数据进行删除!')
    return
  }
  const lifnrs = records.map((item: any) => item.lifnr)
  const type = await VXETable.modal.confirm('您确定要删除吗？')
  if (type === 'confirm') {
    const res = await gyspzDelete(lifnrs.join(','))
    if (res.success) {
      ElMessage.success('删除成功!')
      searchHandle()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  }
}

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

onMounted(() => {
  userDialogRef.value.getUser()
})
</script>

<style scoped lang="less">
.container {
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  .operation {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .table {
    flex-grow: 1;
  }
}
</style>
