<template>
  <vxe-modal
    :loading="loading"
    @close="closeHandle"
    @show="showHandle"
    position="center"
    resize
    :title="matterBasicMsg.title"
    width="1000"
    v-model="isShowModal"
  >
    <div class="container">
      <div class="title">
        <span>事项基本信息</span>
      </div>
      <div class="content">
        <el-form ref="formRef" :model="formData" label-position="right" label-width="180px" :rules="rulesForm">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预算事项编码：" prop="zyssxbm">
                <el-input maxlength="80" placeholder="请选择" v-model="formData.zyssxbm" disabled>
                  <template #append>
                    <el-button :disabled="props.matterBasicMsg.opType == 'EDIT'" class="el-icon-more" @click="handleSearch" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预算事项名称：" prop="zyssxmc">
                <el-input maxlength="80" placeholder="请输入" v-model="formData.zyssxmc"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="年度：" prop="nd">
                <el-date-picker
                  placeholder="请选择"
                  clearable
                  format="YYYY"
                  value-format="YYYY"
                  style="width: 100%"
                  v-model="formData.nd"
                  type="year"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="省归口部门：" prop="zgkbmId">
                <el-select style="width: 100%" v-model="formData.zgkbmId" @change="changeGkbmDataHandle">
                  <el-option v-for="(item, index) in searchList.gkbmList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目类型：" prop="xmlx">
                <ElTreeSelect
                  ref="xmlxRef"
                  @change="changeXmlxHandle"
                  v-model="formData.xmlx"
                  :props="{
                    label: 'name',
                    children: 'children',
                    value: 'id'
                  }"
                  node-key="id"
                  :data="searchList.projectTypeList"
                  :clearable="false"
                ></ElTreeSelect>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="重点投向：" prop="yslxctId">
                <el-select style="width: 100%" v-model="formData.yslxctId" @change="changeYjflDataHandle">
                  <el-option v-for="(item, index) in searchList.yslxctList" :key="index" :label="item.ctmc" :value="item.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="一级分类：" prop="yjfl">
                <el-select style="width: 100%" v-model="formData.yjfl" @change="changeYjflDataHandle" clearable>
                  <el-option v-for="(item, index) in searchList.yjflList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="二级分类：" prop="ejfl">
                <el-select style="width: 100%" v-model="formData.ejfl" @change="changeEjflDataHandle" clearable>
                  <el-option v-for="(item, index) in searchList.ejflList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="三级分类：" prop="sjfl">
                <el-select style="width: 100%" v-model="formData.sjfl" clearable>
                  <el-option v-for="(item, index) in searchList.sjflList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <!-- </el-row>
          <el-row :gutter="20"> -->
            <el-col :span="12">
              <el-form-item label="是否安全生产：" prop="sfaqsc">
                <el-select style="width: 100%" v-model="formData.sfaqsc" clearable>
                  <el-option v-for="(item, index) in searchList.isAq" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="formData.sfaqsc === '0'">
              <el-form-item label="安全生产费用类型：" prop="aqscfylx">
                <el-select style="width: 100%" v-model="formData.aqscfylx">
                  <el-option v-for="(item, index) in searchList.aqscfylxList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="研发投入统计范围：" prop="zyfjftrtjfw">
                <el-select style="width: 100%" v-model="formData.zyfjftrtjfw" clearable>
                  <el-option v-for="(item, index) in searchList.isList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态：" prop="status">
                <el-select style="width: 100%" v-model="formData.status" clearable>
                  <el-option v-for="(item, index) in searchList.statusList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否调度端：" prop="isDispatch">
                <el-select style="width: 100%" v-model="formData.isDispatch" clearable>
                  <el-option v-for="(item, index) in searchList.isList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预算来源：" prop="ysly">
                <el-select style="width: 100%" v-model="formData.ysly" clearable>
                  <el-option v-for="(item, index) in searchList.yslyList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否需要省归口审批：" prop="sfxysgksp">
                <el-select style="width: 100%" v-model="formData.sfxysgksp" clearable>
                  <el-option v-for="(item, index) in searchList.isList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="省公司归口处室：" prop="gkcsId">
                <el-select style="width: 100%" v-model="formData.gkcsId" clearable>
                  <el-option v-for="(item, index) in searchList.gkcsList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计划类型：" prop="jhlx">
                <el-select style="width: 100%" v-model="formData.jhlx" clearable>
                  <el-option v-for="(item, index) in searchList.jhlxList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="财务评审要点：" prop="cwpsyd">
                <el-input maxlength="500" v-model="formData.cwpsyd" type="textarea" :rows="3" resize="none"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="预算事项说明：" prop="remark">
                <el-input maxlength="127" v-model="formData.remark" type="textarea" :rows="5" resize="none"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="operation">
        <el-button plain type="primary" size="mini" @click="saveHandle">保 存</el-button>
        <el-button plain type="primary" size="mini" @click="closeHandle">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowTable"
    :destroy-on-close="true"
    title="预算事项编码"
    width="860"
    :height="700"
    :close-on-press-escape="false"
    @close="closeModal"
  >
    <proTable
      ref="proTableRef"
      :cell-style="columnStyle"
      @cell-click="runTask"
      :data-callback="pageList"
      :request-api="pageMeeting"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
    >
      <template #tableHeader="scope">
        <el-button plain type="primary" size="mini" :disabled="!scope.isSelected" @click.stop="saveModal(scope.selectedList)">确 定</el-button>
      </template>
    </proTable>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'MatterBasicOperation'
}
</script>
<script setup lang="ts">
import { ref, defineExpose, defineEmits, defineProps, reactive, watch, nextTick } from 'vue'
import { getYESJFL, saveMatterBasicData, SaveYssxMsg } from '@/api/matter/matterBasic'
import { getGkbmInProvince, getProtypeTreeByGkbm, getPublicCodeList, getPublicData, pageCommonCode, getGkcsByGkbm } from '@/api/common'
import { ElMessage } from 'element-plus'
import ElTreeSelect from '@/components/ElTreeSelect'
import { getYslxct } from '@/api/matter/yssxMatter'
import proTable from '@/components/ProTable/index.vue' //表格组件

interface MatterBasicMsg {
  title: string
  opType: string
}

interface Props {
  matterBasicMsg: MatterBasicMsg
  selectedData: any
}

interface RowVO {
  code: string
  name: string
  id: any
  note: any
  unicode: any
  [key: string]: number | string
}

const props = defineProps<Props>()

const emit = defineEmits(['saveData'])

const xmlxRef = ref()
const formRef = ref()

const isShowModal = ref(false)
const loading = ref(false)

const checkCodes = ref<any>([])

const isShowTable = ref<boolean>(false)
const proTableRef = ref()

const formData = reactive<SaveYssxMsg>({
  ejfl: '',
  remark: '',
  sjfl: '',
  xmlx: '',
  yjfl: '',
  yslxctId: '',
  zgkbmId: '',
  zyssxbm: '',
  zyssxmc: '',
  sfaqsc: '',
  isDispatch: '',
  zyfjftrtjfw: '',
  aqscfylx: '',
  ysly: '',
  status: '',
  nd: '',
  sfxysgksp: '',
  cwpsyd: '',
  jhlx: '',
  gkcsId: ''
})

const searchList = reactive({
  zyssxbmList: [],
  projectTypeList: [],
  gkbmList: [],
  yjflList: [],
  ejflList: [],
  sjflList: [],
  yslxctList: [],
  aqscfylxList: [],
  yslyList: [],
  jhlxList: [],
  gkcsList: [],
  isAq: [
    {
      name: '是',
      code: '0'
    },
    {
      name: '否',
      code: '1'
    }
  ],
  isList: [
    {
      name: '是',
      code: '1'
    },
    {
      name: '否',
      code: '0'
    }
  ],
  statusList: [
    {
      name: '启用',
      code: '1'
    },
    {
      name: '停用',
      code: '0'
    }
  ]
})
const validateIsDispatch = (rule: any, value: any, callback: any) => {
  if (formData.sjfl) {
    const result = checkCodes.value.includes(formData.sjfl)
    if (result) {
      if (!value) callback(new Error('请选择是否调度端'))
      else callback()
    } else {
      value ? callback(new Error('选择的三级分类不能选择是否调度端')) : callback()
    }
  } else {
    value ? callback(new Error('没有选择三级分类不能选择是否调度端')) : callback()
  }
}

const validateAqscfylx = (rule: any, value: any, callback: any) => {
  if (formData.sfaqsc === '0' && !value) {
    callback(new Error('请选择安全生产费用类型'))
  } else {
    callback()
  }
}

const rulesForm = reactive({
  zyssxbm: [{ required: true, message: '请输入预算事项编码', trigger: ['blur'] }],
  zyssxmc: [{ required: true, message: '请输入预算事项名称', trigger: ['blur'] }],
  nd: [{ required: true, message: '请输入年度', trigger: ['change'] }],
  zgkbmId: [{ required: true, message: '请选择省归口部门', trigger: ['change'] }],
  xmlx: [{ required: true, message: '请选择项目类别', trigger: ['change'] }],
  yslxctId: [{ required: true, message: '请选择预算事项词条', trigger: ['change'] }],
  yjfl: [{ required: true, message: '请选择一级分类', trigger: ['change'] }],
  ejfl: [{ required: true, message: '请选择二级分类', trigger: ['change'] }],
  // sfaqsc: [{ required: true, message: "请选择是否安全生产", trigger: ["change"] }],
  status: [{ required: true, message: '请选择启用状态', trigger: ['change'] }],
  ysly: [{ required: true, message: '请选择预算来源', trigger: ['change'] }],
  // zyfjftrtjfw: [{ required: true, message: "请选择研发投入统计范围", trigger: ["change"] }],
  isDispatch: [{ validator: validateIsDispatch, trigger: 'change' }],
  aqscfylx: [{ validator: validateAqscfylx, trigger: 'change' }]
})

const changeGkbmDataHandle = (val: string) => {
  if (!val) return
  searchList.projectTypeList.length = 0
  searchList.yslxctList.length = 0
  searchList.gkcsList.length = 0
  formData.yslxctId = ''
  formData.xmlx = ''
  formData.gkcsId = ''
  getProtypeTreeByGkbmData(val)
  getGkcsListData(val)
}

// 根据省归口部门获取省公司归口处室
const getGkcsListData = async (gkbmId: string) => {
  const res = await getGkcsByGkbm(gkbmId)
  if (res.success) {
    searchList.gkcsList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const changeXmlxHandle = async (val: string) => {
  clearableHandle('XMLX')
  if (val) {
    getClassifyDataList('YJFL', val)
    getYslxctData(formData.zgkbmId, val)
  }
}

const getYslxctData = async (zgkbmId: string, protypeId: string) => {
  const yssxListData = await getYslxct(zgkbmId, protypeId)
  if (yssxListData.success) {
    searchList.yslxctList = yssxListData.data
  }
}

const getProtypeTreeByGkbmData = async (gkbmId: string) => {
  const res = await getProtypeTreeByGkbm(gkbmId)
  if (res.success) {
    searchList.projectTypeList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const clearableHandle = (flag: string) => {
  if (flag === 'XMLX') {
    formData.yjfl = ''
    formData.ejfl = ''
    formData.sjfl = ''
    formData.yslxctId = ''
    searchList.yjflList.length = 0
    searchList.ejflList.length = 0
    searchList.sjflList.length = 0
    searchList.yslxctList.length = 0
  }
  if (flag === 'SJFL') {
    formData.sjfl = ''
    searchList.sjflList.length = 0
  }
  if (flag === 'EJFL') {
    formData.ejfl = ''
    formData.sjfl = ''
    searchList.ejflList.length = 0
    searchList.sjflList.length = 0
  }
}

const getPublicDataList = async () => {
  try {
    const res = await getPublicCodeList({
      codes: ['DDXTSJFLDZGX', 'AQSCFYLX_COM', 'XMLB_YSLY', 'XMLB_JHLX']
    })
    if (res.success) {
      checkCodes.value = [...new Set(res.data['DDXTSJFLDZGX'].map((item: any) => item.code.split(',')[0]))]
      searchList.aqscfylxList = res.data['AQSCFYLX_COM']
      searchList.yslyList = res.data['XMLB_YSLY']
      searchList.jhlxList = res.data['XMLB_JHLX']
    }
  } catch (e: any) {
    ElMessage.error(e.toString())
  }
}

const showHandle = () => {
  getPublicDataList()
  // getYssxbmData();
  getProGkbmData()
  if (props.matterBasicMsg.opType === 'EDIT' && props.selectedData) {
    loading.value = true
    getYslxctData(props.selectedData.zgkbmId, props.selectedData.xmlx)
    if (props.selectedData.yjfl) getClassifyDataList('YJFL', props.selectedData.xmlx)
    if (props.selectedData.ejfl) {
      getClassifyDataList('EJFL', props.selectedData.xmlx, props.selectedData.yjfl)
      getClassifyDataList('SJFL', props.selectedData.xmlx, props.selectedData.ejfl)
    }
    getProtypeTreeByGkbm(props.selectedData.zgkbmId).then((res) => {
      if (res.success) {
        searchList.projectTypeList = res.data
        formData.yslxctId = props.selectedData.yslxctId
        formData.zyssxmc = props.selectedData.zyssxmc
        formData.yjfl = props.selectedData.yjfl
        formData.xmlx = props.selectedData.xmlx
        formData.zgkbmId = props.selectedData.zgkbmId
        formData.remark = props.selectedData.remark
        formData.ejfl = props.selectedData.ejfl
        formData.sjfl = props.selectedData.sjfl
        formData.id = props.selectedData.id
        formData.zyssxbm = props.selectedData.zyssxbm
        formData.nd = JSON.stringify(props.selectedData.nd)
        formData.aqscfylx = props.selectedData.aqscfylx
        formData.zyfjftrtjfw = props.selectedData.zyfjftrtjfw
        formData.status = props.selectedData.status
        formData.isDispatch = props.selectedData.isDispatch
        formData.sfxysgksp = props.selectedData.sfxysgksp
        formData.sfaqsc = props.selectedData.sfaqsc
        formData.ysly = props.selectedData.ysly
        formData.cwpsyd = props.selectedData.cwpsyd
        formData.jhlx = props.selectedData.jhlx
        formData.gkcsId = props.selectedData.gkcsId
        loading.value = false
      }
    })
    getGkcsListData(props.selectedData.zgkbmId)
  } else {
    // formData.zyssxbm = generaterYssxBm(10);
  }
}

const closeHandle = () => {
  searchList.yjflList.length = 0
  searchList.ejflList.length = 0
  searchList.sjflList.length = 0
  searchList.yslxctList.length = 0
  searchList.gkbmList.length = 0
  searchList.projectTypeList.length = 0
  searchList.jhlxList.length = 0
  searchList.gkcsList.length = 0
  formRef.value.resetFields()
  formData.createTime = ''
  formData.id = ''
  isShowModal.value = false
}

const saveHandle = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      // const isYssxbm = searchList.zyssxbmList.filter((row: any) => row.code == formData.zyssxbm);
      // if (isYssxbm.length != 1) {
      //   return ElMessage.warning("请选择正确的预算事项编码");
      // }
      loading.value = true
      const res = await saveMatterBasicData({
        ...formData
      })
      if (res.success) {
        ElMessage.success('保存成功!')
        emit('saveData')
        loading.value = false
        closeHandle()
      } else {
        ElMessage({
          type: 'error',
          message: res.msg
        })
        loading.value = false
      }
    }
  })
}

// const generaterYssxBm = (len: number) => {
//   len = len || 10;
//   var $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   var maxPos = $chars.length;
//   var pwd = "";
//   for (var i = 0; i < len; i++) {
//     pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
//   }
//   return "YSSX-" + pwd;
// };
// // 获取预算事项编码
// const getYssxbmData = () => {
//   getPublicData("YSSX_COM").then((res) => {
//     if (res.success) {
//       searchList.zyssxbmList = res.data;
//     } else {
//       ElMessage.error(res.msg);
//     }
//   });
// };

// 获取省归口部门
const getProGkbmData = async () => {
  let res = await getGkbmInProvince()
  if (res.success) {
    searchList.gkbmList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const getClassifyDataList = async (searchDataCode: string, xmlxId: string, parentCode?: string) => {
  let parent = ''
  if (parentCode) {
    parent = parentCode
  }
  const res = await getYESJFL(searchDataCode, xmlxId, parent)
  if (res.success) {
    if (searchDataCode === 'YJFL') searchList.yjflList = res.data
    else if (searchDataCode === 'EJFL') searchList.ejflList = res.data
    else searchList.sjflList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const changeYjflDataHandle = (val: string) => {
  clearableHandle('EJFL')
  if (val) getClassifyDataList('EJFL', formData.xmlx, formData.yjfl)
}

const changeEjflDataHandle = (val: string) => {
  clearableHandle('SJFL')
  if (val) getClassifyDataList('SJFL', formData.xmlx, formData.ejfl)
}

// 预算事项下拉框
// 打开弹窗
const handleSearch = () => {
  if (props.matterBasicMsg.opType == 'ADD') {
    isShowTable.value = true
  }
}
// 关闭弹窗
const closeModal = () => {
  isShowTable.value = false
}
// 保存数据
const saveModal = (selectedList: any) => {
  if (selectedList.length == 1) {
    formData.zyssxbm = selectedList[0].code
    formData.zyssxmc = selectedList[0].name
    isShowTable.value = false
  } else {
    ElMessage.warning('请选择一条数据')
  }
}
// 数据回调
const pageList = (val: any) => {
  if (val && val.records) {
    val.records.forEach((item: any, index: any) => {
      item.id = index
    })
  }
  return val
}
// 列表查询
const pageMeeting = (params: any) => {
  params = { ...params, comCode: 'YSSX_COM' }
  return pageCommonCode(params)
}

// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  return 'cursor: pointer;'
}

const runTask = async (row: any, column: any) => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.element.toggleRowSelection(row)
}

const tableColumns = reactive<any>([
  { type: 'selection', label: '序号', width: '50' },
  { type: 'index', label: '序号', width: '50' },
  {
    prop: 'code',
    label: '预算事项编码',
    search: { el: 'input', order: 1 }
  },
  {
    prop: 'name',
    label: '预算事项名称',
    search: { el: 'input', order: 2 }
  }
])

watch(
  () => formData.sfaqsc,
  (newVal) => {
    if (!newVal || newVal === '1') {
      formData.aqscfylx = ''
    }
  }
)

defineExpose({
  isShowModal
})
</script>

<style scoped lang="less">
.container {
  height: 100%;

  .title {
    padding-bottom: 10px;
    color: #0c6f67;
    text-align: center;

    span {
      font-size: 18px;
      font-weight: bold;
    }
  }

  .operation {
    text-align: center;
  }
}
</style>
