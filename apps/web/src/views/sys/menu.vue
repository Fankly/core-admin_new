<template>
  <div class="mod-sys__menu">
    <el-form :inline="true" :model="dataForm" @keyup.enter="getDataList()">
      <el-form-item>
        <el-button type="primary" @click="addOrUpdateHandle()">新增</el-button>
      </el-form-item>
    </el-form>
    <div class="menu-table-box">
      <el-table height="100%" v-loading="dataListLoading" :data="dataList" row-key="id" border style="width: 100%">
        <el-table-column prop="name" label="名称" header-align="center" min-width="150"></el-table-column>
        <el-table-column prop="icon" width="80" label="图标" header-align="center" align="center">
          <template v-slot="scope">
            <svg v-if="scope.row.icon" class="iconfont menu-icon" aria-hidden="true">
              <use :xlink:href="`#${scope.row.icon}`"></use>
            </svg>
            <span v-else class="menu-icon-empty" aria-label="未设置图标">-</span>
          </template>
        </el-table-column>
        <el-table-column width="80" prop="type" label="类型" header-align="center" align="center">
          <template v-slot="scope">
            <el-tag v-if="scope.row.type === 0" size="small">{{ '菜单' }}</el-tag>
            <el-tag v-else size="small" type="info">{{ '按钮' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column width="120" prop="openStyle" label="打开方式" header-align="center" align="center">
          <template v-slot="scope">
            <span v-if="scope.row.type !== 0"></span>
            <el-tag v-else-if="scope.row.openStyle === 1" size="small">{{ '外部打开' }}</el-tag>
            <el-tag v-else size="small" type="info">{{ '内部打开' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" header-align="center" align="center"></el-table-column>
        <el-table-column prop="url" label="路由" header-align="center" align="center" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column
          prop="isShow"
          label="是否显示菜单"
          header-align="center"
          align="center"
          width="120"
          :show-overflow-tooltip="true"
          :formatter="(row:any) => formatHandle(row,'isShow')"
        ></el-table-column>
        <el-table-column
          prop="isFrame"
          label="是否内嵌"
          header-align="center"
          align="center"
          width="80"
          :show-overflow-tooltip="true"
          :formatter="(row:any) => formatHandle(row,'isFrame')"
        ></el-table-column>
        <el-table-column
          prop="outsideMenu"
          label="菜单配置"
          header-align="center"
          align="center"
          width="150"
          :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column label="操作" width="190" fixed="right" header-align="center" align="center">
          <template #default="scope">
            <div class="menu-actions">
              <el-button type="text" size="small" @click="addHandle(scope.row)">新增</el-button>
              <el-button type="text" size="small" @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
              <el-button type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 弹窗, 新增 / 修改 -->
    <add-or-update v-if="addOrUpdateVisible" ref="addOrUpdate" @refreshDataList="getDataList"></add-or-update>
  </div>
</template>

<script lang="ts">
import useView from '@/hooks/useView'
import { defineComponent, reactive, toRefs } from 'vue'
import AddOrUpdate from './menu-add-or-update.vue'

export default defineComponent({
  name: '/sys/menu',
  components: {
    AddOrUpdate
  },
  setup() {
    const state = reactive({ getDataListURL: '/sys/menu/list', deleteURL: '/sys/menu/update' })

    const formatHandle = (row: any, field: string) => {
      return String(row?.[field] ?? '') === '1' ? '是' : '否'
    }

    return { ...useView(state), ...toRefs(state), formatHandle }
  }
})
</script>

<style lang="less" scoped>
.mod-sys__menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  overflow: hidden;
}

.menu-table-box {
  flex: 1;
  min-height: 0;
}

.menu-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.menu-icon {
  width: 18px;
  height: 18px;
}

.menu-icon-empty {
  color: #909399;
}
</style>
