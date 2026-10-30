<template>
  <div class="parse-search">
    <el-form :model="formModel" label-position="right" label-width="120px">
      <Grid :gap="[20, 0]" :cols="4">
        <GridItem>
          <el-form-item prop="xmbm">
            <template #label>
              <span>项目编码</span>
              <span>&nbsp;：</span>
            </template>
            <el-input v-model.trim="formModel.xmbm" clearable :maxlength="100" placeholder="请输入（精确匹配）"></el-input>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="xmmc">
            <template #label>
              <span>项目名称</span>
              <span>&nbsp;：</span>
            </template>
            <el-input v-model.trim="formModel.xmmc" clearable :maxlength="100" placeholder="请输入"></el-input>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="proTypes">
            <template #label>
              <span>项目类型</span>
              <span>&nbsp;：</span>
            </template>
            <ElTreeSelect
              v-model="formModel.proTypes"
              clearable
              :data="projectTypeList"
              :props="parseProjectTypeProps"
              :multiple="true"
              :show-checkbox="true"
              :collapse-tags="true"
              :check-on-click-node="false"
              node-key="middleId"
              placeholder="请选择"
            />
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="jhssnd">
            <template #label>
              <span>计划实施年度</span>
              <span>&nbsp;：</span>
            </template>
            <el-select v-model="formModel.jhssnd" clearable placeholder="请选择" style="width: 100%">
              <el-option v-for="item in yearList" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="yjdw">
            <template #label>
              <span>一级单位</span>
              <span>&nbsp;：</span>
            </template>
            <el-select v-model="formModel.yjdw" clearable filterable placeholder="请选择" style="width: 100%">
              <el-option v-for="item in yjdwList" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="zt">
            <template #label>
              <span>项目状态</span>
              <span>&nbsp;：</span>
            </template>
            <el-select v-model="formModel.zt" clearable multiple collapse-tags placeholder="请选择" style="width: 100%">
              <el-option v-for="item in flowStatusList" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="attachName">
            <template #label>
              <span>附件名称</span>
              <span>&nbsp;：</span>
            </template>
            <el-input v-model.trim="formModel.attachName" clearable :maxlength="200" placeholder="请输入"></el-input>
          </el-form-item>
        </GridItem>
        <GridItem suffix>
          <div class="parse-search__buttons">
            <el-button type="primary" size="small" plain :disabled="loading" @click="$emit('search')">查 询</el-button>
            <el-button size="small" plain :disabled="loading" @click="$emit('reset')">重 置</el-button>
          </div>
        </GridItem>
      </Grid>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import ElTreeSelect from '@/components/ElTreeSelect'
import { parseProjectTypeProps } from '../constants'
import type { ParseOption, ParseSearchForm } from '../constants'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  searchForm: {
    type: Object as PropType<ParseSearchForm>,
    required: true
  },
  yearList: {
    type: Array as PropType<ParseOption[]>,
    default: () => []
  },
  yjdwList: {
    type: Array as PropType<ParseOption[]>,
    default: () => []
  },
  projectTypeList: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  flowStatusList: {
    type: Array as PropType<ParseOption[]>,
    default: () => []
  }
})

defineEmits(['search', 'reset'])

const formModel = ref(props.searchForm)
</script>

<style scoped lang="less">
.parse-search {
  flex: none;
}

.parse-search__buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 2px;
}

:deep(.el-form-item) {
  margin-bottom: 10px;
}
</style>
