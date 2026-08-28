<!-- 创建续建/结转申请单 -->
<template>
  <vxe-modal
    ref="dialogFormRef"
    show-zoom
    resize
    :loading="loading"
    v-model="isShowModel"
    :destroy-on-close="true"
    :title="'编辑'"
    :width="1000"
    :close-on-press-escape="false"
    @close="closeHandle"
  >
    <div style="margin: 0 0 10px 0">
      <el-button size="mini" type="primary" plain @click="pushMsgHandle">保 存</el-button>
      <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
    </div>
    <el-form
      label-suffix=" : "
      ref="ruleFormRef"
      label-width="190px"
      label-position="right"
      :model="rmarkData"
      :rules="rules"
      :hide-required-asterisk="false"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="国网项目编码" prop="gwxmbm">
            <el-input disabled v-model.trim="rmarkData['gwxmbm']" placeholder="请输入" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="项目名称" prop="xmmc">
            <el-input disabled v-model.trim="rmarkData['xmmc']" placeholder="请输入" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="项目类别" prop="proTypeName">
            <el-input disabled v-model.trim="rmarkData['proTypeName']" placeholder="请输入" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="项目性质" prop="xmxzName">
            <el-input disabled v-model.trim="rmarkData['xmxzName']" placeholder="请输入" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="累计财务支出(万元)" prop="yqljcwzc">
            <el-input input-style="text-align:right" disabled v-model.trim="rmarkData['yqljcwzc']" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开工时间" prop="kgsj">
            <el-date-picker value-format="YYYY-MM-DD" v-model="rmarkData['kgsj']" style="width: 100%" type="date" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预计完成时间" prop="yjwcsj">
            <el-date-picker value-format="YYYY-MM-DD" @change="changeEndTime" v-model="rmarkData['yjwcsj']" style="width: 100%" type="date" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="总预算不含税(万元)" prop="amount">
            <el-input input-style="text-align:right" v-model.trim="rmarkData['amount']" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="本年投资计划(万元)" prop="dntzjh">
            <el-input :disabled="isXjjz" input-style="text-align:right" v-model.trim="rmarkData['dntzjh']" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="本年预算不含税(万元)" prop="dnys">
            <el-input input-style="text-align:right" v-model.trim="rmarkData['dnys']" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否预安排" prop="preArrStatus">
            <el-select style="width: 100%" v-model="rmarkData['preArrStatus']" clearable>
              <el-option key="0" label="否" value="0"></el-option>
              <el-option key="1" label="是" value="1"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="续建结转原因" prop="jzyy">
            <el-input
              :maxlength="256"
              show-word-limit
              resize="none"
              type="textarea"
              :rows="6"
              v-model.trim="rmarkData['jzyy']"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-tabs v-model="tabNum">
      <el-tab-pane label="附件信息" name="1" />
    </el-tabs>
    <div style="height: 200px">
      <proTable
        ref="proDataRef"
        :toolButton="['other']"
        :cell-style="columnStyle"
        @selection-change="selectionChange"
        @cell-click="downloadReport"
        :data="pageData"
        :search-col="4"
        :columns="tableColumns"
        :pagination="false"
      >
        <template #tableHeader="scope">
          <el-upload style="display: inline; padding: 0 0 0 10px" :on-change="uploadHandle" :auto-upload="false" :show-file-list="false">
            <el-button size="mini" type="success" icon="el-icon-upload">上传附件</el-button>
          </el-upload>
          <el-button
            size="mini"
            :disabled="!scope.isSelected"
            type="primary"
            plain
            style="margin-left: 10px"
            @click="handleBtn('del', scope.selectedList)"
            >删除附件</el-button
          >
        </template>
      </proTable>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="EditModal">
import { ref, reactive, nextTick, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { updateXjjzInfo, deleteAttach, uploadAttach, download } from '@/api/service/xjjz/index'
import { submitActivity } from '@/api/workflow/xjjz'
import baseService from '@/service/baseService'
import VXETable from 'vxe-table'
import { checkBeforeSubmit } from '@/api/service/continueCarryOver'
import { getBqshFlag } from "@/api/service/requirement";

interface propsVo {
  publicParams: any
  getTableList?: () => void
}

const props = defineProps<propsVo>()
// 子组件
const emit = defineEmits(['showModal'])
const loading = ref<boolean>(false)
const proDataRef = ref()
const pageData = ref<any[]>([])
const tabNum = ref('1')
const store = useStore()
const wfParam = ref<WFParam>({
  XMID: '',
  PROTYPE: '',
  FQZZ: '',
  FQBM: ''
})
const ruleFormRef = ref()
const dialogFormRef = ref()
const isShowModel = ref<boolean>(false)
const rmarkData = ref<any>({}) // 弹框参数
const isXjjz = computed(() => rmarkData && (rmarkData.value['xmxz'] === '2' || rmarkData.value['xmxz'] === 2))

//表格规则
const rules = reactive({
  preArrStatus: [
    {
      required: true,
      message: '请选择是否预安排',
      trigger: 'change'
    }
  ],
  kgsj: [
    {
      required: true,
      message: '请选择开工时间',
      trigger: 'change'
    }
  ],
  yjwcsj: [
    {
      required: true,
      message: '请选择预计完成时间',
      trigger: 'change'
    }
  ],
  jzyy: [
    {
      required: true,
      message: '续建结转原因不能为空',
      trigger: 'blur'
    }
  ],
  amount: [
    {
      required: true,
      message: '总预算不含税(万元)不能为空',
      trigger: 'blur'
    },
    {
      pattern: /^\d{1,12}(\.\d{1,6})?$/,
      message: '整数部分不超过12位且最多六位小数的非负数'
    }
  ],
  dntzjh: [
    {
      required: true,
      message: '本年投资计划(万元)不能为空',
      trigger: 'blur'
    },
    {
      pattern: /^\d{1,12}(\.\d{1,6})?$/,
      message: '整数部分不超过12位且最多六位小数的非负数'
    }
  ],
  dnys: [
    {
      required: true,
      message: '本年预算不含税(万元)不能为空',
      trigger: 'blur'
    },
    {
      pattern: /^\d{1,12}(\.\d{1,6})?$/,
      message: '整数部分不超过12位且最多六位小数的非负数'
    }
  ]
})

// 关闭
const closeHandle = () => {
  ruleFormRef.value.resetFields()
  isShowModel.value = false
  props.getTableList?.()
}
// 提交工作流
const submitCbxqshWorkflowHandle = async () => {
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: props.publicParams.bmId || '',
    spRoleId: props.publicParams.spRoleId || ''
  }
  const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${props.publicParams.bmId || ''}`)
  if (!flagData.success) {
    ElMessage.error(flagData.data)
    return
  }
  const getDataRes = await getBqshFlag(rmarkData.value.xmId, props.publicParams.dwId || '')
  if (getDataRes.success) {
    wfParam.value.XMID = rmarkData.value.xmId
    wfParam.value.FQZZ = flagData.data
    wfParam.value.FQBM = props.publicParams.specialorgcode
    wfParam.value.DWLX = getDataRes.data.DWLX || ''
    wfParam.value.PROTYPE = rmarkData.value.xmId.proType
    wfParam.value.XMLX = '0'
    wfParam.value['ZBCB_FLAG'] = rmarkData.value['zbcbFlag']
    submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_MISXJJZSHLC', '', wfUserInfo, wfParam.value, {}, submitWFCallback)
  }
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: any) => {
  const list: any[] = JSON.parse(wfData).WorkFlowDataList.WorkFlowData
  const obj: any = {}
  list.forEach((item) => {
    obj[item.DataCode] = item.DataValue
  })
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: props.publicParams.bmId || '',
    spRoleId: props.publicParams.spRoleId || '',
    wfCode: 'WF_MISXJJZSHLC',
    wfData: obj,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await submitActivity({
    ...spfrom
  })
  if (res.success) {
    ElMessage.success('提交成功')
    closeHandle()
  } else {
    ElMessage.error('提交失败!')
  }
  loading.value = false
}
// 校验开工时间
const changeEndTime = (val: string) => {
  if (val && rmarkData.value.kgsj) {
    const startTime = new Date(rmarkData.value.kgsj).getTime()
    const endTime = new Date(val).getTime()
    if (startTime > endTime) {
      ElMessage.warning('预计完成时间不能早于开工时间')
      rmarkData.value.yjwcsj = ''
    }
  }
}

//保存
const pushMsgHandle = () => {
  ruleFormRef.value.validate((valid: any) => {
    if (!valid) return
    if (pageData.value.length == 0) return ElMessage.warning('请上传附件!')
    ElMessageBox.confirm('请确定要保存的内容', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        loading.value = true
        let res: any = await updateXjjzInfo([rmarkData.value])
        if (res.success) {
          loading.value = false
          ElMessage.success('保存成功')
          submitGzl()
        } else {
          loading.value = false
          ElMessage.error(res.msg)
        }
      })
      .catch((e: any) => {
        console.log(e)
      })
  })
}
const submitGzl = async () => {
  const isOk: any = await VXETable.modal.confirm('是否提交审核？选择【是】直接提交审核，选择【否】可后续在页面中批量进行提交审核。', '提示', {
    confirmButtonText: '是',
    cancelButtonText: '否',
    showClose: false
  })
  if (isOk === 'confirm') {
    try {
      // 增加校验
      if (rmarkData.value['xjjzSfglsx'] !== '1') {
        ElMessage.warning('请关联事项后,进行提交审核！')
        return
      }
      loading.value = true
      const params = {
        gwxmbm: rmarkData.value?.gwxmbm || '',
        isPack: rmarkData.value?.isPack || '',
        xmId: rmarkData.value?.xmId || '',
        xmxz: rmarkData.value?.xmxz || '',
        ysbzId: rmarkData.value?.ysbzId || ''
      }
      const isSubmit = await checkBeforeSubmit([params])
      if (isSubmit.success) {
        submitCbxqshWorkflowHandle()
      } else {
        ElMessage.error(isSubmit.msg)
        closeHandle()
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  } else {
    closeHandle()
  }
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'xjjzAttachname', label: '附件名称' }
])
// 单选
const selectionChange = (selection: any) => {
  if (selection.length > 1) {
    nextTick(() => {
      proDataRef.value?.clearSelection()
      proDataRef.value?.element.toggleRowSelection(selection[selection.length - 1])
    })
  }
}
// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  if (column.label == '附件名称') {
    return 'color:#00706b;cursor: pointer;'
  }
}
// 下载附件
const downloadReport = async (row: any, column: any) => {
  if (column.label == '附件名称') {
    try {
      loading.value = true
      const blob: any = await download(row.xjjzUuid)
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      // 获取文件名
      let filename = row.xjjzAttachname
      dom.download = `${decodeURI(decodeURI(filename))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
      loading.value = false
    } catch (e: any) {
      console.error(e.toString())
    }
  }
}
// 上传
const uploadHandle = async (file: any) => {
  if (pageData.value.length != 0) {
    ElMessageBox.confirm('此操作会替换当前附件，请确认', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        uploadFile(file)
      })
      .catch((error: any) => {
        console.log(error)
      })
  } else {
    uploadFile(file)
  }
}
const uploadFile = async (file: any) => {
  const formData = new FormData()
  formData.append('file', file.raw)
  formData.append('fileName', file.name)
  formData.append('xmIds', rmarkData.value.xmId)
  let res = await uploadAttach(formData)
  if (res.success) {
    ElMessage.success('上传成功')
    pageData.value.length = 0
    pageData.value.push({ xjjzUuid: res.data, xjjzAttachname: file.name })
  } else {
    ElMessage.error(res.msg)
  }
}
// 删除附件
const handleBtn = async (val: any, selectedList: any) => {
  if (selectedList.length != 1) {
    return ElMessage.warning('请选择一条数据')
  }
  if (val == 'del') {
    ElMessageBox.confirm('确定要删除所选附件？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        let res = await deleteAttach({ ids: [rmarkData.value.xmId] })
        if (res.success) {
          ElMessage.success('删除成功！')
          pageData.value.length = 0
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  }
}

// 子组件暴露方法到父组件
defineExpose({
  dialogFormRef,
  isShowModel,
  closeHandle,
  rmarkData,
  pageData
})
</script>
