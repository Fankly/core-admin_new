<template>
  <div class="search-area">
    <el-form :model="searchForm" class="search-form" label-position="right" label-suffix=" : " label-width="100px">
      <div class="search-row">
        <el-form-item label="物料描述" class="search-item">
          <el-input v-model="searchForm.maktx" maxlength="256" show-word-limit clearable placeholder="请输入物料描述" />
        </el-form-item>

        <div class="search-item search-actions">
          <el-button type="primary" plain @click="handleSearch">查 询</el-button>
          <el-button plain @click="handleReset">重 置</el-button>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "materialTaskDetailTestSearch" })
import { inject, reactive, ref } from 'vue'
import { CrudTableRefInjectionKey } from '@/views/suzhou/common/types/crud'
import type { CrudQueryParams } from '@/views/suzhou/common/types/crud'

const materialTableRef = inject(CrudTableRefInjectionKey, ref())

const createInitialState = () => ({
  maktx: ''
})

const searchForm = reactive(createInitialState())

const getSearchParams = (): CrudQueryParams => ({
  maktx: searchForm.maktx
})

const handleSearch = () => {
  materialTableRef.value?.searchData(getSearchParams(), { resetPage: true })
}

const handleReset = () => {
  Object.assign(searchForm, createInitialState())
  materialTableRef.value?.searchData(getSearchParams(), { resetPage: true })
}
</script>

<style scoped lang="less">
@import '../../common/styles/search';
</style>
