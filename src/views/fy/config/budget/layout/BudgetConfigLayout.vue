<template>
  <div class="budget-config-layout">
    <SplitPane :splitSet="splitSet">
      <template #paneL>
        <div class="panel-left">
          <el-tree></el-tree>
        </div>
      </template>
      <template #paneR>
        <div class="panel-right">
          <div class="toolbar">
            <div class="toolbar-main">
              <div class="toolbar-main-left">
                <slot name="toolbar"></slot>
              </div>
              <div class="toolbar-main-right">
                <span> 年度：</span>
                <el-select v-model="nd" style="width: 100px">
                  <el-option v-for="item in ndList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                </el-select>
              </div>
            </div>
          </div>
          <div class="table">
            <div class="main-table">
              <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents" />
            </div>
            <div class="main-pagination">
              <el-pagination
                :current-page="page.currentPage"
                background
                :page-sizes="[20, 50, 100, 200]"
                :page-size="page.pageSize"
                :total="parseInt(page.total + '')"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="limitChangeHandle"
                @current-change="pageChangeHandle"
              ></el-pagination>
            </div>
          </div>
        </div>
      </template>
    </SplitPane>
  </div>
</template>

<script setup lang="ts">
import SplitPane, { ContextProps } from '@/components/ReSplitPane'
import { useBudgetConfig } from '@/views/fy/config/budget/layout/useBudgetConfig'
import { reactive } from 'vue'
import { VxeGridPropTypes } from 'vxe-table'

interface Props {
  columns: VxeGridPropTypes.Columns // 列配置项  ==> 必传
  data?: any[] // 静态 table data 数据，若存在则不会使用 requestApi 返回的 data ==> 非必传
  requestApi?: (params: any) => Promise<any> // 请求表格数据的 api ==> 非必传
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  data: () => []
})

const splitSet = reactive<ContextProps>({
  minPercent: 20,
  defaultPercent: 20,
  maxPercent: 30,
  split: 'vertical'
})
const { limitChangeHandle, pageChangeHandle, page, gridOptions, gridEvents, ndList, nd } = useBudgetConfig(props)
</script>

<style lang="less" scoped>
.budget-config-layout {
  padding: 10px;
  width: 100%;
  height: 100%;
  .panel-left,
  .panel-right {
    height: 100%;
    display: flex;
    flex-direction: column;

    .toolbar {
      margin-bottom: 10px;

      &-main {
        width: 100%;
        height: 100%;
        display: flex;
        &-left {
          width: 400px;
          flex: 1;
        }
      }
    }

    .table {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 400px;
    }
  }

  .panel-left {
    margin-right: 4px;
    :deep(.el-tree) {
      height: 100%;
    }
  }

  .panel-right {
    margin-left: 4px;
    .main-table {
      flex: 1;
      height: 300px;
    }
  }
}
</style>
