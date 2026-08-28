<template>
  <div class="search-area">
    <el-form :model="searchForm" class="search-form">
      <div class="search-row">
        <el-form-item label="物料编码" class="search-item">
          <ReMultipleText
            v-model="searchForm.materialCode"
            dialog-title="物料编码"
            tooltip-text="物料编码"
            placeholder="请输入物料编码,多个物料编码以逗号分隔"
          />
        </el-form-item>
        <el-form-item label="物料描述" class="search-item">
          <el-input maxlength="256" v-model="searchForm.materialDesc" placeholder="请输入物料描述" clearable />
        </el-form-item>
        <el-form-item label="小类编码" class="search-item">
          <ReMultipleText
            v-model="searchForm.smallCategoryCode"
            dialog-title="小类编码"
            tooltip-text="小类编码"
            placeholder="请输入物料编码,多个小类编码以逗号分隔"
          />
        </el-form-item>
        <el-form-item label="是否资产级设备" class="search-item">
          <el-select style="width: 100%" v-model="searchForm.isAssetLevelEquipment" placeholder="请选择" clearable>
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
        </el-form-item>
        <div class="search-item search-actions">
          <el-button type="primary" plain @click="handleSearch">查 询</el-button>
          <el-button plain @click="handleReset">重 置</el-button>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts" name="materialSearch">
import { useCrudSearch } from '@/views/suzhou/common/hooks/useCrudSearch'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
const { searchForm, handleSearch, handleReset } = useCrudSearch({
  materialCode: '',
  materialDesc: '',
  smallCategoryCode: '',
  isAssetLevelEquipment: '1'
})
</script>

<style scoped lang="less">
@import '../../common/styles/search';
</style>
