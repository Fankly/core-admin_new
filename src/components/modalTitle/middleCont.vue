<!-- 切换和图例 -->
<template>
  <div class="formClass">
    <el-form
      label-suffix=" : "
      ref="ruleFormRef"
      label-width="90px"
      label-position="right"
      :hide-required-asterisk="false"
    >
      <el-row :gutter="20">
        <el-form-item label="展示方式" prop="aaa">
          <el-select
            v-model="viewMethod"
            style="width: 200px"
            placeholder="请选择展示方式"
            @change="getViewMethod"
          >
            <el-option
              v-for="item in showTypeList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </el-form-item>
      </el-row>
    </el-form>
    <div class="formClassTl">
      <div>省级统筹</div>
      <div>市域统筹</div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'middleCont'
}
</script>
<script setup lang="ts">
import { ref, defineEmits } from 'vue'

const emits = defineEmits(['changeView'])
const viewMethod = ref<string>('1')
const showTypeList = ref<any[]>([
  {
    value: '1',
    label: '层级结构查看'
  },
  {
    value: '2',
    label: '极简查看'
  }
])

// 切换查看模式
const getViewMethod = (val: any) => {
  emits('changeView', val)
}
</script>
<style scoped lang="less">
.formClass {
  width: 100%;
  display: flex;
  justify-content: space-between;
  z-index: 1;
  .formClassTl {
    display: flex;
    > div {
      width: 100px;
      height: 30px;
      line-height: 30px;
      text-align: center;
      border: 1px solid #f6f6f6;
    }
    > div:first-child {
      background: rgba(17, 194, 109);
    }
    > div:last-child {
      background: rgba(252, 185, 0, 1);
    }
  }
}
</style>
