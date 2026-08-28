<!-- 项目比对明细 -->
<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      v-model="isShowTable"
      :destroy-on-close="true"
      :title="`比对`"
      :width="1200"
      :height="700"
      :close-on-press-escape="false"
      @close="closeSxModal"
      :loading="loading"
    >
      <el-row :gutter="20" class="row-column">
        <el-col :span="12" class="left-column">
          <div class="section-title">本会议当前提交记录</div>
          <el-form label-suffix="：" label-width="140px" label-position="right">
            <template v-for="item in xmInfoColunm" :key="item.label">
              <el-form-item :label="item.label" class="info-form-item">
                <span class="info-text" :style="{ color: newProject[item.props] !=oldProject[item.props] ? 'red' : '' }">{{ newProject[item.props] }}</span>
              </el-form-item>
            </template>
          </el-form>
        </el-col>
        <el-col :span="12" class="right-column">
          <div class="section-title">本会议上个提交记录</div>
          <el-form label-suffix="：" label-width="140px" label-position="right">
            <template v-for="item in xmInfoColunm" :key="item.label">
              <el-form-item :label="item.label" class="info-form-item">
                <span class="info-text" :style="{ color: newProject[item.props] !=oldProject[item.props] ? 'red' : '' }">{{ oldProject[item.props] }}</span>
              </el-form-item>
            </template>
          </el-form>
        </el-col>
      </el-row>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'ChangXmInfo'
}
</script>
<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'

const modalRef = ref()
const isShowTable = ref<boolean>(false)
const loading = ref<boolean>(false)
const newProject = ref()
const oldProject = ref()

//关闭
const closeSxModal = () => {
  isShowTable.value = false
}

const xmInfoColunm = reactive([
  { label: '项目编码', props: 'xmbm' },
  { label: '项目名称', props: 'xmmc' },
  { label: '项目类型', props: 'pro_type_name' },
  { label: '一级单位', props: 'yjdw' },
  { label: '二级单位', props: 'ejdw' },
  { label: '成本中心', props: 'apply_center' },
  { label: '申报金额（万元）', props: 'amount' },
  { label: '计划实施年份', props: 'jhssnd' },
  { label: '重点投向', props: 'zdtx' },
  { label: '省归口部门', props: 'zgkbm' },
  { label: '预算事项名称', props: 'yssxmc' },
  // { label: '预算事项说明',props: 'yssx_remark' },
  { label: '一级分类', props: 'yjfl' },
  { label: '二级分类', props: 'ejfl' },
  { label: '三级分类', props: 'sjfl' },
  { label: '实施部门', props: 'ssbm' },
  { label: '项目实施人', props: 'xmssr' },
  { label: '研发投入统计范围', props: 'zyfjftrtjfw' },
  // { label: '预期成果',props: 'zyqcg' },
  { label: '研发投入百分比', props: 'jryftrbfb' },
  // { label: '百分比说明',props: 'bfbjsfssm' },
  { label: '是否安全生产', props: 'sfaqsc' },
  { label: '安全生产费用类型', props: 'aqscfylx' },
  { label: '线路类型', props: 'xllx' },
  { label: '电压等级', props: 'dydj' }
  // { label: '项目实施内容',props: 'ssnr' },
  // { label: '项目建议书（数量）',props: 'fj1' },
  // { label: '可研（数量）',props: 'fj2' },
  // { label: '批复文件（数量）',props: 'fj3' },
])

defineExpose({
  isShowTable,
  loading,
  newProject,
  oldProject,
  xmInfoColunm
})
</script>
<style scoped lang="less">
.row-column {
  width: 100%;
  height: 100%;

  .left-column {
    border-right: 1px solid #c7c7c7;
  }
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 0;
  padding-left: 8px;
  border-left: 4px solid var(--color-primary, #00857c);
  line-height: 1.2;
}

.info-form-item {
  margin-bottom: 0;
  border-bottom: 1px solid #f2f6fc;
}

.info-form-item:last-child {
  border-bottom: none;
}
</style>
