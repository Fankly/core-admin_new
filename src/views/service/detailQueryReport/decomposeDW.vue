<!-- 费用单位分解明细查询报表 -->
<template>
  <div class="container" v-show="isShowPage">
    <otherTable
      @reset="reset"
      ref="otherTableRef"
      :columnsTable="columns"
      :tableType="'3'"
      :file-name="'费用单位分解明细查询报表'"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="tsx">
export default {
  name: '/service/detailQueryReport/decomposeDW'
}
</script>
<script setup lang="tsx">
import { onMounted, ref, reactive } from 'vue'
import { getPublicData, getBizOrgXzTreeExcludeBmNoPermissionNoLazy } from '@/api/common' //公共代码
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import otherTable from '@/views/service/detailQueryReport/components/table.vue' //表格组件
import { formatNumValue } from '@/utils/utils'
import TreeSelect from '@/components/select/TreeSelectLazy.vue'

const userDialogRef = ref() // 用户角色
const isShowPage = ref(false) //未选择角色前不展示页面
const otherTableRef = ref()
const proDwRef = ref()
const ywlxList = ref<any>([]) // 业务类型
const kmlxList = ref<any>([]) // 科目类型
const ztList = ref<any>([]) // 状态
const dwList = ref<any>([]) // 单位
const tzList = ref<any>([]) // 调整类型
// 树形结构props类型
const treeProps = reactive({
  dwListProps: {
    children: 'children',
    label: 'name',
    isLeaf: 'leaf'
  }
})
// 方法
onMounted(async () => {
  await initParamLists()
  await userDialogRef.value.getUser()
})

//公共代码
const initParamLists = async () => {
  // 清空下拉框数据
  kmlxList.value.length = 0
  ywlxList.value.length = 0
  ztList.value.length = 0
  dwList.value.length = 0
  tzList.value.length = 0

  // 获取公共代码
  // 业务类型
  const res = await getPublicData('YSBZ_BUSI_TYPE')
  if (res.success && res.data.length !== 0) {
    ywlxList.value.push(...res.data)
  }
  // 科目类型
  const root = await getPublicData('YSBZ_KMLX')
  if (root.success && root.data.length !== 0) {
    kmlxList.value.push(...root.data)
  }
  // 状态
  const item = await getPublicData('YSBZ_STATUS')
  if (item.success && item.data.length !== 0) {
    ztList.value.push(...item.data)
  }
  // 调整状态
  const tzTypes = await getPublicData('YSBZ_TZ_TYPE')
  if (tzTypes.success && tzTypes.data.length !== 0) {
    tzList.value.push(...tzTypes.data)
  }

  // 单位
  const data = await getBizOrgXzTreeExcludeBmNoPermissionNoLazy()
  if (data.success && data.data.length !== 0) {
    dwList.value.push(...data.data)
  }
}

const reset = (val: any) => {
  if (val.type == 'RESET') {
    proDwRef.value?.clearSelect()
  }
}

// 获取选择的单位合集
const selectedDwData = (value: any, flag: string) => {
  otherTableRef.value.proTableRef.searchParam[flag] = value
}

// 清空单位
const resetDwData = () => {
  const $table = otherTableRef.value.proTableRef
  if (Array.isArray($table.searchParam.dwIdList)) {
    $table.searchParam.dwIdList.length = 0
  } else {
    $table.searchParam.dwIdList = ''
  }
}

const columns = reactive<any>([
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'nd',
    label: '年度',
    isShow: false,
    search: {
      el: 'date-picker',
      order: 1,
      props: {
        type: 'year',
        valueFormat: 'YYYY',
        clearable: true
      }
    }
  },
  {
    prop: 'busiType',
    label: '业务类型',
    isShow: false,
    search: { el: 'select', order: 2 },
    enum: ywlxList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'kmlx',
    label: '科目类型',
    isShow: false,
    search: { el: 'select', order: 3 },
    enum: kmlxList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'tzType',
    label: '调整类型',
    isShow: false,
    search: { el: 'select', order: 8 },
    enum: tzList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'dwIdList',
    label: '单位',
    search: {
      order: 5,
      render: () => {
        return (
          <TreeSelect
            ref={proDwRef}
            check-strictly={true}
            onClearData={resetDwData}
            is-child-node={false}
            data={dwList.value}
            onSelectChange={(value: any) => selectedDwData(value, 'dwIdList')}
            is-leaf={false}
            data-type="id"
            default-props={treeProps.dwListProps}
            node-key="id"
          />
        )
      }
    },
    isShow: false
  },
  { prop: 'nd', label: '年度', width: '100' },
  { prop: 'busiTypeName', label: '业务类型', width: '100' },
  { prop: 'kmlxName', label: '科目类型', width: '100' },
  { prop: 'tzTypeName', label: '调整类型', width: '100' },
  {
    prop: 'yskmName',
    label: '预算科目',
    search: {
      el: 'input',
      order: 3,
      props: {
        maxlength: 20,
        showWordLimit: true,
        inputStyle: { paddingRight: '80px' }
      }
    },
    width: '180'
  },
  {
    prop: 'cnxName',
    label: '承诺项名称',
    search: {
      el: 'input',
      order: 3,
      props: {
        maxlength: 20,
        showWordLimit: true,
        inputStyle: { paddingRight: '80px' }
      }
    },
    width: '240'
  },
  { prop: 'dwName', label: '单位', width: '280' },
    {
    prop: 'fjje',
    label: '分解金额(万元)',
    width: '160',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.fjje
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 4)
    }
  },
  {
    prop: 'status',
    label: '状态',
    isShow: false,
    search: { el: 'select', order: 7 },
    enum: ztList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  { prop: 'statusName', label: '状态', width: '80' },
  {
    prop: 'xdje',
    label: '下达金额(万元)',
    width: '160',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.xdje
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 4)
    }
  },
  { prop: 'sbStatus', label: '上报状态', width: '100' },
  {
    prop: 'sbje',
    label: '上报金额(万元)',
    width: '160',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.sbje
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 4)
    }
  },
  { prop: 'sbDesc', label: '上报说明', width: '200' },
  { prop: 'sdStatus', label: '审定状态', width: '100' },
  {
    prop: 'sdje',
    label: '审定金额(万元)',
    width: '160',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.sdje
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 4)
    }
  },
  { prop: 'sdTime', label: '审定时间', width: '100' },
  { prop: 'fjStatus', label: '分解状态', width: '100' },
  { prop: 'fjTime', label: '分解时间', width: '100' },
])

// 选择角色
const getRoleHandle = async () => {
  try {
    const userInfo = { ...userDialogRef.value.userMsg }
    const isQuery = userDialogRef.value.isQuery
    if (isQuery) {
      isShowPage.value = true
      otherTableRef.value.dwId=userInfo.org_id
      otherTableRef.value?.proTableRef.getTableList()
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  position: relative;
}
</style>
