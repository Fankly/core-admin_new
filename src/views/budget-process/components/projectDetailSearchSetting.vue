<template>
  <el-drawer v-model="drawer" title="字段显示设置">
    <div class="container">
      <vxe-grid v-bind="gridOptions">
        <template #bottom>
          <div class="operation">
            <el-button type="primary" plain @click="handleSave">保 存</el-button>
            <el-button type="primary" @click="handleClose">关 闭</el-button>
          </div>
        </template>
        <template #isShow_default="{ row }">
          <el-switch :disabled="row.sfmrzs" v-model="row.link" @change="(val) => onSwitchChange(val, row)" />
        </template>
        <template #sort_edit="{ row }">
          <input class="my-input" @change="() => onInputChange(row)" type="text" v-model="row.sort" />
        </template>
      </vxe-grid>
    </div>
  </el-drawer>
</template>

<script setup lang="ts" name="projectDetailSearchSetting">
import { IObject } from '@/types/interface'
import { reactive, ref } from 'vue'
import { VxeGridProps } from 'vxe-table'
import { BaseMethod } from '@/api/base/BaseMethod'
import { ElMessage, ElMessageBox } from 'element-plus'

interface RowVO {
  dataType: string
  id: string
  link: boolean
  name: boolean
  sfmrzs: true
  sort: string
}

const drawer = ref(false)
const baseMethod = new BaseMethod()
const emit = defineEmits(['search'])

const gridOptions = reactive<VxeGridProps<RowVO>>({
  border: true,
  stripe: true,
  loading: false,
  loadingConfig: {
    icon: 'el-icon-loading',
    text: '正在加载中...'
  },
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    beforeEditMethod: ({ row }: { row: RowVO }) => {
      return row['link']
    }
  },
  headerAlign: 'center',
  showHeaderOverflow: true,
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  columnConfig: {
    resizable: true
  },
  columns: [
    { field: 'name', title: '字段名', headerAlign: 'center', align: 'center', visible: true },
    {
      field: 'isShow',
      title: '是否默认展示',
      headerAlign: 'center',
      width: 120,
      align: 'center',
      visible: true,
      slots: { default: 'isShow_default' }
    },
    {
      field: 'sort',
      title: '排序',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      visible: true,
      editRender: {
        name: 'input',
        autofocus: '.my-input',
        autoselect: true
      },
      slots: {
        edit: 'sort_edit'
      }
    }
  ],
  data: []
})

const param = ref({
  dataType: '1'
})

const handleClose = () => {
  drawer.value = false
}
const handleSave = async () => {
  // drawer.value = false
  const changeRows = gridOptions.data
  if (Array.isArray(changeRows) && changeRows.length === 0) {
    ElMessage.warning('请修改后,再进行保存!')
    return
  }
  gridOptions.loading = true
  try {
    const isConfirm = await ElMessageBox.confirm('请确认是否进行保存?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否',
      type: 'warning'
    })
    if (isConfirm === 'confirm') {
      const res = await baseMethod.post('/xmmxConfig/saveLink', changeRows, {}, false)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('保存成功!')
      drawer.value = false
      clearData()
      emit('search')
    }
  } catch (e) {
    ElMessage.warning((e as Error).message)
  } finally {
    gridOptions.loading = false
  }
}

const clearData = () => {
  changeRowMap.clear()
}

const acceptParams = (params: IObject) => {
  drawer.value = true
  param.value = { ...param.value, ...params }
  getLinkData()
}

const getLinkData = async () => {
  try {
    gridOptions.loading = true
    const res = await baseMethod.get(
      '/xmmxConfig/getLinkList',
      {
        ...param.value
      },
      {},
      false
    )
    if (!res.success) throw new Error(res.msg)
    gridOptions.data = res.data
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    gridOptions.loading = false
  }
}

const changeRowMap = new Map()

const onSwitchChange = (val: string, row: RowVO) => {
  changeRowMap.set(row.id, row)
}
const onInputChange = (row: RowVO) => {
  changeRowMap.set(row.id, row)
}

const getChangedRows = () => {
  return Array.from(changeRowMap.values())
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  padding: 10px;
  .operation {
    text-align: center;
    padding-top: 10px;
  }
}
</style>
