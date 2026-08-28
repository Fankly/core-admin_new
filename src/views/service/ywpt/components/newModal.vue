<!-- 专家人员录入 -->
<template>
  <div v-if="isShowModel">
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      :title="props.title"
      :width="800"
      :height="750"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <el-form
        label-suffix=" : "
        ref="ruleFormRef"
        label-width="120px"
        label-position="right"
        :model="rmarkData"
        :rules="rules"
        :hide-required-asterisk="false"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="专家专业" prop="major">
              <el-select style="width: 100%" v-model="rmarkData.major" placeholder="请选择专家专业(必填)" clearable>
                <el-option v-for="item in props.pszy" :key="item.code" :label="item.name" :value="item.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专家姓名" prop="expertName">
              <el-input :maxlength="8" v-model.trim="rmarkData.expertName" placeholder="请输入专家姓名(必填)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="一级单位" prop="yjdw">
              <el-select style="width: 100%" v-model="rmarkData.yjdw" placeholder="请选择一级单位(选填)" clearable>
                <el-option v-for="item1 in levelOne" @click="selectChange(item1)" :key="item1.code" :label="item1.name" :value="item1.code">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="二级单位" prop="ejdw">
              <el-select style="width: 100%" v-model="rmarkData.ejdw" placeholder="请选择二级单位(选填)" clearable>
                <el-option v-for="item1 in levelTwo" @click="selectChangeBm(item1)" :key="item1.code" :label="item1.name" :value="item1.code">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属部门" prop="deptId">
              <el-select style="width: 100%" v-model="rmarkData.deptId" placeholder="请选择所属部门(选填)" clearable>
                <el-option v-for="item1 in levelThree" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="identityCard">
              <el-input maxlength="18" v-model.trim="rmarkData.identityCard" clearable placeholder="请输入身份证号(选填)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专家性别" prop="sex">
              <el-select style="width: 100%" v-model="rmarkData.sex" placeholder="请选择专家性别(选填)" clearable>
                <el-option v-for="item1 in gender" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一权限账号" prop="account">
              <el-input maxlength="60" v-model.trim="rmarkData.account" clearable placeholder="请输入统一权限账号(必填)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式" prop="phoneNo">
              <el-input :maxlength="11" v-model.trim="rmarkData.phoneNo" clearable placeholder="请输入联系方式(必填)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="mail">
              <el-input maxlength="62" v-model.trim="rmarkData.mail" clearable placeholder="请输入电子邮箱(选填)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="擅长专业" prop="talent">
              <!-- <el-select style="width: 100%" v-model="rmarkData.expertLevel" placeholder="请选择" clearable >
                 <el-option v-for="item1 in options" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
                </el-select> -->
              <el-input maxlength="62" v-model.trim="rmarkData.talent" placeholder="请输入擅长专业(选填)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专家级别" prop="expertLevel">
              <el-select style="width: 100%" v-model="rmarkData.expertLevel" placeholder="请选择专家级别(选填)" clearable>
                <el-option v-for="item1 in props.zjjb" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="工作简历" prop="resume">
              <el-input
                :maxlength="120"
                show-word-limit
                resize="none"
                type="textarea"
                :rows="4"
                v-model.trim="rmarkData.resume"
                placeholder="请输入工作简历(选填)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="主要业绩" prop="performance">
              <el-input
                :maxlength="120"
                show-word-limit
                resize="none"
                type="textarea"
                :rows="4"
                v-model.trim="rmarkData.performance"
                placeholder="请输入主要业绩(选填)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                :maxlength="120"
                show-word-limit
                resize="none"
                type="textarea"
                :rows="4"
                v-model.trim="rmarkData.remark"
                placeholder="请输入备注(选填)"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div style="text-align: center">
        <el-button size="mini" type="primary" plain @click="pushMsgHandle">保 存</el-button>
        <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, defineProps, defineEmits, defineExpose, reactive } from 'vue'
import { ElMessageBox } from 'element-plus'
import { getEjdwData, getBm } from '@/api/service/expertinformation'

interface OptionItem {
  code: string | number
  name: string
  id?: string | number
  [key: string]: any
}

//接收父组件传参
const props = withDefaults(
  defineProps<{
    title: string
    zjjb: OptionItem[]
    pszy: OptionItem[]
  }>(),
  {
    title: '新增',
    zjjb: () => [],
    pszy: () => []
  }
)
// 子组件
const emit = defineEmits(['showModal'])
//表格规则
const rules = reactive({
  major: [
    {
      required: true,
      message: '请选择一个专家专业',
      trigger: 'change'
    }
  ],
  expertName: [
    {
      required: true,
      message: '请输入专家姓名',
      trigger: 'blur'
    }
  ],
  account: [
    {
      required: true,
      message: '请输入统一权限账号',
      trigger: 'blur'
    }
  ],
  identityCard: [
    {
      required: false,
      message: '请输入身份证',
      trigger: 'blur'
    },
    {
      pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
      message: '请输入正确的身份证号码'
    }
  ],
  mail: [
    {
      required: false,
      message: '请输入电子邮箱',
      trigger: 'blur'
    },
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: '请输入正确的邮箱格式'
    }
  ],
  phoneNo: [
    {
      required: true,
      message: '请输入联系方式',
      trigger: 'blur'
    },
    {
      pattern: /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-79])|(?:5[0-35-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1589]))\d{8}$/,
      message: '请输入正确的电话号码'
    }
  ]
})
const ruleFormRef = ref()
const dialogFormRef = ref()
const isShowModel = ref(false)
// 弹框参数
const rmarkData = ref<any>({})
const gender = ref<any>([
  { code: '0', name: '男' },
  { code: '1', name: '女' }
])
const levelOne = ref<any>([]) //一级单位
const levelTwo = ref<any>([]) //二级单位
const levelThree = ref<any>([]) //所属部门

// 联动二级单位
const selectChange = async (val: any) => {
  rmarkData.value.ejdw = ''
  rmarkData.value.deptId = ''
  levelThree.value.length = 0
  let res: any = await getEjdwData(val.id)
  if (res.success && res.data.length !== 0) {
    levelTwo.value = res.data
  }
}
// 联动所属部门
const selectChangeBm = async (val: any) => {
  rmarkData.value.deptId = ''
  let res: any = await getBm(parseInt(val.code))
  if (res.success && res.data.length !== 0) {
    levelThree.value = res.data
  }
}

// 关闭
const closeHandle = () => {
  ruleFormRef.value.resetFields()
  isShowModel.value = false
}
//保存
const pushMsgHandle = () => {
  ruleFormRef.value.validate((valid: any) => {
    if (!valid) return
    ElMessageBox.confirm('是否确定保存？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        emit('showModal', { type: props.title, label: rmarkData })
      })
      .catch((error: any) => {
        console.log(error)
      })
  })
}
// 子组件暴露方法到父组件
defineExpose({
  dialogFormRef,
  isShowModel,
  closeHandle,
  rmarkData,
  levelOne,
  levelTwo,
  levelThree
})
</script>
