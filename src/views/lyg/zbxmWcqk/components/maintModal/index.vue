<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="600px"
    height="560px"
    @close="handleClose"
    :loading="loading"
    show-footer
  >
    <el-form ref="ruleFormRef" label-suffix=":" label-width="120px" label-position="right" :model="searchParams">
      <el-row :gutter="0">
        <el-col :span="24">
          <el-form-item label="年度" prop="zyear" :rules="[{ required: true, message: '请选择年度' }]">
            <el-date-picker v-model="searchParams.zyear" type="year" format="YYYY" value-format="YYYY" clearable placeholder="请选择年度" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="月度" prop="zmonth" :rules="[{ required: true, message: '请选择月度' }]">
            <el-select v-model="searchParams.zmonth" clearable filterable placeholder="请选择月度" style="width: 100%">
              <el-option v-for="i in 12" :key="i" :label="String(i)" :value="String(i)" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="资本/成本类型" prop="zcblx" :rules="[{ required: true, message: '请选择资本/成本类型' }]">
            <el-select v-model="searchParams.zcblx" clearable filterable placeholder="请选择资本/成本类型" style="width: 100%">
              <el-option v-for="item in zcblxList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="一级单位" prop="yjdw" :rules="[{ required: true, message: '请选择一级单位' }]">
            <el-select v-model="searchParams.yjdw" @change="yjdwChange" clearable filterable placeholder="请选择一级单位" style="width: 100%">
              <el-option v-for="item in yjdwList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="二级单位" prop="ejdw">
            <el-select v-model="searchParams.ejdw" clearable filterable placeholder="请选择二级单位" style="width: 100%">
              <el-option v-for="item in ejdwList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="归口部门" prop="gkbm">
            <el-select v-model="searchParams.gkbm" clearable filterable placeholder="请选择归口部门" style="width: 100%">
              <el-option v-for="item in gkbmList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="目标值（万元）" prop="targetValue" :rules="[{ required: true, message: '请输入目标值' }]">
            <el-input v-model="searchParams.targetValue" placeholder="请输入目标值" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="完成值（万元）" prop="finishValue" :rules="[{ required: true, message: '请输入完成值' }]">
            <el-input v-model="searchParams.finishValue" placeholder="请输入完成值" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button size="mini" :loading="loading" :disabled="loading" @click="handleSave" type="primary"> 保 存 </el-button>
        <el-button size="mini" :disabled="loading" @click="handleClose" plain> 关 闭 </el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'zbxmWcqkMaintModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { zbxmWcqkAdd, zbxmWcqkUpdate } from '@/api/lyg/zbxmWcqk'
import { getYjdwNew, getEjdwByYjdw, getPublicData } from '@/api/common'
import { getSgbm } from '@/api/service/requirement'

/** 公共代码项 */
interface CodeItem {
  code: string
  name: string
}

/** 弹窗参数 */
interface ModalParams {
  type: string
  searchParams: Record<string, any>
  specialorgid: string
  org_id: string
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('')
const userInfo = ref<any>()
const yjdwList = ref<CodeItem[]>([])
const ejdwList = ref<CodeItem[]>([])
const gkbmList = ref<CodeItem[]>([])
const zcblxList = ref<CodeItem[]>([])
const searchParams = ref<any>({})

/** 重置表单数据与校验状态 */
const resetForm = () => {
  ruleFormRef.value?.resetFields()
  isShowModal.value = false
}

/** 关闭弹窗 */
const handleClose = () => {
  resetForm()
}

/** 保存 */
const handleSave = () => {
  if (!ruleFormRef.value) {
    ElMessage.warning('表单未加载完成，请稍后重试')
    return
  }
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', {
        status: 'warning'
      })
      if (type !== 'confirm') {
        ElMessage.info('已取消')
        return
      }
    } catch {
      return
    }

    loading.value = true
    try {
      const saveApi = modalTitle.value === '编辑' ? zbxmWcqkUpdate : zbxmWcqkAdd
      const res = await saveApi({ ...searchParams.value })
      if (res.success) {
        ElMessage.success('保存成功！')
        emit('searchHandle', { param: 'success' })
        handleClose()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  })
}

/** 一级单位变化：联动二级单位与归口部门 */
const yjdwChange = async (val: any) => {
  searchParams.value.ejdw = ''
  searchParams.value.gkbm = ''
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  if (!val) return

  // 联动二级单位
  try {
    const ejdwRes: any = await getEjdwByYjdw(val)
    if (ejdwRes.success && ejdwRes.data && ejdwRes.data.length !== 0) {
      ejdwList.value.push(...ejdwRes.data)
    }
  } catch (e) {
    console.error(e)
  }

  // 联动归口部门
  try {
    const gkbm: any = await getSgbm({
      YJDW: val,
      bmId: userInfo.value.specialorgid,
      dwId: userInfo.value.org_id,
      parentCode: val
    })
    if (gkbm.success && gkbm.data && gkbm.data.length !== 0) {
      gkbmList.value.push(...gkbm.data)
    }
  } catch (e) {
    console.error(e)
  }
}

/** 获取一级单位下拉选项 */
const fetchYjdw = async (specialorgid: any) => {
  try {
    yjdwList.value.length = 0
    const res: any = await getYjdwNew(specialorgid)
    if (res.success && res.data && res.data.length !== 0) {
      yjdwList.value.push(...res.data)
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

/** 获取资本/成本类型下拉选项 */
const fetchZcblx = async () => {
  try {
    zcblxList.value.length = 0
    const res: any = await getPublicData('LYG_ZBXM_ZCBLX_COM')
    if (res.success && res.data && res.data.length !== 0) {
      zcblxList.value.push(...res.data)
    }
  } catch (error) {
    console.error(error)
  }
}

/** 打开弹窗 */
const acceptParams = async (params: ModalParams) => {
  userInfo.value = { ...params }
  modalTitle.value = params.type
  // 清空已有属性，保持 searchParams 引用不变（避免 el-form 的 model 引用失效导致校验失败）
  Object.keys(searchParams.value).forEach((key) => {
    delete searchParams.value[key]
  })
  const src = params.searchParams || {}
  Object.assign(searchParams.value, src)
  // 新增时初始化字段
  if (modalTitle.value === '新增') {
    searchParams.value.zyear = src.zyear || new Date().getFullYear().toString()
    searchParams.value.zmonth = src.zmonth || ''
    searchParams.value.zcblx = src.zcblx || ''
    searchParams.value.yjdw = src.yjdw || ''
    searchParams.value.ejdw = src.ejdw || ''
    searchParams.value.gkbm = src.gkbm || ''
    searchParams.value.targetValue = src.targetValue ?? ''
    searchParams.value.finishValue = src.finishValue ?? ''
  }
  isShowModal.value = true
  fetchYjdw(userInfo.value.specialorgid)
  fetchZcblx()
  // 编辑时回显联动数据
  if (modalTitle.value === '编辑' && searchParams.value.yjdw) {
    const { yjdw, ejdw, gkbm } = src
    await yjdwChange(yjdw)
    // 还原选中值（yjdwChange 会清空 ejdw/gkbm）
    searchParams.value.yjdw = yjdw
    searchParams.value.ejdw = ejdw
    searchParams.value.gkbm = gkbm
  }
}

defineExpose({ acceptParams })
</script>
