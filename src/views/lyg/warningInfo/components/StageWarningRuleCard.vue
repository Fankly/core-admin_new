<template>
  <div class="card-container">
    <!-- 3D Header -->
    <cardTitle :title="`${stageTitle}预警说明`" />

    <!-- Rule Items List with transition -->
    <Transition name="fade-slide" mode="out-in">
      <div class="rules-list" v-if="rulesDetail.type == 1 || rulesDetail.type == 2">
        <!-- Rule Item 1: 提醒 -->
        <div class="rule-item rule-remind">
          <div class="icon-box icon-remind">
            <Bell class="tw-h-4 tw-w-4" />
          </div>
          <div class="rule-body">
            <div class="rule-top font-bold text-amber-800">
              <span class="rule-label label-remind">{{ rulesDetail.type == 1 ? `【提醒规则】` : rulesDetail.tx.label }}</span>
              <span v-if="rulesDetail.type == 1" class="days-tag tag-remind">{{ `≥${rulesDetail.yjsjzqTx}天` }}</span>
            </div>
            <p v-if="rulesDetail.type == 1" class="rule-condition">{{ `${rulesDetail.text1}${rulesDetail.yjsjzqTx}${rulesDetail.text2}` }}</p>
            <p v-else class="rule-condition">{{ rulesDetail.tx.condition }}</p>
          </div>
        </div>

        <!-- Rule Item 2: 预警 -->
        <div class="rule-item rule-alert">
          <div class="icon-box icon-alert">
            <AlertTriangle class="tw-h-4 tw-w-4" />
          </div>
          <div class="rule-body">
            <div class="rule-top font-bold text-rose-800">
              <span class="rule-label label-remind">{{ rulesDetail.type == 1 ? `【预警规则】` : rulesDetail.yj.label }}</span>
              <span v-if="rulesDetail.type == 1" class="days-tag tag-alert">{{ `≥${rulesDetail.yjsjzqYj}天` }}</span>
            </div>
            <p v-if="rulesDetail.type == 1" class="rule-condition">{{ `${rulesDetail.text1}${rulesDetail.yjsjzqYj}${rulesDetail.text2}` }}</p>
            <p v-else class="rule-condition">{{ rulesDetail.yj.condition }}</p>
          </div>
        </div>

        <!-- Rule Item 3: 警告 -->
        <div class="rule-item rule-warning">
          <div class="icon-box icon-warning">
            <AlertCircle class="tw-h-4 tw-w-4" />
          </div>
          <div class="rule-body">
            <div class="rule-top font-bold text-orange-800">
              <span class="rule-label label-remind">{{ rulesDetail.type == 1 ? `【警告规则】` : rulesDetail.jg.label }}</span>
              <span v-if="rulesDetail.type == 1" class="days-tag tag-warning">{{ `≥${rulesDetail.yjsjzq}天` }}</span>
            </div>
            <p v-if="rulesDetail.type == 1" class="rule-condition">{{ `${rulesDetail.text1}${rulesDetail.yjsjzq}${rulesDetail.text2}` }}</p>
            <p v-else class="rule-condition">{{ rulesDetail.jg.condition }}</p>
          </div>
        </div>
      </div>
      <div class="rules-list" v-else>
        <!-- Rule Item 1: 提醒 -->
        <div class="rule-item rule-remind">
          <div class="icon-box icon-remind">
            <Bell class="tw-h-4 tw-w-4" />
          </div>
          <div class="rule-body">
            <div class="rule-top font-bold text-amber-800">
              <span class="rule-label label-remind">【提醒规则】</span>
            </div>
            <p class="rule-text">{{
              `1)已送审项目在项目审定完成后超过${rulesDetail.tx[0]}天未完成项目关闭；\n2)无需送审项目在项目竣工后${rulesDetail.tx[1]}天未完成完成项目关闭；\n3)未维护竣工日期的项目在结算进度(项目累计结算金额/项目总预算)大于98%，且最后一次结算后超过${rulesDetail.tx[2]}天未完成项目关闭`
            }}</p>
          </div>
        </div>

        <!-- Rule Item 2: 预警 -->
        <div class="rule-item rule-alert">
          <div class="icon-box icon-alert">
            <AlertTriangle class="tw-h-4 tw-w-4" />
          </div>
          <div class="rule-body">
            <div class="rule-top font-bold text-rose-800">
              <span class="rule-label label-remind">【预警规则】</span>
            </div>
            <p class="rule-text">{{
              `1)已送审项目在项目审定完成后超过${rulesDetail.yj[0]}天未完成项目关闭；\n2)无需送审项目在项目竣工后${rulesDetail.yj[1]}天未完成完成项目关闭；\n3)未维护竣工日期的项目在结算进度(项目累计结算金额/项目总预算)大于98%，且最后一次结算后超过${rulesDetail.yj[2]}天未完成项目关闭`
            }}</p>
          </div>
        </div>

        <!-- Rule Item 3: 警告 -->
        <div class="rule-item rule-warning">
          <div class="icon-box icon-warning">
            <AlertCircle class="tw-h-4 tw-w-4" />
          </div>
          <div class="rule-body">
            <div class="rule-top font-bold text-orange-800">
              <span class="rule-label label-remind">【警告规则】</span>
            </div>
            <p class="rule-text">{{
              `1)已送审项目在项目审定完成后超过${rulesDetail.jg[0]}天未完成项目关闭；\n2)无需送审项目在项目竣工后${rulesDetail.jg[1]}天未完成完成项目关闭；\n3)未维护竣工日期的项目在结算进度(项目累计结算金额/项目总预算)大于98%，且最后一次结算后超过${rulesDetail.jg[2]}天未完成项目关闭`
            }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import cardTitle from '@/views/lyg/components/cardTitle.vue'
import { Bell, AlertTriangle, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  selectedStage?: any
  STAGE_RULES: any[]
}>()

const stageTitle = computed(() => props.selectedStage?.yjhjName || '项目立项')
const rulesDetail = computed(() => props.STAGE_RULES.find((item) => item.title == stageTitle.value))
</script>

<style scoped>
.card-container {
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.rules-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* justify-content: space-between; */
  gap: 8px;
}

.rule-item {
  border-radius: 8px;
  padding: 6px;
  display: flex;
  align-items: flex-start;
  gap: 5px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.rule-item:hover {
  transform: translateX(4px);
}

.rule-remind {
  background: linear-gradient(to right, rgba(254, 243, 199, 0.8), rgba(254, 249, 195, 0.4));
}

.rule-alert {
  background: linear-gradient(to right, rgba(255, 237, 213, 0.8), rgba(254, 243, 199, 0.4));
}

.rule-warning {
  background: linear-gradient(to right, rgba(255, 228, 230, 0.8), rgba(254, 205, 211, 0.4));
}
.icon-box {
  padding: 6px;
  border-radius: 6px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-remind {
  background-color: rgba(250, 253, 12, 0.4);
  color: #b45309;
}

.icon-alert {
  background-color: rgba(252, 153, 7, 0.3);
  color: #c2410c;
}

.icon-warning {
  background-color: rgba(219, 47, 43, 0.25);
  color: #be123c;
}

.icon-svg {
  width: 16px;
  height: 16px;
}

.rule-body {
  flex: 1;
}

.rule-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rule-label {
  font-weight: 700;
  font-size: 16px;
}

.label-remind {
  color: #92400e;
}
.label-alert {
  color: #9a3412;
}

.label-warning {
  color: #9f1239;
}

.days-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 700;
  font-family: monospace;
}

.tag-remind {
  background-color: rgba(254, 243, 199, 0.8);
  color: #78350f;
}

.tag-alert {
  background-color: rgba(255, 237, 213, 0.8);
  color: #7c2d12;
}

.tag-warning {
  background-color: rgba(255, 228, 230, 0.8);
  color: #881337;
}

.rule-condition {
  color: #334155;
  font-size: 16px;
  line-height: 1.6;
  margin: 4px 0 0 0;
}
.rule-text {
  color: #334155;
  font-size: 12px;
  margin: 4px 0 0 0;
  white-space: pre-line;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.35s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
