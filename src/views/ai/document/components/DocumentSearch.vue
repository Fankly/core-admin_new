<template>
  <div v-show="visible" class="search">
    <el-form ref="formRef" :model="formModel" label-position="right" label-width="120px">
      <Grid :gap="[20, 0]" :cols="4">
        <GridItem>
          <el-form-item prop="xmbm">
            <template #label>
              <el-space :size="4">
                <span>项目编码</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-input v-model.trim="formModel.xmbm" clearable :maxlength="64" placeholder="请输入"></el-input>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="xmmc">
            <template #label>
              <el-space :size="4">
                <span>项目名称</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-input v-model.trim="formModel.xmmc" clearable :maxlength="100" placeholder="请输入"></el-input>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="proTypes">
            <template #label>
              <el-space :size="4">
                <span>项目类型</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <ElTreeSelect
                v-model="formModel.proTypes"
                clearable
                :data="projectTypeList"
                :props="projectTypeProps"
                :multiple="true"
                :show-checkbox="true"
                :collapse-tags="true"
                :check-on-click-node="false"
                node-key="middleId"
                placeholder="请选择"
              />
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="jhssnd">
            <template #label>
              <el-space :size="4">
                <span>计划实施年度</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.jhssnd" clearable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in yearList" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="yjdw">
            <template #label>
              <el-space :size="4">
                <span>一级单位</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.yjdw" clearable filterable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in yjdwList" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="attachName">
            <template #label>
              <el-space :size="4">
                <span>附件名称</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-input v-model.trim="formModel.attachName" clearable :maxlength="200" placeholder="请输入"></el-input>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="attachType">
            <template #label>
              <el-space :size="4">
                <span>附件类型</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.attachType" clearable filterable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in attachTypeList" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="priority">
            <template #label>
              <el-space :size="4">
                <span>优先级</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.priority" clearable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in priorityOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="transcodeStatus">
            <template #label>
              <el-space :size="4">
                <span>转码状态</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.transcodeStatus" clearable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="extractStatus">
            <template #label>
              <el-space :size="4">
                <span>提取状态</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.extractStatus" clearable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem suffix>
          <div class="search-buttons">
            <el-button type="primary" size="mini" plain :disabled="loading" @click="$emit('search')">查 询</el-button>
            <el-button size="mini" plain :disabled="loading" @click="$emit('reset')">重 置</el-button>
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
import { priorityOptions, projectTypeProps, statusOptions } from '../constants'
import type { OptionItem, SearchForm } from '../types'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchForm: {
    type: Object as PropType<SearchForm>,
    required: true
  },
  yearList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  yjdwList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  attachTypeList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  projectTypeList: {
    type: Array as PropType<any[]>,
    default: () => []
  }
})

defineEmits(['search', 'reset'])

const formRef = ref()
const formModel = ref(props.searchForm)

defineExpose({
  clearValidate: () => formRef?.value?.clearValidate?.()
})
</script>

<style scoped lang="less">
.search {
  margin-bottom: 10px;
}

.form {
  width: 100%;
}

.search-buttons {
  text-align: right;
  padding-top: 2px;
}
</style>
