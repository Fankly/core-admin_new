<template>
  <el-dialog
    :close-on-click-modal="false"
    @open="openDialogHandle"
    :show-close="false"
    title="采购信息记录"
    :model-value="props.showDiaglog"
    @update:model-value="(val:boolean)=>emit('closeDialog',val)"
    width="70%"
    top="10px"
  >
    <el-tabs v-loading="dialogLoad" type="card" class="selectPanel" v-model="activeName" @tab-click="tabClickHandle">
      <el-tab-pane label="物资采购信息" name="first">
        <div class="one">
          <div class="form">
            <el-form :model="suppliesForm" :rules="formRules" ref="suppliesFormRef">
              <el-form-item prop="cglb" label="采购类别：">
                <el-radio-group v-model="suppliesForm.cglb" @change="getCglbDataHandle">
                  <el-radio :key="item.code" v-for="item in props.purchaseData.wzlb" :label="item.code">{{ item.name }} </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </div>
          <div class="title">
            <span>物资采购明细信息</span>
          </div>
          <div class="table-box">
            <proTable
              ref="oneSuppliesTableRef"
              :data="oneSuppliesData"
              height="100%"
              :pagination="false"
              :columns="suppliesColumns"
              :toolButton="['other']"
            >
              <template #tableHeader="scope">
                <el-button
                  size="mini"
                  :disabled="suppliesForm.cglb === 'W0' || suppliesForm.cglb === ''"
                  type="primary"
                  plain
                  @click="addSuppliesDataHandle('supplies')"
                  >新 增
                </el-button>
                <el-button
                  size="mini"
                  :disabled="suppliesForm.cglb === 'W0' || suppliesForm.cglb === '' || !scope.isSelected"
                  type="primary"
                  plain
                  @click="editSuppliesDataHandle(scope.selectedList)"
                  >修 改
                </el-button>
                <el-button
                  size="mini"
                  :disabled="suppliesForm.cglb === 'W0' || suppliesForm.cglb === '' || !scope.isSelected"
                  plain
                  @click="deleteSuppliesDataHandle(scope.selectedList)"
                >
                  删 除
                </el-button>
              </template>
            </proTable>
          </div>
        </div>
        <div class="two">
          <div class="title">
            <span>预算项目全过程取值</span>
          </div>
          <div class="table-box">
            <ProTable
              :columns="suppliesColumns"
              :data-callback="dataCallbackSupplies"
              :request-auto="false"
              ref="twoSuppliesTableRef"
              height="100%"
              :request-api="getSuppliesDataList"
              :pagination="false"
              :toolButton="['other']"
            >
              <template #tableHeader="scope">
                <el-button
                  size="mini"
                  :disabled="suppliesForm.cglb === 'W0' || suppliesForm.cglb === '' || !scope.isSelected"
                  type="primary"
                  plain
                  @click="useTableDataHandle(scope.selectedList)"
                  >采 用
                </el-button>
              </template>
            </ProTable>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane name="second" label="服务采购信息">
        <div class="one">
          <div class="form">
            <el-form :model="serviceForm" :rules="formRules" ref="serviceFormRef">
              <el-form-item prop="cglb" label="采购类别：">
                <el-radio-group v-model="serviceForm.cglb" @change="getCglbSerDataHandle">
                  <el-radio :key="item.code" v-for="item in props.purchaseData.fwlb" :label="item.code">{{ item.name }} </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </div>
          <div class="title">
            <span>服务采购明细信息</span>
          </div>
          <div class="table-box">
            <proTable
              ref="oneServiceTableRef"
              :data="oneServiceData"
              height="100%"
              :pagination="false"
              :columns="serviceColumns"
              :toolButton="['other']"
            >
              <template #tableHeader="scope">
                <el-button
                  size="mini"
                  :disabled="serviceForm.cglb === 'F0' || serviceForm.cglb === ''"
                  type="primary"
                  plain
                  @click="addSuppliesDataHandle('service')"
                  >新 增
                </el-button>
                <el-button
                  size="mini"
                  :disabled="serviceForm.cglb === 'F0' || serviceForm.cglb === '' || !scope.isSelected"
                  type="primary"
                  plain
                  @click="editSuppliesDataHandle(scope.selectedList)"
                  >修 改
                </el-button>
                <el-button
                  size="mini"
                  :disabled="serviceForm.cglb === 'F0' || serviceForm.cglb === '' || !scope.isSelected"
                  plain
                  @click="deleteSuppliesDataHandle(scope.selectedList)"
                >
                  删 除
                </el-button>
              </template>
            </proTable>
          </div>
        </div>
        <div class="two">
          <div class="title">
            <span>预算项目全过程取值</span>
          </div>
          <div class="table-box">
            <ProTable
              :columns="serviceColumns"
              :data-callback="dataCallbackService"
              ref="twoServiceTableRef"
              height="100%"
              :request-api="getServiceDataList"
              :pagination="false"
              :toolButton="['other']"
            >
              <template #tableHeader="scope">
                <el-button
                  size="mini"
                  :disabled="serviceForm.cglb === '' || serviceForm.cglb === 'F0' || !scope.isSelected"
                  type="primary"
                  plain
                  @click="useServiceTableDataHandle(scope.selectedList)"
                  >采 用
                </el-button>
              </template>
            </ProTable>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <div class="dialog-footer" style="text-align: center">
        <el-button type="primary" plain size="mini" @click="saveDialogHandle">保 存</el-button>
        <el-button plain size="mini" @click="closeDialogHandle">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog :show-close="false" :title="addDialogTitle" v-model="isShowAddDialog" width="20%" top="30vh">
    <el-form ref="addDialogDataRef" :model="addDialogData" :rules="addDialogDataRules" label-position="right" :label-width="120">
      <el-form-item prop="cglx" label="采购类型：">
        <el-select style="width: 100%" v-model="addDialogData.cglx" placeholder="请选择采购类型">
          <el-option :value="item.code" v-for="item in addDialogDataCglx" :key="item.code" :label="item.name"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="cgsqh" label="采购申请号：">
        <el-input v-model="addDialogData.cgsqh" placeholder="请输入采购申请号"></el-input>
      </el-form-item>
      <el-form-item prop="hxmh" label="行项目号：">
        <el-input-number
          class="leftInput"
          :min="0"
          :max="9999"
          style="width: 100%"
          :controls="false"
          v-model="addDialogData.hxmh"
          placeholder="请输入行项目号"
        ></el-input-number>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer" style="text-align: center">
        <el-button type="primary" plain size="mini" @click="addDialogDataDetermineHandle(addDialogDataRef, flag)">确 定 </el-button>
        <el-button plain size="mini" @click="addDialogDataCloseHandle">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="FormDialog">
import { getCgxxByXmid, getChildCglx, getDataByCgsq, save } from '@/api/purchase'
import ProTable from '@/components/ProTable/index.vue'
import { ColumnProps } from '@/components/ProTable/interface'
import { PurchaseData, PurchaseDatas, RulesForm, SuppliesForm } from '@/views/purchase/types'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { cloneDeep } from 'lodash'

interface Props {
  showDiaglog: boolean
  purchaseData: PurchaseDatas
  selectedTableData: object
}

const props = defineProps<Props>()

const dialogLoad = ref(false)

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam: any = reactive({})

const initServiceParam: any = reactive({})

const selectedTableData: any = computed(() => props.selectedTableData)

const emit = defineEmits<{
  (e: 'closeDialog', showDiaglog: boolean): void
}>()

const suppliesForm = ref<SuppliesForm>({
  cglb: ''
})
const serviceForm = ref<SuppliesForm>({
  cglb: ''
})

const getCglbDataHandle = (val: string) => {
  if (val === 'W0') {
    oneSuppliesData.value.length = 0
  }
  oneSuppliesTableRef.value?.clearSelection()
  twoSuppliesTableRef.value?.clearSelection()
  twoTableSearch()
}

const getCglbSerDataHandle = (val: string) => {
  if (val === 'F0') {
    oneServiceData.value.length = 0
  }
  oneServiceTableRef.value?.clearSelection()
  twoServiceTableRef.value?.clearSelection()
  twoTableServiceSearch()
}

const tabClickHandle = () => {
  if (activeName.value === 'first') {
    oneSuppliesTableRef.value?.clearSelection()
    twoSuppliesTableRef.value?.clearSelection()
    twoTableSearch()
  } else {
    oneServiceTableRef.value?.clearSelection()
    twoServiceTableRef.value?.clearSelection()
    twoTableServiceSearch()
  }
}

const flag = ref('')
const activeName = ref('first')

const formRules = reactive({
  cglb: [{ required: true, message: '请选择采购类别', trigger: 'change' }]
})

const addDialogDataRef = ref()
const oneSuppliesTableRef = ref()
const twoSuppliesTableRef = ref()
const oneServiceTableRef = ref()
const twoServiceTableRef = ref()
const suppliesFormRef: any = ref()
const serviceFormRef: any = ref()

const addSuppliesDataHandle = async (flagStr: string) => {
  let res: any = ''
  if (flagStr === 'supplies') {
    addDialogTitle.value = '物资采购信息录入'
    res = await getChildCglx(suppliesForm.value.cglb)
  } else {
    addDialogTitle.value = '服务采购信息录入'
    res = await getChildCglx(serviceForm.value.cglb)
  }
  flag.value = 'ADD'
  isShowAddDialog.value = true
  addDialogDataCglx.value = res.data
  addDialogData.value.cglx = res.data[0].code
}

const backAddDialogData = ref()

const editSuppliesDataHandle = async (selectedList: any[]) => {
  if (selectedList.length !== 1) {
    ElMessage.warning('只能选择一条数据进行编辑')
    return
  }
  let res: any = ''
  if (activeName.value === 'first') {
    addDialogTitle.value = '物资采购信息录入'
    res = await getChildCglx(suppliesForm.value.cglb)
  } else {
    addDialogTitle.value = '服务采购信息录入'
    res = await getChildCglx(serviceForm.value.cglb)
  }

  flag.value = 'EDIT'
  isShowAddDialog.value = true
  addDialogDataCglx.value = res.data
  addDialogData.value.cglx = res.data[0].code

  addDialogData.value.hxmh = Number(selectedList[0].hxmh)
  addDialogData.value.cgsqh = selectedList[0].cgsqh
  backAddDialogData.value = cloneDeep(addDialogData.value)
}

const deleteSuppliesDataHandle = (selectedList: any[]) => {
  if (activeName.value === 'first') {
    oneSuppliesData.value = oneSuppliesData.value.filter((item) => !selectedList.includes(item))
    oneSuppliesTableRef.value?.clearSelection()
  } else {
    oneServiceData.value = oneServiceData.value.filter((item) => !selectedList.includes(item))
    oneServiceTableRef.value?.clearSelection()
  }
}

const useTableDataHandle = (selectedList: any[]) => {
  filterData(oneSuppliesData.value, selectedList)
}

const useServiceTableDataHandle = (selectedList: any[]) => {
  filterData(oneServiceData.value, selectedList)
}

// 过滤重复
const filterData = (oneData: any[], selectedList: any[]) => {
  let flag = -1
  selectedList.forEach((item) => {
    let index = oneData.findIndex((i) => i.cgsqh === item.cgsqh && i.hxmh === item.hxmh)
    if (index === -1) {
      oneData.unshift(item)
    } else {
      flag = 1
    }
  })
  if (flag !== -1) {
    ElMessage({
      message: `存在重复数据！`,
      type: 'warning'
    })
  }
}

const addDialogDataCloseHandle = () => {
  isShowAddDialog.value = false
  addDialogData.value.cgsqh = ''
  addDialogData.value.hxmh = 0
}

const openDialogHandle = async () => {
  let cgxxData = await getCgxxByXmid({
    type: '1',
    xmid: selectedTableData.value.id
  })

  let serxxData = await getCgxxByXmid({
    type: '2',
    xmid: selectedTableData.value.id
  })
  suppliesForm.value.cglb = selectedTableData.value.wz || ''
  oneSuppliesData.value = cgxxData.data || []
  serviceForm.value.cglb = selectedTableData.value.fw || ''
  oneServiceData.value = serxxData.data || []

  twoTableSearch()
}

const addDialogDataDetermineHandle = (formEl: any, flag: string) => {
  if (activeName.value === 'first') {
    if (!formEl) return
    formEl.validate(async (valid: any, fields: any) => {
      if (valid) {
        initParam.type = '1'
        initParam.cgsqh = addDialogData.value.cgsqh
        initParam.hxmh = addDialogData.value.hxmh
        initParam.cglx = addDialogData.value.cglx
        // 权限设置
        let res = await getDataByCgsq({ ...initParam })
        if (res.data.length === 0) {
          const cglxData: any = addDialogDataCglx.value.filter((item) => item.code === initParam.cglx)
          let obj: any = {
            cglx: initParam.cglx,
            hxmh: initParam.hxmh,
            cgsqh: initParam.cgsqh
          }
          obj.cglxName = cglxData[0].name
          let data = oneSuppliesData.value.some((item) => {
            return item.hxmh === obj.hxmh && item.cgsqh === obj.cgsqh
          })
          if (data) {
            ElMessage({
              message: `数据重复,请重新进行操作！`,
              type: 'warning'
            })
          } else {
            if (flag === 'ADD') {
              oneSuppliesData.value.unshift(obj)
            } else {
              const cglxData: any = addDialogDataCglx.value.filter((item) => item.code === initParam.cglx)
              addDialogData.value.cglxName = cglxData[0].name
              let oneIndex = oneSuppliesData.value.findIndex(
                (item) => item.cgsqh === backAddDialogData.value.cgsqh || item.hxmh === backAddDialogData.value.hxmh
              )
              oneSuppliesData.value.splice(oneIndex, 1, { ...addDialogData.value })
            }
          }
        } else {
          if (flag === 'ADD') {
            filterData(oneSuppliesData.value, res.data)
          } else {
            const cglxData: any = addDialogDataCglx.value.filter((item) => item.code === initParam.cglx)
            addDialogData.value.cglxName = cglxData[0].name
            let oneIndex = oneSuppliesData.value.findIndex(
              (item) => item.cgsqh === backAddDialogData.value.cgsqh || item.hxmh === backAddDialogData.value.hxmh
            )
            oneSuppliesData.value.splice(oneIndex, 1, ...res.data)
          }
        }
        addDialogDataCloseHandle()
        oneSuppliesTableRef.value?.clearSelection()
      }
    })
  } else {
    if (!formEl) return
    formEl.validate(async (valid: any, fields: any) => {
      if (valid) {
        initServiceParam.type = '2'
        initServiceParam.cgsqh = addDialogData.value.cgsqh
        initServiceParam.hxmh = addDialogData.value.hxmh
        initServiceParam.cglx = addDialogData.value.cglx
        // 权限设置
        let res = await getDataByCgsq({ ...initServiceParam })
        if (res.data.length === 0) {
          const cglxData: any = addDialogDataCglx.value.filter((item) => item.code === initServiceParam.cglx)
          let obj: any = {
            cglx: initServiceParam.cglx,
            hxmh: initServiceParam.hxmh,
            cgsqh: initServiceParam.cgsqh
          }
          obj.cglxName = cglxData[0].name
          let data = oneServiceData.value.some((item) => {
            return item.hxmh === obj.hxmh && item.cgsqh === obj.cgsqh
          })
          if (data) {
            ElMessage({
              message: `数据重复,请重新进行操作！`,
              type: 'warning'
            })
          } else {
            if (flag === 'ADD') {
              oneServiceData.value.unshift(obj)
            } else {
              const cglxData: any = addDialogDataCglx.value.filter((item) => item.code === initServiceParam.cglx)
              addDialogData.value.cglxName = cglxData[0].name
              let oneIndex = oneServiceData.value.findIndex(
                (item) => item.cgsqh === backAddDialogData.value.cgsqh || item.hxmh === backAddDialogData.value.hxmh
              )
              oneServiceData.value.splice(oneIndex, 1, { ...addDialogData.value })
            }
          }
        } else {
          if (flag === 'ADD') {
            filterData(oneServiceData.value, res.data)
          } else {
            const cglxData: any = addDialogDataCglx.value.filter((item) => item.code === initServiceParam.cglx)
            addDialogData.value.cglxName = cglxData[0].name
            let oneIndex = oneServiceData.value.findIndex(
              (item) => item.cgsqh === backAddDialogData.value.cgsqh || item.hxmh === backAddDialogData.value.hxmh
            )
            oneServiceData.value.splice(oneIndex, 1, ...res.data)
          }
        }
        addDialogDataCloseHandle()
        oneServiceTableRef.value?.clearSelection()
      }
    })
  }
}

const oneSuppliesData = ref<any[]>([])
const oneServiceData = ref<any[]>([])

const getSuppliesDataList = (params: any) => {
  dialogLoad.value = true
  let newParams = JSON.parse(JSON.stringify(params))
  newParams.gwxmbm = selectedTableData.value.gwxmbm
  newParams.specialorgid = selectedTableData.value.specialorgid
  newParams.type = '1'
  if (suppliesForm.value.cglb !== 'W0') {
    newParams.cglb = suppliesForm.value.cglb
  }
  newParams.cglb = suppliesForm.value.cglb
  return getDataByCgsq(newParams)
}

const dataCallbackSupplies = (data: any) => {
  dialogLoad.value = false
  return data
}

const getServiceDataList = (params: any) => {
  dialogLoad.value = true
  let newParams = JSON.parse(JSON.stringify(params))
  newParams.gwxmbm = selectedTableData.value.gwxmbm
  newParams.specialorgid = selectedTableData.value.specialorgid
  newParams.type = '2'
  newParams.cglb = serviceForm.value.cglb
  return getDataByCgsq(newParams)
}

const dataCallbackService = (data: any) => {
  dialogLoad.value = false
  return data
}

const addDialogTitle = ref<string>('')
const isShowAddDialog = ref<boolean>(false)
const addDialogData = ref<RulesForm>({
  cglx: '',
  cgsqh: '',
  hxmh: 0
})
const addDialogDataRules = reactive({
  cglx: [{ required: true, message: '请选择采购类别', trigger: 'change' }],
  cgsqh: [{ required: true, message: '请输入采购申请号', trigger: 'blur' }],
  hxmh: [{ required: true, message: '请输入行项目号', trigger: 'blur' }]
})

const addDialogDataCglx = ref<PurchaseData[]>([])

// 表格配置项
const suppliesColumns = reactive<ColumnProps<any>[]>([
  { type: 'selection', width: 80 },
  { prop: 'cglx', label: '采购类型ID', isShow: false },
  { prop: 'cglxName', label: '采购类型' },
  { prop: 'cgsqh', label: '采购申请' },
  { prop: 'hxmh', label: '行项目号' },
  { prop: 'zbsj', label: '中标时间' },
  { prop: 'zbje', label: '中标金额', align: 'right', headerAlign: 'center' },
  { prop: 'gysName', label: '供应商名称' },
  { prop: 'htqdrq', label: '合同签订日期' },
  { prop: 'htbh', label: '合同编号' },
  { prop: 'htje', label: '合同金额', align: 'right', headerAlign: 'center' }
])

// 表格配置项
const serviceColumns = reactive<ColumnProps<any>[]>([
  { type: 'selection', width: 80 },
  { prop: 'cglx', label: '采购类型ID', isShow: false },
  { prop: 'cglxName', label: '采购类型' },
  { prop: 'cgsqh', label: '采购申请' },
  { prop: 'hxmh', label: '行项目号' },
  { prop: 'zbsj', label: '中标时间' },
  { prop: 'zbje', label: '中标金额', align: 'right', headerAlign: 'center' },
  { prop: 'gysName', label: '供应商名称' },
  { prop: 'htqdrq', label: '合同签订日期' },
  { prop: 'htbh', label: '合同编号' },
  { prop: 'htje', label: '合同金额', align: 'right', headerAlign: 'center' }
])

const closeDialogHandle = () => {
  // 重置所有数据
  suppliesForm.value.cglb = ''
  serviceForm.value.cglb = ''
  oneSuppliesData.value = []
  oneServiceData.value = []
  backAddDialogData.value = ''
  oneSuppliesTableRef.value?.clearSelection()
  twoSuppliesTableRef.value?.clearSelection()
  oneServiceTableRef.value?.clearSelection()
  twoServiceTableRef.value?.clearSelection()
  activeName.value = 'first'
  emit('closeDialog', false)
}

const saveDialogHandle = async () => {
  if (activeName.value === 'first') {
    if (!suppliesFormRef.value) return
    suppliesFormRef.value.validate(async (valid: any, fields: any) => {
      if (valid) {
        const paramsFri = {
          xmid: selectedTableData.value.id,
          cglb: suppliesForm.value.cglb,
          ddxxLists: oneSuppliesData.value,
          type: '1'
        }
        let resFri = await save(paramsFri)
        if (resFri.success) {
          ElMessage.success('保存成功')
        } else {
          ElMessage.error(resFri.msg)
        }
      } else {
        ElMessage({
          message: `请选择采购类别！`,
          type: 'warning'
        })
      }
    })
  } else {
    if (!serviceFormRef.value) return
    serviceFormRef.value.validate(async (valid: any, fields: any) => {
      if (valid) {
        const paramsSec = {
          xmid: selectedTableData.value.id,
          cglb: serviceForm.value.cglb,
          ddxxLists: oneServiceData.value,
          type: '2'
        }

        let resSec = await save(paramsSec)
        if (resSec.success) {
          ElMessage.success('保存成功')
        } else {
          ElMessage.error(resSec.msg)
        }
      } else {
        ElMessage({
          message: `请选择采购类别！`,
          type: 'warning'
        })
      }
    })
  }
}

const twoTableSearch = () => {
  twoSuppliesTableRef.value?.getTableList()
}

const twoTableServiceSearch = () => {
  twoServiceTableRef.value?.getTableList()
}

defineExpose({ twoTableSearch })
</script>

<style scoped lang="less">
:deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.selectPanel {
  :deep(.is-active) {
    background-color: rgba(0, 0, 0, 0.1);
  }
}

:deep(.table-box) {
  height: 300px !important;
}

.one {
  .form {
    height: 42px;

    .el-form {
      .el-form-item {
        margin-bottom: 0;
      }
    }
  }
}

.title {
  margin-bottom: 10px;
  font-size: 16px;
}

.two {
  .title {
    margin-top: 20px;
  }
}

.leftInput {
  :deep(.el-input__inner) {
    text-align: left;
  }
}
</style>
