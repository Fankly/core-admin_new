<template>
  <div v-if="isShowModel">
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      :title="props.title"
      width="95%"
      height="90%"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <div class="form-title">基础信息</div>
      <el-form
        label-suffix=" : "
        ref="ruleFormRef"
        label-width="180px"
        label-position="right"
        :model="rmarkData"
        :rules="rules"
        :hide-required-asterisk="false"
      >
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="合同编码" prop="code">
              <el-input
                :maxlength="200"
                v-model.trim="rmarkData.code"
                placeholder="请输入合同编码"
                :disabled="['edit', 'view'].includes(props.dialogState)"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="合同名称" prop="name">
              <el-input
                :maxlength="100"
                v-model.trim="rmarkData.name"
                placeholder="请输入合同名称"
                clearable
                :disabled="['view'].includes(props.dialogState)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="租赁需求编码" prop="wbsCode">
              <el-input
                :maxlength="25"
                v-model.trim="rmarkData.wbsCode"
                placeholder="请输入租赁需求编码"
                clearable
                readonly
                :disabled="['view'].includes(props.dialogState)"
              >
                <template #append>
                  <el-button
                    class="el-icon-more"
                    @click="handleSearch('xmbm')"
                  />
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="租赁需求名称" prop="wbsName">
              <el-input
                :maxlength="100"
                v-model.trim="rmarkData.wbsName"
                placeholder="请输入租赁需求名称"
                clearable
                readonly
                :disabled="['view'].includes(props.dialogState)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="合同签订日期" prop="crtSigningDate">
              <!-- 日期选择器 -->
              <el-date-picker
                v-model="rmarkData.crtSigningDate"
                type="date"
                placeholder="请选择合同签订日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                clearable
                :disabled="['view'].includes(props.dialogState)"
                @change="htqdrqrChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="出租方名称" prop="venderName">
              <el-input
                v-model.trim="rmarkData.venderName"
                placeholder="出租方名称"
                readonly
                :disabled="['view'].includes(props.dialogState)"
              >
                <template #append>
                  <el-button
                    class="el-icon-more"
                    @click="handleSearch('czf')"
                  />
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="供应商SAP编码" prop="venderNumber">
              <el-input
                v-model.trim="rmarkData.venderNumber"
                placeholder="请输入供应商SAP编码"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="是否为内部单位" prop="innerVender">
              <el-select
                style="width: 100%"
                v-model="rmarkData.innerVender"
                placeholder="请选择是否为内部单位"
                disabled
              >
                <el-option
                  v-for="item in props.sfnbdwArr"
                  :key="item.code"
                  :label="item.name"
                  :value="item.code"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="一级单位" prop="yjdw">
              <el-select
                style="width: 100%"
                v-model="rmarkData.yjdw"
                placeholder="请选择一级单位(选填)"
                clearable
                :disabled="['edit', 'view'].includes(props.dialogState)"
              >
                <el-option
                  v-for="item1 in levelOne"
                  @click="selectChange(item1)"
                  :key="item1.code"
                  :label="item1.name"
                  :value="item1.code"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="二级单位" prop="ejdw">
              <el-select
                style="width: 100%"
                v-model="rmarkData.ejdw"
                placeholder="请选择二级单位(选填)"
                clearable
                :disabled="['edit', 'view'].includes(props.dialogState)"
              >
                <el-option
                  v-for="item1 in levelTwo"
                  @click="selectChangeBm(item1)"
                  :key="item1.code"
                  :label="item1.name"
                  :value="item1.code"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="租赁期实际开始日" prop="startDate">
              <!-- 日期选择器 -->
                <el-date-picker
                  v-model="rmarkData.startDate"
                  type="date"
                  placeholder="请选择租赁期实际开始日"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  @change="datePickerChange('startDate')"
                  clearable
                  :disabled="['view'].includes(props.dialogState)"
                />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="租赁期实际结束日" prop="endDate">
              <!-- 日期选择器 -->
                <el-date-picker
                  v-model="rmarkData.endDate"
                  type="date"
                  placeholder="请选择租赁期实际结束日"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  @change="datePickerChange('endDate')"
                  clearable
                  :disabled="['view'].includes(props.dialogState)"
                />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="租赁周期（月数)" prop="leaseMonth">
              <el-input
                v-model.trim="rmarkData.leaseMonth"
                placeholder="请输入租赁周期（月数)"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="含税总租金（单位元）" prop="totalRentTax">
              <el-input
                v-model.trim="rmarkData.totalRentTax"
                placeholder="请输入含税总租金（单位元）"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="不含税总租金（单位元）" prop="totalRentNottax">
              <el-input
                v-model.trim="rmarkData.totalRentNottax"
                placeholder="请输入不含税总租金（单位元）"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="年折现率（%）" prop="npvRateNd">
              <el-input
                v-model.trim="rmarkData.npvRateNd"
                placeholder="请输入年折现率（%）"
                clearable
                :disabled="['view'].includes(props.dialogState)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="是否分批起租" prop="fpqz">
              <el-select
                style="width: 100%"
                v-model="rmarkData.fpqz"
                placeholder="请选择是否分批起租"
                @change="sffpqzChange"
                disabled
              >
                <el-option
                  v-for="item in props.sffpqzArr"
                  :key="item.code"
                  :label="item.name"
                  :value="item.code"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="豁免类型" prop="exemption">
              <el-select
                style="width: 100%"
                v-model="rmarkData.exemption"
                placeholder="请选择豁免类型"
                clearable
                :disabled="['view'].includes(props.dialogState)"
              >
                <el-option
                  v-for="item in props.sfhmArr"
                  :key="item.code"
                  :label="item.name"
                  :value="item.code"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="是否留购" prop="retrntion">
              <el-select
                style="width: 100%"
                v-model="rmarkData.retrntion"
                placeholder="请选择是否留购"
                @change="sflgChange"
                clearable
                :disabled="['view'].includes(props.dialogState)"
              >
                <el-option
                  v-for="item in props.sflgArr"
                  :key="item.code"
                  :label="item.name"
                  :value="item.code"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="租赁资产剩余可使用年限" prop="zlzcsyksynx">
              <el-input
                v-model.trim="rmarkData.zlzcsyksynx"
                placeholder="请输入租赁资产剩余可使用年限"
                :disabled="rmarkData.retrntion === 'N' || ['view'].includes(props.dialogState)"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <formTable
        ref="formTableRef"
        :fpqz="rmarkData.fpqz"
        :start-date="rmarkData.startDate"
        :end-date="rmarkData.endDate"
        :htID="props.htID"
        :htBm="rmarkData.code"
        :dialog-state="props.dialogState"
        @update-data="updateData"
        @judgement-is-exist-same-value="judgementIsExistSameValue"
        @dynamic-computation="dynamicComputation"
      ></formTable>
      <div style="text-align: center">
        <!-- <el-button size="mini" type="primary" plain @click="saveHandler">暂 存</el-button>
        <el-button size="mini" type="primary" plain @click="submitHandler">提交参数库</el-button> -->
        <el-button size="mini" type="primary" plain @click="submitHandler">保存</el-button>
        <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, defineProps, defineEmits, defineExpose } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEjdwData, getBm } from '@/api/service/expertinformation'
import formTable from '@/views/service/xq/components/formTable.vue'
import baseService from '@/service/baseService'
import {
  checkCsSave,
  csParamSave
} from '@/api/service/requirement'

interface OptionItem {
  code: string | number
  name: string
  id?: string | number
  [key: string]: any
}

const formTableRef = ref()

//接收父组件传参
const props = withDefaults(
  defineProps<{
    title: string
    dialogState: string
    htID: string
    sffpqzArr: OptionItem[]
    sfhmArr: OptionItem[]
    sflgArr: OptionItem[]
    sfnbdwArr: OptionItem[]
    slArr: OptionItem[]
    pcsxArr: OptionItem[]
    userInfo: any
  }>(),
  {
    title: '新增',
    dialogState: '',
    htID: '',
    sffpqzArr: () => [],
    sfhmArr: () => [],
    sflgArr: () => [],
    sfnbdwArr: () => [],
    slArr: () => [],
    pcsxArr: () => [],
    userInfo: () => {}
  }
)
// 子组件
const emit = defineEmits(['showModal', 'inputAppendHandle', 'updateHtId'])
//表格规则
const rules = ref<any>({
  code: [
    {
      required: true,
      message: '请输入合同编码',
      trigger: 'blur'
    }
  ],
  name: [
    {
      required: true,
      message: '请输入合同名称',
      trigger: 'blur'
    }
  ],
  crtSigningDate: [
    {
      required: true,
      message: '请选择合同签订日期',
      trigger: 'blur'
    }
  ],
  venderName: [
    {
      required: true,
      message: '请输入出租方名称',
      trigger: 'change'
    }
  ],
  venderNumber: [
    {
      required: false,
      message: '请输入供应商SAP编码',
      trigger: 'blur'
    }
  ],
  innerVender: [
    {
      required: false,
      message: '请选择是否为内部单位',
      trigger: 'change'
    }
  ],
  yjdw: [
    {
      required: true,
      message: '请选择一级单位',
      trigger: 'change'
    }
  ],
  ejdw: [
    {
      required: true,
      message: '请选择二级单位',
      trigger: 'change'
    }
  ],
  startDate: [
    {
      required: true,
      message: '请选择租赁期实际开始日',
      trigger: 'change'
    }
  ],
  endDate: [
    {
      required: true,
      message: '请选择租赁期实际结束日',
      trigger: 'change'
    }
  ],
  leaseMonth: [
    {
      required: false,
      message: '请输入租赁周期（月数)',
      trigger: 'blur'
    }
  ],
  totalRentTax: [
    {
      required: false,
      message: '请输入含税总租金（单位元）',
      trigger: 'blur'
    },
    {
      pattern: /^(\d+)?(\.\d{0,2})?$/,
      message: '只允许输入数字和小数,小数点后最多只能输入2位小数'
    }
  ],
  totalRentNottax: [
    {
      required: false,
      message: '请输入不含税总租金（单位元）',
      trigger: 'blur'
    },
    {
      pattern: /^(\d+)?(\.\d{0,2})?$/,
      message: '只允许输入数字和小数,小数点后最多只能输入2位小数'
    }
  ],
  npvRateNd: [
    {
      required: true,
      message: '请输入年折现率（%）',
      trigger: 'blur'
    },
    {
      pattern: /(^[0](\.\d{1,2})?$)|(^[1-9](\.\d{1,2})?$)|(^[1][0-9](\.\d{1,2})?$)|(^[2-4][0-9](\.\d{1,2})?$)|(^[5][0]$)/,
      message: '只允许输入大于等于0且小于等于50的数字和小数,小数点后最多只能输入2位小数'
    }
  ],
  wbsCode: [
    {
      required: false,
      message: '请输入租赁需求编码',
      trigger: 'blur'
    }
  ],
  wbsName: [
    {
      required: false,
      message: '请输入租赁需求名称',
      trigger: 'blur'
    }
  ],
  fpqz: [
    {
      required: true,
      message: '请选择是否分批起租',
      trigger: 'change'
    }
  ],
  exemption: [
    {
      required: true,
      message: '请选择豁免类型',
      trigger: 'change'
    }
  ],
  retrntion: [
    {
      required: true,
      message: '请选择是否留购',
      trigger: 'change'
    }
  ],
  zlzcsyksynx: [
    {
      required: true,
      message: '请输入租赁资产剩余可使用年限',
      trigger: 'blur'
    },
    {
      pattern: /(^[1][2-9]$)|(^[2-9][0-9]$)|(^[1][0-9][0-9]$)|(^[2][0-9][0-9]$)|(^[3][0][0]$)/,
      message: '只允许输入大于等于12且小于等于300的整数'
    }
  ],
})
const ruleFormRef = ref()
const dialogFormRef = ref()
const isShowModel = ref(false)
// 弹框参数
const rmarkData = ref<any>({})
const levelOne = ref<any>([]) //一级单位
const levelTwo = ref<any>([]) //二级单位
const levelThree = ref<any>([]) //所属部门
const TYPE = ref<any>('')
const isTipsState = ref<boolean>(false)

// 联动二级单位
const selectChange = async (val: any) => {
  // console.log('====一级单位====', val.code)
  rmarkData.value.ejdw = ''
  rmarkData.value.deptId = ''
  levelThree.value.length = 0

  rmarkData.value.wbsCode = '' // 项目编码
  rmarkData.value.wbsName = '' // 项目名称
  // let res: any = await getEjdwData(val.id)
  let res: any = await baseService.post('/bizOrgTree/getEjdw', {
    YJDW: val.code,
    bmId: props.userInfo.deptId || '',
    dwId: props.userInfo.dwId || '',
    parentCode: val.code
  })
  if (res.success && res.data.length !== 0) {
    levelTwo.value = res.data
  }
  // 获取选中一级单位的名称
  let item = levelOne.value.find((item: any) => item.code == val.code)
  rmarkData.value.yjdwms = item.name
}

// 联动所属部门
const selectChangeBm = async (val: any) => {
  // console.log('====二级单位====', val.code)
  rmarkData.value.wbsCode = '' // 项目编码
  rmarkData.value.wbsName = '' // 项目名称
  rmarkData.value.deptId = ''
  let res: any = await getBm(parseInt(val.code))
  if (res.success && res.data.length !== 0) {
    levelThree.value = res.data
  }
  // 获取选中二级单位的名称
  let item = levelTwo.value.find((item: any) => item.code == val.code)
  rmarkData.value.ejdwms = item.name
}

// 暂存
const saveHandler = () => {
  ruleFormRef.value.validate(async (valid: any) => {
    if (!valid) return
    if (formTableRef.value.formObj.list.length == 0) {
      ElMessage.warning('请添加“租金计划”！');
      return;
    }

    // 校验租金计划是否都必填
    await formTableRef.value.formValidate()
    if (!formTableRef.value.validateStatus) return

    const newObj = judgementIsExistSameValue(formTableRef.value.formObj.list);
	  if (newObj.state) {
      ElMessage.error('同一批次的“付款时间”不能存在相同的时间！');
      return;
    }

    const dataList: any = await checkCsSave({
      HTBM: rmarkData.value.code,
      HTID: props.htID
    });
    if (dataList.checkFlag) {
      ElMessage.warning(dataList.msg);
      return;
    } else {
      const paramData: any = await csParamSave({
        ...rmarkData.value,
        list: JSON.stringify(formTableRef.value.formObj.list),
        code: rmarkData.value.code,
        id: props.htID,
        state: '0',
        type: props.dialogState === 'add' ? '0' : props.dialogState == 'edit' ? '1' : '2'
      });
      if (paramData.success) {
        if (paramData.data.id) {
          emit('updateHtId', paramData.data.id)
        }
        if (!isTipsState.value) {
          isTipsState.value = true; 
          emit('showModal', '0')
          ElMessage.success('保存成功，请确认是否已提交至损益测算参数库，否则将影响损益预测！');
        } else {
          emit('showModal', '1')
          ElMessage.success('保存成功！')
        }
      } else {
        ElMessage.error('保存失败！')
      }
    }
  })
}

// 提交参数库
const submitHandler = () => {
  ruleFormRef.value.validate(async (valid: any) => {
    if (!valid) return
    if (formTableRef.value.formObj.list.length == 0) {
      ElMessage.warning('请添加“租金计划”！');
      return;
    }

    // 校验租金计划是否都必填
    await formTableRef.value.formValidate()
    if (!formTableRef.value.validateStatus) return

    const newObj = judgementIsExistSameValue(formTableRef.value.formObj.list);
	  if (newObj.state) {
      ElMessage.error('同一批次的“付款时间”不能存在相同的时间！');
      return;
    }

    const dataList: any = await checkCsSave({
      HTBM: rmarkData.value.code,
      HTID: props.htID
    });
    if (dataList.checkFlag) {
      ElMessage.warning(dataList.msg);
      return;
    } else {
      const paramData: any = await csParamSave({
        ...rmarkData.value,
        list: JSON.stringify(formTableRef.value.formObj.list),
        code: rmarkData.value.code,
        id: props.htID,
        state: '1',
        type: props.dialogState === 'add' ? '0' : props.dialogState == 'edit' ? '1' : '2'
      });
      if (paramData.success) {
        ElMessage.success('保存成功！')
        emit('showModal', '1')
      } else {
        ElMessage.error('保存失败！')
      }
    }
  })
}

// 关闭
const closeHandle = () => {
  ruleFormRef.value.resetFields()
  isTipsState.value = false
  isShowModel.value = false
}

// 合同签订日期 onchange 事件
const htqdrqrChange = () => {
  if (rmarkData.value.crtSigningDate && new Date(rmarkData.value.crtSigningDate).getTime() >= new Date('2025-06-01').getTime()) {
    rules.value.wbsCode[0].required = true;
    rules.value.wbsName[0].required = true;
  } else {
    rules.value.wbsCode[0].required = false;
    ruleFormRef.value.clearValidate('wbsCode');

    rules.value.wbsName[0].required = false;
    ruleFormRef.value.clearValidate('wbsName');
  }
}

// 租赁期实际开始日 和 租赁期实际开结束日 onchange 事件
const datePickerChange = (val: any) => {
  if (val === 'startDate') {
    if (rmarkData.value.endDate && new Date(rmarkData.value.startDate).getTime() >= new Date(rmarkData.value.endDate).getTime()) {
      ElMessage.warning("租赁期实际开始日不得大于等于租赁期实际结束日！");
      rmarkData.value.startDate = '';
    }
    if (rmarkData.value.fpqz === '0') {
      // 判断是否分批起租为 否 时
      for (var i = 0; i < formTableRef.value.formObj.list.length; i++) {
        formTableRef.value.formObj.list[i].startDate = rmarkData.value.startDate;
      }
    }
  } else if (val === 'endDate'){
    if (rmarkData.value.startDate && new Date(rmarkData.value.endDate).getTime() <= new Date(rmarkData.value.startDate).getTime()) {
      ElMessage.warning("租赁期实际结束日不得小于等于租赁期实际开始日！");
      rmarkData.value.endDate = '';
    }
    if (rmarkData.value.fpqz === '0') {
      // 判断是否分批起租为 否 时
      for (var i = 0; i < formTableRef.value.formObj.list.length; i++) {
        formTableRef.value.formObj.list[i].endDate = rmarkData.value.endDate;
      }
    }
  }
  if (rmarkData.value.startDate && rmarkData.value.endDate) {
    var newVal = calculateMonthDifference();
    rmarkData.value.leaseMonth = newVal;
  }
}

// 是否分批起租 onchange 事件
const sffpqzChange = (val: any) => {
  if (val === '0') {
    // 判断是否分批起租为 否 时
    for (var i = 0; i < formTableRef.value.formObj.list.length; i++) {
      formTableRef.value.formObj.list[i].pcNo = '第一批次';
      formTableRef.value.formObj.list[i].startDate = rmarkData.value.startDate;
      formTableRef.value.formObj.list[i].endDate = rmarkData.value.endDate;
    }
    formTableRef.value.isDisabled = true;
  } else {
    formTableRef.value.isDisabled = false;
  }
}

// 是否留购 anchange 事件
const sflgChange = (val: any) => {
  rmarkData.value.zlzcsyksynx = '';
  if (val === 'N') {
    // 判断是否留购为 否 时
    rules.value.zlzcsyksynx[0].required = false;
    ruleFormRef.value.clearValidate('zlzcsyksynx');
  } else {
    rules.value.zlzcsyksynx[0].required = true;
  }
}

// 计算两个时间之间相差的月份
const calculateMonthDifference = () => {
  var start = new Date(rmarkData.value.startDate);
  var end = new Date(rmarkData.value.endDate);
  // 获取年
  var startYear = start.getFullYear();
  var endYear = end.getFullYear();
  // 获取月
  var startMouth = start.getMonth() + 1;
  var endMouth = end.getMonth() + 1;
  // 获取日
  var startDay = start.getDate() + 1;
  var endDay = end.getDate() + 1;
  // 相差年份月份
  var diffYear = endYear - startYear;
  // 获取当前月天数
  var startDays = getDays(startMouth, startYear);
  var endDays = getDays(endMouth, endYear);
  var diffSartMouth = (startDays - startDay) / startDays;
  var diffEndMouth = endDay / endDays;
  var diffMouth = diffSartMouth + diffEndMouth + (12 - startMouth - 1) + endMouth + (diffYear - 1) * 12;
  diffMouth = diffMouth == 0 ? 1 : diffMouth;
  return Math.ceil(diffMouth);
}

// 判断同一批次付款时间是否存在相同的时间
const judgementIsExistSameValue = (arrList: []) => {
	if (arrList && arrList.length < 2) {
		return {
			state: false
		};
	}
  var obj: any = {};
  for (var i = 0; i < arrList.length; i ++) {
    var items: any = arrList[i];
    if (obj[items.pcNo] && obj[items.pcNo].length > 0) {
      obj[items.pcNo].push(items.payDate);
    } else {
      obj[items.pcNo] = new Array(items.payDate);
    }
  }
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (obj[key].length > 1) {
        var fksjArr = obj[key];
        if (new Set(fksjArr).size !== fksjArr.length) {
          return {
            pcName: key,
            date: obj[key],
            state: true
          };
        }
      }
    }
  }
	return {
		state: false
	};
};

// 根据租金计划里的“支付不含税总租金”和“税率”动态计算基本信息里的“含税总租金（单位元）”和“不含税总租金（单位元）”值
const dynamicComputation = (obj: any) => {
  var items = formTableRef.value.formObj.list;
  var totalRentTax: any = '';
  var totalRentNottax: any = '';
  for (var i = 0; i < items.length; i ++) {
    var item = items[i];
    if (obj && obj.index == i) {
      if (obj.payAmountNottax !== '') {
        totalRentNottax = parseFloat((Number(totalRentNottax) + Number(obj.payAmountNottax)).toFixed(2));
      }
      if (obj.payAmountNottax !== '' && obj.taxRate !== '') {
        totalRentTax = parseFloat((Number(totalRentTax) + Number(obj.payAmountNottax) * (1 + Number(obj.taxRate) / 100)).toFixed(2));
      }
    } else {
      if (item.payAmountNottax !== '') {
        totalRentNottax = parseFloat((Number(totalRentNottax) + Number(item.payAmountNottax)).toFixed(2));
      }
      if (item.payAmountNottax !== '' && item.taxRate !== '') {
        totalRentTax = parseFloat((Number(totalRentTax) + Number(item.payAmountNottax) * (1 + Number(item.taxRate) / 100)).toFixed(2));
      }
    }
  }
  rmarkData.value.totalRentNottax = totalRentNottax;
  rmarkData.value.totalRentTax = totalRentTax;
}

// 更新数据
const updateData = () => {
  rmarkData.value.totalRentNottax = '';
  rmarkData.value.totalRentTax = '';
}

// 获取某月份的天数
const getDays = (mouth: any, year: any) => {
  var days = 30;
  if (mouth == 2) {
    days = year % 4 === 0 ? 29 : 28;
  } else if (mouth == 1 || mouth == 3 || mouth == 5 || mouth == 7 || mouth == 8 || mouth== 10 || mouth == 12) {
    days = 31;
  }
  return days;
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

// 打开弹窗
const handleSearch = (val: any) => {
  emit('inputAppendHandle', val)
}

// 子组件暴露方法到父组件
defineExpose({
  dialogFormRef,
  isShowModel,
  closeHandle,
  rmarkData,
  rules,
  ruleFormRef,
  levelOne,
  levelTwo,
  levelThree
})
</script>

<style scoped lang="less">
.form-title {
  margin-bottom: 10px;
  line-height: 36px;
  background-color: #00706b;
  color: #fff;
  padding-left: 10px;
  font-size: 14px;
}
</style>
