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
            <el-button
              :disabled="pageData.length == 0"
              size="mini"
              type="primary"
              plain
              v-debounce="[handlePush, `click`, 500]"
            >
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
            <el-table-column label="省专业归口部门" prop="zgkbmName" align="center" />
            <el-table-column label="省统筹预算编制状态" prop="ysStatusName" align="center" />
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
          </el-table>
        </div>
      </div>
    </vxe-modal>
  </div>
  <zyReporting
    ref="ZyReportTable"
    @push-page="pushPage"
    @get-pass="getPass"
    :isShow="isShow"
    :formData="formData"
  />
</template>
<script lang="ts">
export default {
  name: '/lslxJsc/components/dwTable'
}
</script>
<script setup lang="ts">
import { reactive, ref, defineEmits, defineExpose } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPublicData } from '@/api/common' //公共代码
import {
  getZgkbmCollectionProgress,
  passForZgkbmYs,
  rejectForZgkbmYs
} from '@/api/lslxJsc/szyBmApi'
import zyReporting from '@/views/service/lslxJsc/ysysszyhd/components/zyReporting.vue' //上报组件

const ZyReportTable = ref()
const isShow = ref<boolean>(false)

const dialogFormRef = ref()
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

const pushPage = (val: any) => {
  if (val) {
    ZyReportTable.value.isShowModel = false
  }
}

// 列表查询
const pageMeeting = async (val: any) => {
  dwInfo.loading = true
  const item: any = await getPublicData('MBZYS_STATUS')
  if (item.success && item.data.length !== 0) {
    let res: any = await getZgkbmCollectionProgress(val)
    if (res.success) {
      res.data.forEach((el: any) => {
        if (el && el.ysStatus != null) {
          const ysStatusName = item.data.find((root: any) => root.code == el.ysStatus)
          el.ysStatusName = ysStatusName.name
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
    ZyReportTable.value.isShowModel = false
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
      zgkbmId: row.zgkbmId,
      versionId: formData.value.versionId
    }
    const val = type == 'PASS' ? '通过' : '驳回'
    const api = type == 'PASS' ? passForZgkbmYs : rejectForZgkbmYs
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
          ElMessage.success(`${row.dwName}的一上预算省专业上报已${val}`)
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
    const params = {
      versionId: formData.value.versionId,
      versionName: formData.value.versionName,
      versionNo: formData.value.versionNo,
      zgkbmId: row.zgkbmId,
      nd: formData.value.nd,
      title: `${row.zgkbmName}-上报明细`
    }
    formData.value = { ...params }
    isShow.value = row.ysStatus == '3'
    ZyReportTable.value.userInfo = userInfo.value
    ZyReportTable.value.isShowModel = true
    ZyReportTable.value.getHeaderData(formData.value)
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
