<!--年度预算事项基本信息/预算事项主数据-->
<script lang="ts">
export default {
  name: '/matter/yssxzsjTest'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { onMounted, reactive, ref, nextTick } from 'vue'
import { getMatterBasicData, SearchData } from '@/api/matter/matterBasic'
import { useGuide } from '@/hooks/useGuide'

interface InitParams {
  [key: string]: string
}

const userDialogRef = ref()
const helpModalRef = ref()
const loading = ref(false)
const isShowPage = ref(false)
const initParams = ref<InitParams>({})

const searchData = reactive<any>({
  zyssxbm: '',
  zyssxmc: ''
})

const tableDataList = ref()

const page = reactive({
  total: 0,
  limit: 20,
  page: 1
})

const formRef = ref()
const tableRef = ref()

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

// 点击行单选当前行（参考 RangeVxeTable 的 exclusive 模式）：非复选框单元格点击时清空其他勾选并选中当前行
const cellClickHandle = ({ row, column }: any) => {
  if (!row || column?.type === 'checkbox') return
  nextTick(() => {
    tableRef.value?.clearCheckboxRow?.()
    tableRef.value?.setCheckboxRow?.(row, true)
  })
}

const searchHandle = async () => {
  loading.value = true
  try {
    const params = {
      ...searchData,
      page: page.page,
      limit: page.limit,
      specialorgid: initParams.value.specialorgid
    } as SearchData
    const res = await getMatterBasicData(params)
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

const getRoleHandle = () => {
  loading.value = false
  initParams.value.specialorgid = userDialogRef.value.specialorgid
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
    startGuide()
    searchHandle()
  }
}

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

// 是否类字段（1 是 / 0 否）列表展示
const yesNoMap: Record<string, string> = { '1': '是', '0': '否' }
const formatYesNo = ({ cellValue }: any) => yesNoMap[String(cellValue)] || ''

const { startGuide } = useGuide({
  moduleKey: 'CentralizedModification',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

onMounted(() => {
  userDialogRef.value.getUser()
})
</script>

<template>
  <div class="container" v-show="isShowPage">
    <div class="opertion" v-if="isShowPage">
      <div class="left"> </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form ref="formRef" :model="searchData" label-position="right" label-width="120px">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="预算事项编码：" prop="zyssxbm">
              <el-input maxlength="80" v-model="searchData.zyssxbm"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="预算事项名称：" prop="zyssxmc">
              <el-input maxlength="80" v-model="searchData.zyssxmc"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <div class="operation" style="text-align: right">
              <el-button :loading="loading" type="primary" size="small" plain @click="searchHandle">查 询</el-button>
              <el-button :loading="loading" type="primary" size="small" plain @click="resetHandle">重 置</el-button>
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
        :checkbox-config="{ highlight: true }"
        @cell-click="cellClickHandle"
        :data="tableDataList"
        height="100%"
        :loading="loading"
      >
        <vxe-column field="nd" width="80" title="年度"></vxe-column>
        <vxe-column field="zyssxbm" width="180" title="预算事项编码"></vxe-column>
        <vxe-column field="zyssxmc" width="180" title="预算事项名称"></vxe-column>
        <vxe-column field="xmlxName" width="180" title="项目类型"></vxe-column>
        <vxe-column field="yslyName" width="180" title="预算来源"></vxe-column>
        <vxe-column field="zgkbmName" width="180" title="省归口部门"></vxe-column>
        <vxe-column field="yslxctName" width="180" title="重点投向"></vxe-column>
        <vxe-column field="yjflName" width="180" title="一级分类"></vxe-column>
        <vxe-column field="ejflName" width="180" title="二级分类"></vxe-column>
        <vxe-column field="sjflName" width="180" title="三级分类"></vxe-column>
        <vxe-column field="sfaqscName" width="120" title="是否安全生产"></vxe-column>
        <vxe-column field="aqscfylxName" width="220" title="安全生产费用类型"></vxe-column>
        <vxe-column field="zyfjftrtjfwName" width="120" title="研发投入统计范围"></vxe-column>
        <vxe-column field="isDispatchName" width="120" title="是否调度端"></vxe-column>
        <vxe-column field="sfxysgkspName" width="150" title="是否需要省归口审批"></vxe-column>
        <vxe-column field="sfxmlr" width="140" title="是否允许需求录入" :formatter="formatYesNo"></vxe-column>
        <vxe-column field="sfxylhhs" width="140" title="是否需要省级会审" :formatter="formatYesNo"></vxe-column>
        <vxe-column field="isGjPspfwj" width="190" title="是否挂接评审及批复资料" :formatter="formatYesNo"></vxe-column>
        <vxe-column field="sfjjcl" width="140" title="是否授权地市处理" :formatter="formatYesNo"></vxe-column>
        <vxe-column field="xmbbm" width="240" title="预算包编号"></vxe-column>
        <vxe-column field="cwpsyd" width="220" title="财务评审要点"></vxe-column>
        <vxe-column field="jhlxName" width="120" title="计划类型"></vxe-column>
        <vxe-column field="gkcsName" width="180" title="省公司归口处室"></vxe-column>
        <vxe-column field="statusName" width="120" title="状态"></vxe-column>
        <vxe-column field="remark" width="220" title="预算事项说明"></vxe-column>
        <vxe-column field="createTime" width="180" title="创建时间"></vxe-column>
        <vxe-column field="fjNum" width="100" title="附件数量"></vxe-column>
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
  <HelpModal ref="helpModalRef" />
</template>

<style scoped lang="less">
.container {
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  .opertion {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .operation {
    margin-bottom: 10px;
  }
  .table {
    flex-grow: 1;
  }
}
</style>
