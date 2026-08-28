<script lang="ts">
export default {
  name: '/matter/yydwAndGddwzzpz'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, reactive, ref, computed } from 'vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { ElMessage } from 'element-plus'
import { deleteMatterDwpzData, exportMatterDwpzData, getMatterDwpzData } from '@/api/matter/matterBasic'
import YegddwpzBasicOperation from '@/views/matter/components/YegddwpzBasicOperation/index.vue'
import VXETable from 'vxe-table'

interface InitParams {
  [key: string]: string
}

const userDialogRef = ref()
const helpModalRef = ref()
const loading = ref(false)
const isShowPage = ref(false)

const isDisabled = computed(() => loading.value)
const initParams = ref<InitParams>({})

const searchData = reactive({
  code: '',
  name: ''
})

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
const YegddwpzBasicOperationRef = ref()
const selectedData = ref(null)

// 查询
const searchHandle = async () => {
  loading.value = true
  try {
    const params = {
      ...searchData,
      page: page.page,
      limit: page.limit,
      specialorgid: initParams.value.specialorgid
    } as any
    const res = await getMatterDwpzData(params)
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

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
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

  YegddwpzBasicOperationRef.value.isShowModal = true
}

// 删除
const deleteHandle = async () => {
  const records = tableRef.value.getCheckboxRecords()
  if (records && records.length === 0) {
    ElMessage.warning('请至少选择一条数据进行删除!')
    return
  }
  const ids = records.map((item: any) => item.code)
  const type = await VXETable.modal.confirm('您确定要删除吗？')
  if (type === 'confirm') {
    const res = await deleteMatterDwpzData(ids)
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

const exportHandle = async () => {
  try {
    loading.value = true
    const params = {
      ...searchData,
      page: page.page,
      specialorgid: initParams.value.specialorgid
    } as any
    let res = await exportMatterDwpzData(params)
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = '产业单位与供电单位组织配置.xlxs'
    if (res && res.headers) {
      filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    }
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  userDialogRef.value.getUser()
})
</script>

<template>
  <div class="container" v-show="isShowPage">
    <div class="opertion" v-if="isShowPage">
      <div class="left">
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" @click="addOrEditHandle('ADD')" v-permission="'ADD'"
          >新 增</el-button
        >
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" @click="addOrEditHandle('EDIT')" v-permission="'EDIT'"
          >修 改</el-button
        >
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" v-permission="'DELETE'" @click="deleteHandle()"
          >删 除</el-button
        >
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" v-permission="'VIEW'" @click="addOrEditHandle('VIEW')"
          >查 看</el-button
        >
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" v-permission="'EXPORT'" @click="exportHandle"
          >导 出</el-button
        >
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form ref="formRef" :model="searchData" label-position="right" label-width="120px">
        <el-row>
          <el-col :span="6">
            <el-form-item label="单位名称：" prop="name">
              <el-input maxlength="80" v-model="searchData.name"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单位编码：" prop="code">
              <el-input maxlength="80" v-model="searchData.code"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <div class="operation" style="text-align: right">
              <el-button :loading="loading" type="primary" size="mini" plain @click="searchHandle">查 询</el-button>
              <el-button :loading="loading" type="primary" size="mini" plain @click="resetHandle">重 置</el-button>
            </div>
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
        <vxe-column field="code" width="180" title="单位编码"></vxe-column>
        <vxe-column field="name" width="180" title="单位名称"></vxe-column>
        <vxe-column field="sx" width="180" title="单位属性"></vxe-column>
        <vxe-column field="sgscydwCode" width="180" title="市级产业单位编码"></vxe-column>
        <vxe-column field="sgscydwName" width="180" title="市级产业单位名称"></vxe-column>
        <vxe-column field="xgsgddwCode" width="180" title="县级供电单位编码"></vxe-column>
        <vxe-column field="xgsgddwName" width="180" title="县级供电单位名称"></vxe-column>
        <vxe-column field="sgsgddwCode" width="180" title="市级供电单位编码"></vxe-column>
        <vxe-column field="sgsgddwName" width="180" title="市级供电单位名称"></vxe-column>
        <vxe-column field="xgsgddwAuditName" width="180" title="是否需要县级供电单位审核"></vxe-column>
        <vxe-column field="sgsgddwAuditName" width="180" title="是否需要市级供电单位审核"></vxe-column>
        <vxe-column field="sgscydwAuditName" width="180" title="是否需要市级产业单位审核"></vxe-column>
        <vxe-column field="bukrs" width="150" title="财务中台单位编码"></vxe-column>
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
  <YegddwpzBasicOperation @save-data="searchHandle" :selectedData="selectedData" :matterBasicMsg="matterBasicMsg" ref="YegddwpzBasicOperationRef" />
  <HelpModal ref="helpModalRef" />
</template>

<style scoped lang="less">
.container {
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  .operation {
    margin-bottom: 10px;
  }

  .opertion {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .table {
    flex-grow: 1;
  }
}
</style>
