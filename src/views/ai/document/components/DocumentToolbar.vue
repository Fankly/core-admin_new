<template>
  <div class="opeartion">
    <div class="left">
      <el-button v-if="hasPermission(ADD_PERMISSION)" type="primary" size="mini" plain :disabled="disabled" @click="$emit('create-task')">
        创建任务
      </el-button>
      <el-button v-if="hasPermission(EDIT_PERMISSION)" type="primary" size="mini" plain :disabled="disabled" @click="$emit('redo-task')">
        重新执行
      </el-button>
      <el-button v-if="hasPermission(EDIT_PERMISSION)" type="primary" size="mini" plain :disabled="disabled" @click="$emit('async-task')">
        异步执行
      </el-button>
      <el-button v-if="hasPermission(DETAIL_PERMISSION)" type="primary" size="mini" plain :disabled="disabled" @click="$emit('open-detail')">
        查看详情
      </el-button>
      <el-button v-if="hasPermission(EDIT_PERMISSION)" type="primary" size="mini" plain :disabled="disabled" @click="$emit('open-edit')">
        编 辑
      </el-button>
      <el-button v-if="hasPermission(EDIT_PERMISSION)" type="primary" size="mini" plain :disabled="disabled" @click="$emit('batch-update')">
        批量更新
      </el-button>
      <el-button v-if="hasPermission(EDIT_PERMISSION)" type="primary" size="mini" plain :disabled="disabled" @click="$emit('open-priority')">
        修改优先级
      </el-button>
    </div>
    <div class="right">
      <ToolbarButtons
        :tool-button="toolButtons"
        :search-visible="searchVisible"
        @setting-click="$emit('setting-click')"
        @search-click="$emit('toggle-search')"
        @help-click="$emit('help')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import type { PropType } from 'vue'
import { usePermission } from '@/hooks/usePermission'
import { ADD_PERMISSION, DETAIL_PERMISSION, EDIT_PERMISSION } from '../constants'

type ToolButtonKey = 'setting' | 'search' | 'help'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  searchVisible: {
    type: Boolean,
    default: true
  },
  toolButtons: {
    type: Array as PropType<ToolButtonKey[]>,
    default: () => ['setting', 'search', 'help']
  }
})

defineEmits(['create-task', 'redo-task', 'async-task', 'open-detail', 'open-edit', 'batch-update', 'open-priority', 'setting-click', 'toggle-search', 'help'])

const { hasPermission } = usePermission()
</script>

<style scoped lang="less">
.opeartion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  .left,
  .right {
    display: flex;
    align-items: center;
  }

  .right {
    gap: 12px;
  }
}
</style>
