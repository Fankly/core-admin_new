<template>
  <vxe-modal
    destroy-on-close
    :loading="loading"
    position="center"
    title="日志"
    @close="handleCancel"
    v-model="isShowModal"
    width="70%"
    height="810"
    show-zoom
    show-footer
    resize
  >
    <div class="table">
      <vxe-table
        border
        :row-config="{
          height: 32,
          keyField: 'id'
        }"
        stripe
        show-overflow
        show-header-overflow
        align="center"
        header-align="center"
        resizable
        height="100%"
        :data="logDataList"
        ref="logTableRef"
      >
        <vxe-column
          align="center"
          header-align="center"
          show-overflow
          field="xgzd"
          title="修改字段"
          width="180"
        ></vxe-column>
        <vxe-column
          align="center"
          header-align="center"
          show-overflow
          field="xgBefore"
          title="修改前值"
        ></vxe-column>
        <vxe-column
          align="center"
          header-align="center"
          show-overflow
          field="xgAfter"
          title="修改后值"
        ></vxe-column>
        <vxe-column
          align="center"
          header-align="center"
          show-overflow
          field="xgrId"
          title="修改人ID"
          width="120"
        ></vxe-column>
        <vxe-column
          align="center"
          header-align="center"
          show-overflow
          field="xgrMc"
          width="120"
          title="修改人名称"
        ></vxe-column>
        <vxe-column
          align="center"
          header-align="center"
          show-overflow
          field="xgsj"
          width="180"
          title="修改时间"
        ></vxe-column>
      </vxe-table>
    </div>

    <template #footer>
      <el-pagination
        :current-page="page.page"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jmper"
        @size-change="(size:number) => limitChangeHandle(size)"
        @current-change="(page:number) => pageChangeHandle(page)"
      ></el-pagination>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="DeptModal">
import { getEditLog } from '@/api/sys/proCategory'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'

interface AcceptParams {
  id: string
  dwId: string
}
const emit = defineEmits(['saveDataAfter'])

const logTableRef = ref()
const isShowModal = ref(false)
const loading = ref(false)
const parameter = ref<AcceptParams>({
  id: '',
  dwId: ''
})

const page = reactive({
  total: 0,
  limit: 20,
  page: 1
})

const logDataList = ref([])

const searchLog = async () => {
  try {
    loading.value = true
    const res = await getEditLog({
      id: parameter.value.id,
      ...page
    })
    if (res.success) {
      logDataList.value = res.data.records
      page.total = res.data.total
    } else {
      throw new Error(res.msg)
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchLog()
}

const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchLog()
}

const acceptParams = (params: AcceptParams) => {
  isShowModal.value = true
  parameter.value = { ...parameter.value, ...params }
  searchLog()
}

const handleCancel = () => {
  isShowModal.value = false
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.table {
  height: 100%;
}
</style>
