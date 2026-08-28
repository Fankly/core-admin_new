<!-- 项目分配 -->
<template>
  <vxe-modal
    ref="dialogFormRef"
    v-model="isShowModel"
    :destroy-on-close="true"
    resize
    show-zoom
    fullscreen
    :title="'评审分工'"
    :width="800"
    :height="750"
    :close-on-press-escape="false"
    @close="closeHandle"
    :loading="loading"
  >
    <Split ratio="5/5">
      <template #one>
        <proTable
          ref="proTableRef"
          @search="searchHandle"
          :tool-button="['other']"
          @reset="resetHandle"
          :data-callback="pageList"
          :request-api="searchDataHandle"
          :request-auto="false"
          :search-col="4"
          :columns="expertColumns"
          @row-click="handerClickTable"
        >
        </proTable>
      </template>
      <template #two>
        <proTable
          ref="proDataRef"
          @search="clearSelect"
          @reset="clearReset"
          :tool-button="['other']"
          :data-callback="callBackHandle"
          :request-api="getPageList"
          :request-auto="false"
          :search-col="4"
          :columns="programColumns"
          @row-click="rowClick"
        >
          <template #tableHeader="scope">
            <el-button v-if="isShowBtn" size="mini" type="primary" plain @click="handleClick('ADD', scope['selectedList'])"> 新 增 </el-button>
            <el-button
              v-if="isShowBtn"
              :disabled="!scope['isSelected']"
              size="mini"
              type="primary"
              plain
              @click="handleClick('DEL', scope['selectedList'])"
            >
              删 除
            </el-button>
            <el-button size="mini" type="primary" plain v-debounce="[handlePush, `click`, 500]"> 导出项目 </el-button>
          </template>
        </proTable>
      </template>
    </Split>
  </vxe-modal>
  <proAssignedModal @include-in-review="clearSelect" ref="proAssignedModalRef" />
</template>
<script lang="tsx">
export default {
  name: 'proAssigned'
}
</script>
<script setup lang="tsx">
import { ref, reactive, nextTick } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { getPublicData, getEjdwData, getYjdwData, getSubProtypeTree } from '@/api/common' //公共代码
import { pageExpertInfo, pageExpertLinkedXmInfo, exportExpertLinkedXmInfo, removeExpertProjectLink } from '@/api/service/jointReview'
import { ElMessage, ElMessageBox } from 'element-plus'
import Split from '@/components/Split/index.vue'
import { formatNumValue } from '@/utils/utils'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import proAssignedModal from '@/views/service/ywpt/components/proAssignedModal/index.vue'

import { apiExportHandle } from '@/utils/export'

const emits = defineEmits(['pushPage'])

const loading = ref(false)
const isShowBtn = ref(true)
const isShowModel = ref(false) //显示弹窗
const proTableRef = ref<any>()
const proDataRef = ref<any>()
const dialogFormRef = ref<any>()
const levelOne = ref<any>([]) // 一级单位
const levelTwo = ref<any>([]) // 二级单位
const levelTwoPro = ref<any>([]) // 二级单位
const pszy = ref<any>([]) // 评审专业
const ndDataList = ref<any>([]) // 年度查询
const zjjb = ref<any>([]) //专业级别
const projectTypeList = ref<any>([]) //项目类型
const searchData = ref<any>({})
const proSearchData = ref<any>({})
const proAssignedModalRef = ref<any>()
const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}
// 专家页面 开始
// 搜索
const searchHandle = () => {
  loading.value = true
  proTableRef.value?.clearSelection()
}
//重置
const resetHandle = () => {
  levelTwo.value.length = 0
  loading.value = true
  proTableRef.value?.clearSelection()
}
// 点击行选中
const handerClickTable = async (val: any) => {
  searchData.value.expertId = val.expertId
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
    proDataRef.value.reset()
  })
}
// 列表查询回调
const searchDataHandle = async (params: any) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  params['meetingId'] = searchData.value.meetingId
  return pageExpertInfo(params)
}
// 数据处理回调
const pageList = (val: any) => {
  loading.value = false
  return val
}
// 专家页面 结束

// 项目页面 开始
// 搜索
const clearSelect = () => {
  loading.value = true
  proDataRef.value?.clearSelection()
}
//重置
const clearReset = () => {
  levelTwoPro.value.length = 0
  loading.value = true
  proDataRef.value?.clearSelection()
}
// 点击行选中
const rowClick = async (val: any) => {
  nextTick(() => {
    proDataRef.value?.clearSelection()
    proDataRef.value?.element.toggleRowSelection(val)
  })
}
// 列表查询回调
const getPageList = async (params: any) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  params['meetingId'] = searchData.value.meetingId
  params['expertId'] = searchData.value.expertId
  params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  if (params['xmbmList'].length > 1000) {
    return ElMessage.error('项目编码最大支持1000条！')
  }
  proSearchData.value = { ...params }
  return pageExpertLinkedXmInfo(params)
}
// 数据处理回调
const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

const handleClick = (type: any, selectedList: any) => {
  if (type == 'DEL') {
    ElMessageBox.confirm(`是否确定删除?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        loading.value = true
        const xmIdList = selectedList.map((res: any) => res.xmId)
        const params = {
          ...searchData.value,
          xmIdList: xmIdList
        }
        let res: any = await removeExpertProjectLink(params)
        if (res.success) {
          ElMessage.success('删除成功！')
          proTableRef.value?.getTableList()
          proDataRef.value.getTableList()
          proDataRef.value?.clearSelection()
          loading.value = false
        } else {
          ElMessage.error(res.msg)
          loading.value = false
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  } else {
    if (!searchData.value.expertId) return ElMessage.warning('请选择要分配的专家！')
    const params = {
      row: { ...searchData.value },
      getTableList: proDataRef.value?.getTableList,
      getDataList: proTableRef.value?.getTableList
    }
    proAssignedModalRef.value.acceptParams(params)
  }
}

const handlePush = () => {
  try {
    loading.value = true
    const params = {
      ...proSearchData.value
    }
    const fileName = '项目明细表'
    apiExportHandle(params, fileName, exportExpertLinkedXmInfo)
    loading.value = false
  } catch (e) {
    loading.value = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}

// 项目页面 结束

// 弹窗关闭
const closeHandle = () => {
  isShowModel.value = false
  emits('pushPage', true)
}

//公共代码
const initParamLists = async () => {
  levelOne.value.length = 0 //清空单位
  levelTwo.value.length = 0 //清空单位
  levelTwoPro.value.length = 0 //清空单位
  pszy.value.length = 0
  ndDataList.value.length = 0

  // 获取公共代码
  // 一级单位
  const res = await getYjdwData()
  if (res.success && res.data.length !== 0) {
    levelOne.value.push(...res.data)
  }
  // 评审专业
  const publicCodeList = await getPublicData('MAJOR_COM')
  if (publicCodeList.success && publicCodeList.data.length !== 0) {
    pszy.value.push(...publicCodeList.data)
  }
  // 专家级别
  const zjjbCodeList = await getPublicData('EXPERT_LEVEL_COM')
  if (zjjbCodeList.success && zjjbCodeList.data.length !== 0) {
    zjjb.value = zjjbCodeList.data
  }
  let list = await getPublicData('NDCX')
  if (list.success && list.data.length !== 0) {
    ndDataList.value.push(...list.data)
  }
  getProjectData()
}

// 获取项目类型
const getProjectData = () => {
  getSubProtypeTree().then((res: any) => {
    if (res.success) {
      projectTypeList.value = res.data
    } else {
      ElMessage.error(res.msg)
    }
  })
}

// 选择一级单位联动二级单位
const selectChange = (val: any) => {
  const params = proTableRef.value?.searchParam
  params.ejdw = ''
  levelTwo.value.length = 0
  const { id }: any = levelOne.value.find((item: any) => item.code === val)
  getEjdwData(id).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      levelTwo.value.push(...res.data)
    }
  })
}

// 选择一级单位联动二级单位
const selectChange1 = (val: any) => {
  const params = proDataRef.value?.searchParam
  params.ejdw = ''
  levelTwoPro.value.length = 0
  const { id }: any = levelOne.value.find((item: any) => item.code === val)
  getEjdwData(id).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      levelTwoPro.value.push(...res.data)
    }
  })
}

const expertColumns = reactive<any[]>([
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'major',
    label: '评审专业',
    search: {
      el: 'select',
      order: 4
    },
    enum: pszy.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.major
    }
  },
  {
    prop: 'expertName',
    label: '专家姓名',
    width: '80',
    search: {
      el: 'input',
      order: 3
    }
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: '180',
    search: { el: 'select', props: { onChange: selectChange }, order: 1 },
    enum: levelOne.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.yjdw
    }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    width: '180',
    search: { el: 'select', order: 2 },
    enum: levelTwo.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.ejdw
    }
  },
  {
    prop: 'deptName',
    label: '所属部门',
    width: '180'
  },
  { prop: 'projectCount', label: '评审项目数量', width: '120' }
])

const programColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'meetingCode',
    label: '会议编号',
    width: '100'
  },
  {
    prop: 'meetingName',
    label: '会议名称',
    width: '280'
  },
  {
    prop: 'xmbm',
    label: '项目编码',
    width: '180',
    search: {
      order: 6,
      render: (scope: any) => {
        return <ReMultipleText modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'xmmc',
    label: '项目名称',
    width: '280',
    search: {
      el: 'input',
      order: 1
    }
  },
  // { prop: 'sfgmbName', label: '是否规模包', width: '100' },
  // { prop: 'gmbbm', label: '规模包编码', width: '180' },
  // { prop: 'gmbName', label: '规模包名称', width: '200' },
  { prop: 'isPack', label: '是否打捆项目', width: '100' },
  {
    prop: 'proType',
    label: '项目类型',
    width: '150',
    search: {
      order: 4,
      render: (scope: any) => {
        return <ElTreeSelect clearable data={projectTypeList.value} props={proTypeProps} nodeKey={'middleId'} modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: '180',
    search: { el: 'select', props: { onChange: selectChange1 }, order: 2 },
    enum: levelOne.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.yjdw
    }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    width: '180',
    search: { el: 'select', order: 3 },
    enum: levelTwoPro.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.ejdw
    }
  },
  {
    prop: 'applyCenter',
    label: '成本中心',
    width: '180'
  },
  {
    prop: 'amount',
    label: '申报金额（万元）',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.amount
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6) as string
    }
  },
  {
    prop: 'jhssnd',
    label: '计划实施年份',
    search: { el: 'select', order: 4 },
    enum: ndDataList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.jhssnd
    }
  },
  {
    prop: 'zdtxName',
    label: '重点投向',
    width: '180'
  },
  {
    prop: 'zgkbm',
    label: '省归口部门',
    width: '180'
  },
  {
    prop: 'zyssxmc',
    label: '预算事项名称',
    width: '280'
  },
  {
    prop: 'yssxmc',
    label: '预算事项名称',
    width: '280',
    search: {
      el: 'input',
      order: 5
    },
    isShow: false
  },
  {
    prop: 'remark',
    label: '预算事项说明',
    width: '280'
  },
  {
    prop: 'yjfl',
    label: '一级分类',
    width: '140'
  },
  {
    prop: 'ejfl',
    label: '二级分类',
    width: '140'
  },
  {
    prop: 'sjfl',
    label: '三级分类',
    width: '140'
  },
  {
    prop: 'fzrbh',
    label: '实施部门',
    width: '180'
  },
  {
    prop: 'xmssr',
    label: '项目实施人',
    width: '180'
  },
  {
    prop: 'zyfjftrtjfw',
    label: '研发投入统计范围',
    width: '180'
  },
  {
    prop: 'zyqcgbm',
    label: '预期成果',
    width: '180'
  },
  {
    prop: 'jryftrbfb',
    label: '研发投入百分比',
    width: '180'
  },
  {
    prop: 'bfbjsfssm',
    label: '百分比说明',
    width: '180'
  },
  {
    prop: 'sfaqsc',
    label: '是否安全生产',
    width: '140'
  },
  {
    prop: 'aqscfylx',
    label: '安全生产费用类型',
    width: '180'
  },
  {
    prop: 'xllx',
    label: '线路类型',
    width: '180'
  },
  {
    prop: 'dydj',
    label: '电压等级',
    width: '140'
  },
  {
    prop: 'ssnr',
    label: '项目实施内容',
    width: '280'
  },
  {
    prop: 'xmjys',
    label: '项目建议书（数量）',
    width: '140'
  },
  {
    prop: 'ky',
    label: '可研（数量）',
    width: '140'
  },
  {
    prop: 'pfwj',
    label: '批复文件（数量）',
    width: '140'
  }
])

defineExpose({
  isShowModel,
  initParamLists,
  proTableRef,
  searchData,
  isShowBtn
})
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 10px;
}
</style>
