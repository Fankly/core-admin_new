<!-- 专家管理 -->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <proTable
      ref="proTableRef"
      @search="searchHandle"
      @reset="resetHandle"
      :data-callback="pageList"
      :request-api="searchDataHandle"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      @row-click="handerClickTable"
      guide-module-key="ExpertInformation"
    >
      <!-- <template #tableHeader="scope">
        <template v-for="(item, index) in btnList" :key="index">
          <el-button
            v-permission="item.code"
            :disabled="!scope.isSelected && item.isSelected"
            type="primary"
            size="mini"
            plain
            @click="handlerBtn(item.label, scope.selectedList)"
            >{{ item.value }}</el-button
          >
        </template>
      </template> -->
    </proTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <newModal ref="newModalRef" :title="modalTitle" :zjjb="zjjb" :pszy="pszy" @show-modal="showModal" />
  <ImportExcel ref="importRef" />
</template>
<script lang="ts">
export default {
  name: '/service/ywpt/ExpertInformationZ'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getPublicData } from '@/api/common' //公共代码
import {
  xmExpertDelete,
  save,
  getListPageData,
  getImportTemplate,
  exportData,
  getEjdwData,
  importData,
  getYjdwData,
  getBm
} from '@/api/service/expertinformation'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import ImportExcel from '@/components/ImportExcel/index.vue' //导入组件
import { useStore } from 'vuex'
import { useUser } from '@/hooks/useUser'
import newModal from '@/views/service/ywpt/components/newModal.vue'
import { useRoute } from 'vue-router'

const loading = ref(false)
const isShowPage = ref(false) //未选择角色前不展示页面
const store = useStore()
const proTableRef = ref<any>()
const levelOne = ref<any>([]) // 一级单位
const levelTwo = ref<any>([]) // 二级单位
const userDialogRef = ref() // 用户角色
const pszy = ref<any[]>([]) // 专家专业
const zjjb = ref<any[]>([]) //专业级别
const userInfo = ref<any>() //用户ID
const importRef = ref<any>() //导入类名
const newModalRef = ref<any>() //新增弹窗元素
const modalTitle = ref<any>('') //弹窗标题
const route = useRoute()
// 按钮
const btnList = ref<any>([
  //isSelected 按钮是否需要选择数据
  { label: 'add', value: '新 增', isSelected: false, code: 'ADD' },
  { label: 'edit', value: '编 辑', isSelected: true, code: 'EDIT' },
  { label: 'del', value: '删 除', isSelected: true, code: 'DELETE' },
  { label: 'import', value: '导 入', isSelected: false, code: 'IMPORT' },
  { label: 'export', value: '导 出', isSelected: false, code: 'EXPORT' }
])
// 搜索
const searchHandle = () => {
  proTableRef.value?.clearSelection()
}
//重置
const resetHandle = () => {
  levelTwo.value.length = 0
  proTableRef.value?.clearSelection()
}
// 按钮点击事件
const handlerBtn = async (val: any, selectedList: any) => {
  if (val == 'edit' && selectedList.length != 1) {
    return ElMessage.warning('请选择一条数据')
  }
  if (['add', 'edit'].includes(val)) {
    // 新增编辑
    newModalRef.value.rmarkData = val == 'add' ? {} : selectedList[0]
    newModalRef.value.isShowModel = true
    modalTitle.value = val == 'add' ? '新增' : '编辑'
    newModalRef.value.levelOne = levelOne.value
    if (val == 'edit') {
      let item = levelOne.value.find((item: any) => item.code == selectedList[0].yjdw)
      const res: any = await getEjdwData(item.id)
      if (res.success && res.data.length !== 0) {
        newModalRef.value.levelTwo = res.data
      }
      const root: any = await getBm(parseInt(selectedList[0].ejdw))
      if (root.success && root.data.length !== 0) {
        newModalRef.value.levelThree = root.data
      }
    }
  } else if (val == 'del') {
    const ids = selectedList.map(({ id }: any) => id)
    ElMessageBox.confirm('是否确定删除所选数据？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        let res: any = await xmExpertDelete({ ids: ids })
        if (res.success) {
          ElMessage.success('删除成功')
          proTableRef.value?.getTableList()
          proTableRef.value?.clearSelection()
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  } else if (val == 'import') {
    let importApi: any = importData
    if (!importApi) return
    let params = {
      title: '专家信息表-',
      tempApi: getImportTemplate,
      importApi: (importParams: any) => {
        let newImportParams = {
          excelFormData: importParams.excelFormData
        }
        return importApi(newImportParams)
      },
      getTableList: proTableRef.value?.getTableList,
      specialorgid: userInfo.value
    }
    importRef.value.acceptParams(params)
    proTableRef.value?.reset()
  } else if (val == 'export') {
    ElNotification({
      title: '温馨提示',
      message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
      type: 'info',
      duration: 3000
    })
    loading.value = true
    const params = {}
    exportData(params).then((res: any) => {
      const blob = res
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      // 获取文件名
      let filename = '专家信息表.xlsx'
      if (res.headers && res.headers['content-disposition']) {
        filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
      }
      dom.download = `${decodeURI(decodeURI(filename))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
      loading.value = false
    })
  }
}

// 点击行选中
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 保存
const showModal = async ({ type, label }: any) => {
  let res: any = await save(label.value)
  if (res.success) {
    ElMessage.success(`${type}成功`)
    newModalRef.value.closeHandle()
    proTableRef.value?.getTableList()
    proTableRef.value?.clearSelection()
  } else {
    ElMessage.error(res.msg)
  }
}

//公共代码
const initParamLists = async () => {
  levelOne.value.length = 0 //清空单位
  pszy.value.length = 0
  // 获取公共代码
  // 一级单位
  const res = await getYjdwData()
  if (res.success && res.data.length !== 0) {
    levelOne.value.push(...res.data)
  }
  // 专家专业
  const publicCodeList = await getPublicData('MAJOR_COM')
  if (publicCodeList.success && publicCodeList.data.length !== 0) {
    pszy.value.push(...publicCodeList.data)
    proTableRef.value?.getTableList()
  }
  // 专家级别
  const zjjbCodeList = await getPublicData('EXPERT_LEVEL_COM')
  if (zjjbCodeList.success && zjjbCodeList.data.length !== 0) {
    zjjb.value = zjjbCodeList.data
  }
}
// 选择一级单位联动二级单位
const selectChange = (val: any) => {
  const params = proTableRef.value?.searchParam
  params.ejdw = ''
  levelTwo.value.length = 0
  const { id }: any = levelOne.value.find((item: any) => item.code === val)
  getEjdwData(id).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      levelTwo.value.push(...res.data)
    }
  })
}
// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    const userMsg = { ...userDialogRef.value.userMsg }
    userInfo.value = userMsg.specialOrgId
    if (isQuery) {
      await initParamLists()
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}
// 方法
onMounted(async () => {
  var isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    const jRGlobalInfo = store.getters.getJRGlobalInfo
    userInfo.value = jRGlobalInfo.deptId
    await initParamLists()
    isShowPage.value = true
  } else {
    await userDialogRef.value.getUser()
  }
})
// 数据处理回调
const pageList = (val: any) => {
  loading.value = false
  val.records.forEach((item: any) => {
    item.sex = item.sex == '0' ? '男' : item.sex == '1' ? '女' : ''
    pszy.value.forEach((element: any) => {
      if (item.major == element.code) {
        item.majorName = element.name
      }
    })
    zjjb.value.forEach((item1: any) => {
      if (item1.code == item.expertLevel) {
        item.expertLevel = item1.name
      }
    })
    // item.phoneNoName = item.phoneNo ? `${item.phoneNo.substring(0, 3)}****${item.phoneNo.substr(item.phoneNo.length - 4)}` : "";
    // item.identityCardName = item.identityCard ? `${item.identityCard.substring(0, 6)}******${item.identityCard.substr(item.identityCard.length - 4)}` : "";
  })
  return val
}
// 列表查询回调
const searchDataHandle = async (params: any) => {
  loading.value = true
  return getListPageData(params)
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'majorName', label: '专家专业', width: '120' },
  {
    prop: 'major',
    label: '专家专业',
    isShow: false,
    search: {
      el: 'select',
      order: 1
    },
    enum: pszy.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'expertName',
    label: '专家姓名',
    width: '80',
    search: {
      el: 'input',
      order: 2
    }
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    isShow: false,
    search: { el: 'select', props: { onChange: selectChange }, order: 3 },
    enum: levelOne.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    isShow: false,
    search: { el: 'select', order: 4 },
    enum: levelTwo.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  { prop: 'yjdwname', label: '一级单位', width: '180' },
  { prop: 'ejdwname', label: '二级单位', width: '180' },
  { prop: 'deptname', label: '所属部门', width: '180' },
  // { prop: 'identityCard', label: '身份证号', width: '150' },
  { prop: 'sex', label: '专家性别', width: '80' },
  { prop: 'account', label: '统一权限账号', width: '120' },
  { prop: 'phoneNo', label: '联系方式', width: '120' },
  { prop: 'mail', label: '电子邮箱', width: '150' },
  { prop: 'talent', label: '擅长专业', width: '180' },
  { prop: 'expertLevel', label: '专家级别', width: '80' },
  { prop: 'resume', label: '工作简历', width: '180' },
  { prop: 'performance', label: '主要业绩', width: '180' },
  { prop: 'remark', label: '备注', width: '180' }
  // { prop: 'createTime', label: '新增时间', width: '150' },
  // { prop: 'updateTime', label: '更新时间', width: '150' }
])
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
</style>
