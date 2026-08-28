<template>
  <div class="requirement-cart-workbench" v-loading="loading">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="需求明细" name="first"></el-tab-pane>
      <el-tab-pane label="待确认需求明细" name="second"></el-tab-pane>
    </el-tabs>
    <div class="opeartion">
      <div class="left" v-if="activeName === 'first'">
        <el-button v-permission="'EDIT'" plain type="primary" size="mini" v-debounce="[editHandle, `click`, 300]">修 改</el-button>
        <el-button v-permission="'DELETE'" plain type="primary" size="mini" v-debounce="[deleteHandle, `click`, 300]">删 除</el-button>
        <el-button v-permission="'GLSX'" plain type="primary" size="mini" v-debounce="[matterHandle, `click`, 300]">关联事项</el-button>
        <el-button v-permission="'CJBMXG'" plain type="primary" size="mini" v-debounce="[createDeptHandle, `click`, 300]">创建部门修改</el-button>
        <el-button v-permission="'YKXMTH'" plain type="primary" size="mini" v-debounce="[backHandle, `click`, 300]">业扩项目退回</el-button>
        <el-button v-permission="'SUBMIT'" type="primary" size="mini" v-debounce="[submitsWorkflowHandle, `click`, 300]">提 交</el-button>
        <el-button v-permission="'EXPORT'" plain type="primary" size="mini" v-debounce="[exportHandle, `click`, 300]">导 出</el-button>
        <el-button v-permission="'PROCESS'" plain type="primary" size="mini" v-debounce="[processHandle, `click`, 300]">流程履历</el-button>
      </div>
      <div class="left" v-else>
        <el-button v-permission="'TYPEQUERY'" plain type="primary" size="mini" v-debounce="[openModal, `click`, 300]">类型确认</el-button>
      </div>
      <div class="right" v-if="showHelp">
        <ToolbarButtons :tool-button="['help']" @help-click="emit('help')" />
      </div>
    </div>
    <div class="search">
      <el-form v-if="activeName === 'first'" ref="formRef" :model="searchDatas" label-position="right" label-width="120px">
        <el-row :gutter="24">
          <template v-for="column in dynamciSearch" :key="column.code">
            <el-col :span="6" v-if="column.link">
              <el-form-item :label="column.name">
                <el-select
                  collapse-tags
                  style="width: 100%"
                  v-if="column.type === 'select'"
                  v-model="searchDatas[column.code]"
                  :placeholder="column.placeholder"
                  :disabled="column.disabled"
                  :clearable="column.clearable !== false"
                  :multiple="column.multiple"
                  :filterable="column.filterable"
                  @change="handleFieldChange(column.code, searchDatas[column.code], column)"
                >
                  <el-option
                    v-for="option in column.options"
                    :key="option.code"
                    :label="option.name"
                    :value="option.code"
                    :disabled="option.disabled"
                  />
                </el-select>
                <tree-select
                  v-else-if="column.type === 'treeSelect'"
                  v-model="searchDatas[column.code]"
                  :data="column.options"
                  :props="column.treeProps"
                  :node-key="column.nodeKey || 'id'"
                  :multiple="column.multiple"
                  :clearable="column.clearable !== false"
                  :filterable="column.filterable"
                  :placeholder="column.placeholder"
                  :disabled="column.disabled"
                  @change="handleFieldChange(column.code, searchDatas[column.code], column)"
                ></tree-select>
                <ReMultipleText
                  :placeholder="column.placeholder"
                  :dialog-title="column.name"
                  :tooltip-text="column.name"
                  v-else-if="column.type === 'inputText'"
                  v-model="searchDatas[column.code]"
                />
                <el-input v-model="searchDatas[column.code]" v-else style="width: 100%"></el-input>
              </el-form-item>
            </el-col>
          </template>
          <el-col :span="spanComp()">
            <div class="operation" style="text-align: right; margin-bottom: 10px">
              <el-button plain type="primary" size="mini" @click="searchDataHandle">查 询</el-button>
              <el-button plain size="mini" @click="resetHandle">重 置</el-button>
              <el-button plain type="primary" size="mini" @click="settingHandle">高级设置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
      <el-form v-else :model="searchSecDatas" label-position="right" label-width="120px">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="项目名称">
              <el-input v-model="searchSecDatas.xmmc" style="width: 100%"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目编码">
              <ReMultipleText v-model="searchSecDatas.xmbm" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <div class="operation" style="text-align: right; margin-bottom: 10px">
              <el-button plain type="primary" size="mini" @click="getSecTableData">查 询</el-button>
              <el-button plain size="mini" @click="resetSecHandle">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="table">
      <vxe-grid
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        v-if="activeName === 'first'"
        ref="gridRef"
        height="100%"
        v-bind="gridOptions"
        @cell-click="gridCellClickHandle($event, '1')"
      ></vxe-grid>
      <vxe-grid
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        v-else
        ref="gridSecRef"
        height="100%"
        v-bind="gridSecOptions"
        @cell-click="gridCellClickHandle($event, '2')"
      ></vxe-grid>
    </div>
    <div class="bottom">
      <el-pagination
        :current-page="activeName === 'first' ? page.page : pageSec.page"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="activeName === 'first' ? page.limit : pageSec.limit"
        :total="activeName === 'first' ? parseInt(page.total + '') : parseInt(pageSec.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
    <DynamicReports @show-modal="reloadAfterSetting" ref="dynamicReportsRef" :title="title" />
  </div>
  <QueryProTypeModal ref="queryProTypeModalRef"></QueryProTypeModal>
  <CentralizedModification
    @saveAfter="searchDataHandle"
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="selectData"
    :flag="flag"
  ></CentralizedModification>
  <Matter @update-table="searchDataHandle" :selectDatas="selectDatas" ref="matterRef" />
  <CreateDeptEditModal ref="createDeptEditModalRef" />
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
</template>

<script lang="ts">
export default {
  name: 'RequirementCartWorkbench'
}
</script>
<script setup lang="ts">
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import DynamicReports from '@/components/DynamicReports/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import TreeSelect from '@/components/TreeSelect/index.vue'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import CreateDeptEditModal from '@/views/service/xq/components/CreateDeptEditModal.vue'
import Matter from '@/views/service/xq/components/Matter.vue'
import QueryProTypeModal from '@/views/service/xq/components/QueryProTypeModal.vue'
import { useRequirementCartWorkbench } from '@/views/service/xq/composables/useRequirementCartWorkbench'
import { computed } from 'vue'

const props = defineProps({
  userInfo: {
    type: Object as any,
    required: true
  },
  showHelp: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['help', 'reloaded'])

const submitLevel = computed(() => props.userInfo?.fqzzFlag)

const {
  activeName,
  backHandle,
  cellClickHandle,
  createDeptEditModalRef,
  createDeptHandle,
  deleteHandle,
  dynamciSearch,
  dynamicReportsRef,
  editHandle,
  editPageRef,
  exportHandle,
  flag,
  formRef,
  getSecTableData,
  gridOptions,
  gridRef,
  gridSecOptions,
  gridSecRef,
  handleFieldChange,
  limitChangeHandle,
  loading,
  matterHandle,
  matterRef,
  openModal,
  page,
  pageChangeHandle,
  pageSec,
  processData,
  processHandle,
  queryProTypeModalRef,
  reload,
  resetHandle,
  resetSecHandle,
  searchDataHandle,
  searchDatas,
  searchSecDatas,
  selectData,
  selectDatas,
  settingHandle,
  spanComp,
  submitsWorkflowHandle,
  title
} = useRequirementCartWorkbench({
  userInfo: computed(() => props.userInfo),
  submitLevel
})

const reloadAfterSetting = async () => {
  await reload()
  emit('reloaded')
}

const gridCellClickHandle = ({ row, column }: any, selectedGrid: string) => {
  cellClickHandle(row, column, selectedGrid)
}

defineExpose({
  loading,
  reload
})
</script>

<style scoped lang="less">
:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__inner) {
  height: auto !important;
  min-height: 32px;
}

:deep(.el-select__tags) {
  height: auto !important;
  max-height: none !important;
  flex-wrap: wrap;
  padding: 2px 0;
  .el-select__input {
    max-width: 110px !important;
  }
}

:deep(.el-input__wrapper) {
  height: auto !important;
}

.requirement-cart-workbench {
  height: 100%;
  display: flex;
  flex-direction: column;

  .opeartion {
    display: flex;
    min-width: 0;
    min-height: 0;
    margin-bottom: 10px;

    .left {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }

    .right {
      min-width: 0;
      min-height: 0;
    }
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
