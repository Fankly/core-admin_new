<script lang="ts">
export default {
  name: 'Notify'
}
</script>
<script lang="ts" setup>
import { reactive, ref, watch, defineProps, defineEmits } from 'vue'
import { getEjdwList, getYjdwList } from '@/api/matter'
import { ElMessage } from 'element-plus'
import { searchUser } from '@/api/goalValue/versionDetail'
import { notifyVersion } from '@/api/goalValue/version'
import VXETable from 'vxe-table'

const dialogVisible = ref(false)
const yjdwListData = ref<any[]>([])
const ejdwListData = ref<any[]>([])
const tableData = ref<any[]>([])
const loading = ref<boolean>(false)

const emit = defineEmits(['update:visible'])

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  specialOrgId: {
    type: String,
    default: '',
    required: true
  },
  versionId: {
    type: String,
    default: '',
    required: true
  }
})

const searchForm = reactive<{
  yjdw: string
  ejdw: string
  userId: string[]
}>({
  yjdw: '',
  userId: [],
  ejdw: ''
})

const showHandle = () => {
  getYjdwEnum()
}

const getYjdwEnum = async () => {
  if (props.specialOrgId) {
    let res: any = await getYjdwList(props.specialOrgId)
    if (res.success) {
      yjdwListData.value = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  }
}

const changeYjdwHandle = async (val: string) => {
  tableData.value.length = 0
  ejdwListData.value.length = 0
  searchForm.ejdw = ''
  searchForm.userId.length = 0
  loading.value = true
  if (val) {
    let res = await getEjdwList({
      parentId: val,
      specialorgid: props.specialOrgId
    })
    if (res.success) {
      ejdwListData.value = res.data
      loading.value = false
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
      loading.value = false
    }
  } else {
    loading.value = false
  }
}

const changeEjdwHandle = async () => {
  loading.value = true
  searchForm.userId.length = 0
  const res = await searchUser({
    ejdw: searchForm.ejdw,
    yjdw: searchForm.yjdw
  })
  if (res.success) {
    tableData.value = res.data
    loading.value = false
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
    loading.value = false
  }
}

const closeHandle = () => {
  dialogVisible.value = false
  searchForm.userId.length = 0
  searchForm.yjdw = ''
  searchForm.ejdw = ''
  emit('update:visible', false)
}

const sendHandle = async () => {
  if (searchForm.userId && searchForm.userId.length === 0) {
    ElMessage.warning('请选择待办接收人!')
    return
  }
  const type = await VXETable.modal.confirm('是否确定通知？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    const res = await notifyVersion({
      versionId: props.versionId,
      userIdList: searchForm.userId
    })
    if (res.success) {
      ElMessage.success('通知成功')
      closeHandle()
    } else {
      ElMessage.error(res.msg)
    }
  }
}

watch(
  () => props.visible,
  (val: boolean) => {
    dialogVisible.value = val
  }
)
</script>

<template>
  <vxe-modal position="center" @show="showHandle" title="版本通知" width="25%" v-model="dialogVisible" height="250px">
    <el-form :models="searchForm" label-width="120px">
      <el-form-item prop="yjdw" label="一级单位：">
        <el-select v-model="searchForm.yjdw" @change="changeYjdwHandle" style="width: 100%">
          <el-option v-for="item in yjdwListData" :key="item.code" :label="item.name" :value="item.code"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="ejdw" label="二级单位：">
        <el-select v-model="searchForm.ejdw" @change="changeEjdwHandle" style="width: 100%">
          <el-option v-for="item in ejdwListData" :key="item.code" :label="item.name" :value="item.code"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="userId" label="待办接收人：">
        <el-select style="width: 100%" collapse-tags :multiple="true" v-model="searchForm.userId">
          <el-option v-for="item in tableData" :key="item.userId" :label="item.username" :value="item.userId"></el-option> </el-select
      ></el-form-item>
    </el-form>
    <div class="btn" style="text-align: center">
      <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      <el-button size="mini" plain type="primary" @click="sendHandle">发送待办</el-button>
    </div>
  </vxe-modal>
</template>

<style scoped lang="less"></style>
