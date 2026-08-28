<template>
  <div class="search">
    <el-form :model="formData" ref="formRef" label-position="right" label-width="120px">
      <Grid ref="gridRef" :gap="[10, 0]" :cols="4">
        <GridItem>
          <el-form-item prop="protypeIds">
            <template #label>
              <el-space :size="4">
                <span>{{ `项目类型` }}</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <TreeSelect
                @clearData="clearDataHandle"
                ref="proTypeRef"
                :is-leaf="false"
                @selectChange="getProjectType"
                :default-props="{ children: 'children', label: 'name' }"
                :data="selectData.projectTypeList"
                :is-child-node="false"
                node-key="id"
                data-type="id"
              />
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="sgkbmId">
            <template #label>
              <el-space :size="4">
                <span>{{ `省归口部门` }}</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select collapse-tags clearable style="width: 100%" v-model="formData.sgkbmId" placeholder="请选择">
                <template v-for="item in selectData.gkbmList" :key="item.id">
                  <el-option :label="item.name" :value="item.id"></el-option>
                </template>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="yjdw">
            <template #label>
              <el-space :size="4">
                <span>{{ `一级单位` }}</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select @change="changeYjdwData" style="width: 100%" v-model="formData.yjdw" placeholder="请选择" clearable>
                <el-option v-for="item in selectData.yjdwList" @click="selectYjdwChange(item)" :key="item.code" :label="item.name" :value="item.code">
                </el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="ejdw">
            <template #label>
              <el-space :size="4">
                <span>{{ `二级单位` }}</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select style="width: 100%" v-model="formData.ejdw" placeholder="请选择" clearable>
                <el-option v-for="item in selectData.ejdwList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="xmbms">
            <template #label>
              <el-space :size="4">
                <span>{{ `项目编码` }}</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <ReMultipleText v-model="formData.xmbms" />
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="xmmc">
            <template #label>
              <el-space :size="4">
                <span>{{ `项目名称` }}</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-input clearable maxlength="30" v-model="formData.xmmc" />
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="jhssnd">
            <template #label>
              <el-space :size="4">
                <span>{{ `计划实施年份` }}</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select style="width: 100%" v-model="formData.jhssnd" placeholder="请选择" clearable>
                <el-option v-for="item in selectData.jhssndList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="zts">
            <template #label>
              <el-space :size="4">
                <span>{{ `状态` }}</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select collapse-tags multiple style="width: 100%" v-model="formData.zts" placeholder="请选择" clearable>
                <el-option v-for="item in selectData.ztsList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem />
        <GridItem />
        <GridItem />
        <GridItem>
          <el-form-item style="text-align: right">
            <el-button size="mini" type="primary" plain @click="searchHandle">查 询</el-button>
            <el-button size="mini" type="primary" plain @click="resetHandle">重 置</el-button>
          </el-form-item>
        </GridItem>
      </Grid>
    </el-form>
  </div>
</template>

<script lang="ts">
export default {
  name: 'SearchCriteria'
}
</script>

<script lang="ts" setup>
import { onMounted, reactive, defineExpose, ref, defineEmits, defineProps, withDefaults } from 'vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import TreeSelect from '@/components/select/TreeSelect.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getProTypeTreeNode } from '@/api/process'
import { getGkbmInProvince, getPublicCodeList } from '@/api/common'
import { getEjdwData, getYjdwData } from '@/api/service/expertinformation'
import { SearchData } from '@/api/service/Storage/PlannedOutbound/Declaration'

interface Prop {
  flag: 'DECLARATION' | 'VERIFICATION'
}
const props = withDefaults(defineProps<Prop>(), {
  flag: 'DECLARATION'
})

const formData = reactive<SearchData>({
  protypeIds: [],
  sgkbmId: '',
  xmbms: '',
  xmmc: '',
  yjdw: '',
  ysly: '',
  zts: ['300', '310', '301'],
  jhssnd: '',
  ejdw: ''
})

const formRef = ref()
const proTypeRef = ref()

const emit = defineEmits(['reset', 'search'])

const selectData = reactive({
  projectTypeList: [],
  yjdwList: [],
  ejdwList: [],
  jhssndList: [],
  ztsList: [],
  gkbmList: []
})

const changeYjdwData = (val: string) => {
  if (!val) {
    formData.ejdw = ''
    selectData.ejdwList = []
  }
}

const getProjectType = (value: any) => {
  formData.protypeIds = value
}

const selectYjdwChange = async (val: any) => {
  formData.ejdw = ''
  let res: any = await getEjdwData(val['id'])
  if (res.success && res.data.length !== 0) {
    selectData.ejdwList = res.data
  }
}

// 获取实施年度
const getJhssndDataList = async () => {
  const res = await getPublicCodeList({
    codes: ['ZLYS_XMJHSSND', 'ZLYS_NCKXMSBZT', 'ZLYS_NCKXMSHZT']
  })
  if (res.success) {
    selectData.jhssndList = res.data['ZLYS_XMJHSSND']
    selectData.ztsList = props.flag === 'DECLARATION' ? res.data['ZLYS_NCKXMSBZT'] : res.data['ZLYS_NCKXMSHZT']
  }
}

// 获取一级单位
const getYjdwDataList = async () => {
  // 一级单位
  const res = await getYjdwData()
  if (res.success && res.data.length != 0) {
    selectData.yjdwList = res.data
  }
}

// 获取项目类型
const getProjectData = () => {
  const nd = new Date().getFullYear().toString()
  const params = {
    parentId: '0',
    startDate: nd
  }
  getProTypeTreeNode(params).then((res) => {
    if (res.success) {
      selectData.projectTypeList = res.data
    }
  })
}

// 获取省归口部门
const getProGkbmData = async () => {
  let res = await getGkbmInProvince()
  if (res.success) {
    selectData.gkbmList = res.data
  }
}

const clearDataHandle = () => {
  if (Array.isArray(formData.protypeIds)) {
    formData.protypeIds = []
  }
}

const resetHandle = () => {
  formRef.value.resetFields()
  formData.zts = props.flag === 'DECLARATION' ? ['300', '310', '301'] : ['310']
  proTypeRef.value.clearSelect()
  selectData.ejdwList = []
  emit('reset')
}

const searchHandle = () => {
  emit('search', formData)
}

const initData = () => {
  getProjectData()
  getYjdwDataList()
  getProGkbmData()
  getJhssndDataList()
}

onMounted(() => {
  formData.zts = props.flag === 'DECLARATION' ? ['300', '310', '301'] : ['310']
  initData()
})

defineExpose({
  formData
})
</script>

<style scoped></style>
