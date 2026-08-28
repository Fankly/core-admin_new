<template>
  <div v-loading="loading" class="container" v-if="isShowPage">
    <div class="container-operation">
      <Operation :search="searchMainPageData" />
    </div>
    <div class="container-search">
      <el-form ref="searchFormRef" :model="searchForm" label-suffix="：">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="批次编号" prop="pspcCode">
              <ReMultipleText v-model="searchForm.pspcCode" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="批次名称" prop="pspcName">
              <el-input maxlength="128" v-model="searchForm.pspcName" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="年度" prop="nd">
              <el-select style="width: 100%" v-model="searchForm.nd">
                <el-option v-for="item in ndList" :key="item.code" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <div class="container-search-main" style="text-align: right">
              <el-button type="primary" size="mini" plain @click="searchMainPageData">查 询</el-button>
              <el-button type="primary" size="mini" plain @click="resetData">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="container-table">
      <Table :search="searchMainPageData" />
    </div>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/service/approval/batch/index">
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { onMounted } from 'vue'
import { useBatch } from './hooks/useBatch'
import Operation from '@/views/service/approval/batch/components/Operation.vue'
import Table from '@/views/service/approval/batch/components/Table.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'

const { userRoleSelectorRef, getRoleHandle, isShowPage, searchForm, searchMainPageData, resetData, searchFormRef, loading, ndList } = useBatch()

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style lang="less" scoped>
.container {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;

  &-operation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &-table {
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    :deep(&-main) {
      flex: 1;
      min-height: 300px;
    }
  }
}
</style>
