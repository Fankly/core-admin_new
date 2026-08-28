<!-- 成本性项目预算结算率统计指标确认 -->
<template>
  <div class="container" v-if="isShowPage">
    <el-date-picker
      @change="changeDateHandle"
      :clearable="false"
      format="YYYY-MM"
      value-format="YYYY-MM"
      :default-value="new Date()"
      v-model="currentYearMonth"
      type="month"
      style="position: absolute; right: 80px; top: 15px; z-index: 999; width: 130px"
    />
    <el-tabs v-model="tabMsg" type="border-card" v-loading="loading">
      <el-tab-pane label="明细查询" name="1" v-if="JSON.stringify(tabList).includes('明细查询')">
        <div style="height: 80vh">
          <proTable
            :search-col="4"
            ref="tableMXRef"
            :pagination="false"
            :data-callback="pageList"
            :request-api="searchDataHandle"
            :request-auto="false"
            :columns="MXColumns"
          >
            <template #tableHeader="scope">
              <template v-for="(item, index) in MXBtn" :key="index">
                <el-button
                  v-permission="item.label"
                  :disabled="!scope.isSelected && item.isSelected"
                  type="primary"
                  size="mini"
                  plain
                  @click="handlerBtn(item.label, scope.selectedList)"
                  >{{ item.value }}</el-button
                >
              </template>
            </template>
          </proTable>
        </div>
      </el-tab-pane>
      <el-tab-pane label="单位统计" name="2" v-if="JSON.stringify(tabList).includes('单位统计')">
        <div style="height: 80vh">
          <proTable :cell-style="columnStyle" :row-style="rowStyle" ref="tableDWRef" :pagination="false" :data="tableDataDW" :columns="DWColumns">
            <template #tableHeader="scope">
              <template v-for="(item, index) in DWBtn" :key="index">
                <el-button v-permission="item.label" type="primary" size="mini" plain @click="handlerBtn(item.label, scope.selectedList)">
                  {{ item.value }}
                </el-button>
              </template>
            </template>
          </proTable>
        </div>
      </el-tab-pane>
      <el-tab-pane label="类型统计" name="3" v-if="JSON.stringify(tabList).includes('类型统计')">
        <div style="height: 80vh">
          <proTable :cell-style="columnStyle" ref="tableLXRef" :pagination="false" :data="tableDataLX" :columns="LXColumns">
            <template #tableHeader="scope">
              <template v-for="(item, index) in XMBtn" :key="index">
                <el-button v-permission="item.label" type="primary" size="mini" plain @click="handlerBtn(item.label, scope.selectedList)">
                  {{ item.value }}
                </el-button>
              </template>
            </template>
          </proTable>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <ImportExcel ref="importRef" />
</template>

<script lang="tsx">
export default {
  name: '/metrics/indicators'
}
</script>
<script setup lang="tsx">
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import ImportExcel from '@/components/ImportExcel/indexSy.vue' //导入组件
import { h } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { onMounted, ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox, ElInput } from 'element-plus'
import { useRouter } from 'vue-router'
import { getPublicData } from '@/api/common' //公共代码
import {
  getTempData,
  exportTempData,
  exportDetailData,
  statAndSaveDetailData,
  getDetailData,
  syncToTemp,
  saveTempData,
  syncToOfficial,
  getImportTemplate,
  importTempData
} from '@/api/metrics/index'

var numberRegex = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/

const userDialogRef = ref() // 用户角色
const loading = ref(false)
const isShowPage = ref(false) //未选择角色前不展示页面
const router = useRouter()

const fromParms = reactive<any>({ nd: '', yd: '' }) //接口入参
const currentYearMonth = ref<any>('') //当前年月
const tabMsg = ref('1') //当前页签位置
const statType = ref<any>('')
const tableMXRef = ref() //明细ref
const tableDWRef = ref() //按单位ref
const tableLXRef = ref() //按项目类型ref
const tableDataDW = ref<any[]>([]) //按单位数据
const tableDataLX = ref<any[]>([]) //按项目类型数据
const importRef = ref<any>() //导入ref
const tabList = ref<any>([])
const options = ref<any[]>([])
const MXBtn = ref<any[]>([
  { label: 'UPDATE', value: '更新明细数据', isSelected: false },
  { label: 'PUSH', value: '生成预览数据', isSelected: false },
  { label: 'EXPORT', value: '导 出', isSelected: false },
  { label: 'DWALLOCATE', value: '单位配置', isSelected: false },
  { label: 'LXALLOCATE', value: '类型配置', isSelected: false }
  // { label: "CONFIRM", value: "数据确认", isSelected: false }
])
const DWBtn = ref<any[]>([
  { label: 'SAVE', value: '保 存', isSelected: false },
  { label: 'IMPORT', value: '导 入', isSelected: false },
  { label: 'EXPORT', value: '导 出', isSelected: false },
  // { label: "DWALLOCATE", value: "单位配置", isSelected: false },
  // { label: "LXALLOCATE", value: "类型配置", isSelected: false },
  { label: 'CONFIRM', value: '数据确认', isSelected: false }
])
const XMBtn = ref<any[]>([
  { label: 'SAVE', value: '保 存', isSelected: false },
  { label: 'IMPORT', value: '导 入', isSelected: false },
  { label: 'EXPORT', value: '导 出', isSelected: false },
  // { label: "DWALLOCATE", value: "单位配置", isSelected: false },
  // { label: "LXALLOCATE", value: "类型配置", isSelected: false },
  { label: 'CONFIRM', value: '数据确认', isSelected: false }
])
// 方法
onMounted(async () => {
  await initParamLists()
  currentYearMonth.value = getCurrentMonth()
  await userDialogRef.value.getUser()
})
const getCurrentMonth = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  return `${year}-${month.toString().padStart(2, '0')}`
}
// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  if (['结算率(%)', '单位', '项目类型'].includes(column.label)) {
    return 'background-color:#F5F7FA;cursor: pointer'
  }
}
// 行样式
const rowStyle = ({ row }: any) => {
  if (row.isBold && row.isBold == '1') {
    return {
      fontWeight: 'bold'
    }
  }
}

// 按钮点击事件
const handlerBtn = async (val: any, selectedList: any) => {
  if (['DWALLOCATE', 'LXALLOCATE'].includes(val)) {
    let params = { busiType: 'YSJSLTJ' }
    router.push({
      path: val == 'DWALLOCATE' ? '/metrics/Configuration' : '/metrics/configData/budgetStatisticsConfig',
      query: params
    })
  } else if (val == 'PUSH') {
    ElMessageBox.confirm('生成预览数据会重新生成并覆盖当前按单位及按类型统计预览数据，是否确认当前操作？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        loading.value = true
        let res: any = await syncToTemp(fromParms)
        if (res.success) {
          ElMessage.success('数据同步成功！')
          getDataApi()
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  } else if (val == 'IMPORT') {
    let tempApi: any = getImportTemplate
    let importApi: any = importTempData
    if (!importApi) return
    const text: any = tabMsg.value == '2' ? '按单位' : tabMsg.value == '3' ? '按类型' : ''
    let params = {
      title: `${text}成本性项目预算结算率统计指标`,
      tempApi: (importParams: any) => {
        let newImportParams = {
          ...fromParms,
          statType: tabMsg.value == '2' ? '1' : '2',
          excelFormData: importParams.excelFormData
        }
        return tempApi(newImportParams)
      },
      importApi: (importParams: any) => {
        let newImportParams = {
          ...fromParms,
          statType: tabMsg.value == '2' ? '1' : '2',
          excelFormData: importParams.excelFormData
        }
        return importApi(newImportParams)
      },
      getTableList: getDataApi
    }
    importRef.value.acceptParams(params)
  } else if (val == 'SAVE') {
    const saveData: any = tabMsg.value == '2' ? tableDataDW.value : tableDataLX.value
    let res: any = await saveTempData(saveData)
    if (res.success) {
      ElMessage.success('保存成功')
      getDataApi()
    } else {
      ElMessage.error(res.msg)
    }
  } else if (val == 'UPDATE') {
    loading.value = true
    let res: any = await statAndSaveDetailData(fromParms)
    if (res.success) {
      ElMessage.success('更新成功')
      tableMXRef.value?.getTableList()
    } else {
      ElMessage.error(res.msg)
    }
  } else if (val == 'EXPORT') {
    const statType1 = tabMsg.value == '1' ? statType.value : tabMsg.value == '2' ? '1' : '2'
    const api = tabMsg.value == '1' ? exportDetailData : exportTempData
    const text =
      tabMsg.value == '1'
        ? '成本性项目预算结算率统计指标明细查询'
        : tabMsg.value == '2'
        ? '按单位成本性项目预算结算率统计指标'
        : '按类型成本性项目预算结算率统计指标'
    loading.value = true
    api({ ...fromParms, statType: statType1 }).then((res: any) => {
      const blob = res
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      // 获取文件名
      let filename = `${text}表.xlsx`
      if (res.headers && res.headers['content-disposition']) {
        filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
      }
      dom.download = `${decodeURI(decodeURI(filename))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
      loading.value = false
    })
  } else if (val == 'CONFIRM') {
    var typeName
    if (tabMsg.value == '2') {
      typeName = '单位'
    } else if (tabMsg.value == '3') {
      typeName = '类型'
    } else if (tabMsg.value == '1') {
      typeName = statType.value == '1' ? '单位' : '类型'
    }
    ElMessageBox.confirm(`此操作会将${typeName}统计数据同步到正式表中，是否确认当前操作？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        const statType1 = tabMsg.value == '1' ? statType.value : tabMsg.value == '2' ? '1' : '2'
        let res: any = await syncToOfficial({ ...fromParms, statType: statType1 })
        if (res.success) {
          ElMessage.success('数据同步成功！')
          getDataApi()
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  }
}
// 数据处理回调
const pageList = (val: any) => {
  loading.value = false
  if (val) {
    val.forEach((item: any) => {
      item.indicatorIndex = item.indicatorValue != null ? Number(item.indicatorValue).toFixed(4) : ''
    })
  } else {
    val = []
  }
  return val
}
// 列表查询回调
const searchDataHandle = async (params: any) => {
  statType.value = params.statType
  params.nd = fromParms.nd
  params.yd = fromParms.yd
  return getDetailData(params)
}

// 日期选择
const changeDateHandle = async (val: any) => {
  await getDataApi()
}

// 选择角色
const getRoleHandle = () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    if (isQuery) {
      isShowPage.value = true
      getDataApi()
    }
  } catch (e) {
    console.error(e)
  }
}
//保留四位小数
const handlerBlur = (row: any, key1: any) => {
  if (numberRegex.test(row[key1])) {
    row[key1] = Number(row[key1]).toFixed(4)
  } else {
    row[key1] = null
  }
}
// 计算结算率
const handlerCom = (row: any, key1: any, key2: any, key3: any) => {
  if (row[key1] != null && row[key2] != null) {
    row[key3] = (Number(row[key1]) == 0 ? 0 : (Number(row[key2]) / Number(row[key1])) * 100).toFixed(2)
  } else {
    row[key3] = null
  }
}

const initParamLists = async () => {
  const res = await getPublicData('JSL_YQ')
  if (res.success) {
    tabList.value = res.data
  }
  const root = await getPublicData('JSL_TXLX')
  options.value.length = 0
  if (root.success) {
    options.value.push(...root.data)
  }
}

// 明细查询列表项
const MXColumns = reactive<any>([
  { prop: 'nd', label: '年度', width: '80' },
  { prop: 'yd', label: '月度', width: '80' },
  {
    prop: 'statType',
    label: '展示维度',
    width: '150',
    search: { el: 'select', order: 1, defaultValue: '1' },
    enum: options.value,
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    isShow: false
  },
  { prop: 'statItem', label: '统计项', width: '280' },
  { prop: 'indicatorName', label: '指标项', width: '150' },
  { prop: 'indicatorIndex', label: '指标值(万元)', width: '150' },
  { prop: 'updateTime', label: '更新时间', width: '200' }
])
// 按单位列表项
const DWColumns = reactive<any>([
  { prop: 'statItem', label: '单位', width: '280' },
  {
    label: '当年结算率',
    prop: 'nd',
    _children: [
      {
        prop: 'currentMbz',
        label: '目标值(万元)',
        width: '150',
        headerRender: () => {
          return h('i', { class: 'el-icon-edit-outline' }, '目标值(万元)')
        },
        render: ({ row }: any) => {
          return h(ElInput, {
            modelValue: row.currentMbz,
            'onUpdate:modelValue': (value: any) => {
              row.currentMbz = value
            },
            onBlur: () => {
              handlerBlur(row, 'currentMbz')
              handlerCom(row, 'currentMbz', 'currentWcz', 'currentJsl')
            },
            inputType: 'number',
            inputStyle: {
              textAlign: 'right',
              border: '1px solid #fff',
              fontWeight: row.isBold ? 'bold' : ''
            }
          })
        }
      },
      {
        prop: 'currentWcz',
        label: '完成值(万元)',
        headerRender: () => {
          return h('i', { class: 'el-icon-edit-outline' }, '完成值(万元)')
        },
        width: '150',
        render: ({ row }: any) => {
          return h(ElInput, {
            modelValue: row.currentWcz,
            'onUpdate:modelValue': (value: any) => {
              row.currentWcz = value
            },
            onBlur: () => {
              handlerBlur(row, 'currentWcz')
              handlerCom(row, 'currentMbz', 'currentWcz', 'currentJsl')
            },
            inputStyle: {
              textAlign: 'right',
              border: '1px solid #fff',
              fontWeight: row.isBold ? 'bold' : ''
            }
          })
        }
      },
      {
        prop: 'currentJsl',
        label: '结算率(%)',
        width: '120'
      }
    ]
  },
  {
    label: '同期结算率',
    prop: 'nd',
    _children: [
      {
        prop: 'lastMbz',
        label: '目标值(万元)',
        width: '150',
        headerRender: () => {
          return h('i', { class: 'el-icon-edit-outline' }, '目标值(万元)')
        },
        render: ({ row }: any) => {
          return h(ElInput, {
            modelValue: row.lastMbz,
            'onUpdate:modelValue': (value: any) => {
              row.lastMbz = value
            },
            onBlur: () => {
              handlerBlur(row, 'lastMbz')
              handlerCom(row, 'lastMbz', 'lastWcz', 'lastJsl')
            },
            inputStyle: {
              textAlign: 'right',
              border: '1px solid #fff',
              fontWeight: row.isBold ? 'bold' : ''
            }
          })
        }
      },
      {
        prop: 'lastWcz',
        label: '完成值(万元)',
        width: '150',
        headerRender: () => {
          return h('i', { class: 'el-icon-edit-outline' }, '完成值(万元)')
        },
        render: ({ row }: any) => {
          return h(ElInput, {
            modelValue: row.lastWcz,
            'onUpdate:modelValue': (value: any) => {
              row.lastWcz = value
            },
            onBlur: () => {
              handlerBlur(row, 'lastWcz')
              handlerCom(row, 'lastMbz', 'lastWcz', 'lastJsl')
            },
            inputStyle: {
              textAlign: 'right',
              border: '1px solid #fff',
              fontWeight: row.isBold ? 'bold' : ''
            }
          })
        }
      },
      { prop: 'lastJsl', label: '结算率(%)', width: '120' }
    ]
  }
])

// 按项目类型列表项
const LXColumns = reactive<any>([
  { prop: 'statItem', label: '项目类型', width: '280' },
  {
    label: '当年结算率',
    prop: 'nd',
    _children: [
      {
        prop: 'currentMbz',
        label: '目标值(万元)',
        width: '150',
        headerRender: () => {
          return h('i', { class: 'el-icon-edit-outline' }, '目标值(万元)')
        },
        render: ({ row }: any) => {
          return h(ElInput, {
            modelValue: row.currentMbz,
            'onUpdate:modelValue': (value: any) => {
              row.currentMbz = value
            },
            onBlur: () => {
              handlerBlur(row, 'currentMbz')
              handlerCom(row, 'currentMbz', 'currentWcz', 'currentJsl')
            },
            inputStyle: { textAlign: 'right', border: '1px solid #fff' }
          })
        }
      },
      {
        prop: 'currentWcz',
        label: '完成值(万元)',
        width: '150',
        headerRender: () => {
          return h('i', { class: 'el-icon-edit-outline' }, '完成值(万元)')
        },
        render: ({ row }: any) => {
          return h(ElInput, {
            modelValue: row.currentWcz,
            'onUpdate:modelValue': (value: any) => {
              row.currentWcz = value
            },
            onBlur: () => {
              handlerBlur(row, 'currentWcz')
              handlerCom(row, 'currentMbz', 'currentWcz', 'currentJsl')
            },
            inputStyle: { textAlign: 'right', border: '1px solid #fff' }
          })
        }
      },
      { prop: 'currentJsl', label: '结算率(%)', width: '120' }
    ]
  },
  {
    label: '同期结算率',
    prop: 'nd',
    _children: [
      {
        prop: 'lastMbz',
        label: '目标值(万元)',
        width: '150',
        headerRender: () => {
          return h('i', { class: 'el-icon-edit-outline' }, '目标值(万元)')
        },
        render: ({ row }: any) => {
          return h(ElInput, {
            modelValue: row.lastMbz,
            'onUpdate:modelValue': (value: any) => {
              row.lastMbz = value
            },
            onBlur: () => {
              handlerBlur(row, 'lastMbz')
              handlerCom(row, 'lastMbz', 'lastWcz', 'lastJsl')
            },
            inputStyle: { textAlign: 'right', border: '1px solid #fff' }
          })
        }
      },
      {
        prop: 'lastWcz',
        label: '完成值(万元)',
        width: '150',
        headerRender: () => {
          return h('i', { class: 'el-icon-edit-outline' }, '完成值(万元)')
        },
        render: ({ row }: any) => {
          return h(ElInput, {
            modelValue: row.lastWcz,
            'onUpdate:modelValue': (value: any) => {
              row.lastWcz = value
            },
            onBlur: () => {
              handlerBlur(row, 'lastWcz')
              handlerCom(row, 'lastMbz', 'lastWcz', 'lastJsl')
            },
            inputStyle: { textAlign: 'right', border: '1px solid #fff' }
          })
        }
      },
      {
        prop: 'lastJsl',
        label: '结算率(%)',
        width: '120'
      }
    ]
  }
])

// 数据接口调用
const getDataApi = async () => {
  loading.value = true
  if (currentYearMonth.value != '') {
    const yearAndMonth: any = currentYearMonth.value.split('-')
    fromParms.nd = yearAndMonth[0]
    fromParms.yd = Number(yearAndMonth[1])
    let res: any = await getTempData({ ...fromParms, statType: '1' })
    let root: any = await getTempData({ ...fromParms, statType: '2' })
    if (res.success && root.success) {
      loading.value = false
      numReturn(res.data)
      numReturn(root.data)
      tableDataDW.value = res.data
      tableDataLX.value = root.data
      tableMXRef.value.getTableList()
    } else {
      loading.value = false
      ElMessage.error(res.msg)
      ElMessage.error(root.msg)
    }
  }
}

// 数值转换
const numReturn = (array: any[]) => {
  const tableData = array ? array : []
  tableData.forEach((item: any) => {
    item.currentMbz = item.currentMbz != null ? Number(item.currentMbz).toFixed(4) : ''
    item.currentWcz = item.currentWcz != null ? Number(item.currentWcz).toFixed(4) : ''
    item.lastMbz = item.lastMbz != null ? Number(item.lastMbz).toFixed(4) : ''
    item.lastWcz = item.lastWcz != null ? Number(item.lastWcz).toFixed(4) : ''
    item.currentJsl = item.currentJsl != null ? Number(item.currentJsl).toFixed(2) : ''
    item.lastJsl = item.lastJsl != null ? Number(item.lastJsl).toFixed(2) : ''
  })
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
