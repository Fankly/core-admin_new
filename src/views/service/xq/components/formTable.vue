<!-- 项目类型页签配置 -->
<template>
  <div class="container">
    <div v-if="['add', 'edit'].includes(props.dialogState) && searchCode === 'ZLHTTZGL_ZJJH'" class="operation">
      <el-button size="mini" type="primary" plain @click="addMasgHandler">新 增</el-button>
      <el-button size="mini" type="primary" plain @click="delMasgHandler">删 除</el-button>
      <el-button size="mini" type="primary" plain @click="copyHandler">复制行</el-button>
    </div>
    <!-- <div class="title-cont">租金计划</div> -->
    <div class="custom-tabs">
      <div
        class="tab-item"
        :class="{ active: searchCode === 'ZLHTTZGL_ZJJH' }"
        @click="() => searchTableHandle('ZLHTTZGL_ZJJH')"
      >租金计划</div>
      <div
        v-if="['edit', 'view'].includes(props.dialogState)"
        class="tab-item"
        :class="{ active: searchCode === 'ZLHTTZGL_HTFJ' }"
        @click="() => searchTableHandle('ZLHTTZGL_HTFJ')"
      >合同附件</div>
    </div>
    <div class="contebt-area" v-loading="loading">
      <template v-if="searchCode === 'ZLHTTZGL_ZJJH'">
        <div class="table">
          <el-form
            ref="formRef"
            :model="formObj"
            :rules="rules"
            :inline="true"
            :show-message="false"
            class="dynamic-form"
          >
            <el-table
              ref="tableRef"
              @selection-change="handelChooseRow"
              border
              :header-cell-style="'text-align: center;'"
              :data="formObj.list"
              height="300px"
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="序号" width="60" align="center">
                <template #default="scope">{{ scope.$index + 1 }}</template>
              </el-table-column>
              <el-table-column label="批次顺序" align="center">
                <template #default="scope">
                  <el-form-item
                    :prop="'list.' + scope.$index + '.pcNo'"
                    :rules="[
                      {required: true, message: '请选择', trigger: 'change'}
                    ]"
                  >
                    <el-select
                      style="width: 100%"
                      v-model="scope.row.pcNo"
                      placeholder="请选择"
                      :disabled="isDisabled || ['view'].includes(props.dialogState)"
                    >
                      <el-option
                        v-for="item in pcsxArr"
                        :key="item.code"
                        :label="item.name"
                        :value="item.code"
                      >
                      </el-option>
                    </el-select>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="付款时间" align="center">
                <template #default="scope">
                  <el-form-item
                    :prop="'list.' + scope.$index + '.payDate'"
                    :rules="[
                      {required: true, message: '请选择', trigger: 'change'}
                    ]"
                  >
                    <el-date-picker
                      v-model="scope.row.payDate"
                      type="date"
                      placeholder="请选择"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                      :disabled="['view'].includes(props.dialogState)"
                      @change="(value: any) => datePickerChange(value, scope.row.startDate, scope.row.endDate)"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="支付不含税租金" align="center">
                <template #default="scope">
                  <el-form-item
                    :prop="'list.' + scope.$index + '.payAmountNottax'"
                    :rules="[
                      {required: true, message: '请输入', trigger: 'blur'},
                      {validator: checkMoney, trigger: 'blur'}
                    ]"
                    style="width: 100%"
                  > 
                    <template v-if="['add', 'edit'].includes(props.dialogState)">
                      <el-tooltip content="只允许输入数字和小数,小数点后最多只能输入2位小数！" placement="top" effect="dark">
                        <el-input
                          v-model.trim="scope.row.payAmountNottax"
                          placeholder="请输入"
                          style="width: 100%"
                          @blur="inputBlur(scope)"
                          :disabled="['view'].includes(props.dialogState)"
                        />
                      </el-tooltip>
                    </template>
                    <template v-if="['view'].includes(props.dialogState)">
                      <el-input
                        v-model.trim="scope.row.payAmountNottax"
                        placeholder="请输入"
                        style="width: 100%"
                        @blur="inputBlur(scope)"
                        :disabled="['view'].includes(props.dialogState)"
                      />
                    </template>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="税率(%)" align="center">
                <template #default="scope">
                  <el-form-item
                    :prop="'list.' + scope.$index + '.taxRate'"
                    :rules="[
                      {required: true, message: '请选择', trigger: 'blur'}
                    ]"
                  >
                    <el-select
                      style="width: 100%"
                      v-model="scope.row.taxRate"
                      placeholder="请选择"
                      @change="(val: any) => selectChange(val, scope)"
                      :disabled="['view'].includes(props.dialogState)"
                    >
                      <el-option
                        v-for="item in slArr"
                        :key="item.code"
                        :label="item.name"
                        :value="item.code"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="租赁期实际开始日" align="center">
                <template #default="scope">
                  <el-form-item
                    :prop="'list.' + scope.$index + '.startDate'"
                    :rules="[
                      {required: true, message: '请选择', trigger: 'change'}
                    ]"
                  >
                    <el-date-picker
                      v-model="scope.row.startDate"
                      type="date"
                      placeholder="请选择"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                      :disabled="isDisabled || ['view'].includes(props.dialogState)"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="租赁期实际结束日" align="center">
                <template #default="scope">
                  <el-form-item
                    :prop="'list.' + scope.$index + '.endDate'"
                    :rules="[
                      {required: true, message: '请选择', trigger: 'change'}
                    ]"
                  >
                    <el-date-picker
                      v-model="scope.row.endDate"
                      type="date"
                      placeholder="请选择"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                      :disabled="isDisabled || ['view'].includes(props.dialogState)"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
            </el-table>
          </el-form>
        </div>
        <div class="bottom">
          <el-pagination
            :current-page="page.page"
            background
            align="center"
            :page-sizes="[10, 20, 50, 100, 500]"
            :page-size="page.limit"
            :total="parseInt(page.total + '')"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="limitChangeHandle"
            @current-change="pageChangeHandle"
          ></el-pagination>
        </div>
      </template>
      <template v-if="searchCode === 'ZLHTTZGL_HTFJ'">
        <div class="table">
          <vxe-table
            resizable
            ref="tableRef"
            border
            stripe
            show-overflow
            align="center"
            header-align="center"
            :row-config="{
              height: 32
            }"
            :data="tableDataList"
            height="320px"
          >
            <!-- <vxe-column width="50" type="checkbox"></vxe-column> -->
            <vxe-column :index="0" type="seq" width="60"></vxe-column>
            <vxe-column field="typBasNm" title="附件名称"></vxe-column>
            <vxe-column field="fileType" width="200" title="文件类型"></vxe-column>
            <vxe-column width="150" title="附件查看">
              <template #default="scope">
                <span v-if="scope.row.imageId" @click="downloadFile(scope.row)">
                  <i class="el-icon-view" style="cursor: pointer; color: #409eff"></i>
                </span>
                <span v-else>暂无</span>
              </template>
            </vxe-column>
          </vxe-table>
        </div>
        <div class="bottom">
          <el-pagination
            :current-page="htPage.page"
            background
            align="center"
            :page-sizes="[10, 20, 50, 100, 500]"
            :page-size="htPage.limit"
            :total="parseInt(htPage.total + '')"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="htLimitChangeHandle"
            @current-change="htPageChangeHandle"
          ></el-pagination>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, defineExpose, defineEmits, withDefaults, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { checkMoney } from '@/utils/validate.js'
import { getPublicData } from '@/api/common' //公共代码
import {
  searchPayDayList,
  getZlhtfjList,
  payDayDelete,
  getDownloadUrl
} from '@/api/service/requirement'

//接收父组件传参
const props = withDefaults(
  defineProps<{
    fpqz: string,
    startDate: string,
    endDate: string,
    htID: string,
    htBm: string,
    dialogState: string
  }>(),
  {
    fpqz: '',
    startDate: '',
    endDate: '',
    htID: '',
    htBm: '',
    dialogState: ''
  }
)

const page = reactive({
  total: 0,
  limit: 50,
  page: 1
})

const htPage = reactive({
  total: 0,
  limit: 50,
  page: 1
})

const loading = ref(false)
const searchCode = ref('ZLHTTZGL_ZJJH')
const validateStatus = ref(false)
const slArr = ref<any[]>([]) //税率
const pcsxArr = ref<any[]>([]) //批次顺序

const formObj = ref<any>({
  list: []
})
const tableDataList = ref()

const selectData = ref<any>([])
const isDisabled = ref(false)
const rules = ref<any>({})
const formRef = ref<any>(null)
const formErrors = reactive({
  payDate: false,
  payAmountNottax: false
})

const emit = defineEmits(['judgementIsExistSameValue', 'dynamicComputation', 'updateData'])

// 租金计划-当前页改变时会触发
const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchDataHandle()
}

// 租金计划-每页条数改变时会触发
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchDataHandle()
}

// 合同附件-当前页改变时会触发
const htPageChangeHandle = (currentPageNum: number) => {
  htPage.page = currentPageNum
  htSearchDataHandle()
}

// 合同附件-每页条数改变时会触发
const htLimitChangeHandle = (currentLimitNum: number) => {
  htPage.page = 1
  htPage.limit = currentLimitNum
  htSearchDataHandle()
}

// 租金计划-列表查询
const searchDataHandle = async () => {
  const getPageData = await searchPayDayList({
    page: page.page,
    limit: page.limit,
    HTBM: props.htID,
  });
  if (getPageData.success) {
    formObj.value.list = getPageData.data.records;
    page.total = getPageData.data.total;

    if (props.fpqz === '0') {
      // 判断是否分批起租为 否 时
      isDisabled.value = true;
    } else {
      isDisabled.value = false;
    }

    for (var i = 0; i < formObj.value.list.length; i++) {
      formObj.value.list[i].payDate = getDate(formObj.value.list[i].payDate);
      formObj.value.list[i].startDate = getDate(formObj.value.list[i].startDate);
      formObj.value.list[i].endDate = getDate(formObj.value.list[i].endDate);
    }
    emit('dynamicComputation');
  }
}

// 合同附件-列表查询
const htSearchDataHandle = async () => {
  const getPageData = await getZlhtfjList({
    page: htPage.page,
    limit: htPage.limit,
    contractNo: props.htBm
  });
  if (getPageData.success) {
    htPage.total = getPageData.data.total * 1;
    tableDataList.value = getPageData.data.records;
  }
}

const getDate = (value: any) => {
  var nowDate = value ? new Date(value) : new Date();
  var y = nowDate.getFullYear();
  var m: any = nowDate.getMonth() + 1;
  var d: any = nowDate.getDate();
  if (m < 10) {
    m = '0' + m
  }
  if (d < 10) {
    d = '0' + d
  }
  return y + '-' + m + '-' + d;
}

const rndNum = (n: any) => {
  let rdmNum = '';
  for (let i = 0; i < n; i++) {
    rdmNum += Math.floor(Math.random() * 10); // [0-10]的整数
  }
  return rdmNum;
}

// 付款时间 onchange 事件
const datePickerChange = (val: any, startDate: any, endDate: any) => {
  if (!val) return
  if (new Date(val) < new Date(startDate)) {
    ElMessage.error('付款时间不得小于租赁期实际开始日！');
    return;
  }
  if (new Date(val) > new Date(endDate)) {
    ElMessage.error('付款时间不得大于租赁期实际结束日！');
    return;
  }
}

// 新增
const addMasgHandler = () => {
  if (props.fpqz === '0') {
    formObj.value.list.push({
      tabItemId: 'T' + rndNum(6), // 生成以T开头的七位随机数
      pcNo: '第一批次',
      payDate: '',
      payAmountNottax: '',
      taxRate: '',
      startDate: props.startDate,
      endDate: props.endDate,
      dataStatus: 'add'
    })
    isDisabled.value = true;
  } else {
    formObj.value.list.push({
      tabItemId: 'T' + rndNum(6), // 生成以T开头的七位随机数
      pcNo: '',
      payDate: '',
      payAmountNottax: '',
      taxRate: '',
      startDate: '',
      endDate: '',
      dataStatus: 'add'
    })
    isDisabled.value = false;
  }
  page.total = formObj.value.list.length;
}

// 删除
const delMasgHandler = async () => {
  if (selectData.value.length == 0) {
    ElMessage.warning('请选择数据！');
    return;
  }
  var ids = '';
  const idList: any = [];
  for (var i = 0; i < selectData.value.length; i++) {
    if (selectData.value[i].id) {
      if (i < selectData.value.length - 1) {
        ids += selectData.value[i].id + ',';
      } else {
        ids += selectData.value[i].id;
      }
    }
    if (selectData.value[i].id) {
      idList.push(selectData.value[i].id)
    } else if (selectData.value[i].tabItemId) {
      idList.push(selectData.value[i].tabItemId)
    }
  }

  const newDataList = formObj.value.list.filter((item: any) => !(idList.includes(item.id)) && !(idList.includes(item.tabItemId)))
  formObj.value.list = newDataList;
  page.total = formObj.value.list.length;
  if (formObj.value.list.length == 0) {
    emit('updateData')
  }
  if (!ids) return
  const paramData: any = await payDayDelete({
    ID: ids
  });
  if (paramData.success) {
    ElMessage.success('删除成功！');
    emit('dynamicComputation');
    return;
  } else {
    ElMessage.error('租金计划使用中,不可删除！')
  }
}

// 复制行
const copyHandler = () => {
  if (selectData.value.length == 0) {
    ElMessage.warning('请选择数据！');
    return;
  }
  for (var i = 0; i < selectData.value.length; i++) {
    formObj.value.list.push({
      tabItemId: 'T' + rndNum(6),
      pcNo: selectData.value[i].pcNo,
			fpqzNo: selectData.value[i].fpqzNo || '',
      payDate: selectData.value[i].payDate,
      payAmountNottax: selectData.value[i].payAmountNottax,
			payAmountTax: selectData.value[i].payAmountTax || '',
      taxRate: selectData.value[i].taxRate,
      startDate: selectData.value[i].startDate,
      endDate: selectData.value[i].endDate,
      dataStatus: 'add'
    })
  }
  page.total = formObj.value.list.length;
  emit('dynamicComputation');
} 

const handelChooseRow = (val: any) => {
  selectData.value = val;
}

// 支付不含税租金输入框失去焦点事件
const inputBlur = (item: any) => {
  emit('dynamicComputation', {
    key: 'payAmountNottax',
    payAmountNottax: item.row.payAmountNottax,
    taxRate: item.row.taxRate,
    index: item.$index
  })
}

// 税率 onchange 事件
const selectChange = (val: any, item: any) => {
  emit('dynamicComputation', {
    key: 'taxRate',
    payAmountNottax: item.row.payAmountNottax,
    taxRate: item.row.taxRate,
    index: item.$index
  })
}

// 租金计划form表单校验
const formValidate = () => {
  formRef.value.validate((valid: any) => {
    if (valid) {
      validateStatus.value = true;
    } else {
      validateStatus.value = false;
    }
  })
}

// 附件下载
const downloadFile = async (row: any) => {
  loading.value = true
  const uuid = row.imageId
  // const fileName = row.typBasNm.split('.')[0]
  const blob: any = await getDownloadUrl(uuid)
  if (blob.data) {
    window.open(blob.data,'_blank');
  }
  // const dom = document.createElement('a')
  // const url = window.URL.createObjectURL(blob)
  // dom.href = url
  // // 获取文件名
  // dom.download = `${decodeURI(decodeURI(fileName))}`
  // document.body.appendChild(dom)
  // dom.click()
  // document.body.removeChild(dom)
  // window.URL.revokeObjectURL(url)
  loading.value = false
}

const searchTableHandle = (flag: string) => {
  searchCode.value = flag;
  if (flag === 'ZLHTTZGL_ZJJH') {
    searchDataHandle();
  } else if (flag === 'ZLHTTZGL_HTFJ') {
    htSearchDataHandle();
  }
}

onMounted(async () => {
  // 税率
  const slCodeList = await getPublicData('ZL_RATE')
  if (slCodeList.success && slCodeList.data.length !== 0) {
    slArr.value = slCodeList.data
  }
  // 批次顺序
  const pcsxCodeList = await getPublicData('PCSX')
  if (pcsxCodeList.success && pcsxCodeList.data.length !== 0) {
    pcsxArr.value = pcsxCodeList.data
  }

  if (['edit', 'view'].includes(props.dialogState)) {
    searchDataHandle()
  }
})

defineExpose({
  isDisabled,
  formObj,
  formValidate,
  validateStatus
})
</script>

<style scoped lang="less">
.container {
  padding: 10px;
  .title-cont {
    margin-top: 10px;
    line-height: 36px;
    background-color: #00706b;
    color: #fff;
    padding-left: 10px;
    font-size: 14px;
  }
  .custom-tabs {
    display: flex;
    margin-bottom: 10px;
    border-bottom: 1.5px solid #e4e7ed;
    background: none;
    .tab-item {
      padding: 10px;
      font-size: 14px;
      color: #666;
      cursor: pointer;
      position: relative;
      transition: color 0.2s;
      margin: 0 6px;
    }
    .tab-item.active {
      color: #00706b;
    }
    .tab-item.active::after {
      content: '';
      display: block;
      position: absolute;
      left: 50%;
      bottom: -2px;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, #00706b, #00604a);
      border-radius: 2px;
      transform: translateX(-50%);
      transition: width 0.3s;
    }
  }
  .contebt-area {
    .table {
      padding-top: 10px;
    }
  }
}
.dynamic-form {
  ::v-deep(.el-form-item--small.el-form-item) {
    margin-bottom: 0;
  }
}
</style>
