<template>
  <div class="accounts29CT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="title">
      <h2>项目决算与增资信息</h2>
    </div>

    <el-table row-key="row_id" id="crTable" :key="tableKey" border :data="example" v-if="tableHeight" :height="tableHeight" style="width: 100%; margin-top: 20px" :header-cell-style="{ 'text-align': 'center' }" :cell-style="{ 'text-align': 'center' }">
      <el-table-column show-overflow-tooltip :width="setWidth(item.prop)" v-for="(item, index) in dropCol" :key="item.prop" class-name="dropTableColumn" :prop="item.prop" :label="item.label" header-align="center" align="center"></el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { reactive, toRef, nextTick, toRefs, onMounted } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import Sortable from 'sortablejs'
import { useRoute } from 'vue-router'
defineOptions({
  name: '/budget-process/process-29-1'
})
const route = useRoute()
const setupState = reactive({
  example: [],
  loading: false,
  tableHeight: '',
  tableKey: 0,
  heightNum: '',
  dropCol: [
    {
      label: '项目编号',
      prop: 'pspid'
    },
    {
      label: '项目名称',
      prop: 'post1'
    },
    {
      label: '项目类型',
      prop: 'qkjxmlxmc'
    },
    {
      label: '项目包名称',
      prop: 'qkjxmb_mc'
    },
    {
      label: '一级单位',
      prop: 'qkjyjdw_name'
    },
    {
      label: '二级单位',
      prop: 'qkjejdw_name'
    },
    {
      label: '归口部门',
      prop: 'qkjgkbm_name'
    },
    {
      label: '项目总预算',
      prop: 'erpztys'
    },
    {
      label: '当年预算',
      prop: 'erpjdys'
    },
    {
      label: '当年财务支出（不含税）',
      prop: 'ndzcb_hs'
    },
    {
      label: '当年财务支出（含税）',
      prop: 'ndzc_hs'
    },
    {
      label: '送审单ID',
      prop: 'send_id'
    },
    {
      label: '送审日期',
      prop: 'send_date'
    },
    {
      label: '实际竣工日期',
      prop: 'zsjjg'
    },
    {
      label: '送审及时性（天）',
      prop: 'jh_jsssjsxz'
    },
    {
      label: '审定日期',
      prop: 'audit_date'
    },
    {
      label: '收审日期',
      prop: 'settle_date'
    },
    {
      label: '审计及时性（天）',
      prop: 'jh_jssjjsxz'
    },
    {
      label: '送审金额',
      prop: 'send_amt'
    },
    {
      label: '审定金额',
      prop: 'settle_amt'
    },
    {
      label: '审计核减率（%）',
      prop: 'jh_sjhjlz'
    }
  ]
})
const example = toRef(setupState, 'example')
const loading = toRef(setupState, 'loading')
const tableHeight = toRef(setupState, 'tableHeight')
const tableKey = toRef(setupState, 'tableKey')
const heightNum = toRef(setupState, 'heightNum')
const dropCol = toRef(setupState, 'dropCol')
const componentData = reactive({})
componentData.topHeight = undefined
const topHeight = toRef(componentData, 'topHeight')
componentData.sortable = undefined
const sortable = toRef(componentData, 'sortable')
function setWidth(prop) {
  if (prop === 'post1') {
    return 340
  }
  return 180
}
function columnDrop() {
  const wrapperTr = document.getElementById('crTable')?.querySelector('.el-table__header-wrapper tr')
  if (!wrapperTr) return
  componentData.sortable = Sortable.create(wrapperTr, {
    animation: 180,
    delay: 0,
    draggable: '.dropTableColumn',
    onEnd: (evt) => {
      const oldItem = setupState.dropCol[evt.oldIndex]
      setupState.dropCol.splice(evt.oldIndex, 1)
      setupState.dropCol.splice(evt.newIndex, 0, oldItem)
      setupState.tableKey += 1
      nextTick(() => {
        columnDrop()
      })
    }
  })
}
function setTableHeight() {
  setupState.tableHeight = setupState.heightNum - componentData.topHeight - 90 + 'px'
}
function loadData() {
  setupState.loading = true
  const params = {
    pspid: route.query.pspid,
    zyear: route.query.zyear,
    zmonth: route.query.zmonth
  }
  baseService.post('/process/process29/ct/', params).then((res) => {
    if (res.success == true) {
      setupState.loading = false
      setupState.example = res.data
      columnDrop()
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
onMounted(() => {
  setupState.tableKey = 0
  setupState.heightNum = (document.querySelector('.ds-workspace__viewport')?.clientHeight ?? window.innerHeight)
  componentData.topHeight = (document.querySelector('.title')?.clientHeight ?? 0)
  setTableHeight()
})
;(() => {
  loadData()
})()
defineExpose({
  example,
  loading,
  tableHeight,
  tableKey,
  heightNum,
  dropCol,
  setWidth,
  columnDrop,
  setTableHeight,
  loadData,
  ...toRefs(componentData)
})
</script>

<style lang="less" scoped>
.accounts29CT {
  padding: 10px;
  margin-bottom: 20px;

  .title {
    width: 100%;
    text-align: center;
    color: #00706b;

    h2 {
      font-size: 16px;
      margin: 0;
      margin-bottom: 20px;
    }
  }

  .el-switch__core {
    background-color: #ccc !important;
  }
}
</style>
