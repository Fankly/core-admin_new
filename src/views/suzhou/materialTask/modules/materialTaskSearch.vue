<template>
  <div class="search-area">
    <el-form :model="searchForm" class="search-form" label-postion="right" label-suffix=" : " label-width="140px">
      <div class="search-row">
        <el-form-item label="一级单位" prop="yjdw" class="search-item">
          <el-select style="width: 100%" placeholder="请选择一级单位" v-model="searchForm.yjdw" clearable>
            <el-option v-for="item1 in yjdwList" @click="selectChange(item1)" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="二级单位" prop="ejdw" class="search-item">
          <el-select style="width: 100%" placeholder="请选择二级单位" v-model="searchForm.ejdw" clearable>
            <el-option v-for="item1 in ejdwList" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="年月" prop="taskTime" class="search-item">
          <el-date-picker
            style="width: 100%"
            placeholder="请选择年月"
            @change="handleTime"
            :clearable="false"
            v-model="searchForm.taskTime"
            value-format="YYYY-MM"
            format="YYYY-MM"
            type="month"
          />
        </el-form-item>

        <el-form-item label="任务状态" class="search-item">
          <el-select style="width: 100%" v-model="searchForm.status" clearable>
            <el-option v-for="item in statusOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <div class="search-item search-actions">
          <el-button type="primary" plain @click="handleSearch">查 询</el-button>
          <el-button plain @click="handleReset(), (ejdwList.length = 0)">重 置</el-button>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts" name="materialTaskSearch">
import { onMounted, ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { getPublicCodesList } from '@/api/common'
import { useCrudSearch } from '@/views/suzhou/common/hooks/useCrudSearch'
import { MATERIAL_TASK_STATUS_CODE } from '@/views/suzhou/materialTask/config'
import { useStore } from 'vuex'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'

const statusOptions = ref<Array<{ code: string; name: string }>>([])
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const store = useStore()
const szwlInfo = reactive<{ bmId: string; dwId: string }>({
  bmId: '',
  dwId: ''
})
const getStatusOptions = async () => {
  try {
    if (store) {
      const SZWLlobalInfo: any = store.getters.getSZWLlobalInfo
      szwlInfo.bmId = SZWLlobalInfo.bmId
      szwlInfo.dwId = SZWLlobalInfo.dwId
      const res = await getPublicCodesList({ codes: [MATERIAL_TASK_STATUS_CODE] })
      if (!res.success) throw new Error(res.msg)
      statusOptions.value = res.data?.[0]?.codes || []
      const yjdwCode: any = await getYjdwList({ bmId: szwlInfo.bmId, dwId: szwlInfo.dwId })
      if (yjdwCode.success && yjdwCode.data.length !== 0) {
        yjdwList.value = yjdwCode.data
      }
    }
  } catch (error) {
    ElMessage.error((error as Error).message || '状态字典加载失败!')
  }
}
const handleTime = () => {
  const timeList = searchForm.taskTime.split('-')
  searchForm.nd = timeList[0]
  searchForm.yd = Number(timeList[1]).toString()
}

onMounted(() => {
  setTimeout(() => {
    getStatusOptions()
  }, 500)
})

const { searchForm, handleSearch, handleReset } = useCrudSearch({
  status: '',
  updateSourceDirStatus: '',
  taskTime: '',
  yjdw: '',
  ejdw: '',
  nd: '',
  yd: ''
})

// 选择一级单位联动二级单位
const selectChange = (val: any) => {
  searchForm.ejdw = ''
  ejdwList.value.length = 0
  const param = {
    YJDW: val.code,
    parentCode: val.code,
    bmId: szwlInfo.bmId,
    dwId: szwlInfo.dwId
  }
  getEjdwList({ ...param }).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      ejdwList.value.push(...res.data)
    }
  })
}
</script>

<style scoped lang="less">
@import '../../common/styles/search';
</style>
