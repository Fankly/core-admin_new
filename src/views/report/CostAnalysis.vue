<template>
  <div class="container" v-show="pageInfo.isShowPage" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="container-operation" v-if="pageInfo.isShowPage" style="margin-bottom: 10px">
      <div class="left">
        <el-button :loading="loading" v-permission="'EXPORT'" type="primary" size="mini" plain @click="exportHandle">导 出</el-button>
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form label-position="right" :label-width="110" :model="searchForm">
        <Grid :gap="[12, 0]" :cols="4">
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `指标项` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form" v-if="pageInfo.isShowPage">
                <el-select clearable collapse-tags style="width: 100%" multiple v-model="searchForm.indicatorList">
                  <el-option v-for="item in zbxDataList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <div class="search-form-item">
              <div class="search-form-date">
                <el-form-item>
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `预算期间` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form">
                    <div class="date">
                      <el-date-picker
                        style="width: 120px"
                        @change="startTimeHandle"
                        :clearable="false"
                        v-model="searchForm.startDate"
                        value-format="YYYY-MM"
                        format="YYYY-MM"
                        type="month"
                      ></el-date-picker>
                      <span style="padding: 0 10px">至</span>
                      <el-date-picker
                        style="width: 120px"
                        :disabledDate="disabledEndMonth"
                        :clearable="false"
                        v-model="searchForm.endDate"
                        value-format="YYYY-MM"
                        format="YYYY-MM"
                        type="month"
                      ></el-date-picker>
                    </div>
                  </div>
                </el-form-item>
              </div>
            </div>
          </GridItem>
          <GridItem> </GridItem>
          <GridItem>
            <el-form-item>
              <div class="operation">
                <el-button :disabled="loading" @click="searchData" type="primary" size="mini" plain>查 询</el-button>
                <el-button :disabled="loading" size="mini" plain @click="resetHandle">重 置</el-button>
              </div>
            </el-form-item>
          </GridItem>
        </Grid>
      </el-form>
    </div>
    <div class="table">
      <ListTable :options="tableOptions"></ListTable>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts" name="/report/CostAnalysis">
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import userDialog from '@/components/select/userDialog.vue'
import { ListTable } from '@visactor/vue-vtable'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { onMounted, reactive, ref, watch } from 'vue'
import { getGkbmDynamicColumn, getGkbmStatData, GkbmData, exportStatData } from '@/api/report'
import { ElMessage } from 'element-plus'
import { getPublicCodeList } from '@/api/common'

const userDialogRef = ref()
const helpModalRef = ref()
const userInfo = ref<any>()
const dwId = ref('')

const searchForm = reactive<GkbmData>({
  busiType: 'GKBM_YSZXFX',
  currentUserDwId: '',
  endDate: '',
  startDate: '',
  indicatorList: ['MBZ', 'LXZ', 'WCZ', 'XMSL', 'YZTBXMSL', 'HTQDXMSL', 'YKGXMSL', 'XMZBL', 'XMHTQDL', 'XMKGL', 'JSL']
})

const pageInfo = reactive({
  isShowPage: false
})

const loading = ref(false)

const zbxDataList = ref<any>([])

const tableOptions = reactive<any>({
  header: [],
  records: [],
  frozenColCount: 3,
  frozenRowCount: 1,
  allowFrozenColCount: 3,
  showFrozenIcon: false,
  select: {
    disableSelect: true
  },
  theme: {
    headerStyle: {
      textAlign: 'center',
      fontSize: 12,
      fontWeight: 'bold',
      color: '#000',
      bgColor: '#f5f5f5',
      borderColor: '#e0e0e0',
      padding: 8
    },
    bodyStyle: {
      fontSize: 14,
      color: '#333',
      bgColor: ({ row }: { row: number }) => {
        return row % 2 === 0 ? '#f5f5f5' : '#ffffff'
      },
      borderColor: '#e0e0e0',
      padding: 8
    },
    scrollStyle: {
      visible: 'always'
    }
  }
})

const exportHandle = async () => {
  loading.value = true
  exportStatData({
    ...searchForm
  }).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  })
}

const getRoleHandle = async () => {
  searchForm.currentUserDwId = userDialogRef.value.userMsg.org_id
  dwId.value = userDialogRef.value.userMsg.org_id
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
    await searchHandle()
  }
}

const startTimeHandle = (val: string) => {
  if (searchForm.endDate) {
    const endtTime = new Date(searchForm.endDate)
    const endMonth = endtTime.getMonth()
    const endYear = endtTime.getFullYear()
    const startTime = new Date(val)
    const startMonth = startTime.getMonth()
    const startYear = startTime.getFullYear()
    if (startYear !== endYear || startMonth > endMonth) {
      if (startMonth === 12) {
        searchForm.endDate = (startTime.getFullYear() + startMonth).toString()
      } else {
        searchForm.endDate = (startTime.getFullYear() + startMonth + 1).toString()
      }
    }
  }
}

const disabledEndMonth = (time: Date) => {
  if (!searchForm.startDate) return false
  const startTime = new Date(searchForm.startDate)
  const startYear = startTime.getFullYear()
  const startMonth = startTime.getMonth()
  const currentYear = time.getFullYear()
  const currentMonth = time.getMonth()
  const monthDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth)
  return currentYear !== startYear || monthDiff < 0
}

const searchData = async () => {
  if (searchForm.indicatorList.length === 0) {
    ElMessage.error('指标项不能为空!')
    return
  }
  await searchHandle()
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const searchHandle = async () => {
  try {
    loading.value = true
    const [rs1, rs2] = await Promise.all([
      getGkbmStatData({
        ...searchForm,
        parentId: null
      }),
      getGkbmDynamicColumn({
        ...searchForm
      })
    ])
    if (!rs1.success || !rs1.data) {
      throw new Error(rs1.msg)
    }
    if (!rs2.success) {
      throw new Error(rs2.msg)
    }
    tableOptions.records = rs1.data
    tableOptions.header = rs2.data
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const resetHandle = async () => {
  const year = new Date().getFullYear().toString()
  const curMonth = new Date().getMonth() + 1
  // 设置默认值
  searchForm.startDate = year + '-01'
  searchForm.endDate = year + '-' + curMonth.toString().padStart(2, '0')
  searchForm.indicatorList = zbxDataList.value.map((item: any) => item.code) as string[]
  await searchHandle()
}

watch(
  () => searchForm.startDate,
  (newVal) => {
    if (newVal && searchForm.endDate) {
      const startTime = new Date(newVal)
      const year = startTime.getFullYear().toString()
      const endTime = new Date(searchForm.endDate)
      if (endTime.getFullYear() !== startTime.getFullYear() || endTime.getMonth() < startTime.getMonth()) {
        const curMonth = startTime.getMonth() + 1
        if (curMonth === 12) {
          searchForm.endDate = year + '-' + curMonth.toString().padStart(2, '0')
        } else {
          searchForm.endDate = year + '-' + (curMonth + 1).toString().padStart(2, '0')
        }
      }
    }
  }
)

const initParams = async () => {
  await userDialogRef.value.getUser()
  const year = new Date().getFullYear().toString()
  const curMonth = new Date().getMonth() + 1
  searchForm.startDate = year + '-01'
  searchForm.endDate = year + '-' + curMonth.toString().padStart(2, '0')
  const publicCodeRes = await getPublicCodeList({
    codes: ['GKBM_YSZXFX_ZBX']
  })
  if (publicCodeRes.success) {
    zbxDataList.value = publicCodeRes.data['GKBM_YSZXFX_ZBX']
    searchForm.indicatorList = zbxDataList.value.map((item: any) => item.code) as string[]
  }
}

onMounted(initParams)
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  height: 100%;
  .container-operation {
    display: flex;
    align-items: center;
    .right {
      width: 100px;
      text-align: right;
    }
    .left {
      flex: 1;
      min-width: 100%;
      min-height: 0;
    }
  }
  .operation {
    text-align: right;
  }
  .table {
    flex: 1;
    min-height: 400px;
  }
}
.tips {
  color: red;
}
</style>
