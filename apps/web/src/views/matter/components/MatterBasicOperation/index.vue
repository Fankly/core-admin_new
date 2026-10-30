<template>
  <vxe-modal
    :loading="loading"
    @close="closeHandle"
    @show="showHandle"
    position="center"
    resize
    :title="matterBasicMsg.title"
    width="1100"
    v-model="isShowModal"
  >
    <div class="container">
      <div class="title">
        <span>事项基本信息</span>
      </div>
      <div class="content">
        <el-form ref="formRef" :model="formData" label-position="right" label-width="210px" :rules="rulesForm">
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
                  @change="changeNdHandle"
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
              <el-form-item label="是否允许需求录入：" prop="sfxmlr">
                <el-select style="width: 100%" v-model="formData.sfxmlr" clearable>
                  <el-option v-for="(item, index) in searchList.isList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否需要省级会审：" prop="sfxylhhs">
                <el-select style="width: 100%" v-model="formData.sfxylhhs" clearable>
                  <el-option v-for="(item, index) in searchList.isList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否挂接评审及批复资料：" prop="isGjPspfwj">
                <el-select style="width: 100%" v-model="formData.isGjPspfwj" clearable>
                  <el-option v-for="(item, index) in searchList.isList" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否授权地市处理：" prop="sfjjcl">
                <el-select style="width: 100%" v-model="formData.sfjjcl" clearable>
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
              <el-form-item label="预算包：" prop="xmbbm">
                <el-input placeholder="请选择" :model-value="xmbmcText" disabled>
                  <template #suffix>
                    <i
                      v-if="formData.xmbbm"
                      class="el-input__icon el-icon-circle-close"
                      style="cursor: pointer"
                      title="清空"
                      @click="clearXmbHandle"
                    ></i>
                  </template>
                  <template #append>
                    <el-button class="el-icon-more" title="选择预算包" @click="handleXmbSearch" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="财务评审要点：" prop="cwpsyd">
                <el-input v-model="formData.cwpsyd" type="textarea" :rows="5" resize="none"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="预算事项说明：" prop="remark">
                <el-input v-model="formData.remark" type="textarea" :rows="5" resize="none"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="operation">
        <el-button plain type="primary" size="small" @click="saveHandle">保 存</el-button>
        <el-button plain type="primary" size="small" @click="closeHandle">关 闭</el-button>
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
        <el-button plain type="primary" size="small" :disabled="!scope.isSelected" @click.stop="saveModal(scope.selectedList)">确 定</el-button>
      </template>
    </proTable>
  </vxe-modal>
  <vxe-modal
    resize
    show-zoom
    v-model="isShowXmbTable"
    :destroy-on-close="true"
    title="预算包"
    width="1100"
    :height="700"
    :close-on-press-escape="false"
    @close="closeXmbModal"
  >
    <proTable
      ref="xmbTableRef"
      row-key="code"
      :cell-style="columnStyle"
      @cell-click="selectXmbRow"
      :request-api="getXmbTableData"
      :request-auto="true"
      :pagination="false"
      :search-col="4"
      :columns="xmbTableColumns"
    >
      <template #tableHeader="scope">
        <el-button plain type="primary" size="small" :disabled="!scope.isSelected" @click.stop="saveXmbModal(scope.selectedList)">确 定</el-button>
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
import { getGkbmInProvince, getProtypeTreeByGkbm, getPublicCodeList, getPublicData, pageCommonCode, getGkcsByGkbm, getXmbArr } from '@/api/common'
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

const isShowXmbTable = ref<boolean>(false)
const xmbTableRef = ref()
// 预算包：formData.xmbbm 存编号（传后端），xmbmcText 存名称（仅展示），都是逗号拼接
const xmbmcText = ref('')
const clearXmbHandle = () => {
  formData.xmbbm = ''
  xmbmcText.value = ''
}

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
  gkcsId: '',
  sfxmlr: '',
  sfxylhhs: '',
  isGjPspfwj: '',
  sfjjcl: '',
  xmbbm: ''
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
  sfxmlr: [{ required: true, message: '请选择是否允许需求录入', trigger: ['change'] }],
  sfxylhhs: [{ required: true, message: '请选择是否需要省级会审', trigger: ['change'] }],
  isGjPspfwj: [{ required: true, message: '请选择是否挂接评审及批复资料', trigger: ['change'] }],
  sfjjcl: [{ required: true, message: '请选择是否授权地市处理', trigger: ['change'] }],
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
  clearXmbHandle()
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
    // 预算包按项目类型+年度取数，项目类型变了原选择失效
    clearXmbHandle()
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
        formData.sfxmlr = props.selectedData.sfxmlr
        formData.sfxylhhs = props.selectedData.sfxylhhs
        formData.isGjPspfwj = props.selectedData.isGjPspfwj
        formData.sfjjcl = props.selectedData.sfjjcl
        formData.xmbbm = props.selectedData.xmbbm
        loadXmbmcText()
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
  xmbmcText.value = ''
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

// 预算包弹窗
// 年度变了原预算包选择失效
const changeNdHandle = () => {
  clearXmbHandle()
}
// 在项目类型树中按 id 查节点（formData.xmlx 存的是 id）
const findProtypeNodeById = (list: any[], id: string): any => {
  for (const item of list || []) {
    if (String(item.id) === String(id)) return item
    if (item.children && item.children.length) {
      const found = findProtypeNodeById(item.children, id)
      if (found) return found
    }
  }
  return null
}
// 按项目类型+年度取预算包全量
const fetchXmbList = async () => {
  // getXmbArr 的 xmlx 需传项目类型的 code，而非 TreeSelect 存的 id
  const protypeNode = findProtypeNodeById(searchList.projectTypeList, formData.xmlx)
  const xmlxCode = protypeNode?.code || ''
  // 其余条件不用，与 process-42 等调用方一致传空串
  const res = await getXmbArr({ year: formData.nd, xmlx: xmlxCode, xmblx: '', xmxz: '', sjfl: '', xmbid: '' })
  if (!res.success) {
    ElMessage.error(res.msg)
    return []
  }
  return res.data || []
}
// 编辑回显：后端只存编号，名称按项目类型+年度查回来对上，查不到的保留编号
const loadXmbmcText = async () => {
  const xmbbm = formData.xmbbm
  if (!xmbbm || !formData.xmlx || !formData.nd) return
  const list = await fetchXmbList()
  // 请求期间已重选/清空/关闭则丢弃
  if (formData.xmbbm !== xmbbm) return
  const nameMap = new Map(list.map((item: any) => [String(item.code), item.name]))
  xmbmcText.value = xmbbm
    .split(',')
    .map((code) => nameMap.get(code) || code)
    .join(',')
}
// 打开弹窗时记下已选编号，首次加载后回显勾选
let xmbPendingCodes: string[] = []
// 打开弹窗：预算包按项目类型+年度查询，两者缺一不可
const handleXmbSearch = () => {
  if (!formData.xmlx || !formData.nd) {
    ElMessage.warning('请先选择项目类型和年度')
    return
  }
  xmbPendingCodes = formData.xmbbm ? formData.xmbbm.split(',') : []
  isShowXmbTable.value = true
}
// 关闭弹窗
const closeXmbModal = () => {
  isShowXmbTable.value = false
}
// 保存数据：可多选，编号/名称各自逗号拼接
const saveXmbModal = (selectedList: any) => {
  if (selectedList.length > 0) {
    formData.xmbbm = selectedList.map((item: any) => item.code).join(',')
    xmbmcText.value = selectedList.map((item: any) => item.name).join(',')
    isShowXmbTable.value = false
  } else {
    ElMessage.warning('请至少选择一条数据')
  }
}
// 列表查询：接口按项目类型+年度返回全量，编码/名称在前端过滤
const getXmbTableData = async (params: any) => {
  const code = (params.code || '').trim()
  const name = (params.name || '').trim()
  const list = await fetchXmbList()
  return { data: list.filter((item: any) => (!code || String(item.code).includes(code)) && (!name || String(item.name).includes(name))) }
}
// 点击行切换勾选（勾选框列自身已处理，避免重复切换）
const selectXmbRow = (row: any, column: any) => {
  if (column.type === 'selection') return
  xmbTableRef.value?.element.toggleRowSelection(row)
}
// 回显已选预算包：只在打开后的首次加载执行，避免查询时把用户取消的勾选又勾回来
watch(
  () => xmbTableRef.value?.tableData,
  (rows) => {
    if (!rows?.length || !xmbPendingCodes.length) return
    const codes = xmbPendingCodes
    xmbPendingCodes = []
    nextTick(() => {
      rows.filter((row: any) => codes.includes(String(row.code))).forEach((row: any) => xmbTableRef.value?.element.toggleRowSelection(row, true))
    })
  }
)

const xmbTableColumns = reactive<any>([
  { type: 'selection', label: '序号', width: '50' },
  { type: 'index', label: '序号', width: '50' },
  {
    prop: 'code',
    label: '预算包编号',
    search: { el: 'input', order: 1, width: '120' }
  },
  {
    prop: 'name',
    label: '预算包名称',
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
