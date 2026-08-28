<template>
  <div class="operation">
    <div class="operation-left">
      <template :key="dropdown.permission" v-for="dropdown in dropDownMenu">
        <template v-if="checkPermissions(dropdown.permission)">
          <el-dropdown v-if="dropdown.type === 'dropdown'" style="margin-right: 10px" trigger="click">
            <el-button :disabled="btnDisabledStatus" type="primary" size="mini" plain
              >{{ dropdown.label }}<i class="el-icon-arrow-down" style="margin-left: 6px"></i>
            </el-button>
            <template #dropdown>
              <template v-for="dropdownChild in dropdown.children" :key="dropdownChild.permission">
                <el-dropdown-menu v-if="checkPermissions(dropdownChild.permission)">
                  <el-dropdown-item @click="dropdownChild.click">{{ dropdownChild.label }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </template>
          </el-dropdown>
          <el-button v-else @click="dropdown.click" :disabled="btnDisabledStatus" type="primary" size="mini" plain>
            {{ dropdown.label }}
          </el-button>
        </template>
      </template>
    </div>
    <div class="operation-right">
      <div class="operation-right-info">
        <div class="highlight">
          <dt> 部门名称:</dt>
          <dd>{{ bmName }}</dd>
        </div>
      </div>
      <span>年度：</span>
      <el-select @change="handleChangeNdData" v-model="nd">
        <el-option v-for="ndItem in ndList" :key="ndItem.code" :value="ndItem.code" :label="ndItem.name"></el-option>
      </el-select>
      <div class="operation-right-tool__button">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
  </div>
  <TargetBudgetVersion :search="props.search" ref="targetBudgetVersionRef" />
  <TargetBudgetMaintain :search="props.search" ref="targetBudgetMaintainRef" />
  <TargetBudgetVersionCompare ref="targetBudgetVersionCompareRef" />
  <HelpModal ref="helpModalRef" />
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :isShowLog="processData.isShowLog"
    :searchApi="processData.searchApi"
    :id="processData.id"
    :is="processData.compName"
  ></component>
</template>

<script setup lang="ts">
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import TargetBudgetVersion from '@/views/targetBudget/provinceTarget/components/TargetBudgetVersion.vue'
import TargetBudgetMaintain from '@/views/targetBudget/provinceTarget/components/TargetBudgetMaintain.vue'
import TargetBudgetVersionCompare from '@/views/targetBudget/provinceTarget/components/TargetBudgetVersionCompare.vue'
import { useOperation } from '@/views/targetBudget/provinceTarget/components/hooks/useOperation'
import { PublicCode } from '../types/provinceTarget'

interface OperationProps {
  ndList: PublicCode[]
  search: () => void
}

const props = defineProps<OperationProps>()
const {
  bmName,
  checkPermissions,
  btnDisabledStatus,
  dropDownMenu,
  targetBudgetVersionRef,
  targetBudgetMaintainRef,
  targetBudgetVersionCompareRef,
  ndList,
  nd,
  handleChangeNdData,
  getHelpMessageHandle,
  processData,
  helpModalRef
} = useOperation(props)
</script>

<style scoped lang="less">
.operation {
  display: flex;
  min-height: 100%;
  &-left {
    min-width: 400px;
  }

  &-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1 1 auto;

    :deep(.el-select) {
      width: 120px;
    }

    &-info {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0;
      margin-right: 10px;

      .highlight {
        display: inline-flex;
        align-items: center;
        font-size: 14px;
        padding: 4px 12px;
        background-color: var(--el-fill-color-light, #f5f7fa);
        border: 1px solid var(--el-border-color-light, #dcdfe6);
        border-radius: 4px;
        white-space: nowrap;
        transition: background-color 0.2s;
        max-width: 240px;

        &:hover {
          background-color: var(--el-fill-color, #e6e8eb);
        }

        dt {
          color: var(--el-text-color-regular, #606266);
          font-weight: normal;
          margin: 0;
        }

        dd {
          font-weight: 600;
          color: var(--el-text-color-primary, #303133);
          margin: 0 0 0 6px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    &-tool__button {
      margin-left: 10px;
    }
  }
}
</style>
