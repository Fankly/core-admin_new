<template>
  <div v-if="isShowPage" class="container">
    <div class="operation">
      <div class="left">
        <BudgetingToolbar />
      </div>
      <div class="right">
        <div class="tool-button">
          <el-tooltip content="列设置" placement="top">
            <span @click="openColSetting" style="cursor: pointer; font-size: 18px" class="el-icon-s-operation"></span>
          </el-tooltip>
          <el-tooltip content="隐藏/展示查询" placement="top">
            <span style="cursor: pointer; font-size: 18px; margin: 0 10px" @click="handleIsShowSearch">
              <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
            </span>
          </el-tooltip>
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <splitPane :splitSet="settingLR">
      <template #paneL>
        <div class="left">
          <BudgetingTree />
        </div>
      </template>
      <template #paneR>
        <div class="main">
          <div class="right">
            <div class="search" v-if="isShowSearch">
              <BudgetingSearch />
            </div>
            <div class="custom-tabs">
              <div class="tab-item" :class="{ active: activeTab === '0' }">明细数据</div>
            </div>
            <div v-if="activeTab === '0'">
              <div class="tips">【编制值为年度财务结算值且不含增值税】</div>
            </div>
            <div class="table-main">
              <BudgetingTable ref="budgetingTableRef" />
            </div>
          </div> </div
      ></template>
    </splitPane>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
  <!-- 列设置 -->
  <ColSetting :gridRef="gridRef" ref="colRef" :col-setting="colSetting" />
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts" name="/service/budget/budgeting/index">
import BudgetingToolbar from '@/views/service/budget/budgeting/modules/BudgetingToolbar.vue'
import BudgetingTree from '@/views/service/budget/budgeting/modules/BudgetingTree.vue'
import BudgetingTable from '@/views/service/budget/budgeting/modules/BudgetingTable.vue'
import BudgetingSearch from '@/views/service/budget/budgeting/modules/BudgetingSearch.vue'
import splitPane from '@/components/ReSplitPane'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ColSetting from '@/views/service/project/projectActivation/components/ColSetting.vue'
import { useBudgeting } from '@/views/service/budget/budgeting/hooks/useBudgeting'
import { onMounted } from 'vue'

const { userRoleSelectorRef, getRoleHandle, helpModalRef, isShowPage, initPublicParams, activeTab, settingLR, getHelpMessageHandle, handleIsShowSearch, isShowSearch, colRef, gridRef, budgetingTableRef, colSetting, openColSetting } = useBudgeting()

initPublicParams()

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index';
</style>
