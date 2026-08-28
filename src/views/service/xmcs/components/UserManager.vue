<template>
  <vxe-modal
    @show="handleShow"
    :loading="loading"
    class-name="userManagerModal"
    position="center"
    v-model="dialogVisible"
    width="60%"
    height="700px"
    title="人员设置"
    :resize="true"
    @close="handleClose"
  >
    <div class="container">
      <div class="top">
        <div class="left">
          <el-button type="primary" plain size="mini" @click="addHandle(-1)">新 增</el-button>
          <el-button type="primary" plain size="mini" @click="selectHandle">选 择</el-button>
          <el-button type="primary" plain size="mini" @click="delHandle">删 除</el-button>
          <el-button type="primary" plain size="mini" @click="saveHandle">保 存</el-button>
        </div>
        <div class="right">
          <el-from :models="searchForm">
            <Grid ref="gridRef" :gap="[10, 0]" :cols="3">
              <GridItem>
                <el-form-item prop="deptId">
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `部门类型` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form">
                    <el-select v-model="searchForm.deptId" @change="handleDeptChange">
                      <el-option v-for="item in deptList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                    </el-select>
                  </div>
                </el-form-item>
              </GridItem>
              <GridItem>
                <el-form-item prop="yjdw">
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `一级单位` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form">
                    <el-select v-model="searchForm.yjdw" @change="changeYjdwHandle">
                      <el-option v-for="item in yjdwListData" :key="item.code" :label="item.name" :value="item.code"></el-option>
                    </el-select>
                  </div>
                </el-form-item>
              </GridItem>
              <GridItem>
                <el-form-item prop="ejdw">
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `二级单位` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form">
                    <el-select v-model="searchForm.ejdw" @change="changeEjdwHandle">
                      <el-option v-for="item in ejdwListData" :key="item.code" :label="item.name" :value="item.code"></el-option>
                    </el-select>
                  </div>
                </el-form-item>
              </GridItem>
            </Grid>
          </el-from>
        </div>
      </div>
      <div class="main">
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
          height="100%"
          :data="tableData"
        >
          <vxe-column type="checkbox" width="60"></vxe-column>
          <vxe-column width="200" field="userId" title="用户ID" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
            <template #edit="{ row }">
              <input class="my-sbsm" maxlength="127" v-model="row['userId']" />
            </template>
          </vxe-column>
          <vxe-column width="300" field="username" title="用户姓名" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
            <template #edit="{ row }">
              <input class="my-sbsm" maxlength="127" v-model="row['username']" />
            </template>
          </vxe-column>
          <vxe-column width="300" field="deptName" title="归口部门" />
        </vxe-table>
      </div>
    </div>
    <UserSelectDialog :multiple="true" @confirm="handleUserSelected" ref="userSelectRef" />
  </vxe-modal>
</template>

<script setup lang="ts">
import UserSelectDialog from '@/components/base/UserSelectDialog.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import { ref, defineEmits, defineProps, watch, reactive } from 'vue'
import { getEjdwList, getYjdwList } from '@/api/matter'
import { ElMessage } from 'element-plus'
import { staffArrangementList, staffArrangementSave, staffArrangementRemove } from '@/api/service/xmcs/index'
import { getDataByParent } from '@/api/common/index'
import VXETable from 'vxe-table'

const tableRef = ref()
const userSelectRef = ref<InstanceType<typeof UserSelectDialog>>()

const dialogVisible = ref(false)
const loading = ref(false)

const tableData = ref([])

const searchForm = reactive<{
  yjdw: string
  ejdw: string
  deptId: string
}>({
  yjdw: '',
  ejdw: '',
  deptId: ''
})

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  specialOrgId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'close'])

const yjdwListData = ref<any[]>([])
const ejdwListData = ref<any[]>([])
const deptList = ref<any[]>([])

const handleUserSelected = async (user: any) => {
  if (user && user.length !== 0) {
    const users = user.map((item: any) => ({
      yjdw: searchForm.yjdw,
      ejdw: searchForm.ejdw,
      deptId: searchForm.deptId,
      userId: item.ID,
      username: item.NAME
    }))
    const $table = tableRef.value
    if ($table) {
      const { row: newRow } = await $table.insertAt(users, -1)
      await $table.setEditCell(newRow)
    }
  }
}

const handleClose = () => {
  dialogVisible.value = false
  searchForm.yjdw = ''
  searchForm.ejdw = ''
  searchForm.deptId = ''
  deptList.value.length = 0
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  tableData.value.length = 0
  emit('update:visible', false)
  emit('close')
}

const getYjdwEnum = async () => {
  if (props.specialOrgId) {
    let res: any = await getYjdwList(props.specialOrgId)
    if (res.success) {
      yjdwListData.value = res.data
    } else {
      ElMessage.error(res.msg)
    }
    const record = await getDataByParent('ZXCSDEPTTYPE_COM')
    if (record.success) {
      deptList.value = record.data
    } else {
      ElMessage.error(record.msg)
    }
  }
}
const handleDeptChange = async (val: string) => {
  if (!searchForm.ejdw) return
  changeEjdwHandle()
}
const changeYjdwHandle = async (val: string) => {
  tableData.value.length = 0
  ejdwListData.value.length = 0
  searchForm.ejdw = ''
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
      ElMessage.error(res.msg)
      loading.value = false
    }
  } else {
    loading.value = false
  }
}

const changeEjdwHandle = async () => {
  if (!searchForm.deptId) return
  loading.value = true
  const res = await staffArrangementList({
    ...searchForm
  })
  if (res.success) {
    tableData.value = res.data
    tableData.value.forEach((item: any) => {
      const deptName = deptList.value.filter((records: any) => records.code == item.deptId)
      item.deptName = deptName[0].name
    })
    loading.value = false
  } else {
    ElMessage.error(res.msg)
    loading.value = false
  }
}

const addHandle = async (row?: number) => {
  if (!searchForm.ejdw) {
    ElMessage.warning('请先筛选二级单位')
    return
  }
  const $table = tableRef.value
  if ($table) {
    const record = {
      userId: '',
      username: '',
      deptName: ''
    }
    const { row: newRow } = await $table.insertAt(record, row)
    await $table.setEditCell(newRow, 'userId')
  }
}

const selectHandle = () => {
  if (!searchForm.ejdw) {
    ElMessage.warning('请先筛选二级单位')
    return
  }
  if (userSelectRef.value) userSelectRef.value.dialogVisible = true
}

const delHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    const selectRecords = $table.getCheckboxRecords()
    if (selectRecords.length === 0) {
      ElMessage.warning('请选择一条数据进行删除')
      return
    }
    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      for (let i = 0; i < selectRecords.length; i++) {
        const item = selectRecords[i]
        if (item.id) {
          await staffArrangementRemove(item.id)
        }
      }
      ElMessage.success('删除成功')
      changeEjdwHandle()
    }
  }
}

const saveHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    const { insertRecords, updateRecords } = $table.getRecordset()
    if (insertRecords.length !== 0 || updateRecords.length !== 0) {
      const paramsOne = insertRecords.map((item: any) => ({
        yjdw: searchForm.yjdw,
        ejdw: searchForm.ejdw,
        deptId: searchForm.deptId,
        userId: item.userId,
        username: item.username
      }))
      const paramsTwo = updateRecords.map((item: any) => ({
        yjdw: searchForm.yjdw,
        ejdw: searchForm.ejdw,
        deptId: searchForm.deptId,
        userId: item.userId,
        id: item.id,
        username: item.username
      }))
      const params = paramsOne.concat(paramsTwo)
      const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
        status: 'warning'
      })
      if (type === 'confirm') {
        const res = await staffArrangementSave(params)
        if (res.success) {
          ElMessage.success('保存成功!')
          await changeEjdwHandle()
        } else {
          ElMessage.error(res.msg)
        }
      }
    }
  }
}

const handleShow = () => {
  getYjdwEnum()
}
</script>

<style scoped lang="less">
.userManagerModal {
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    .top {
      display: flex;
      .left {
        width: 300px;
      }

      .right {
        text-align: right;
        flex: 1;
        min-width: 0;
        min-height: 0;
      }
    }

    .main {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
}
</style>
