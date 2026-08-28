<template>
  <div class="table-body">
    <el-tabs type="border-card" v-model="tabName" @tab-click="handleChangeTab">
      <el-tab-pane name="projectDevices" :label="tabLabel.projectDevices">
        <vxe-table
          :loading="loading"
          :data="gjsbLists"
          stripe
          :column-config="{
            resizable: true
          }"
          :row-config="{ height: 32 }"
          show-header-overflow
          show-overflow
          border
          align="center"
          header-align="center"
          height="100%"
        >
          <vxe-column type="seq" width="60" title="序号"></vxe-column>
          <vxe-column width="200" field="stationlinename" title="站线名称"></vxe-column>
          <vxe-column width="200" field="equipcode" title="设备编码"></vxe-column>
          <vxe-column width="200" field="equipname" title="设备名称"></vxe-column>
          <vxe-column width="200" field="astid" title="资产ID"></vxe-column>
          <vxe-column width="200" field="originalequipvalue" title="设备原值"></vxe-column>
          <vxe-column width="200" field="netastvalue" title="资产净值"></vxe-column>
          <vxe-column width="200" field="astnature" title="资产性质">
            <template #default="{ row }">
              {{ getFormattedValue(row['astnature'], 'ASTNATURE_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="astnum" title="资产编号"></vxe-column>
          <vxe-column width="200" field="asttime" title="资本化时间"></vxe-column>
          <vxe-column width="200" field="bayname" title="间隔单元名称"></vxe-column>
          <vxe-column width="200" field="defectquantity" title="缺陷数量"></vxe-column>
          <vxe-column width="200" field="defectquantity" title="江苏个性化-资产级设备资产ID"></vxe-column>
          <vxe-column width="200" field="equipdepreciationyears" title="设备折旧年限"></vxe-column>
          <vxe-column width="200" field="equipfactory" title="设备厂家"></vxe-column>
          <vxe-column width="200" field="equipmodel" title="设备型号"></vxe-column>
          <vxe-column width="200" field="equipstatus" title="设备状态">
            <template #default="{ row }">
              {{ getFormattedValue(row['equipstatus'], 'EQUIPSTATUS_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="equiptype" title="设备类型">
            <template #default="{ row }">
              {{ getFormattedValue(row['equiptype'], 'EQUIPTYPE_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="equipvolume" title="设备容量"></vxe-column>
          <vxe-column width="200" field="factorycode" title="出厂编号"></vxe-column>
          <vxe-column width="200" field="factorydate" title="出厂日期"></vxe-column>
          <vxe-column width="200" field="ifmatch" title="账卡物是否一致">
            <template #default="{ row }">
              {{ getFormattedValue(row['ifmatch'], 'PMS_SF_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="isoutage" title="是否停电">
            <template #default="{ row }">
              {{ getFormattedValue(row['isoutage'], 'PMS_SF_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="isrural" title="是否农网">
            <template #default="{ row }">
              {{ getFormattedValue(row['isrural'], 'PMS_SF_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="oamorgname" title="运维单位名称"></vxe-column>
          <vxe-column width="200" field="operatedate" title="投运日期"></vxe-column>
          <vxe-column width="200" field="proclassification" title="专业分类">
            <template #default="{ row }">
              {{ getFormattedValue(row['proclassification'], 'PROCLASSIFICATION_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="repairmaterials" title="检修材料"></vxe-column>
          <vxe-column width="200" field="stateevaluation" title="状态评价"></vxe-column>
          <vxe-column width="200" field="stationlinetype" title="站线类型">
            <template #default="{ row }">
              {{ getFormattedValue(row['stationlinetype'], 'EQUIPTYPE_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="stationlinevoltlevel" title="站线电压等级">
            <template #default="{ row }">
              {{ getFormattedValue(row['stationlinevoltlevel'], 'VOLTAGELEVEL_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="voltagelevel" title="电压等级">
            <template #default="{ row }">
              {{ getFormattedValue(row['voltagelevel'], 'VOLTAGELEVEL_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="astcreatetime" title="资产创建日期"></vxe-column>
        </vxe-table>
      </el-tab-pane>
      <el-tab-pane name="quotaInfo" :label="tabLabel.quotaInfo">
        <vxe-table
          :loading="loading"
          :data="dexxLists"
          stripe
          :column-config="{
            resizable: true
          }"
          :row-config="{ height: 32 }"
          show-header-overflow
          show-overflow
          border
          align="center"
          header-align="center"
          height="100%"
        >
          <vxe-column type="seq" width="60" title="序号"></vxe-column>
          <vxe-column width="200" field="stationlinename" title="站线名称"></vxe-column>
          <vxe-column width="200" field="measurementunit" title="测算单位"></vxe-column>
          <vxe-column width="200" field="workloaddescription" title="工作量说明"></vxe-column>
          <vxe-column width="200" field="estimatetotalprice" title="预估总价"></vxe-column>
          <vxe-column width="200" field="estimateunitprice" title="预估单价"></vxe-column>
          <vxe-column width="200" field="periodicfrequency" title="周期性工作频次"></vxe-column>
          <vxe-column width="200" field="quotatotalprice" title="定额总价"></vxe-column>
          <vxe-column width="200" field="parameter" title="参数"></vxe-column>
          <vxe-column width="200" field="relateequipnum" title="定额关联设备数量"></vxe-column>
          <vxe-column width="200" field="unitprice" title="单价"></vxe-column>
          <vxe-column width="200" field="groupname" title="班组名称"></vxe-column>
          <vxe-column width="200" field="ifoutlimit" title="是否超标">
            <template #default="{ row }">
              {{ getFormattedValue(row['ifoutlimit'], 'PMS_SF_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="ifperiodicopen" title="是否周期性开展">
            <template #default="{ row }">
              {{ getFormattedValue(row['ifperiodicopen'], 'PMS_SF_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="ifrelateequip" title="是否关联设备">
            <template #default="{ row }">
              {{ getFormattedValue(row['ifrelateequip'], 'PMS_SF_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="professionalkind" title="专业类别">
            <template #default="{ row }">
              {{ getFormattedValue(row['professionalkind'], 'PROFESSIONALKIND_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="quantity" title="数量"></vxe-column>
          <vxe-column width="200" field="quotaequiptype" title="定额设备类型">
            <template #default="{ row }">
              {{ getFormattedValue(row['quotaequiptype'], 'QUOTAEQUIPTYPE_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="quotaequiptypename" title="定额设备类型名称"></vxe-column>
          <vxe-column width="200" field="quotafillmethod" title="定额填写方式">
            <template #default="{ row }">
              {{ getFormattedValue(row['quotafillmethod'], 'QUOTAFILLMETHOD_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="quotaname" title="定额名称"></vxe-column>
          <vxe-column width="200" field="quotavoltagelevel" title="定额电压等级">
            <template #default="{ row }">
              {{ getFormattedValue(row['quotavoltagelevel'], 'VOLTAGELEVEL_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="quotavoltagelevelname" title="定额电压等级名称"></vxe-column>
          <vxe-column width="200" field="standardprojectname" title="标准项目名称"></vxe-column>
          <vxe-column width="200" field="voltagelevel" title="电压等级">
            <template #default="{ row }">
              {{ getFormattedValue(row['voltagelevel'], 'VOLTAGELEVEL_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="workcontent" title="工作内容"></vxe-column>
        </vxe-table>
      </el-tab-pane>
      <el-tab-pane name="quotaTeams" :label="tabLabel.quotaTeams">
        <vxe-table
          :loading="loading"
          :data="gjbzLists"
          stripe
          :column-config="{
            resizable: true
          }"
          :row-config="{ height: 32 }"
          show-header-overflow
          show-overflow
          border
          align="center"
          header-align="center"
          height="100%"
        >
          <vxe-column type="seq" width="60" title="序号"></vxe-column>
          <vxe-column width="200" field="cityname" title="所属地市名称"></vxe-column>
          <vxe-column width="200" field="companyname" title="所属供电公司(县局)名称"></vxe-column>
          <vxe-column width="200" field="groupname" title="班组名称"></vxe-column>
          <vxe-column width="200" field="parentname" title="上级部门名称"></vxe-column>
          <vxe-column width="200" field="effecttime" title="生效时间"></vxe-column>
        </vxe-table>
      </el-tab-pane>
      <el-tab-pane name="quotaStationLines" :label="tabLabel.quotaStationLines">
        <vxe-table
          :loading="loading"
          :data="gjzxLists"
          show-header-overflow
          :row-config="{ height: 32 }"
          show-overflow
          border
          stripe
          :column-config="{
            resizable: true
          }"
          align="center"
          header-align="center"
          height="100%"
        >
          <vxe-column type="seq" width="60" title="序号"></vxe-column>
          <vxe-column width="200" field="stationlinename" title="站线名称"></vxe-column>
          <vxe-column width="200" field="oamorgname" title="运维单位名称"></vxe-column>
          <vxe-column width="200" field="oamgroupname" title="运维班组名称"></vxe-column>

          <vxe-column width="200" field="stationlinetype" title="站线类型">
            <template #default="{ row }">
              {{ getFormattedValue(row['stationlinetype'], 'EQUIPTYPE_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="stationlinevoltlevel" title="站线电压等级">
            <template #default="{ row }">
              {{ getFormattedValue(row['stationlinevoltlevel'], 'STATIONLINEVOLTLEVEL_COM') }}
            </template>
          </vxe-column>
          <vxe-column width="200" field="equipstatus" title="设备状态">
            <template #default="{ row }">
              {{ getFormattedValue(row['equipstatus'], 'EQUIPSTATUS_COM') }}
            </template>
          </vxe-column>
        </vxe-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts" name="AssetZwyfDetails">
import { useMainnetOps } from './hoooks/useMainnetOps'

interface Props {
  selectData: any
  globalParams: any
  opType: string
}

// 默认值
const props = withDefaults(defineProps<Props>(), {
  selectData: () => null,
  globalParams: () => null,
  opType: 'EDIT'
})

const { tabLabel, gjsbLists, dexxLists, gjbzLists, gjzxLists, loading, tabName, getFormattedValue, handleChangeTab } = useMainnetOps(props)
</script>

<style lang="less" scoped>
.table-body {
  height: 100%;
  width: 100%;
}

:deep(.el-tabs) {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
