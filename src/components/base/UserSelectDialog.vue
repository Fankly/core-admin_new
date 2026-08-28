<template>
  <vxe-modal @show="handleShow" position="center" v-model="dialogVisible" width="70%" height="700px" title="选择用户" :mask="true" :lock-scroll="true" :lock-view="true" :resize="true" :show-footer="true" @close="handleClose">
    <div class="user-select-container">
      <div class="search-area">
        <div class="search-form">
          <div class="search-item">
            <span>ID:</span>
            <el-input v-model="searchForm.qry_id" placeholder="请输入ID" clearable></el-input>
          </div>
          <div class="search-item">
            <span>用户登录名:</span>
            <el-input v-model="searchForm.qry_nameCode" placeholder="请输入用户登录名" clearable></el-input>
          </div>
          <div class="search-item">
            <span>用户姓名:</span>
            <el-input v-model="searchForm.qry_name" placeholder="请输入用户姓名" clearable></el-input>
          </div>
          <div class="search-buttons">
            <el-button type="primary" @click="handleSearch">查 询</el-button>
            <el-button @click="resetSearch">重 置</el-button>
          </div>
        </div>
      </div>
      <splitpane :splitSet="settingLR">
        <template #paneL>
          <div class="org-tree">
            <div class="tree-header">
              <el-tabs v-model="acitveTab" @tab-click="handleTabClick">
                <el-tab-pane label="基准组织" name="baseOrg"></el-tab-pane>
                <el-tab-pane label="业务组织" name="businessOrg"></el-tab-pane>
              </el-tabs>
            </div>
            <div class="tree-content">
              <div class="tree-header">
                <div class="tree-title">{{ acitveTab === 'baseOrg' ? '基准组织单元' : '业务组织' }}</div>
                <div class="tree-actions">
                  <el-dropdown trigger="click" @command="handleTreeCommand">
                    <el-tooltip content="选择列表展现方式" placement="top">
                      <i class="el-icon-arrow-down"> </i>
                    </el-tooltip>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <template v-if="acitveTab === 'baseOrg'">
                          <el-dropdown-item command="unitUsers">显示单位用户</el-dropdown-item>
                          <el-dropdown-item command="currentOnly">显示本组织用户</el-dropdown-item>
                          <el-dropdown-item command="allChildren">显示所有下级用户</el-dropdown-item>
                        </template>
                        <template v-else>
                          <el-dropdown-item command="currentAndChildren">显示本组织及直接下级用户</el-dropdown-item>
                          <el-dropdown-item command="currentOnly">显示本组织用户</el-dropdown-item>
                          <el-dropdown-item command="allChildren">显示所有下级用户</el-dropdown-item>
                        </template>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-tooltip content="刷新" placement="top">
                    <i class="el-icon-refresh" @click="refreshTree"> </i>
                  </el-tooltip>
                </div>
              </div>
              <el-tree
                ref="orgTree"
                :data="orgTreeData"
                node-key="id"
                :props="{
                  label: 'text'
                }"
                @node-click="handleNodeClick"
                highlight-current
                :expand-on-click-node="false"
                class="custom-tree"
                lazy
                :load="loadNode"
              ></el-tree>
            </div>
          </div>
        </template>
        <template #paneR>
          <div class="content-area">
            <div class="user-list">
              <div class="table-header">
                <span class="table-title">用户列表</span>
                <span class="selected-count" v-if="selectedUsers.length > 0">已选择{{ selectedUsers.length }} 项 </span>
              </div>
              <div class="user-table">
                <vxe-table
                  show-header-overflow
                  show-overflow
                  :row-config="{ keyField: 'id', height: 32 }"
                  ref="xTable"
                  border
                  align="center"
                  header-align="center"
                  highlight-hover-row
                  height="100%"
                  :data="userList"
                  :checkbox-config="{ checkRowKeys: checkedRowKeys, checkMethod: checkMethod }"
                  @checkbox-change="handleSelectionChange"
                  @checkbox-all="handleSelectAll"
                >
                  <vxe-column type="checkbox" width="55" align="center"></vxe-column>
                  <vxe-column field="NAME" title="用户名"></vxe-column>
                  <vxe-column field="NAMECODE" title="用户登录名"></vxe-column>
                  <vxe-column field="PATH" title="基准组织名称"></vxe-column>
                  <vxe-column field="STATE" title="用户状态" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row['STATE'] === '1' ? 'success' : 'danger'" size="small">
                        {{ row['STATE'] === '1' ? '有效用户' : '无效用户' }}
                      </el-tag>
                    </template>
                  </vxe-column>
                  <vxe-column field="HR_ID" title="人资编码" width="120"></vxe-column>
                </vxe-table>
              </div>
              <el-pagination
                :current-page="page.page"
                background
                align="center"
                :page-sizes="[10, 20, 50, 100, 500]"
                :page-size="page.limit"
                :total="parseInt(page.total + '')"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="limitChangeHandle"
                @current-change="pageChangeHandle"
              ></el-pagination>
            </div>
          </div>
        </template>
      </splitpane>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关 闭</el-button>
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script lang="ts">
import { getAppframeResponse } from '@/api/common'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import { defineComponent, nextTick, onMounted, reactive, ref, watch } from 'vue'
import splitpane, { ContextProps } from '@/components/ReSplitPane'

export default defineComponent({
  components: {
    splitpane
  },
  name: 'UserSelectDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: true
    },
    defaultSelected: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:visible', 'confirm', 'close'],
  setup(props, { emit, expose }) {
    const dialogVisible = ref(false)

    const settingLR: ContextProps = reactive({
      minPercent: 20,
      defaultPercent: 20,
      split: 'vertical'
    })

    const searchForm = reactive<any>({
      qry_nameCode: '',
      qry_id: '',
      qry_name: '',
      onlyChild: ''
    })

    const parentOrgId = ref('')

    const page = reactive({
      total: 0,
      limit: 50,
      page: 1,
      current: '1'
    })

    const url = ref('')

    const acitveTab = ref('baseOrg')
    const orgTreeData = ref<any[]>([])
    const orgTree = ref()

    const userList = ref<any[]>([])
    const selectedUsers = ref<any[]>([])
    const checkedRowKeys = ref<any[]>([])
    const xTable = ref()

    const getOrgTree = async () => {
      try {
        let basicOrgRes = await baseService.get('/workflow/declare/getParamValue?paramKey=BASIC_ORG')
        if (basicOrgRes.success) {
          url.value = basicOrgRes.data
          const path = acitveTab.value === 'baseOrg' ? '/appframe-auth-ui/auth/framework/baseOrgTree/getTreeNode' : '/appframe-auth-ui/auth/framework/specialOrgTree/getTreeNode'
          const appframeUrl = basicOrgRes.data + path
          const params: any = {
            id: 0,
            node: 0,
            appframeUrl: appframeUrl,
            fnCode: 'SYSSPROLE'
          }
          if (acitveTab.value === 'baseOrg') {
            params['treeType'] = 'baseOrgTree'
            params['treeRoot'] = 'orgRoot'
          } else {
            params['treeType'] = 'specialOrgTree'
            params['treeRoot'] = 'groupRoot'
            params['viewType'] = 'sporgType'
          }
          const res = await getAppframeResponse(params)
          if (res.success) {
            orgTreeData.value = res.data || []
            if (orgTreeData.value.length > 0) {
              nextTick(() => {
                const tree = orgTree.value
                if (tree) {
                  tree.setCurrentKey(orgTreeData.value[0].id)
                  handleNodeClick(orgTreeData.value[0])
                }
              })
            }
          } else {
            ElMessage.error(res.msg || '获取组织树失败')
          }
        } else {
          ElMessage.error(basicOrgRes.msg || '获取组织树失败')
        }
      } catch (error) {
        console.log('获取组织树出错', error)
      }
    }

    const getUserList = async () => {
      try {
        const path = acitveTab.value === 'baseOrg' ? '/appframe-auth-ui/auth/sysUser/list' : '/appframe-auth-ui/auth/sysUser/getUserBySpOrg'
        const appframeUrl = url.value + path
        const params: any = {
          appframeUrl: appframeUrl,
          start: (page.page - 1) * page.limit,
          limit: page.limit,
          qry_userStatus: 1,
          onlyChild: searchForm.onlyChild,
          qry_nameCode: searchForm.qry_nameCode,
          parentOrgId: parentOrgId.value,
          qry_id: searchForm.qry_id,
          qry_name: searchForm.qry_name
        }
        if (acitveTab.value === 'baseOrg') {
          params['orgType'] = 'baseOrg'
        } else {
          params['orgType'] = 'spOrg'
        }
        const res = await getAppframeResponse({
          appframeUrl: appframeUrl,
          start: (page.page - 1) * page.limit,
          limit: page.limit,
          qry_userStatus: 1,
          onlyChild: searchForm.onlyChild,
          qry_nameCode: searchForm.qry_nameCode,
          parentOrgId: parentOrgId.value,
          qry_id: searchForm.qry_id,
          qry_name: searchForm.qry_name,
          orgType: 'baseOrg'
        })

        if (res.success) {
          userList.value = res.data.rows || []
          page.total = res.data.results || 0
        } else {
          ElMessage.error(res.msg || '获取用户列表出错')
        }
      } catch (error) {
        ElMessage.error('获取用户列表出错')
      }
    }

    const resetSearch = () => {
      Object.keys(searchForm).forEach((key) => {
        if (key !== 'orgId') {
          searchForm[key] = ''
        }
      })
      handleSearch()
    }

    const checkMethod = ({ row }: any) => {
      if (!props.multiple && selectedUsers.value.length > 0) {
        return selectedUsers.value.some((item) => item.id === row.id)
      }
      return true
    }

    const handleSearch = () => {
      getUserList()
    }

    const refreshTree = () => {
      orgTreeData.value = []
      getOrgTree()
    }

    const handleTreeCommand = (command: string) => {
      const currentNode = orgTree.value?.getCurrentNode()
      if (!currentNode) {
        ElMessage.warning('请选择一个组织节点')
        return
      }
      switch (command) {
        case 'unitUsers':
          searchForm.onlyChild = false
          break
        case 'currentAndChildren':
          searchForm.onlyChild = false
          break
        case 'currentOnly':
          searchForm.onlyChild = true
          break
        case 'allChildren':
          searchForm.onlyChild = 'all'
          break
      }
      page.page = 1
      getUserList()
    }

    const handleTabClick = () => {
      getOrgTree()
      getUserList()
    }

    const handleNodeClick = (data: any) => {
      parentOrgId.value = data.id
      getUserList()
    }

    const handleSelectionChange = ({ row, checked }: any) => {
      if (checked) {
        if (!props.multiple) {
          selectedUsers.value = [row]
          checkedRowKeys.value = [row.id]
        } else {
          selectedUsers.value.push(row)
          checkedRowKeys.value.push(row.id)
        }
      } else {
        selectedUsers.value = selectedUsers.value.filter((item) => item.id !== row.id)
        checkedRowKeys.value = checkedRowKeys.value.filter((id) => id !== row.id)
      }
    }

    const handleSelectAll = ({ checked, rows }: any) => {
      if (checked) {
        if (!props.multiple) {
          ElMessage.warning('单选模式不能全选')
          return
        }
        selectedUsers.value = [...rows]
        checkedRowKeys.value = rows.map((row: any) => row.id)
      } else {
        selectedUsers.value = []
        checkedRowKeys.value = []
      }
    }

    const pageChangeHandle = (currentPageNum: number) => {
      page.page = currentPageNum
      getUserList()
    }
    const limitChangeHandle = (currentLimitNum: number) => {
      page.page = 1
      page.limit = currentLimitNum
      getUserList()
    }

    const loadNode = (node: any, resolve: (data: any[]) => void) => {
      if (node.level === 0) {
        return resolve(orgTreeData.value)
      }

      const parentId = node.data.id
      const path = acitveTab.value === 'baseOrg' ? '/appframe-auth-ui/auth/framework/baseOrgTree/getTreeNode' : '/appframe-auth-ui/auth/framework/specialOrgTree/getTreeNode'
      const appframeUrl = url.value + path
      const params: any = {
        id: parentId,
        node: parentId,
        appframeUrl: appframeUrl,
        fnCode: 'SYSSPROLE'
      }
      if (acitveTab.value === 'baseOrg') {
        params['treeType'] = 'baseOrgTree'
        params['treeRoot'] = 'orgRoot'
      } else {
        params['treeType'] = 'specialOrgTree'
        params['treeRoot'] = 'groupRoot'
        params['viewType'] = 'sporgType'
      }
      getAppframeResponse(params)
        .then((res) => {
          if (res.success) {
            resolve(res.data || [])
          } else {
            ElMessage.error(res.msg || '获取子节点失败')
            resolve([])
          }
        })
        .catch((error) => {
          ElMessage.error('获取子节点失败' + error)
          resolve([])
        })
    }

    const handleShow = () => {
      getOrgTree()
    }

    const handleClose = () => {
      searchForm.qry_nameCode = ''
      searchForm.qry_id = ''
      searchForm.qry_name = ''
      searchForm.onlyChild = ''
      parentOrgId.value = ''
      url.value = ''
      page.total = 0
      page.limit = 50
      page.page = 1
      page.current = '1'
      selectedUsers.value = []
      checkedRowKeys.value = []
      userList.value = []
      orgTreeData.value = []
      dialogVisible.value = false
      emit('update:visible', false)
      emit('close')
    }

    const handleConfirm = () => {
      if (selectedUsers.value.length === 0) {
        ElMessage.warning('请至少选择一个用户')
        return
      }
      if (!props.multiple && selectedUsers.value.length > 0) {
        ElMessage.warning('只能选择一个用户')
        return
      }
      emit('confirm', props.multiple ? selectedUsers.value : selectedUsers.value[0])
      handleClose()
    }

    expose({
      dialogVisible
    })

    return {
      settingLR,
      dialogVisible,
      searchForm,
      acitveTab,
      orgTreeData,
      orgTree,
      userList,
      selectedUsers,
      checkedRowKeys,
      xTable,
      refreshTree,
      handleTreeCommand,
      loadNode,
      handleNodeClick,
      handleSelectionChange,
      handleSelectAll,
      handleShow,
      resetSearch,
      handleClose,
      handleSearch,
      handleConfirm,
      checkMethod,
      handleTabClick,
      page,
      limitChangeHandle,
      pageChangeHandle
    }
  }
})
</script>

<style scoped lang="less">
.user-select-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 10px;

  .search-area {
    margin-bottom: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 15px;

    .search-form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      .search-item {
        display: flex;
        align-items: center;
        margin-right: 20px;
        margin-bottom: 10px;

        span {
          margin-right: 8px;
          white-space: nowrap;
          font-weight: 500;
          color: #606266;
        }
        .el-input {
          width: 200px;
        }
      }
      .search-buttons {
        margin-left: auto;
        display: flex;
        gap: 10px;
      }
    }
  }

  .org-tree {
    display: flex;
    flex-direction: column;
    background-color: #fff;

    .tree-header {
      border-bottom: 1px solid #ebeef5;
      padding: 0 10px;
    }

    .tree-content {
      flex: 1;
      min-width: 0;
      min-height: 0;
      overflow: auto;
      padding: 10px 0;

      .tree-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .tree-title {
          font-weight: bold;
          margin-bottom: 15px;
          padding-left: 8px;
          border-left: 3px solid #409eff;
          font-size: 14px;
          line-height: 1.2;
          color: #303133;
        }
        .tree-actions {
          display: flex;
          margin-bottom: 15px;
          padding-left: 10px;
          align-items: center;
          gap: 10px;
          i {
            cursor: pointer;
            color: #606266;
            font-size: 16px;
            vertical-align: middle;
            &:hover {
              color: #409eff;
            }
          }
        }
      }

      .custom-tree {
        margin-top: 10px;

        :deep(.el-tree-node__content) {
          height: 32px;

          &:hover {
            background-color: #f5f7fa;
          }
        }

        :deep(.el-tree-node.is-current > .el-tree-node__content) {
          background-color: #ecf5ff;
          color: #409eff;
        }
      }
    }
  }

  .content-area {
    height: 100%;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .user-list {
      height: 100%;
      min-width: 0;
      min-height: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: #fff;
      padding: 15px;

      .table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15px;
        .table-title {
          font-size: 16px;
          font-weight: 500;
          color: #303133;
        }

        .selected-count {
          font-size: 14px;
          color: #409eff;
        }
      }

      .user-table {
        min-width: 0;
        min-height: 0;
        flex: 1;
        :deep(.vxe-table) {
          border-radius: 4px;
          .vxe-header--column {
            background-color: #f5f7fa;
            font-weight: 500;
          }

          .vxe-body--row {
            &.row--hover {
              background-color: #f5f7fa;
            }

            &.row--checked {
              background-color: #f5f7fa;
            }
          }
        }
      }
    }
    .pagination {
      margin-top: 15px;
      padding: 10px 0;
      display: flex;
      justify-content: flex-end;

      :deep(.vxe-pager) {
        .vxe-pager--jump-prev,
        .vxe-pager--jump-next,
        .vxe-pager--num-btn {
          &:not(.is--disabled):hover {
            color: #409eff;
          }

          &.is--active {
            background-color: #409eff;
            border-color: #409eff;
          }
        }
        .vxe-pager--sizes {
          .vxe-input {
            width: 110px;
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding: 10px 20px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;

  .el-button {
    padding: 9px 20px;

    & + .el-button {
      margin-left: 12px;
    }
  }
}
</style>
