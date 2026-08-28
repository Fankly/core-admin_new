<template>
  <div>
    <el-form :model="searchForm" label-suffix=" : " label-width="120px">
      <el-row>
        <el-col :span="6">
          <el-form-item label="项目名称">
            <ReMultipleText
              v-model="searchForm.xmmc"
              dialog-title="项目名称"
              tooltip-text="项目名称"
              placeholder="请输入项目名称,多个项目名称以逗号分隔"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="部门">
            <el-select style="width: 100%" v-model="searchForm.dept" placeholder="请选择部门" clearable>
              <el-option v-for="(item, index) in deptList" :key="index" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="专业">
            <el-select style="width: 100%" v-model="searchForm.zyxf" placeholder="请选择专业" clearable>
              <el-option v-for="(item, index) in zyxfList" :key="index" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="编制人">
            <el-input maxlength="128" v-model.trim="searchForm.creator" placeholder="请输入编制人" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="测算状态">
            <el-select style="width: 100%" v-model="searchForm.zxcsstatus" placeholder="请选择测算状态" clearable>
              <el-option v-for="(item, index) in zxcsStatusList" :key="index" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="评审状态">
            <el-select style="width: 100%" v-model="searchForm.zxcsspstatus" placeholder="请选择评审状态" clearable>
              <el-option v-for="(item, index) in zxcspsStatusList" :key="index" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6" v-if="isLhpsqk">
          <el-form-item label="联合评审情况">
            <el-select style="width: 100%" v-model="searchForm.lhpsqk" placeholder="请选择联合评审情况" clearable>
              <el-option v-for="(item, index) in lhpsqkList" :key="index" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6" v-if="!isLhpsqk"/>
        <el-col :span="6">
          <div style="text-align: right; margin-bottom: 10px">
            <el-button type="primary" plain @click="handleSearch">查 询</el-button>
            <el-button plain @click="handleReset">重 置</el-button>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { csqrParams } from '@/views/service/xmcs/hooks/csqr'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'

interface propsVo {
  zxcsStatusList: any[]
  zxcspsStatusList: any[]
  lhpsqkList: any[]
  deptList: any[]
  zyxfList: any[]
  isLhpsqk: boolean
}
const props = defineProps<propsVo>()
const emit = defineEmits(['handleSearch', 'handleReset'])
const { searchForm } = csqrParams()

const handleSearch = () => {
  searchForm.value.xmmcList = searchForm.value.xmmc ? searchForm.value.xmmc.split(',') : []
  searchForm.value.cjr = searchForm.value.creator || ''
  searchForm.value.cszt = searchForm.value.zxcsstatus || ''
  searchForm.value.pszt = searchForm.value.zxcsspstatus || ''
  searchForm.value.lhpsqk = searchForm.value.lhpsqk || ''
  emit('handleSearch', { ...searchForm.value })
}
const handleReset = () => {
  for (const key in searchForm.value) {
    searchForm.value[key] = null
  }
  if (searchForm.value.xmmcList) searchForm.value.xmmcList.length = 0
  emit('handleReset', { ...searchForm })
}
</script>
