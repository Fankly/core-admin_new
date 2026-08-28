<template>
  <div class="container">
    <div class="operation">
      <div class="left">
        <el-button v-show="opType !== 'VIEW'" type="primary" size="mini" plain @click="handleAddData">新 增</el-button>
        <el-button v-show="opType !== 'VIEW'" type="primary" size="mini" plain @click="handleDeleteData">删 除</el-button>
        <el-button type="primary" size="mini" plain @click="handleSearchData">查 询</el-button>
      </div>
      <div class="right" v-if="opType !== 'ADD'">
        <span>总预算:{{ view.amount }}万元 当年预算:{{ view.dnys }}万元 占比(总预算/资产原值):{{ view.rate }}% </span>
      </div>
    </div>
    <div class="form">
      <el-form :disabled="true" :model="formData" ref="formRef" label-position="right" label-width="140px">
        <Grid ref="gridRef" :gap="[10, 0]" :cols="3">
          <GridItem>
            <el-form-item prop="pmsZyxlCode">
              <template #label>
                <el-space :size="4">
                  <span>{{ `中压线路编码` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsZyxlCode"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsDyxlCode">
              <template #label>
                <el-space :size="4">
                  <span>{{ `低压线路编码` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsDyxlCode"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsDytqCode">
              <template #label>
                <el-space :size="4">
                  <span>{{ `低压台区编码` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsDytqCode"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsZyxlName">
              <template #label>
                <el-space :size="4">
                  <span>{{ `中压线路名称` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsZyxlName"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsDyxlName">
              <template #label>
                <el-space :size="4">
                  <span>{{ `低压线路名称` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsDyxlName"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsDytqName">
              <template #label>
                <el-space :size="4">
                  <span>{{ `低压台区名称` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsDytqName"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsYjwl">
              <template #label>
                <el-space :size="4">
                  <span>{{ `运检网格` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsYjwl"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsBdzName">
              <template #label>
                <el-space :size="4">
                  <span>{{ `变电站名称` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsBdzName"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsPdbyqName">
              <template #label>
                <el-space :size="4">
                  <span>{{ `配电变压器名称` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsPdbyqName"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsYjfl">
              <template #label>
                <el-space :size="4">
                  <span>{{ `一级分类(问题)` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsYjfl"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsEjfl">
              <template #label>
                <el-space :size="4">
                  <span>{{ `二级分类(问题)` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsEjfl"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsXmlb">
              <template #label>
                <el-space :size="4">
                  <span>{{ `项目类别` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsXmlb"></el-input>
              </div>
            </el-form-item>
          </GridItem>
        </Grid>
        <Grid ref="gridRef" :gap="[10, 0]" :cols="1">
          <GridItem>
            <el-form-item prop="pmsGzdx">
              <template #label>
                <el-space :size="4">
                  <span>{{ `改造对象` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsGzdx" resize="none" :row="4" type="textarea"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsWtyp">
              <template #label>
                <el-space :size="4">
                  <span>{{ `问题研判` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsWtyp" resize="none" :row="4" type="textarea"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="pmsWtms">
              <template #label>
                <el-space :size="4">
                  <span>{{ `问题描述` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.pmsWtms" resize="none" :row="4" type="textarea"></el-input>
              </div>
            </el-form-item>
          </GridItem>
        </Grid>
      </el-form>
    </div>
    <div class="title">
      <span>设备资产信息</span>
    </div>
    <div class="table">
      <vxe-table
        :loading="loading"
        :checkbox-config="{
          highlight: true
        }"
        size="small"
        align="center"
        ref="vxeTableRef"
        :data="tableData"
        :column-config="{ resizable: true }"
        :edit-config="{ trigger: 'click', mode: 'cell' }"
        :show-header-overflow="true"
        :show-overflow="true"
        border
        stripe
        resizable
        header-align="center"
        height="100%"
      >
        <vxe-column type="checkbox" width="60"></vxe-column>
        <vxe-column width="160" field="equipcode" title="PMS设备编号" :edit-render="{}">
          <template #edit="{ row }">
            <vxe-input v-model="row.equipcode" type="text" placeholder="请输入PMS设备编号"></vxe-input>
          </template>
        </vxe-column>
        <vxe-column width="180" field="materialname" title="PMS设备名称" :edit-render="{}">
          <template #edit="{ row }">
            <vxe-input v-model="row.materialname" type="text" placeholder="请输入PMS设备名称"></vxe-input>
          </template>
        </vxe-column>
        <vxe-column width="160" field="erpequipcode" title="ERP设备编号"></vxe-column>
        <vxe-column width="180" field="erpequipname" title="ERP设备名称"></vxe-column>
        <vxe-column width="160" field="iszzsb" title="是否用户资产未移交" :edit-render="{}">
          <template #default="{ row }"> {{ formatUser(row.iszzsb) }} </template>
          <template #edit="{ row }">
            <vxe-select v-model="row.iszzsb" transfer>
              <vxe-option v-for="item in isList" :key="item.value" :value="item.value" :label="item.label"></vxe-option>
            </vxe-select>
          </template>
        </vxe-column>
        <vxe-column width="160" field="astnum" title="ERP资产编号" :edit-render="{}">
          <template #edit="{ row }">
            <vxe-input v-model="row.astnum" type="text" placeholder="请输入ERP资产编号"></vxe-input>
          </template>
        </vxe-column>
        <vxe-column width="180" field="astname" title="ERP资产名称"></vxe-column>
        <vxe-column width="160" field="erpzcmxl" title="ERP资产明细类编码"></vxe-column>
        <vxe-column width="180" field="erpzcmxlmc" title="ERP资产明细类名称"></vxe-column>
        <vxe-column width="160" field="asttime" title="资本化日期"></vxe-column>
        <vxe-column header-align="center" align="right" width="160" field="originalequipvalue" title="资产原值(万元)"></vxe-column>
        <vxe-column header-align="center" align="right" width="160" field="netastvalue" title="资产净值(万元)"></vxe-column>
        <vxe-column width="160" field="dydjName" title="电压等级"></vxe-column>
        <vxe-column width="160" field="mcppd" title="名称匹配度"></vxe-column>
        <vxe-column width="160" field="zcsx" title="资产属性"></vxe-column>
        <vxe-column header-align="center" width="160" field="yglxmje" align="right" title="已关联项目金额(万元)"></vxe-column>
      </vxe-table>
    </div>
  </div>
  <AddOrEditModal @sendData="insertTableData" ref="addOrEditModalRef"></AddOrEditModal>
</template>

<script lang="ts">
import { Result } from '@/api/mbz'
import { getSbzcInfoByXmId } from '@/api/service/requirement'
import GridItem from '@/components/Grid/components/GridItem.vue'
import Grid from '@/components/Grid/index.vue'
import AddOrEditModal from '@/views/service/xq/components/operation/AddOrEditModal.vue'
import { ElMessage } from 'element-plus'
import { defineComponent, onMounted, reactive, ref } from 'vue'
import VXETable from 'vxe-table'
import { RowVo } from './operation/interface'

export default defineComponent({
  props: {
    selectData: Object,
    globalParams: Object,
    opType: {
      type: String,
      default: 'VIEW'
    }
  },
  components: {
    Grid,
    GridItem,
    AddOrEditModal
  },
  emits: ['searched'],
  name: 'AssetDetails',
  setup(props, { expose, emit }) {
    const formData = ref<{
      pmsDytqCode: string
      pmsPdbyqName: string
      pmsDytqName: string
      pmsDyxlCode: string
      pmsDyxlName: string
      pmsGzdx: string
      pmsZyxlCode: string
      pmsYjwl: string
      pmsYjfl: string
      pmsEjfl: string
      pmsXmlb: string
      pmsWtyp: string
      pmsWtms: string
      pmsBdzName: string
      pmsZyxlName: string
    }>({
      pmsDytqCode: '',
      pmsPdbyqName: '',
      pmsDytqName: '',
      pmsDyxlCode: '',
      pmsDyxlName: '',
      pmsGzdx: '',
      pmsZyxlCode: '',
      pmsYjwl: '',
      pmsYjfl: '',
      pmsEjfl: '',
      pmsXmlb: '',
      pmsWtyp: '',
      pmsWtms: '',
      pmsBdzName: '',
      pmsZyxlName: ''
    })
    const addOrEditModalRef = ref<InstanceType<typeof AddOrEditModal>>()
    const isList = reactive([
      {
        value: '1',
        label: '是'
      },
      {
        value: '0',
        label: '否'
      }
    ])

    const xmId = ref('')
    const loading = ref(false)

    // 自定义组件标识
    const ISCUSTOMCOPONENT = true

    const tableData = ref<RowVo[]>([])
    const vxeTableRef = ref()
    const view = reactive({
      amount: 0,
      dnys: 0,
      rate: 0
    })

    const formatUser = (value: string) => {
      if (value === '1') {
        return '是'
      }
      if (value === '0') {
        return '否'
      }
      return ''
    }
    const handleAddData = () => {
      addOrEditModalRef.value?.acceptParams({
        title: '设备资产信息-新增',
        opType: 'ADD'
      })
    }
    const handleDeleteData = async () => {
      const $table = vxeTableRef.value
      if ($table) {
        const records = $table.getCheckboxRecords()
        if (records.length === 0) {
          ElMessage.warning('请选择一条或多条数据进行删除!')
          return
        }
        const type = await VXETable.modal.confirm('是否确认删除？', '温馨提示', {
          status: 'warning'
        })
        if (type === 'confirm') {
          $table.removeCheckboxRow()
        }
      }
    }
    const handleSearchData = async (initial = false) => {
      try {
        loading.value = true
        const res = await getSbzcInfoByXmId(xmId.value)
        if (res.success && res.data) {
          view.dnys = res.data.dnys
          view.amount = res.data.amount
          view.rate = res.data.rate
          if (res.data.sbzcs) {
            tableData.value = res.data.sbzcs
          } else {
            tableData.value = []
          }
          if (res.data.lineStation) {
            formData.value = res.data.lineStation
          }
        } else {
          throw new Error(res.msg)
        }
      } catch (error: any) {
        ElMessage.error(error.message)
      } finally {
        loading.value = false
        emit('searched', { initial })
      }
    }

    const insertTableData = async (res: Result) => {
      if (res.data) {
        // 获取表格中所有数据
        const $table = vxeTableRef.value
        if ($table) {
          const { tableData } = $table.getTableData()
          const isSome = tableData.some((item: RowVo) => item.equipcode === res.data.equipcode)
          if (isSome) {
            ElMessage.error('已存在相同设备资产数据，请勿重复添加！')
            return
          }
          ElMessage.success('确认成功')
          if (addOrEditModalRef.value) addOrEditModalRef.value.handleCloseModal()
          await $table.insertAt(res.data, -1)
        }
      } else {
        if (res.msg !== 'success') ElMessage.error(res.msg)
        else ElMessage.error('请重新再试!')
      }
    }

    onMounted(() => {
      if (props.globalParams) {
        xmId.value = props.globalParams.ID
        handleSearchData(true)
      }
    })

    // 获取表格中数据-自定义组件必须实现方法
    const getFormData = () => {
      const $table = vxeTableRef.value
      if ($table) {
        const { tableData } = $table.getTableData()
        return {
          sbInfos: tableData
        }
      }
      return {
        sbInfos: []
      }
    }

    expose({
      getFormData,
      ISCUSTOMCOPONENT
    })

    return {
      ISCUSTOMCOPONENT,
      view,
      loading,
      tableData,
      getFormData,
      insertTableData,
      isList,
      formatUser,
      formData,
      handleDeleteData,
      handleSearchData,
      handleAddData,
      addOrEditModalRef,
      vxeTableRef
    }
  }
})
</script>

<style scoped lang="less">
@primary-color: #00706b;
@primary-soft: #dff3f0;
@primary-border: #b8ddd9;

.container {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.title {
  height: 28px;
  line-height: 28px;
  text-align: right;
  font-size: 14px;
  padding-left: 10px;
  background-color: @primary-soft;
  color: @primary-color;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 0;
  min-width: 0;
}

.table {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.operation {
  display: flex;
  margin-bottom: 10px;
  min-width: 0;
  min-height: 0;
  .left {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .right {
    height: 28px;
    line-height: 28px;
    text-align: right;
    font-size: 14px;
    padding-left: 10px;
    background-color: @primary-soft;
    border-left: 1px solid @primary-border;
    border-radius: 6px;
    color: @primary-color;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 0;
    min-width: 0;
  }
}
</style>
