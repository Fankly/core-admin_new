<template>
  <div class="search">
    <el-form ref="searchFormRef" label-suffix="：" :model="searchForm">
      <el-row :gutter="24">
        <el-col :span="6">
          <el-form-item label="版本名称" prop="versionName">
            <el-input :maxlength="64" v-model.trim="searchForm.versionName" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="归口部门" prop="gkbmName">
            <el-input :maxlength="64" v-model.trim="searchForm.gkbmName" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="状态" prop="status">
            <el-select v-model="searchForm.status" class="search-select">
              <el-option v-for="item in statusList" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item class="search-form__item">
            <el-button type="primary" plain size="mini" @click="handleSearchData">查 询</el-button>
            <el-button size="mini" plain @click="handleResetData">重 置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { useSearch } from '@/views/targetBudget/provinceTarget/components/hooks/useSearch'
import { PublicCode } from '../types/provinceTarget'

interface Props {
  statusList: PublicCode[]
  search: () => void
}

const props = defineProps<Props>()

const { searchForm, statusList, handleResetData, handleSearchData, searchFormRef } = useSearch(props)
</script>

<style lang="less" scoped>
.search-form__item {
  text-align: right;
}
.search-select {
  width: 100%;
}
</style>
