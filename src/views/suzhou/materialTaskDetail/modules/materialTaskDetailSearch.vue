<template>
  <div class="search-area">
    <el-form :model="searchForm" class="search-form" label-position="right" label-suffix=" : " label-width="100px">
      <div class="search-row">
        <el-form-item label="一级单位" class="search-item">
          <el-select style="width: 100%" placeholder="请选择一级单位" v-model="searchForm.yjdw" clearable>
            <el-option v-for="item in yjdwList" :key="item.code" :label="item.name" :value="item.code" @click="selectChange(item)" />
          </el-select>
        </el-form-item>

        <el-form-item label="二级单位" class="search-item">
          <el-select style="width: 100%" placeholder="请选择二级单位" v-model="searchForm.ejdw" clearable>
            <el-option v-for="item in ejdwList" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>

        <el-form-item label="过账日期" class="search-item">
          <el-date-picker
            style="width: 100%"
            v-model="searchForm.budatMkpfRange"
            type="daterange"
            value-format="YYYYMMDD"
            format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>

        <el-form-item label="年度" class="search-item">
          <el-date-picker
            style="width: 100%"
            :clearable="false"
            v-model="searchForm.mjahr"
            value-format="YYYY"
            format="YYYY"
            type="year"
            placeholder="请选择年度"
          />
        </el-form-item>

        <el-form-item label="项目定义" class="search-item">
          <ReMultipleText
            v-model="searchForm.xmdy"
            dialog-title="项目定义"
            tooltip-text="项目定义"
            placeholder="请输入项目定义,多个项目定义以逗号分隔"
          />
        </el-form-item>

        <el-form-item label="项目描述" class="search-item">
          <el-input v-model="searchForm.post1" clearable />
        </el-form-item>

        <el-form-item label="物料编码" class="search-item">
          <ReMultipleText
            v-model="searchForm.wlbm"
            dialog-title="物料编码"
            tooltip-text="物料编码"
            placeholder="请输入物料编码,多个物料编码以逗号分隔"
          />
        </el-form-item>

        <el-form-item label="物料描述" class="search-item">
          <el-input v-model="searchForm.maktx" clearable />
        </el-form-item>

        <el-form-item label="项目类型" class="search-item">
          <ElTreeSelect
            v-model="searchForm.proTypeList"
            clearable
            :data="projectTypeList"
            :props="projectTypeProps"
            :multiple="true"
            :show-checkbox="true"
            :collapse-tags="true"
            :check-on-click-node="false"
            node-key="middleId"
            placeholder="请选择项目类型"
          />
        </el-form-item>

        <el-form-item label="匹配结果" class="search-item">
          <el-select style="width: 100%" v-model="searchForm.ppjg" clearable>
            <el-option v-for="item in ppOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" class="search-item">
          <el-select style="width: 100%" v-model="searchForm.status" clearable>
            <el-option v-for="item in statusOptions" :key="item.code" :label="item.name" :value="item.code" />
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

<script setup lang="ts" name="materialTaskDetailSearch">
import { inject, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'
import { getPublicCodesList, getSubProtypeTree } from '@/api/common'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ElTreeSelect from '@/components/ElTreeSelect'
import { CrudTableRefInjectionKey } from '@/views/suzhou/common/types/crud'
import type { CrudQueryParams } from '@/views/suzhou/common/types/crud'
import { MATERIAL_TASK_DETAIL_STATUS_CODE } from '@/views/suzhou/materialTaskDetail/config'

const store = useStore()
const materialTableRef = inject(CrudTableRefInjectionKey, ref())
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const projectTypeList = ref<any[]>([])
const statusOptions = ref<Array<{ code: string; name: string }>>([])
const ppOptions = ref<Array<{ code: string; name: string }>>([
  { code: '0', name: '未匹配' },
  { code: '1', name: '已匹配' }
])
const projectTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}
const szwlInfo = reactive<{ bmId: string; dwId: string }>({
  bmId: '',
  dwId: ''
})

const createInitialState = () => ({
  yjdw: '',
  ejdw: '',
  budatMkpfRange: [] as string[],
  mjahr: '',
  xmdy: '',
  post1: '',
  wlbm: '',
  maktx: '',
  proTypeList: [] as string[],
  ppjg: '',
  status: ''
})

const searchForm = reactive(createInitialState())

const splitToList = (value?: string) => {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const getSearchParams = (): CrudQueryParams => {
  const range = Array.isArray(searchForm.budatMkpfRange) ? searchForm.budatMkpfRange : []
  return {
    yjdw: searchForm.yjdw,
    ejdwList: searchForm.ejdw ? [searchForm.ejdw] : [],
    budatMkpfStart: range[0] || '',
    budatMkpfEnd: range[1] || '',
    mjahr: searchForm.mjahr,
    post1: searchForm.post1,
    maktx: searchForm.maktx,
    ppjg: searchForm.ppjg,
    status: searchForm.status,
    pspidList: splitToList(searchForm.xmdy),
    matnrList: splitToList(searchForm.wlbm),
    proTypeList: Array.isArray(searchForm.proTypeList) ? [...searchForm.proTypeList] : []
  }
}

const handleSearch = () => {
  materialTableRef.value?.searchData(getSearchParams(), { resetPage: true })
}

const handleReset = () => {
  Object.assign(searchForm, createInitialState())
  ejdwList.value = []
  materialTableRef.value?.searchData(getSearchParams(), { resetPage: true })
}

const loadOptions = async () => {
  try {
    const SZWLlobalInfo: any = store.getters.getSZWLlobalInfo
    szwlInfo.bmId = SZWLlobalInfo?.bmId || ''
    szwlInfo.dwId = SZWLlobalInfo?.dwId || ''

    const [statusRes, yjdwRes, projectTypeRes] = await Promise.all([
      getPublicCodesList({ codes: [MATERIAL_TASK_DETAIL_STATUS_CODE] }),
      getYjdwList({ bmId: szwlInfo.bmId, dwId: szwlInfo.dwId }),
      getSubProtypeTree()
    ])

    if (!statusRes.success) throw new Error(statusRes.msg)
    statusOptions.value = statusRes.data?.[0]?.codes || []

    if (yjdwRes.success && yjdwRes.data?.length) {
      yjdwList.value = yjdwRes.data
    }

    if (projectTypeRes.success) {
      projectTypeList.value = projectTypeRes.data || []
    } else {
      ElMessage.error(projectTypeRes.msg || '项目类型树加载失败!')
    }
  } catch (error) {
    ElMessage.error((error as Error).message || '筛选条件加载失败!')
  }
}

const selectChange = (val: any) => {
  searchForm.ejdw = ''
  ejdwList.value = []
  if (!val?.code) return
  getEjdwList({
    YJDW: val.code,
    parentCode: val.code,
    bmId: szwlInfo.bmId,
    dwId: szwlInfo.dwId
  }).then((res: any) => {
    if (res.success && res.data?.length) {
      ejdwList.value = res.data
    }
  })
}

onMounted(() => {
  // 等待角色上下文写入 store 后再拉单位字典
  setTimeout(() => {
    loadOptions()
  }, 500)
})
</script>

<style scoped lang="less">
@import '../../common/styles/search';
</style>
