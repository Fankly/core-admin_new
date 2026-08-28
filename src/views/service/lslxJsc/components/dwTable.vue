<!-- 收集进度查询 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      resize
      show-zoom
      :title="formData?.title"
      :width="1200"
      :close-on-press-escape="true"
      @close="closeHandle"
      :loading="dwInfo.loading"
    >
      <div class="contentModal">
        <div class="toolButtoon">
          <div class="left">
            <el-button size="mini" type="primary" plain v-debounce="[handlePush, `click`, 500]">
              刷 新
            </el-button>
          </div>
          <div class="right">
            <div class="info">
              <span class="highlight">
                版本编号: <span>{{ formData?.versionNo }}</span>
              </span>
              <span class="highlight">
                版本名称: <span>{{ formData?.versionName }}</span>
              </span>
              <span class="highlight">
                年度:<span>{{ formData?.nd }}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="table">
          <el-table
            border
            :header-cell-style="'text-align: center;'"
            :data="pageData"
            height="100%"
          >
            <el-table-column label="序号" type="index" width="50" align="center" />
            <el-table-column label="单位" prop="dwName" align="center" />
            <el-table-column label="一上预算编制审核" prop="ysStatusName" align="center" />
            <el-table-column label="操作" prop="ggdm" align="center">
              <template #default="{ row }">
                <el-button type="text" size="mini" @click="handleClick('VIEW', row)">
                  明细查看
                </el-button>
                <el-button
                  v-if="row.ysStatus == '3'"
                  type="text"
                  size="mini"
                  @click="handleClick('PASS', row)"
                >
                  通 过
                </el-button>
                <el-button
                  v-if="row.ysStatus == '3'"
                  type="text"
                  size="mini"
                  @click="handleClick('REJECT', row)"
                >
                  驳 回
                </el-button>
              </template>
            </el-table-column>
            <el-table-column label="二上预算编制审核" prop="esStatusName" align="center" > 
              <template #default="{ row }">
               {{ row.esStatusName?row.esStatusName:'-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" prop="ggdm" align="center">
              <template #default="{ row }">
                <div v-if="row.esStatusName">
                  <el-button type="text" size="mini" @click="handleBtn('VIEW', row)">
                  明细查看
                </el-button>
                <el-button
                  v-if="row.esStatus == '3'"
                  type="text"
                  size="mini"
                  @click="handleBtn('PASS', row)"
                >
                  通 过
                </el-button>
                <el-button
                  v-if="row.esStatus == '3'"
                  type="text"
                  size="mini"
                  @click="handleBtn('REJECT', row)"
                >
                  驳 回
                </el-button>
                </div>
                <div v-else>-</div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </vxe-modal>
  </div>
  <flowAudit ref="flowAuditRef" @get-pass="getPass" :formData="formData" />
</template>
<script lang="ts">
export default {
  name: '/lslxJsc/components/dwTable'
}
</script>
<script setup lang="ts">
import { reactive, ref, defineEmits, defineExpose } from 'vue'
import {
  getCollectionProgress,
  passForYs,
  rejectForYs,
  passForEs,
  rejectForEs
} from '@/api/lslxJsc/index'
import { ElMessage, ElMessageBox } from 'element-plus'
import flowAudit from '@/views/service/lslxJsc/components/flowAudit.vue' //上报审核组件
import { getPublicData } from '@/api/common' //公共代码

const dialogFormRef = ref()
const flowAuditRef = ref()
const formData = ref<any>({})
const userInfo = ref()
const pageData = ref<any>([])
const isShowModel = ref(false)
const emits = defineEmits(['pushPage'])

const dwInfo = reactive<{
  loading: boolean
  isShowPage: boolean
}>({
  loading: false,
  isShowPage: false
})

const closeHandle = () => {
  emits('pushPage', true)
}

// 列表查询
const pageMeeting = async (val: any) => {
  dwInfo.loading = true
  const item: any = await getPublicData('MBZYS_STATUS')
  const status: any = await getPublicData('MBZES_STATUS')

  if (item.success && item.data.length !== 0) {
    let res: any = await getCollectionProgress(val)
    if (res.success && res.data.length !== 0 && status.success && status.data.length !== 0) {
      res.data.forEach((el: any) => {
        if (el.ysStatus != null) {
          const ysStatusName = item.data.find((root: any) => root.code == el.ysStatus)
          el.ysStatusName = ysStatusName.name
        }
        if (el.esStatus != null) {
          const esStatusName = status.data.find((root: any) => root.code == el.esStatus)
          el.esStatusName = esStatusName.name
        }
      })
      pageData.value = res.data
      dwInfo.loading = false
    } else {
      ElMessage.error(res.msg)
    }
  }
}

const getPass = (val: any) => {
  if (val) {
    pageMeeting(formData.value.versionId)
    flowAuditRef.value.isShowModel = false
  }
}

// 刷新当前列表
const handlePush = () => {
  pageMeeting(formData.value.versionId)
}
// 一上操作点击事件
const handleClick = (type: any, row: any) => {
  if (type != 'VIEW') {
    const params = {
      dwId: row.dwId,
      versionId: formData.value.versionId
    }
    const val = type == 'PASS' ? '通过' : '驳回'
    const api = type == 'PASS' ? passForYs : rejectForYs

    ElMessageBox.confirm(`操作不可逆，是否${val}？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        dwInfo.loading = true
        const res: any = await api(params)
        if (res.success) {
          pageMeeting(params.versionId)
          ElMessage.success(`${row.dwName}的一上预算上报已${val}`)
          dwInfo.loading = false
        } else {
          ElMessage.error(res.msg)
          dwInfo.loading = false
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  } else {
    formData.value.dwId = row.dwId
    formData.value.dwName = row.dwName
    formData.value.modelTitle = '一上上报审核'
    formData.value.isShow = row.ysStatus == '3'
    flowAuditRef.value.userInfo = userInfo.value
    flowAuditRef.value.getHeaderData(formData.value)
    flowAuditRef.value.isShowModel = true
  }
}

// 二上操作点击事件
const handleBtn = (type: any, row: any) => {
  if (type != 'VIEW') {
    const params = {
      dwId: row.dwId,
      versionId: formData.value.versionId
    }
    const val = type == 'PASS' ? '通过' : '驳回'
    const api = type == 'PASS' ? passForEs : rejectForEs

    ElMessageBox.confirm(`操作不可逆，是否${val}？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        dwInfo.loading = true
        const res: any = await api(params)
        if (res.success) {
          pageMeeting(params.versionId)
          ElMessage.success(`${row.dwName}的二上预算上报已${val}`)
          dwInfo.loading = false
        } else {
          ElMessage.error(res.msg)
          dwInfo.loading = false
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  } else {
    formData.value.dwId = row.dwId
    formData.value.dwName = row.dwName
    formData.value.isShow = row.esStatus == '3'
    formData.value.modelTitle = '二上上报审核'
    flowAuditRef.value.userInfo = userInfo.value
    flowAuditRef.value.getHeaderData(formData.value)
    flowAuditRef.value.isShowModel = true
  }
}

defineExpose({
  isShowModel,
  closeHandle,
  userInfo,
  formData,
  pageMeeting
})
</script>

<style scoped lang="less">
.contentModal {
  width: 100%;
  height: calc(100vh - 110px);
  padding: 10px;
  .toolButtoon {
    height: 30px;
    align-items: center;
    display: flex;
    margin-bottom: 10px;

    .left {
      display: flex;
      justify-content: space-between;
      max-width: 190px;
    }

    .right {
      flex: 1;
      text-align: right;
      font-weight: bold;
      color: #212529;

      span {
        display: inline-block;
        font-size: 14px;
        color: #555;
        padding: 5px;
        background-color: #e9ecef;
        border-radius: 5px;
        min-height: 0;
        min-width: 0;
        margin-right: 5px;
      }
    }
  }
  .table {
    margin: 0 auto;
    height: calc(100% - 40px);
  }
}
</style>
