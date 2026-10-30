<!-- 审核要点 -->
<template>
  <div v-if="isShowPage" class="audit-rule-point">
    <div class="point-content-wrap">
      <leftPanel class="point-content-wrap__left" @select="handleSelect" />
      <rightPanel class="point-content-wrap__right" :item="activeItem" />
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts">
defineOptions({ name: "/suzhou/aiAuditRulePoint/index" })
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import leftPanel from './components/left.vue'
import rightPanel from './components/right.vue'

interface PointItem {
  categoryRuleId: string
  ruleCode: string
  ruleName: string
  ruleClassifyName: string
  ruleLevelName: string
  ruleStatus: '0' | '1'
  [key: string]: any
}

const activeItem = ref<PointItem | null>(null)

const handleSelect = (item: PointItem | null) => {
  activeItem.value = item
}

const isShowPage = ref(false)
const userDialogRef = ref()

const getRoleHandle = async () => {
  try {
    if (userDialogRef.value?.isQuery) isShowPage.value = true
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
