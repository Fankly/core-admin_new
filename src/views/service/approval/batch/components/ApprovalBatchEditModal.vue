<template>
  <vxe-modal
    v-model="isShowModal"
    show-zoom
    resize
    show-footer
    position="center"
    :destroy-on-close="true"
    :loading="loading"
    :title="parameter.title"
    width="60%"
    height="910"
    @close="handleClose"
  >
    <div class="form-container">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-position="right" label-width="90px" label-suffix=" : ">
        <div class="section-header">
          <div class="section-title">
            <i class="vxe-icon-info-circle-fill"></i>
            基础信息
          </div>
        </div>
        <el-row :gutter="30">
          <el-col :span="12">
            <el-form-item prop="pspcCode" label="批次编号">
              <el-input v-model="formData.pspcCode" clearable maxlength="32"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="pspcName" label="批次名称">
              <el-input v-model="formData.pspcName" clearable maxlength="128"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="pspcType" label="批次类型">
              <el-select v-model="formData.pspcType" style="width: 100%">
                <el-option v-for="item in pspcList" :key="item.code" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="nd" label="年度">
              <el-select v-model="formData.nd" style="width: 100%">
                <el-option v-for="item in ndList" :key="item.code" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="showReviewTemplate" :span="24">
            <div class="template-panel" v-loading="templateLoading">
              <div class="template-panel__header">
                <div class="template-panel__title-wrap">
                  <span class="template-panel__title">附件模板</span>
                  <span class="template-panel__subtitle">{{ currentPspcTypeName }}自动匹配</span>
                </div>
                <span v-if="reviewTemplateList.length > 0" class="template-panel__count">{{ reviewTemplateList.length }}份</span>
              </div>
              <div class="template-panel__body">
                <button v-for="item in reviewTemplateList" :key="item.uuid" type="button" class="template-item" @click="handleDownloadTemplate(item)">
                  <span class="template-item__name" :title="item.attachName">{{ item.attachName }}</span>
                  <span class="template-item__action">下载</span>
                </button>
                <div v-if="reviewTemplateList.length === 0" class="template-empty">当前批次类型暂未配置附件模板</div>
              </div>
            </div>
          </el-col>
        </el-row>

        <div class="section-header">
          <div class="section-title">
            <i class="vxe-icon-calendar"></i>
            需求申报阶段
          </div>
        </div>
        <div class="phase-section">
          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item prop="lhhsSkTime" label="截止时间">
                <el-date-picker v-model="formData.lhhsSkTime" value-format="YYYY-MM-DD" type="day" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="section-header">
          <div class="section-title">
            <i class="vxe-icon-calendar"></i>
            联合会审阶段
          </div>
        </div>
        <div class="phase-section">
          <span class="phase-tag">线上预审</span>
          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item prop="lhhsOneStartTime" label="开始日期">
                <el-date-picker
                  v-model="formData.lhhsOneStartTime"
                  value-format="YYYY-MM-DD"
                  type="day"
                  style="width: 100%"
                  @change="(val: string) => handleDateSync(val, 'lhhsOneEndTime', 'after')"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="lhhsOneEndTime" label="结束日期">
                <el-date-picker
                  v-model="formData.lhhsOneEndTime"
                  value-format="YYYY-MM-DD"
                  type="day"
                  style="width: 100%"
                  @change="(val: string) => handleDateSync(val, 'lhhsOneStartTime', 'before')"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>

          <span class="phase-tag">线下会审</span>
          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item prop="lhhsTwoStartTime" label="开始日期">
                <el-date-picker
                  v-model="formData.lhhsTwoStartTime"
                  value-format="YYYY-MM-DD"
                  type="day"
                  style="width: 100%"
                  @change="(val: string) => handleDateSync(val, 'lhhsTwoEndTime', 'after')"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="lhhsTwoEndTime" label="结束日期">
                <el-date-picker
                  v-model="formData.lhhsTwoEndTime"
                  value-format="YYYY-MM-DD"
                  type="day"
                  style="width: 100%"
                  @change="(val: string) => handleDateSync(val, 'lhhsTwoStartTime', 'before')"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="phase-section">
          <span class="phase-tag">出具可研评审意见</span>
          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item prop="lhhsThreeStartTime" label="开始日期">
                <el-date-picker
                  v-model="formData.lhhsThreeStartTime"
                  value-format="YYYY-MM-DD"
                  type="day"
                  style="width: 100%"
                  @change="(val: string) => handleDateSync(val, 'lhhsThreeEndTime', 'after')"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="lhhsThreeEndTime" label="结束日期">
                <el-date-picker
                  v-model="formData.lhhsThreeEndTime"
                  value-format="YYYY-MM-DD"
                  type="day"
                  style="width: 100%"
                  @change="(val: string) => handleDateSync(val, 'lhhsThreeStartTime', 'before')"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>

          <span class="phase-tag">专业批复合规性审查</span>
          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item prop="lhhsFourStartTime" label="开始日期">
                <el-date-picker
                  v-model="formData.lhhsFourStartTime"
                  value-format="YYYY-MM-DD"
                  type="day"
                  style="width: 100%"
                  @change="(val: string) => handleDateSync(val, 'lhhsFourEndTime', 'after')"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="lhhsFourEndTime" label="结束日期">
                <el-date-picker
                  v-model="formData.lhhsFourEndTime"
                  value-format="YYYY-MM-DD"
                  type="day"
                  style="width: 100%"
                  @change="(val: string) => handleDateSync(val, 'lhhsFourStartTime', 'before')"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="form-operation" style="text-align: center">
        <el-button type="primary" size="mini" plain @click="handleSave">保存</el-button>
        <el-button size="mini" plain @click="handleClose">关闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="ApprovalBatchEditModal">
import { useApprovalBatchEdit } from './hooks/useApprovalBatchEdit'

interface Props {
  search: () => void
}

const props = defineProps<Props>()

const {
  isShowModal,
  loading,
  templateLoading,
  parameter,
  formRules,
  formRef,
  formData,
  acceptParams,
  handleClose,
  handleSave,
  handleDateSync,
  handleDownloadTemplate,
  pspcList,
  ndList,
  showReviewTemplate,
  currentPspcTypeName,
  reviewTemplateList
} = useApprovalBatchEdit(props)

defineExpose({
  acceptParams
})
</script>

<style lang="less" scoped>
.form-container {
  padding: 10px 20px;

  .section-header {
    margin: 25px 0 15px;
  }

  .section-header:first-child {
    margin-top: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-primary);
  }

  .section-title i {
    margin-right: 8px;
    color: var(--color-primary);
  }

  .phase-section {
    position: relative;
    margin-bottom: 20px;
    padding: 20px 20px 5px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;

    &::before {
      position: absolute;
      top: 20px;
      left: 0;
      width: 3px;
      height: 14px;
      content: '';
      background: var(--color-primary);
      border-radius: 0 2px 2px 0;
    }
  }

  .phase-tag {
    display: block;
    margin-bottom: 15px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    color: #909399;
  }

  .template-panel {
    padding: 16px 18px;
    margin-bottom: 6px;
    background: linear-gradient(135deg, #f7fbff 0%, #ffffff 100%);
    border: 1px solid #dbe7f6;
    border-radius: 8px;
  }

  .template-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .template-panel__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .template-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .template-panel__subtitle {
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
  }

  .template-panel__count {
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
    background: rgb(64 158 255 / 10%);
    border-radius: 999px;
  }

  .template-panel__body {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 10px;
    padding-top: 10px;
    max-height: 176px;
    overflow-y: auto;
    padding-right: 2px;
  }

  .template-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }

  .template-item:hover {
    border-color: var(--color-primary);
    box-shadow: 0 6px 18px rgb(64 158 255 / 10%);
    transform: translateY(-1px);
  }

  .template-item__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 13px;
    color: #303133;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .template-item__action {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
  }

  .template-empty {
    padding: 12px 14px;
    font-size: 13px;
    color: #909399;
    background: #fff;
    border: 1px dashed #dcdfe6;
    border-radius: 8px;
  }

  .el-form-item__label {
    padding-bottom: 4px !important;
    font-weight: 500 !important;
    color: #606266 !important;
  }
}
</style>
