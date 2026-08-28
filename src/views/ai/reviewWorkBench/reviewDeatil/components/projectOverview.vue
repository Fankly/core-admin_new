<template>
  <div>
    <div class="section-title">项目概要</div>
    <div v-if="selectedProject" style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e8e8e8">
      <div class="project-info-content">
        <el-form label-suffix="：" label-width="140px" label-position="left">
          <template v-for="item in xmInfoContern" :key="item.label">
            <el-form-item :label="item.label" class="info-form-item" :class="item.type == 'text' ? '' : 'block-item'">
              <div :class="item.type == 'text' ? 'info-text-new' : 'info-block-content-new'">
                {{ `${selectedProject[item.props] || ''}` }}
                {{ `${['amount', 'all_invest_tax'].includes(item.props) && selectedProject[item.props] ? '(万元)' : ''}` }}
              </div>
            </el-form-item>
          </template>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
interface propVo {
  xmInfoContern: any[]
  selectedProject: any
}
const props = defineProps<propVo>()
</script>
<style scoped lang="less">
.section-title {
  margin: 10px 0 !important;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0;
  padding-left: 10px;
  border-left: none; // Disable original blocky border
  position: relative;
  line-height: 1.2;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 1px;
    bottom: 1px;
    width: 3.5px;
    background-color: var(--color-primary, #00857c);
    border-radius: 2px; // Beautiful capsule/pill shaped border accent
  }
}
.project-info-content {
  width: 100%;
  height: 260px;
  overflow: hidden;
  overflow-y: auto;
  padding-bottom: 10px;
}
.info-form-item {
  margin-bottom: 0;
  // border-bottom: 1px solid #e8e8e8;
  // padding: 8px 0;
  transition: background-color 0.2s;

  &:hover {
    background-color: #fafbfc;
  }

  &:last-child {
    border-bottom: none;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: #475569;
    line-height: 32px;
  }
}

.info-form-item-new {
  padding: 45px 0 15px 0;
}
.info-block-content-new {
  background-color: #f8fafc;
  border: 1px solid #e8e8e8;
  padding: 12px;
  border-radius: 6px;
  color: #475569;
  line-height: 1.5;
  height: 140px;
  box-sizing: border-box;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow-y: auto;
  word-wrap: break-word;
  word-break: break-all;
  transition: all 0.25s ease;

  &:hover {
    background-color: #ffffff;
    border-color: var(--color-primary, #00857c);
    box-shadow: 0 4px 12px rgba(0, 133, 124, 0.05);
  }
}
</style>
