<template>
  <div class="form-container" v-if="isShowPage" v-loading="loading">
    <div class="steps-nav">
      <template v-for="(item, index) in steps" :key="item.stepId">
        <div class="step" :class="activeStep === index + 1 ? 'step-selected' : ''">
          <div class="font">
            {{ item.stepName }}
          </div>
          <div class="icon">
            <img v-if="index === 0" src="@/assets/service/mobanxiazai.png" alt="" />
            <img v-if="index === 1" src="@/assets/service/daoruwenjiandaoruxinxidaorushuju.png" alt="" />
            <img v-if="index === 2" src="@/assets/service/a-fujian3.png" alt="" />
          </div>
        </div>
        <div class="allow" v-if="index !== steps.length - 1">
          <img src="@/assets/service/allow.png" alt="" />
        </div>
      </template>
      <div class="myCart" @click="handleShopping">
        <div class="main">
          <div class="title">我的需求</div>
          <div class="number">{{ notifyNumber }}</div>
        </div>
        <div class="pic">
          <img src="@/assets/service/lanzi.png" alt="" />
        </div>
      </div>
    </div>
    <div class="form-main">
      <div class="form-content">
        <div class="form-title">
          <h2>{{ steps[activeStep - 1]?.stepName || '需求模版下载' }}</h2>
        </div>
        <div class="form-panel form-panel-1" v-show="activeStep === 1">
          <el-form label-position="right" label-width="160px" ref="formOneRef" :model="formData" :rules="formRules">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-form-item label="年度：">
                  <el-select style="width: 100%" v-model="formData.nd" placeholder="请选择">
                    <template v-for="item in ndList" :key="item.yearCode">
                      <el-option :label="item.yearName" :value="item.yearCode"></el-option>
                    </template>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="项目类型：" prop="proTypeId">
                  <ElTreeSelect
                    @change="changeHandle"
                    nodeKey="middleId"
                    :data="proTypeTreeData"
                    :props="{
                      label: 'name',
                      value: 'middleId',
                      children: 'children'
                    }"
                    v-model="formData.proTypeId"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-button type="primary" plain @click="downloadHandle">模板下载</el-button>
              </el-col>
            </el-row>
          </el-form>
        </div>
        <div class="form-panel form-panel-2" v-show="activeStep === 2">
          <div class="left">
            <div class="title">①：附件上传</div>
            <div class="main">
              <el-upload ref="uploadRef" :limit="1" :on-remove="onRemoveFile" :show-file-list="true" action="#" :before-upload="(file:any)=>beforeExcelUpload(file,'xmExcel')" :http-request="(file:any) => uploadExcel(file, 'xmExcel')" :accept="fileTypeOne" drag>
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处,或<em>点击上传</em></div>
              </el-upload>
            </div>
          </div>
          <div class="right">
            <div class="title">②：校验结果</div>
            <div class="main">
              <vxe-table
                :span-method="spanMethod"
                resizable
                show-overflow
                header-align="center"
                align="center"
                border
                stripe
                :row-config="{
                  height: 32
                }"
                height="100%"
                :data="excelData"
              >
                <vxe-column width="120" field="rowNo" title="序号"></vxe-column>
                <vxe-column title="附件名称" field="name"></vxe-column>
                <vxe-column width="300" field="xmmc" title="项目名称"></vxe-column>
                <vxe-column field="error" title="错误原因"></vxe-column>
              </vxe-table>
            </div>
          </div>
        </div>
        <div class="form-panel form-panel-2" v-show="activeStep === 3">
          <div class="left">
            <div class="title">①：附件上传</div>
            <div class="main">
              <el-upload :show-file-list="false" action="#" :before-upload="(file:any) => beforeExcelUpload(file, 'xmAttach')" :http-request="(file:any) => uploadExcel(file, 'xmAttach')" :accept="fileTypeTwo" drag>
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处,或<em>点击上传</em></div>
              </el-upload>
            </div>
          </div>
          <div class="right">
            <div class="title">②：文件内容</div>
            <div class="main">
              <vxe-table
                :data="attachData"
                header-align="center"
                align="center"
                resizable
                border
                stripe
                show-overflow
                :row-config="{
                  height: 32
                }"
                height="100%"
              >
                <vxe-column title="序号" type="seq"></vxe-column>
                <vxe-column title="文件名称" field="fileName"></vxe-column>
              </vxe-table>
            </div>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <el-button @click="prevStep" v-if="activeStep > 1">返回上一步</el-button>
        <el-button type="primary" @click="nextStep" v-if="activeStep === 1 || activeStep < steps.length">下一步 </el-button>
        <el-button type="success" @click="submitForm" v-if="activeStep !== 1 && activeStep === steps.length" :disabled="isDisabled">确 认 </el-button>
      </div>
    </div>
  </div>
  <MyCart ref="myCartRef" :userInfo="userInfo" />
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: '/service/xq/BatchRequirement'
}
</script>

<script lang="ts" setup>
import { getProtypeTreeNoMiddle, getXqlrNum } from '@/api/service/requirement'
import baseService from '@/service/baseService'
import MyCart from '@/views/service/xq/components/MyCart.vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import VXETable, { VxeTablePropTypes } from 'vxe-table'

import { getAppMenu } from '@/api/menu/menuConfig'
import { importTemplateDownload, xmExcelVerify, xmImport } from '@/api/service/batchRequirement'
import ElTreeSelect from '@/components/ElTreeSelect/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useUser } from '@/hooks/useUser'
import { MenuConfig } from '@/views/service/xq/interface'
import { useRoute } from 'vue-router'
import { getYearData } from '@/api/common'

interface Params {
  [key: string]: string
}

const loading = ref(false)
const activeStep = ref(1)
const isShowPage = ref(false)
const notifyNumber = ref<number>(0)
const myCartRef = ref()
const store = useStore()
const operationBtn = ref<MenuConfig[]>([])
const searchBtn = ref<MenuConfig[]>([])
const route = useRoute()

const isDisabled = computed(() => loading.value)

const userInfOther = ref()
const formOneRef = ref()
const proTypeName = ref('')
const excelData = ref([])
const ndList = ref([])
const attachData = ref<any[]>([])
const attachFile = ref()
const xlsxFile = ref()

const changeHandle = (_value: any, globalParams: any) => {
  if (_value) {
    proTypeName.value = globalParams['name']
    flag.value = false
  }
}

const formData = reactive<Params>({
  proTypeId: ''
})
const formRules = reactive({
  proTypeId: [
    {
      required: true,
      trigger: 'change',
      message: '请选择项目类型'
    }
  ]
})

const proTypeTreeData = ref([])
const uploadRef = ref()

const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  userName: string
  userId: string
  roleId: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: '',
  roleId: '',
  userName: '',
  userId: ''
})

const isChange = ref(false)

const flag = ref(false)
// 父组件传过来的参数
const fileTypeOne = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
const fileTypeTwo = ['application/x-zip-compressed']

const onRemoveFile = () => {
  flag.value = false
}

const uploadExcel = async (param: any, type: string) => {
  const { file, onSuccess, onError } = param
  // 校验信息
  if (type === 'xmExcel') {
    try {
      loading.value = true
      let excelFormData = new FormData()
      excelFormData.append('file', param.file)
      const params = {
        currentUserBmId: userInfo.value?.deptId || '',
        currentUserDwId: userInfo.value?.dwId || '',
        proTypeId: formData.proTypeId,
        file: excelFormData
      }
      const name = param.file?.name
      const res = await xmExcelVerify(params)
      if (res.success) {
        if (res.data.successful) {
          excelData.value = []
          flag.value = true
          ElMessage.success('模板内容填写正确,请继续进行下一步操作!')
          xlsxFile.value = param
          onSuccess()
        } else {
          const data: any = []
          res.data.error.forEach((item: any) => {
            if (item.error && Array.isArray(item.error)) {
              item.error.forEach((e: any) => {
                let errorMsg: any = {
                  rowNo: item.rowNo,
                  xmbm: item.xmbm,
                  xmmc: item.xmmc,
                  name: name
                }
                errorMsg['error'] = e
                data.push(errorMsg)
              })
            }
          })
          ElMessage.error('模板内容填写错误,请根据列表中内容检查错误!')
          // 清空上传失败的文件
          if (uploadRef.value && uploadRef.value.clearFiles) {
            uploadRef.value.clearFiles()
          }
          flag.value = false
          excelData.value = data
        }
      } else {
        ElMessage.error(res.msg)
      }
    } finally {
      loading.value = false
    }
  } else {
    const file = param.file
    let excelFormData = new FormData()
    excelFormData.append('file', param.file)
    attachData.value = [
      {
        fileName: file.name
      }
    ]
    attachFile.value = param
  }
}

const spanMethod: VxeTablePropTypes.SpanMethod<any> = ({ row, _rowIndex, column, visibleData }) => {
  const fields = ['rowNo', 'xmbm', 'xmmc', 'name']
  const cellValue = row[column.field]
  if (cellValue && fields.includes(column.field)) {
    const prevRow = visibleData[_rowIndex - 1]
    let nextRow = visibleData[_rowIndex + 1]
    if (prevRow && prevRow[column.field] === cellValue) {
      return {
        rowspan: 0,
        colspan: 0
      }
    } else {
      let countRowSpan = 1
      while (nextRow && nextRow[column.field] === cellValue) {
        nextRow = visibleData[++countRowSpan + _rowIndex]
      }
      if (countRowSpan > 1) {
        return {
          rowspan: countRowSpan,
          colspan: 1
        }
      }
    }
  }
}

/**
 * @description 文件上传之前判断
 * @param file 上传的文件
 * @param type
 * */
const beforeExcelUpload = (file: any, type: string) => {
  const fileType = type === 'xmExcel' ? fileTypeOne : fileTypeTwo
  const isExcel = fileType?.includes(file.type as File.ExcelMimeType)
  if (!isExcel)
    if (type === 'xmExcel') {
      ElMessage({
        message: '上传文件只能是 xls / xlsx 格式！',
        type: 'warning'
      })
    } else {
      ElMessage({
        message: '上传文件只能是 zip 格式！',
        type: 'warning'
      })
    }

  return isExcel
}

const steps = ref([
  { stepId: '1', stepName: '需求模板下载', stepType: '1' },
  { stepId: '2', stepName: '需求信息导入', stepType: '2' },
  { stepId: '3', stepName: '附件信息上传', stepType: '3' }
])

const prevStep = () => {
  if (activeStep.value > 1) {
    activeStep.value--
  }
}

const nextStep = async () => {
  try {
    if (activeStep.value === 1) {
      await formOneRef.value.validate()
      isChange.value = false
    }
    if (activeStep.value === 2) {
      if (!flag.value) {
        ElMessage.error('请正确填写模板内容!')
        return
      }
    }
    activeStep.value++
  } catch (error: any) {
    ElMessage.error('请填写完毕后,再点击下一步!')
  }
}

const downloadHandle = async () => {
  const validate = await formOneRef.value.validate()
  if (validate) {
    loading.value = true
    const params = {
      currentUserBmId: userInfo.value?.deptId || '',
      currentUserDwId: userInfo.value?.dwId || '',
      proTypeId: formData.proTypeId,
      nd: formData.nd
    }
    importTemplateDownload(params).then((res: any) => {
      const blob = res
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      // 获取文件名
      let filename = proTypeName.value + '-模板下载.xlsx'
      dom.download = `${decodeURI(decodeURI(filename))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
      loading.value = false
    })
  }
}

const submitForm = async () => {
  const type = await VXETable.modal.confirm('是否确认导入?', '提示', {
    confirmButtonText: '是',
    cancelButtonText: '否',
    showClose: false
  })
  if (type === 'confirm') {
    let id = ''
    let name = ''
    if (store && store.getters.getUserMsg) {
      const user = store.getters.getUserMsg
      id = user.id
      name = user.name
    }
    const formDatas = new FormData()

    if (xlsxFile.value) formDatas.append('xmExcel', xlsxFile.value.file)
    if (attachFile.value) formDatas.append('xmAttach', attachFile.value.file)
    const params = {
      currentUserBmId: userInfo.value?.deptId || '',
      currentUserDwId: userInfo.value?.dwId || '',
      currentUserBmName: userInfo.value?.deptName || '',
      currentUserDwName: userInfo.value?.dwName || '',
      proTypeId: formData.proTypeId,
      currentUserId: id || '',
      currentUserName: name || '',
      file: formDatas
    }
    const res = await xmImport(params)
    if (res.success) {
      ElMessage.success('导入成功')
      await showHandle(userInfo.value.dwId, userInfo.value.deptId)
      closeHandle()
    } else {
      ElMessage.error(res.msg)
      return
    }
  }
}

const showHandle = async (dwId: string, bmId: string) => {
  const xqlrNum = await getXqlrNum({
    bmId: bmId || '',
    dwId: dwId || '',
    sfzl: '0'
  })
  if (xqlrNum.success) {
    notifyNumber.value = xqlrNum.data
  }
}

const closeHandle = () => {
  activeStep.value = 1
  xlsxFile.value = null
  attachFile.value = null
  flag.value = false
  attachData.value.length = 0
  excelData.value.length = 0
  if (uploadRef.value && uploadRef.value.clearFiles) {
    uploadRef.value.clearFiles()
  }
}

const handleShopping = () => {
  myCartRef.value.isShowModal = true
}

const userDialogRef = ref()

const getRoleHandle = async () => {
  try {
    loading.value = true
    const isQuery = userDialogRef.value.isQuery
    userInfOther.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfOther.value.specialorgid}`)
      if (flagData.success && flagData.data) {
        const userInfoOthers = {
          userId: userInfOther.value.userId,
          userName: userInfOther.value.userName,
          deptId: userInfOther.value.specialorgid,
          deptName: userInfOther.value.specialorgname,
          dwId: userInfOther.value.org_id,
          dwName: userInfOther.value.org_name,
          roleId: userInfOther.value.role_id,
          roleCode: userInfOther.value.code,
          spRoleId: userInfOther.value.id,
          specialorgcode: userInfOther.value.specialorgcode,
          fqzzFlag: flagData.data
        }
        userInfo.value = userInfoOthers
        store.commit('setXqGlobalInfo', userInfoOthers)
        await showHandle(userInfOther.value.org_id, userInfOther.value.specialorgid)
        await getProTypeTreeData(userInfOther.value.specialorgid, userInfOther.value.org_id)
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getProTypeTreeData = async (deptId: string, dwId: string) => {
  proTypeTreeData.value.length = 0
  const res = await getProtypeTreeNoMiddle()
  if (!res.success) {
    throw new Error(res.msg)
  }
  proTypeTreeData.value = res.data
}

const getYearDataList = async () => {
  const res = await getYearData()
  if (res.success) {
    ndList.value = res.data
    formData.nd = new Date().getFullYear().toString()
  } else {
    ElMessage.error(res.msg)
  }
}

onMounted(async () => {
  const isRoel = await useUser()
  if (isRoel && route.params.formJsc) {
    const xqGlobalInfo = store.getters.getXqGlobalInfo
    isShowPage.value = true
    userInfo.value = {
      ...(xqGlobalInfo as any)
    }
    await getProTypeTreeData(userInfo.value.deptId, userInfo.value.dwId)
    await getYearDataList()
    await showHandle(userInfo.value.dwId, userInfo.value.deptId)
  } else {
    await getYearDataList()
    const operationRes = await getAppMenu({
      appNo: 'XQK',
      label: '1'
    })
    const searchRes = await getAppMenu({
      appNo: 'XQK',
      label: '2'
    })
    if (operationRes.success && searchRes.success) {
      operationBtn.value = operationRes.data
      searchBtn.value = searchRes.data
    }
    await userDialogRef.value.getUser()
  }
})
</script>

<style lang="less" scoped>
.form-content {
  .form-panel:first-of-type {
    max-width: 500px !important;
  }
}

.project-form-prototype {
  padding: 10px;
  height: 100%;
  min-height: 100%;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-container {
  height: 100%;
  width: 100%;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  padding: 20px;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
}

.steps-nav {
  height: 70px;
  border-radius: 8px;
  display: flex;

  .step {
    height: 100%;
    flex: 1;
    min-width: 0;
    min-height: 0;
    margin: 0 10px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to right, #e8f4f4, #c6e9e5);
    padding: 0 20px;
    color: #009895;

    .font {
      flex: 1;
      min-width: 0;
      min-height: 0;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
    }

    img {
      width: 30px;
    }
  }

  .step-selected {
    background: linear-gradient(to right, #00b7b2, #008880);
    color: white;
  }

  .allow {
    line-height: 70px;
  }

  .myCart {
    margin-left: 20px;
    width: 160px;
    height: 100%;
    background: linear-gradient(to right, #028381, #276b8d);
    border-radius: 10px;
    display: flex;
    cursor: pointer;

    .main {
      flex: 1;
      min-width: 0;
      min-height: 0;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-left: 20px;

      .title {
        font-size: 12px;
        padding-bottom: 10px;
      }

      .number {
        font-size: 20px;
      }
    }

    .pic {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;

      img {
        width: 65px;
      }
    }
  }
}

.form-panel-2 {
  padding: 0 15% !important;
  overflow: auto;
  display: flex;
  flex-direction: column;

  .left,
  .right {
    min-width: 600px;
  }

  .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  .title {
    font-size: 16px;
    font-weight: bold;
    margin: 20px 0;
  }

  .main {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  :deep(.el-upload) {
    width: 100% !important;
  }

  :deep(.el-upload-dragger) {
    width: 100% !important;
  }

  .main {
    width: 100%;
  }
}

.form-main {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #cccccc;
  border-radius: 8px;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.form-title {
  margin-bottom: 25px;
  padding-left: 12px;
  border-left: 4px solid #409eff;
}

.form-title h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.form-content {
  border-radius: 8px;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.form-panel {
  flex: 1;
  min-width: 500px;
  min-height: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  padding: 0 50px;
}

.form-panel-1 {
  min-width: 600px;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.el-form) {
    min-width: 600px;
  }

  :deep(.el-button) {
    width: 100px;
    border-radius: 8px;
  }
}

.form-actions {
  display: flex;
  justify-content: center;
  padding: 10px 0 0 0;
  border-top: 1px solid #ebeef5;
  margin-top: 10px;
}

.form-actions .el-button {
  min-width: 130px;
  margin: 0 20px;
  padding: 12px 20px;
  font-size: 15px;
}
</style>
