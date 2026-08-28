<!-- 高级查询-联合会审 -->
<template>
  <div>
    <vxe-modal ref="modalRef" resize v-model="isShowTable" destroy-on-close :title="`高级查询`" :width="480" @close="closeHandle">
      <el-form ref="ruleFormRef" label-width="120px" label-position="right" :model="searchParams">
        <el-row :gutter="0">
          <el-col :span="24">
            <el-form-item label="项目编码：">
              <ReMultipleText style="width: 275px" v-model="searchParams.xmbm" :dialog-title="'项目编码'" :tooltip-text="'项目编码'"></ReMultipleText>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="项目名称：">
              <el-input clearable :maxlength="64" style="width: 275px" v-model.trim="searchParams.xmmc"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="预算事项：">
              <el-input clearable :maxlength="64" style="width: 275px" v-model.trim="searchParams.yssxmc"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="一级单位：">
              <el-select style="width: 275px" v-model="searchParams.yjdw" clearable placeholder="请选择" @change="getEjdw(searchParams.yjdw)">
                <el-option v-for="item in levelOne" :key="item.code" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="二级单位：">
              <el-select style="width: 275px" v-model="searchParams.ejdw" clearable placeholder="请选择">
                <el-option v-for="item in levelTwo" :key="item.code" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <template v-if="props.showOfflineFields">
            <el-col :span="24">
              <el-form-item label="项目类型：">
                <ElTreeSelect
                  clearable
                  style="width: 275px"
                  v-model="searchParams.protypeIds"
                  :data="projectTypeOptions"
                  :props="proTypeProps"
                  :multiple="true"
                  :showCheckbox="true"
                  :checkOnClickNode="false"
                  :collapseTags="true"
                  node-key="middleId"
                  placeholder="请选择"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="专家账号：">
                <el-input clearable :maxlength="64" style="width: 275px" v-model.trim="searchParams.expertAccount"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="预审状态：">
                <el-select style="width: 275px" v-model="searchParams.yszt" clearable placeholder="请选择">
                  <el-option v-for="item in budgetStatusOptions" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="线下会审意见：">
                <el-select style="width: 275px" v-model="searchParams.xxhsyj" clearable placeholder="请选择">
                  <el-option v-for="item in reviewOpinionOptions" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="终评意见：">
                <el-select style="width: 275px" v-model="searchParams.zsyj" clearable placeholder="请选择">
                  <el-option v-for="item in reviewOpinionOptions" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </template>
          <el-col :span="24">
            <div style="text-align: center">
              <el-button size="mini" v-debounce="[search, `click`, 300]" type="primary"> 查 询 </el-button>
              <el-button size="mini" v-debounce="[reset, `click`, 300]" plain> 重 置 </el-button>
              <!-- <el-button size="mini" v-debounce="[closeHandle, `click`, 300]" plain> 关 闭 </el-button> -->
            </div>
          </el-col>
        </el-row>
      </el-form>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'searchParams'
}
</script>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ElTreeSelect from '@/components/ElTreeSelect'
import { getEjdwData } from '@/api/service/expertinformation'
import { getPublicData, getSubProtypeTree } from '@/api/common'
import { ElMessage } from 'element-plus'

const props = withDefaults(
  defineProps<{
    showOfflineFields?: boolean
  }>(),
  {
    showOfflineFields: false
  }
)

const createEmptySearchParams = () => (props.showOfflineFields ? { protypeIds: [] } : {})
const searchParams = ref<any>(createEmptySearchParams())
const levelOne = ref<any>([]) // 一级单位
const levelTwo = ref<any>([]) // 二级单位
const budgetStatusOptions = ref<any[]>([])
const projectTypeOptions = ref<any[]>([])
const isShowTable = ref<boolean>(false)
const ruleFormRef = ref()
const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}
const reviewOpinionOptions = [
  { code: '0', name: '不通过' },
  { code: '1', name: '通过' }
]

const emits = defineEmits(['searchHandle'])

const getBudgetStatusOptions = async () => {
  const res: any = await getPublicData('LHHS_YSZT')
  if (res.success) {
    budgetStatusOptions.value = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

const getProjectTypeOptions = async () => {
  const res: any = await getSubProtypeTree()
  if (res.success) {
    projectTypeOptions.value = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

const getEjdw = (val: any) => {
  searchParams.value.ejdw = ''
  levelTwo.value.length = 0
  if (searchParams.value['yjdw']) {
    const { id, name }: any = levelOne.value.find((item: any) => item.code === val)
    searchParams.value.yjdwName = name
    getEjdwData(id).then((res: any) => {
      if (res.success && res.data.length !== 0) {
        levelTwo.value.push(...res.data)
      }
    })
  } else {
    searchParams.value.yjdwName = ''
  }
}
//关闭
const closeHandle = () => {
  isShowTable.value = false
}

// 查询
const search = () => {
  try {
    searchParams.value['xmbmList'] = searchParams.value['xmbm'] ? searchParams.value['xmbm'].split(',') : []
    searchParams.value['protypeIds'] = Array.isArray(searchParams.value['protypeIds']) ? searchParams.value['protypeIds'] : []
    if (searchParams.value['ejdw']) {
      const { name }: any = levelTwo.value.find((item: any) => item.code === searchParams.value['ejdw'])
      searchParams.value.ejdwName = name
    } else {
      searchParams.value.ejdwName = ''
    }
    emits('searchHandle', { param: searchParams.value, type: 'search' })
  } catch (e) {
    console.log((e as Error).message)
  }
}

// 重置
const reset = () => {
  clear()
  emits('searchHandle', { param: searchParams.value, type: 'reset' })
}
// 清空
const clear = () => {
  searchParams.value = createEmptySearchParams()
  levelTwo.value.length = 0
}

defineExpose({
  levelOne,
  isShowTable
})

onMounted(() => {
  getBudgetStatusOptions()
  if (props.showOfflineFields) {
    getProjectTypeOptions()
  }
})
</script>
