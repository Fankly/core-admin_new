<!-- 项目财务初审-新增/编辑/查看 -->
<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      v-model="isShowModal"
      destroy-on-close
      show-footer
      :title="modalParams.type"
      width="60%"
      height="600px"
      @close="reset"
      :loading="loading"
    >
      <el-tabs v-model="tabsPages">
        <el-tab-pane label="基本信息" name="1" />
        <el-tab-pane label="动因维护" name="2" />
        <el-tab-pane label="附件维护" name="3" />
      </el-tabs>
      <div v-if="tabsPages == '1'" style="height: 400px; overflow: hidden; overflow-y: auto">
        <el-form ref="ruleFormRef" label-suffix=":" :disabled="isDisabled" label-width="150px" label-position="right" :model="searchParams">
          <el-row :gutter="0">
            <el-col :span="12">
              <el-form-item label="部门" prop="dept" :rules="[{ required: true, message: '请输入部门' }]">
                <el-select v-model="searchParams.dept" clearable filterable placeholder="请选择属性" style="width: 100%" :disabled="isEditMc">
                  <el-option v-for="item in deptList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="一级" prop="yj" :rules="[{ required: true, message: '请输入一级' }]">
                <el-input clearable :maxlength="128" show-word-limit v-model.trim="searchParams.yj" placeholder="请输入一级" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="二级" prop="ej" :rules="[{ required: true, message: '请输入二级' }]">
                <el-input clearable :maxlength="128" show-word-limit v-model.trim="searchParams.ej" placeholder="请输入二级" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="三级" prop="sj" :rules="[{ required: true, message: '请输入三级' }]">
                <el-input clearable :maxlength="128" show-word-limit v-model.trim="searchParams.sj" placeholder="请输入三级" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目名称" prop="xmmc" :rules="[{ required: true, message: '请输入项目名称' }]">
                <el-input
                  clearable
                  :maxlength="256"
                  show-word-limit
                  v-model.trim="searchParams.xmmc"
                  placeholder="请输入项目名称"
                  :disabled="isEditMc"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="属性" prop="sx" :rules="[{ required: true, message: '请选择属性' }]">
                <el-select v-model="searchParams.sx" clearable filterable placeholder="请选择属性" style="width: 100%">
                  <el-option v-for="item in sxList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="必要性依据" prop="byxyj" :rules="[{ required: true, message: '请输入必要性依据' }]">
                <el-input
                  resize="none"
                  clearable
                  type="textarea"
                  :maxlength="2000"
                  show-word-limit
                  :rows="3"
                  v-model.trim="searchParams.byxyj"
                  placeholder="请输入必要性依据"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="专业细分" prop="zyxf" :rules="[{ required: true, message: '请选择专业细分' }]">
                <el-select v-model="searchParams.zyxf" clearable filterable placeholder="请选择专业细分" style="width: 100%">
                  <el-option v-for="item in zyxfList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="安排类型" prop="aplx" :rules="[{ required: true, message: '请选择安排类型' }]">
                <el-select v-model="searchParams.aplx" clearable filterable placeholder="请选择安排类型" style="width: 100%">
                  <el-option v-for="item in aplxList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否预安排" prop="sfyap" :rules="[{ required: true, message: '请选择是否预安排' }]">
                <el-select v-model="searchParams.sfyap" clearable filterable placeholder="请选择是否预安排" style="width: 100%">
                  <el-option v-for="item in sfList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="工作内容" prop="whnr" :rules="[{ required: true, message: '请输入工作内容' }]">
                <el-input
                  resize="none"
                  clearable
                  type="textarea"
                  :maxlength="2000"
                  show-word-limit
                  :rows="3"
                  v-model.trim="searchParams.whnr"
                  placeholder="请输入工作内容"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="评价指标" prop="pjzb" :rules="[{ required: true, message: '请输入评价指标' }]">
                <el-input clearable :maxlength="256" show-word-limit v-model.trim="searchParams.pjzb" placeholder="请输入评价指标" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否一事一议" prop="isYsyy" :rules="[{ required: true, message: '请选择是否一事一议' }]">
                <el-select v-model="searchParams.isYsyy" clearable filterable placeholder="请选择是否一事一议" style="width: 100%">
                  <el-option v-for="item in ysyyList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="情况说明" prop="qksm" :rules="[{ required: searchParams.isYsyy == '1', message: '请输入情况说明' }]">
                <el-input clearable :maxlength="256" show-word-limit v-model.trim="searchParams.qksm" placeholder="请输入情况说明" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="是否涉及核心业务" prop="sjsbyjhxyw">
                <el-input
                  clearable
                  :maxlength="256"
                  disabled
                  show-word-limit
                  v-model.trim="searchParams.sjsbyjhxyw"
                  placeholder="请输入是否涉及核心业务"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" v-if="searchParams.sx == '0'">
              <div style="margin-left: 30px">
                <div class="section-title">资产信息</div>
                <div style="margin-bottom: 10px" v-if="!isDisabled">
                  <el-button type="primary" plain size="mini" @click="addHandle(-1)">新 增</el-button>
                  <el-button type="primary" plain size="mini" @click="delHandle">删 除</el-button>
                </div>
                <vxe-table
                  keep-source
                  :edit-config="{
                    trigger: 'click',
                    mode: 'cell',
                    showStatus: true
                  }"
                  ref="tableRef"
                  resizable
                  show-overflow
                  show-header-overflow
                  align="center"
                  header-align="center"
                  border
                  stripe
                  :row-config="{ height: 32 }"
                  height="200px"
                  :data="zcxxList"
                >
                  <vxe-column type="checkbox" width="60" />
                  <vxe-column width="400" field="zcmc" title="资产名称" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
                    <template #edit="{ row }">
                      <input class="my-sbsm" maxlength="127" v-model="row['zcmc']" />
                    </template>
                  </vxe-column>
                  <vxe-column width="200" field="zcyz" title="资产原值(元)" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
                    <template #edit="{ row }">
                      <input class="my-sbsm" maxlength="127" v-model="row['zcyz']" />
                    </template>
                  </vxe-column>
                </vxe-table>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <dytable
        :is-disabled="isDisabled"
        :zxcsspstatus="zxcsspstatus"
        :creatorAccount="searchParams.creatorAccount"
        :table-data="dyTableData"
        :user-info="userInfo"
        @save-dy="getDyData"
        :xmid="searchParams.id"
        v-if="tabsPages == '2'"
      />
      <fileModal
        :is-disabled="isDisabled"
        :file-type-list="fileTypeList"
        :file-list="fileList"
        :xmid="searchParams.id"
        @save-file="handleFile"
        v-if="tabsPages == '3'"
      />
      <template #footer>
        <div style="text-align: center">
          <el-button v-if="tabsPages == '1' && !isDisabled" size="mini" v-debounce="[save, `click`, 300]" type="primary"> 保 存 </el-button>
          <el-button size="mini" v-debounce="[reset, `click`, 300]" plain> 关 闭 </el-button>
        </div>
      </template>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'xmModal'
}
</script>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { saveOrUpdateHandler } from '@/api/service/xmcs/index'
import dytable from '@/views/service/xmcs/components/dytable.vue'
import fileModal from '@/views/service/xmcs/components/fileModal.vue'
import { queryById, getZxcsAttach } from '@/api/service/xmcs/index'
import { getPublicCodesList } from '@/api/common'
import { VXETable } from 'vxe-table'

interface ModalProps {
  type: string
  searchParams: Partial<any>
}
interface Props {
  userInfo?: Record<string, any>
}
defineProps<Props>()
const tabsPages = ref('1')
const tableRef = ref()
const searchParams = ref<any>({})
const isShowModal = ref<boolean>(false)
const ruleFormRef = ref()
const loading = ref<boolean>(false)
const dyTableData = ref<any[]>([])
const fileList = ref<any[]>([])
const fileTypeList = ref<any[]>([])
const codesList = ref<any>({})
const isDisabled = ref<boolean>(false)
const isEditMc = ref<boolean>(false)
const zxcsspstatus = ref<string>('')
const modalParams = ref<ModalProps>({
  type: '',
  searchParams: {}
})
const zcxxList = ref<any[]>([])

const zyxfList = ref<any[]>([])
const aplxList = ref<any[]>([])
const gjwdList = ref<any[]>([])
const sfList = ref<any[]>([])
const sxList = ref<any[]>([])
const deptList = ref<any[]>([])
const ysyyList = ref<any[]>([])

const emits = defineEmits(['searchHandle'])

// 保存
const save = () => {
  try {
    ruleFormRef.value.validate(async (valid: any) => {
      if (!valid) return
      if (searchParams.value.sx == '0') {
        if (zcxxList.value.length == 0) {
          ElMessage.warning('属性为动因资产，资产信息必填')
          return
        } else {
          const isNull = zcxxList.value.some((item: any) => item.zcmc == '' || item.zcyz == '')
          if (isNull) {
            ElMessage.warning('属性为动因资产息不能为空!')
            return
          }
        }
      }

      const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', {
        status: 'warning'
      })
      if (type !== 'confirm') return ElMessage.info('已取消')
      searchParams.value.zcxxDTO = zcxxList.value
      let res = await saveOrUpdateHandler([{ ...searchParams.value }])
      if (!res.success) return ElMessage.error(res.msg)
      ElMessage.success('保存成功！')
      reset()
    })
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

// 关闭
const reset = () => {
  clear()
}
// 更新动因信息
const getDyData = async () => {
  const codes = await getPublicCodesList({ codes: ['NUMSOURCE_COM', 'ZXCSXGLX_COM'] })
  codesList.value = codes.data
  const param = {
    creatorAccount: searchParams.value.creatorAccount,
    id: searchParams.value.id
  }
  let res: any = await queryById({ ...param })
  if (res.success) {
    const data = res.data.records
    data[0].dyList.forEach((dy: any) => {
      dy.sfxjName = dy.sfxj == '1' ? '是' : '否'
      const xglxName = codesList.value[1].codes.filter((code: any) => code.code == dy.xglx)
      dy.xglxName = xglxName.length != 0 ? xglxName[0].name : ''
      const gzllyyjName = codesList.value[0].codes.filter((code: any) => code.code == dy.gzllyyj)
      dy.gzllyyjName = gzllyyjName.length != 0 ? gzllyyjName[0].name : ''
      dy.bz = dy.dyBz
    })
    zcxxList.value = data[0].zcxxList || []
    zxcsspstatus.value = data[0].zxcsspstatus || ''
    isEditMc.value = data[0].zxcsstatus != '0' || modalParams.value.type == '查看'
    searchParams.value = { ...data[0], creator: searchParams.value.creator, creatorAccount: searchParams.value.creatorAccount }
    dyTableData.value.length = 0
    dyTableData.value = data[0].dyList.filter((dy: any) => dy.sheetname != null && dy.sheetname != '')
  }
}
// 获取公共代码
const getPublicCodes = async () => {
  zyxfList.value.length = 0
  aplxList.value.length = 0
  gjwdList.value.length = 0
  sfList.value.length = 0
  sxList.value.length = 0
  deptList.value.length = 0
  fileTypeList.value.length = 0
  ysyyList.value.length = 0
  const codes = await getPublicCodesList({
    codes: ['ZXCSZYXF_COM', 'ZXCSAPLX_COM', 'ZXCSGJWD_COM', 'GY_SF', 'ZXCSSX_COM', 'ZXCSFJLX_COM', 'ZXCSBM_COM', 'IS_YSYY_COM']
  })
  if (!codes.success) return ElMessage.warning(codes.msg)
  const codesData = codes.data
  zyxfList.value = codesData[0].codes
  aplxList.value = codesData[1].codes
  gjwdList.value = codesData[2].codes
  sfList.value = codesData[3].codes
  sxList.value = codesData[4].codes
  fileTypeList.value = codesData[5].codes || []
  deptList.value = codesData[6].codes || []
  ysyyList.value = codesData[7].codes || []
}
//更新附件信息
const handleFile = async (val: any) => {
  const params = {
    xmId: searchParams.value.id || '',
    attachType: val
  }
  const res = await getZxcsAttach({ ...params })
  if (!res.success) return ElMessage.error(res.msg)
  fileList.value = res.data
}
// 清空
const clear = () => {
  emits('searchHandle', { param: 'success' })
  fileList.value.length = 0
  dyTableData.value.length = 0
  zcxxList.value.length = 0
  isDisabled.value = false
  isEditMc.value = false
  searchParams.value = {}
  isShowModal.value = false
}
// 打开触发事件
const acceptParams = (params: ModalProps) => {
  isShowModal.value = true
  tabsPages.value = '1'
  modalParams.value = { ...params }
  searchParams.value = { ...params.searchParams }
  isDisabled.value = modalParams.value.type == '查看'
  getPublicCodes()
  fileList.value.length = 0
  dyTableData.value.length = 0
  zcxxList.value.length = 0
  if (modalParams.value.type == '新增') return
  getDyData()
  handleFile('1')
}

const addHandle = async (row?: number) => {
  const $table = tableRef.value
  if ($table) {
    zcxxList.value.push({
      id: '',
      xmid: searchParams.value.id || '',
      zcmc: '',
      zcyz: ''
    })
  }
}

const delHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    const selectRecords = $table.getCheckboxRecords()
    if (selectRecords.length != 1) {
      ElMessage.warning('请选择一条数据进行删除')
      return
    }
    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      const chooseData = selectRecords[0]
      zcxxList.value.forEach((item: any, index: any) => {
        if (chooseData.id == item.id && chooseData.zcmc == item.zcmc && chooseData.zcyz == item.zcyz) {
          zcxxList.value.splice(index, 1)
        }
      })
    }
  }
}

defineExpose({
  acceptParams
})
</script>
<style scoped lang="less">
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 2px solid var(--color-primary, #00857c);
  line-height: 1.2;
}
</style>
