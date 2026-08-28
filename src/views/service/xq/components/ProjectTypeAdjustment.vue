<template>
  <vxe-modal
    position="center"
    :loading="loading"
    :destroy-on-close="true"
     v-model="isShowModal"
    show-zoom
    :title="typeAdjustMsg.title"
    width="70%"
    height="650"
    @close="closeHandle"
  >
    <div class="container">
      <ProTable
        ref="proTableRef"
        :data-callback="dataCallBack"
        :tool-button="['other']"
        :request-api="getPageList"
        :request-auto="true"
        :search-col="4"
        :columns="columns"
      >
        <template #tableHeader="scope">
          <el-button plain type="primary" size="mini" @click="confirmHandle(scope['selectedList'])">确 定</el-button>
          <el-button plain type="primary" size="mini" @click="closeHandle">关 闭</el-button>
        </template>
      </ProTable>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'ProjectTypeAdjustment',
  components: {}
}
</script>
<script setup lang="ts">
import ProTable from '@/components/ProTable/index.vue'
import { getYssxForZl, zlxmXgXmlx } from '@/api/common'
import { ColumnProps } from '@/components/ProTable/interface'
import { ref, toRef, defineExpose, defineEmits, defineProps, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface TypeAdjustMsg {
  title: string
  opType: string
}

interface Props {
  typeAdjustMsg: TypeAdjustMsg
  selectedData: any
  userInfo: any
  xmIds: string
}

const props = defineProps<Props>()
const emit = defineEmits(['confirmData'])

const xmIds = toRef(props, 'xmIds')
const isShowModal = ref(false)
const loading = ref(false)

const columns = reactive<ColumnProps<any>[]>([
  { type: 'selection', width: 80 },
  { prop: 'zyssxbm', label: '预算事项编码', width: '180' },
  { prop: 'zyssxmc', label: '预算事项名称', width: '180' },
  { prop: 'yslyName', label: '预算类型', width: '180' },
  { prop: 'xmlxName', label: '项目类型', width: '180' },
  { prop: 'yjflName', label: '一级分类', width: '180' },
  { prop: 'ejflName', label: '二级分类', width: '180' },
  { prop: 'sjflName', label: '三级分类', width: '180' }
])

const dataCallBack = (data: any[]) => {
  loading.value = false
  return data || []
}

const getPageList = async (params: any) => {
  loading.value = true
  let newParams = JSON.parse(JSON.stringify(params))
  return getYssxForZl(newParams)
}

// 关闭
const closeHandle = () => {
  isShowModal.value = false
}

// 确定
const confirmHandle = async (list: any[]) => {
  if (list.length !== 1) {
    ElMessage.warning('请选择一条数据进行操作！')
    return
  }
  loading.value = true
  const params = list[0]
  zlxmXgXmlx({
    xmIds: xmIds.value,
    id: params.id,
    yslxctId: params.yslxctId,
    xmlx: params.xmlx,
    yjfl: params.yjfl,
    ejfl: params.ejfl,
    sjfl: params.sjfl
  }).then((res: any) => {
    if (res.success) {
      loading.value = false
      ElMessage.success('修改成功!')
      closeHandle()
      emit('confirmData')
    } else {
      loading.value = false
      ElMessage.error(res.msg || '修改失败!')
    }
  })
}

watch(
  () => isShowModal.value,
  (newVal) => {
    if (newVal) {
    }
  },
  {
    immediate: true
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
}
</style>
