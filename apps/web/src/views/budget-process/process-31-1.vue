<template>
  <div class="accounts31CT1" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="title">
      <h2>决算及时性</h2>
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
  name: '/budget-process/process-31-1'
})
const route = useRoute()
const setupState = reactive({
  example: [],
  tableKey: 0,
  loading: false,
  tableHeight: '',
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
      label: '送审',
      prop: 'send_id'
    },
    {
      label: '最后一次结算审定日期',
      prop: 'audit_date'
    },
    {
      label: '决算报告日期',
      prop: 'jus_bgrq'
    },
    {
      label: '决算及时性(天)',
      prop: 'jh_jusssjsxz'
    }
  ]
})
const example = toRef(setupState, 'example')
const tableKey = toRef(setupState, 'tableKey')
const loading = toRef(setupState, 'loading')
const tableHeight = toRef(setupState, 'tableHeight')
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
  const wrapperTr = document.getElementById('crTable').querySelector('.el-table__header-wrapper tr')
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
  let pspid = route.query.pspid
  const params = {
    pspid: pspid,
    zyear: route.query.zyear,
    zmonth: route.query.zmonth
  }
  baseService.post('/process/process31/ct1', params).then((res) => {
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
  setupState.heightNum = document.querySelector('.el-card').clientHeight
  componentData.topHeight = document.querySelector('.title').clientHeight
  setTableHeight()
})
;(() => {
  loadData()
})()
defineExpose({
  example,
  tableKey,
  loading,
  tableHeight,
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
.accounts31CT1 {
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
