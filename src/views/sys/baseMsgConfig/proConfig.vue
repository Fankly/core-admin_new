<template>
  <div class="main" v-if="userMsg.isShowPage">
    <splitpane :splitSet="pageConfig">
      <template #paneL>
        <div class="panel-left">
          <div class="panel-left-main">
            <div class="panel-left-main__search">
              <el-input
                @blur="blurHandle"
                @input="changeInputValueHandle"
                v-model="pageData.filterXmlxData"
                placeholder="请输入项目类型名称"
              ></el-input>
            </div>
            <div class="panel-left-main__content">
              <el-tree
                @node-click="getClickxmlxDataHandle"
                :highlight-current="true"
                ref="xmlxRef"
                :default-expanded-keys="pageData.defaultExpandedKeys"
                node-key="middleId"
                :data="pageData.xmlxData"
                :props="pageData.treeProps"
                :filter-node-method="getNameDataHandle"
              ></el-tree>
            </div>
          </div>
        </div>
      </template>
      <template #paneR>
        <div class="panel-right">
          <div class="panel-right-tools">
            <div class="left">
              <el-button v-permission="'SAVE'" type="primary" plain @click="saveHandle">保存</el-button>
            </div>
            <div class="right">
              <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
            </div>
          </div>
          <Grid ref="gridRef" :gap="[20, 0]" :cols="2">
            <GridItem>
              <el-form-item>
                <template #label>
                  <el-space :size="4">
                    <span>{{ `归口部门` }}</span>
                  </el-space>
                  <span>&nbsp;:</span>
                </template>
                <div class="panel-right-main">
                  <el-tree
                    :default-checked-keys="pageData.deptDatas[1]"
                    :default-expanded-keys="pageData.deptDatas[0]"
                    @check-change="getCheckedDataHandle"
                    :props="pageData.treeProps"
                    :data="pageData.deptSelectData"
                    :load="loadNode"
                    ref="gkbmRef"
                    node-key="id"
                    lazy
                    show-checkbox
                  ></el-tree>
                </div>
              </el-form-item>
            </GridItem>
          </Grid>
        </div>
      </template>
    </splitpane>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <ImportData ref="importDataRef"></ImportData>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/sys/baseMsgConfig/proConfig'
}
</script>
<script setup lang="ts">
import { getBizOrgTree, getGkbmByProtypeId, getSubProtypeTree, xmxlConfigSave } from '@/api/common'
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import userDialog from '@/components/select/userDialog.vue'
import ImportData from '@/views/sys/baseMsgConfig/components/ImportData.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

interface PageConfig extends ContextProps {
  loading: boolean
}

interface GkbmData {
  id: string
  parentId: string
  name: string
  leaf: boolean
  leafString: string
}

const userDialogRef = ref()
const helpModalRef = ref()
const xmlxRef = ref()
const gkbmRef = ref()
const importDataRef = ref()

onMounted(() => {
  selectRolesHandle()
})

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const pageConfig = reactive<PageConfig>({
  loading: true,
  minPercent: 20,
  defaultPercent: 20,
  split: 'vertical'
})

const userMsg = reactive({
  specialOrgId: '',
  isShowPage: false
})

const pageData = reactive<any>({
  filterXmlxData: '',
  treeProps: {
    children: 'children',
    label: 'name',
    isLeaf: 'leaf'
  },
  xmlxData: [],
  deptSelectData: [],
  defaultExpandedKeys: [],
  protypeId: -1,
  deptDatas: []
})

const selectRolesHandle = () => {
  pageConfig.loading = true
  userDialogRef.value.getUser()
}

const getRoleHandle = () => {
  pageConfig.loading = false
  userMsg.specialOrgId = userDialogRef.value.specialorgid
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    userMsg.isShowPage = true
    getXmlxData()
  }
}

const changeInputValueHandle = (val: string) => {
  xmlxRef.value.filter(val)
}

const blurHandle = (val: any) => {
  if (val.target.value && val.target.value === 'xmlvsetongdao') {
    importDataRef.value.isShowModal = true
  }
}

const getNameDataHandle = (value: string, data: any) => {
  if (!value) return true
  return data.name.indexOf(value) !== -1
}

const loadNode = async (node: any, resolve: any) => {
  let id = node.level === 0 ? '-1' : node.data.id
  let res = await getBizOrgTree(id, userMsg.specialOrgId)
  if (res.success) {
    resolve(res.data)
  } else {
    ElMessage.error(res.msg)
    resolve([])
  }
}

const getCheckedDataHandle = (data: GkbmData, checked: boolean, indeterminate: boolean) => {
  let node = gkbmRef.value.getNode(data.id)
  expandTreeNodeHandle(node)
}

const expandTreeNodeHandle = (node: any) => {
  if (node.checked && !node.expanded && !node.isLeaf) {
    node.expand(function () {
      let childNodes = node.childNodes
      for (let i = 0; i < childNodes.length; i++) {
        let childNode = childNodes[i]
        if (!childNode.data.leaf) {
          gkbmRef.value.$emit('check-change', childNode.data, childNode.checked, childNode.indeterminate)
        }
      }
    })
  }
}

const getXmlxData = async () => {
  let res = await getSubProtypeTree()
  if (res.success) {
    pageData.xmlxData = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

const getClickxmlxDataHandle = async (data: any) => {
  if (data.leaf && data.children.length === 0) {
    let allNodes = gkbmRef.value.store.nodesMap
    for (const key in allNodes) {
      if (allNodes[key].expanded) {
        allNodes[key].expanded = false
      }
    }
  }
  pageData.deptDatas.length = 0
  gkbmRef.value.setCheckedKeys([])
  let middleId = Number(data.middleId)
  pageData.protypeId = middleId
  let res = await setDefaultBmData(middleId)
  pageData.deptDatas = res
}

const setDefaultBmData = async (middleId: number): Promise<string[]> => {
  let res = await getGkbmByProtypeId(middleId)
  if (res.success) {
    let defaultKeys: any = []
    let defaultChecked: any = []
    res.data.forEach((item: any) => {
      defaultChecked.push(...item.splice(item.length - 1, 1))
      defaultKeys.push(...item)
    })
    defaultKeys = Array.from(new Set(defaultKeys))
    let selectDatas = defaultChecked.join(',').split(',').concat()
    return [defaultKeys, selectDatas]
  } else {
    ElMessage.error(res.msg)
    return []
  }
}

const saveHandle = async () => {
  if (pageData.protypeId === -1) {
    ElMessage.warning('请选择项目类型末级节点!')
    return
  }
  let gkbmIds: number[] = gkbmRef.value
    .getCheckedNodes()
    .filter((item: GkbmData) => item.leaf)
    .map((item: GkbmData) => Number(item.id))
  if (gkbmIds.length === 0) {
    ElMessage.warning('请选择归口部门末级节点!')
    return
  }
  ElMessageBox.prompt('请输入口令', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^.+$/,
    inputErrorMessage: '口令不能为空'
  })
    .then(async (val: any) => {
      let res = await xmxlConfigSave(gkbmIds, pageData.protypeId, val.value)
      if (res.success) {
        ElMessage.success('保存成功')
      } else {
        ElMessage.error(res.msg)
      }
    })
    .catch((error: any) => {
      console.log(error)
    })
}
</script>

<style scoped lang="less">
.main {
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .panel-left,
  .panel-right {
    height: 100%;
    padding: 10px 0 10px 10px;
  }

  .panel-right {
    &-tools {
      height: 32px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }

  .panel-left {
    &-main {
      height: calc(100% - 32px);
      display: flex;
      flex-direction: column;

      &__search {
        padding: 0 10px 10px 0;
      }

      &__content {
        flex: 1;
        min-width: 0;
        min-height: 0;
        overflow: auto;
      }
    }
  }
}
</style>
