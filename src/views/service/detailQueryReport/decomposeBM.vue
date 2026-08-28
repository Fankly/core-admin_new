<!-- 费用部门分解明细查询报表 -->
<template>
  <div class="container" v-show="isShowPage">
    <otherTable
      @reset="reset"
      ref="otherTableRef"
      :columnsTable="columns"
      :tableType="'4'"
      :file-name="'费用部门分解明细查询报表'"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="tsx">
export default {
  name: '/service/detailQueryReport/decomposeBM'
}
</script>
<script setup lang="tsx">
import { onMounted, ref, reactive } from 'vue'
import { getPublicData, getGkbmInProvince } from '@/api/common' //公共代码
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import otherTable from '@/views/service/detailQueryReport/components/table.vue' //表格组件
import { formatNumValue } from '@/utils/utils'
import TreeSelect from '@/components/select/TreeSelectLazy.vue'

const userDialogRef = ref() // 用户角色
const isShowPage = ref(false) //未选择角色前不展示页面
const otherTableRef = ref()
const proDwRef = ref()
const proTypeRef = ref()
const ywlxList = ref<any>([]) // 业务类型
const kmlxList = ref<any>([]) // 科目类型
const ztList = ref<any>([]) // 状态
const gkbmList = ref<any>([]) // 部门
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
  gkbmList.value.length = 0

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
  // 部门
  const data = await getGkbmInProvince()
  if (data.success && data.data.length !== 0) {
    gkbmList.value.push(...data.data)
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
  if (Array.isArray($table.searchParam.bmIdList)) {
    $table.searchParam.bmIdList.length = 0
  } else {
    $table.searchParam.bmIdList = ''
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
    prop: 'bmIdList',
    label: '部门',
    search: {
      order: 5,
      render: () => {
        return (
          <TreeSelect
            ref={proDwRef}
            check-strictly={true}
            onClearData={resetDwData}
            is-child-node={false}
            data={gkbmList.value}
            onSelectChange={(value: any) => selectedDwData(value, 'bmIdList')}
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
  {
    prop: 'status',
    label: '状态',
    isShow: false,
    search: { el: 'select', order: 7 },
    enum: ztList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  { prop: 'nd', label: '年度', width: '100' },
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
  { prop: 'dwName', label: '一级单位', width: '280' },
  { prop: 'ejdw', label: '二级单位', width: '280' },
  { prop: 'profitCenter', label: '利润中心', width: '280' },
  { prop: 'applyCenter', label: '成本中心', width: '280' },
  { prop: 'bmName', label: '部门', width: '280' },
  { prop: 'pch', label: '批次号', width: '120' },
  { prop: 'busiTypeName', label: '业务类型', width: '100' },
  { prop: 'kmlxName', label: '科目类型', width: '100' },
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
    prop: 'ysje',
    label: '预算金额(万元)',
    width: '160',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.ysje
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 4)
    }
  },
  { prop: 'statusName', label: '状态', width: '80' },
  { prop: 'auditStatus', label: '审批状态', width: '80' },
  { prop: 'sbStatus', label: '上报状态', width: '100' },
  { prop: 'sdStatus', label: '审定状态', width: '100' },
  { prop: 'fjStatus', label: '分解状态', width: '100' },
  { prop: 'description', label: '编制说明', width: '100' }
])
// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    if (isQuery) {
      isShowPage.value = true
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
