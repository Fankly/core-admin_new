<template>
  <div v-loading="loading" class="container" ref="containerRef">
    <!-- <div class="operation" v-if="opType !== 'VIEW'">
      <el-button :disabled="!props.selectData" type="primary" plain @click="handleSaveData">
        保 存
      </el-button>
    </div> -->
    <el-collapse v-model="activeNames">
      <el-form
        :disabled="opType === 'VIEW'"
        :rules="formRules"
        ref="formRef"
        label-position="right"
        label-width="180px"
        label-suffix="："
        :model="projectScaleData"
      >
        <el-collapse-item name="hardware" title="单项目规模建设">
          <div class="table">
            <el-row>
              <el-col :span="12">
                <el-form-item label="杆塔（根）" prop="dxmgt">
                  <el-input-number
                    v-model="projectScaleData.dxmgt"
                    :controls="false"
                    style="width: 100%"
                    @change="() => handleChangeData('tqgt', 'dxmgt', 'gtzb')"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="电缆分支箱（只）" prop="dxmdlfzx">
                  <el-input-number
                    v-model="projectScaleData.dxmdlfzx"
                    :controls="false"
                    style="width: 100%"
                    @change="() => handleChangeData('tqdlfzx', 'dxmdlfzx', 'dlfzxzb')"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="架空线路（Km）" prop="dxmjkxl">
                  <el-input-number
                    v-model="projectScaleData.dxmjkxl"
                    :controls="false"
                    style="width: 100%"
                    @change="() => handleChangeData('tqjkxl', 'dxmjkxl', 'jkxlzb')"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="电缆线路（Km）" prop="dxmdlxl">
                  <el-input-number
                    v-model="projectScaleData.dxmdlxl"
                    :controls="false"
                    style="width: 100%"
                    @change="() => handleChangeData('tqdlxl', 'dxmdlxl', 'dlxlzb')"
                  ></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-collapse-item>
        <el-collapse-item name="engine" title="台区现有规模">
          <div class="table">
            <el-row>
              <el-col :span="12">
                <el-form-item label="杆塔（根）" prop="tqgt">
                  <el-input-number
                    v-model="projectScaleData.tqgt"
                    :controls="false"
                    style="width: 100%"
                    @change="() => handleChangeData('dxmgt', 'tqgt', 'gtzb')"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="电缆分支箱（只）" prop="tqdlfzx">
                  <el-input-number
                    v-model="projectScaleData.tqdlfzx"
                    :controls="false"
                    style="width: 100%"
                    @change="() => handleChangeData('dxmdlfzx', 'tqdlfzx', 'dlfzxzb')"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="架空线路（Km）" prop="tqjkxl">
                  <el-input-number
                    v-model="projectScaleData.tqjkxl"
                    :controls="false"
                    style="width: 100%"
                    @change="() => handleChangeData('dxmjkxl', 'tqjkxl', 'jkxlzb')"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="电缆线路（Km）" prop="tqdlxl">
                  <el-input-number
                    v-model="projectScaleData.tqdlxl"
                    :controls="false"
                    style="width: 100%"
                    @change="() => handleChangeData('dxmdlxl', 'tqdlxl', 'dlxlzb')"
                  ></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-collapse-item>
        <el-collapse-item name="information" title="项目规则占比">
          <div class="table">
            <el-row>
              <el-col :span="12">
                <el-form-item label="杆塔占比（%）">
                  <el-input v-model="projectScaleData.gtzb" :disabled="true" placeholder=""></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="电缆分支箱占比（%）">
                  <el-input v-model="projectScaleData.dlfzxzb" :disabled="true" placeholder=""></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="架空线路占比（%）">
                  <el-input v-model="projectScaleData.jkxlzb" :disabled="true" placeholder=""></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="电缆线路占比（%）">
                  <el-input v-model="projectScaleData.dlxlzb" :disabled="true" placeholder=""></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-collapse-item>
      </el-form>
    </el-collapse>
  </div>
</template>

<script setup lang="ts" name="ProjectScale">
import { ref, reactive, onMounted } from 'vue'
import VXETable from 'vxe-table'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
interface Props {
  selectData: any
  globalParams: any
  opType: string
}
type Names = 'hardware' | 'engine' | 'information'
// 默认值
const props = withDefaults(defineProps<Props>(), {
  selectData: null,
  globalParams: null,
  opType: 'EDIT'
})

// 自定义组件标识
const ISCUSTOMCOPONENT = true

const loading = ref<boolean>(false)
const containerRef = ref<any>()
const formRef = ref<any>()
const formRules = reactive({
  dxmgt: [{ required: true, message: '请输入杆塔（根）', trigger: 'blur' }],
  dxmdlfzx: [{ required: true, message: '请输入电缆分支箱（只）', trigger: 'blur' }],
  dxmjkxl: [{ required: true, message: '请输入架空线路（Km）', trigger: 'blur' }],
  dxmdlxl: [{ required: true, message: '请输入电缆线路（Km）', trigger: 'blur' }],
  tqgt: [{ required: true, message: '请输入杆塔（根）', trigger: 'blur' }],
  tqdlfzx: [{ required: true, message: '请输入电缆分支箱（只）', trigger: 'blur' }],
  tqjkxl: [{ required: true, message: '请输入架空线路（Km）', trigger: 'blur' }],
  tqdlxl: [{ required: true, message: '请输入电缆线路（Km）', trigger: 'blur' }]
})
const projectScaleData = ref<{
  dxmdlfzx: string
  dxmdlxl: string
  dxmgt: string
  dxmjkxl: string
  tqdlfzx: string
  tqdlxl: string
  tqgt: string
  tqjkxl: string
  dlfzxzb: string
  dlxlzb: string
  jkxlzb: string
  gtzb: string
  [key: string]: string | number
}>({
  dxmdlfzx: '',
  dxmdlxl: '',
  dxmgt: '',
  dxmjkxl: '',
  tqdlfzx: '',
  tqdlxl: '',
  tqgt: '',
  tqjkxl: '',
  dlfzxzb: '',
  dlxlzb: '',
  jkxlzb: '',
  gtzb: ''
})

const activeNames = ref<Names[]>(['hardware', 'engine', 'information'])

const handleSaveData = async () => {
  if (formRef.value) {
    await formRef.value.validate()
    const type = await VXETable.modal.confirm('是否确认保存?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      try {
        loading.value = true
        const res = await baseService.post('/xmjsgm/saveXmjsgm', {
          ...props.selectData,
          ...projectScaleData.value
        })
        if (!res.success) throw new Error(res.msg)
        ElMessage.success('保存成功!')
      } catch (error) {
        ElMessage.error((error as Error).message)
      } finally {
        loading.value = false
      }
    }
  }
}

const handleChangeData = (flag: string, targetFlag: string, targetZbFlag: string) => {
  const calcZbValue = calcZb(projectScaleData.value[flag], projectScaleData.value[targetFlag])
  if (Number.isNaN(Number(calcZbValue))) {
    projectScaleData.value[targetZbFlag] = ''
  } else {
    projectScaleData.value[targetZbFlag] = calcZbValue
  }
}

const calcZb = (value: string | number, targetValue: string | number) => {
  let num = ''
  if (String(value) === '0') {
    num = '0.00'
  } else if (value === null || value === '' || value === 'undefined') {
    num = ''
  } else if (String(targetValue) === '0') {
    num = '100.00'
  } else if (parent == null || targetValue === '' || targetValue === 'undefined') {
    num = ''
  } else {
    num = ((Number(value) * 100) / Number(targetValue)).toFixed(2)
  }
  return num
}

const initData = async () => {
  try {
    if (props.globalParams) {
      loading.value = true
      const res = await baseService.get(`/xmjsgm/getJsgmByXmId?xmId=${props.globalParams.ID}`)
      if (!res.success) throw new Error(res.msg)
      projectScaleData.value = {
        ...res.data
      }
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

// 获取表格中数据-自定义组件必须实现方法
const getFormData = () => {
  return {
    jsgmInfos: projectScaleData.value
  }
}

onMounted(initData)

defineExpose({
  getFormData,
  ISCUSTOMCOPONENT,
  formEl: formRef
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  :deep(.el-collapse-item__header) {
    padding-left: 10px;
    font-size: 18px;
    font-weight: bold;
    color: var(--color-primary, #409eff);
  }

  .operation {
    margin: 10px 0;
  }
}
</style>
