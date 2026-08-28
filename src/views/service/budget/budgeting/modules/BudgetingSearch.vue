<template>
  <div class="searchForm">
    <el-form ref="formRef" label-position="right" label-width="110px" :model="searchForm" label-suffix="：">
      <el-row :gutter="24">
        <el-col :span="6">
          <el-form-item label="项目名称" prop="xmmc">
            <el-input v-model="searchForm.xmmc" maxlength="128" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="储备编码" prop="xmbmx">
            <ReMultipleText v-model="searchForm.xmbms" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="国网编码" prop="gwxmbms">
            <ReMultipleText v-model="searchForm.gwxmbms" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="项目包名称" prop="xmbName">
            <el-input v-model="searchForm.xmbName" maxlength="128" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="6">
          <el-form-item label="一级单位" prop="yjdw">
            <el-select class="select_style" clearable collapse-tags @change="getChildUnitList" v-model="searchForm.yjdw">
              <el-option v-for="item in unitLevelOneList" :key="item.code" :label="item.name" :value="item.code"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="二级单位" prop="ejdw">
            <el-select class="select_style" v-model="searchForm.ejdw" clearable collapse-tags>
              <el-option v-for="item in unitLevelTwoList" :key="item.code" :label="item.name" :value="item.code"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="预算发送状态" prop="ysStatus">
            <el-select class="select_style" clearable collapse-tags v-model="searchForm.ysStatus">
              <el-option v-for="item in budgetStatusList" :key="item.code" :label="item.name" :value="item.code"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="项目流转状态" prop="xmStatus">
            <el-select class="select_style" clearable collapse-tags v-model="searchForm.xmStatus">
              <el-option v-for="item in projectFlowStatusList" :key="item.code" :label="item.name" :value="item.code"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="24">
          <div class="basic-operation">
            <el-button type="primary" size="mini" plain @click="handleSearchData">查 询</el-button>
            <el-button size="mini" plain @click="handleResetData">重 置</el-button>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { useBudgetingSearch } from '@/views/service/budget/budgeting/hooks/useBudgetingSearch'

const { formRef, getParentUnitList, getChildUnitList, getCommonCodeList, searchForm, unitLevelOneList, unitLevelTwoList, projectFlowStatusList, budgetStatusList, handleSearchData, handleResetData } = useBudgetingSearch()

getCommonCodeList()
getParentUnitList()
</script>

<style scoped lang="less">
.select_style {
  width: 100%;
}
</style>
