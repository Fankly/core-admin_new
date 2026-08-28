<template>
  <div class="toolButtoon">
    <div class="left">
      <template v-for="(item, index) in btnList" :key="index">
        <el-button
          v-if="item.type == 'normal'"
          type="primary"
          size="mini"
          plain
          @click="handleClickBtn(item)"
        >
          {{ item.value }}
        </el-button>
        <el-dropdown placement="bottom" v-else style="margin: 0 5px">
            <el-button v-permission="item.label" size="mini" plain type="primary">
              {{ item.value }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu v-for="operation in item.children" :key="operation.id">
                <el-dropdown-item
                  v-permission="operation.label"
                  @click="handleClickBtn(operation)"
                >
                  {{ operation.value }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
      </template>
    </div>
    <div class="right">
      <div class="info">
        <template v-for="(item, index) in formList" :key="index">
          <span class="highlight">
            {{ item.label }} <span>{{ item.code }}</span>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: '/lslxJsc/components/dwTable'
}
</script>
<script setup lang="ts">
import { reactive, ref, defineEmits, defineProps } from 'vue'

interface propsVo {
  btnList: any[]
  formList: any[]
}

const props = defineProps<propsVo>()
const emits = defineEmits(['btnType'])

// 点击按钮
const handleClickBtn = (val: any) => {
  emits('btnType', { ...val })
}
</script>

<style scoped lang="less">
.toolButtoon {
  width: 100%;
  height: 30px;
  align-items: center;
  display: flex;
  margin-bottom: 10px;

  .left {
    display: flex;
    justify-content: space-between;
    max-width: 190px;
  }

  .right {
    flex: 1;
    text-align: right;
    font-weight: bold;
    color: #212529;

    span {
      display: inline-block;
      font-size: 14px;
      color: #555;
      padding: 5px;
      background-color: #e9ecef;
      border-radius: 5px;
      min-height: 0;
      min-width: 0;
      margin-right: 5px;
    }
  }
}
</style>
