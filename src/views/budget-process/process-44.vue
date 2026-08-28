<template>
  <div class="container-main">
    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
    <template v-if="isShowPage">
      <div v-loading="loading" class="process" element-loading-text="正在从服务器获取数据.....">
        <div class="topBox">
          <div class="title">
            <div class="titleBox">
              <el-button v-permission="'ADD'" size="mini" type="success" @click="addNewTermHandle"
                >新 增</el-button
              >
              <el-button
                v-permission="'DELETE'"
                size="mini"
                type="danger"
                @click="() => getIsDeleteData('delete')"
              >
                删 除
              </el-button>
              <el-button
                v-permission="'UNDELETE'"
                size="mini"
                type="warning"
                @click="() => getIsDeleteData('recover')"
              >
                恢复删除
              </el-button>
              <el-button v-permission="'EXPORT'" size="mini" v-debounce="[exportData]" type="info"
                >导 出</el-button
              >
            </div>
            <div class="searchBox">
              <el-dropdown
                style="margin-right: 10px; cursor: pointer"
                trigger="click"
                :hide-on-click="false"
              >
                <span class="el-dropdown-link">
                  <el-icon class="el-icon-s-operation">
                    <arrow-down />
                  </el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu class="dropdown-max">
                    <el-dropdown-item v-for="item in columns" :key="item.columnKey">
                      <el-checkbox
                        v-model="item.hidden"
                        @change="listShow(item.columnKey, item.hidden)"
                      >
                        {{ item.columnValue }}
                      </el-checkbox>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <span class="searchShow" v-if="searchShow === false" @click="showSearch(true)">
                <i class="el-icon-arrow-down"></i>
              </span>
              <span class="searchShow" @click="showSearch(false)" v-else>
                <i class="el-icon-arrow-up"></i>
              </span>
              <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
            </div>
          </div>

          <div class="search" v-if="searchShow">
            <el-form
              :inline="true"
              size="mini"
              class="formStyle"
              label-position="right"
              :label-width="120"
            >
              <el-row class="rowStyle">
                <el-col :span="6">
                  <el-form-item label="预算事项名称：">
                    <el-input v-model="formData.zyssxmc" clearable></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="归口部门名称：">
                    <el-input v-model="formData.zgkbmmc" clearable></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="显示已删除记录">
                    <el-checkbox @change="changeValue" v-model="deleteFlag"></el-checkbox>
                  </el-form-item>
                </el-col>
                <el-col :span="8" style="text-align: right">
                  <el-button size="mini" v-debounce="[loadData]" type="primary"> 查 询</el-button>
                  <el-button size="mini" type="default" @click="reset">重 置</el-button>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>
        <div class="content_table" ref="contentTables">
          <div class="content_table_center">
            <el-table
              @selection-change="handleSelectionChange"
              highlight-current-row
              @row-dblclick="updateMaintenancePage"
              ref="multipleTable"
              stripe
              border
              height="100%"
              :data="tableData"
              row-key="id"
              style="width: 100%; margin-top: 10px"
              :header-cell-style="{ 'text-align': 'center' }"
            >
              <el-table-column type="selection" width="55" align="center"></el-table-column>
              <template v-for="item in columns" :key="item.columnKey">
                <el-table-column
                  :formatter="
                    (row, column, cellValue) => formatHandle(row, column, cellValue, item.columnKey)
                  "
                  min-width="200"
                  align="center"
                  :show-overflow-tooltip="true"
                  :prop="item.columnKey"
                  v-if="!item.hidden"
                  :label="item.columnValue"
                ></el-table-column>
              </template>
            </el-table>
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
          <el-dialog @close="cancelHandle" fullscreen v-model="dialogFormVisible">
            <div class="dialog-form">
              <h2>预算事项维护</h2>
              <el-form
                ref="dialogFormRef"
                label-position="right"
                :label-width="160"
                :model="dialogForm"
              >
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="预算事项编号：" prop="zyssxbm">
                      <el-input v-model="dialogForm.zyssxbm" :disabled="true"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="预算事项名称：" prop="zyssxmc">
                      <el-input v-model="dialogForm.zyssxmc"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="预算立项辞条：" prop="yslxct">
                      <el-input v-model="dialogForm.yslxct"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="归口部门名称：" prop="zgkbmmc">
                      <el-input v-model="dialogForm.zgkbmmc"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="项目类别：">
                      <el-cascader
                        v-model="dialogForm.xmlx"
                        style="width: 50%"
                        :options="dialogSearchData.xmlxList"
                        :show-all-levels="false"
                      ></el-cascader>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="是否预安排：" prop="is_yap">
                      <el-select
                        clearable
                        placeholder="请选择"
                        v-model="dialogForm.is_yap"
                        style="width: 50%"
                      >
                        <el-option
                          v-for="item in dialogSearchData.isYapList"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        ></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="年度：" prop="nd">
                      <el-date-picker
                        class="dialog-picker"
                        value-format="YYYY"
                        :clearable="false"
                        style="width: 50%"
                        v-model="dialogForm.nd"
                        type="year"
                        placeholder="选择年"
                      ></el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="本年申请：" prop="dnys">
                      <el-input :disabled="true" v-model="dialogForm.dnys"></el-input>
                      <span style="margin-left: 10px">(万元)</span>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="处室：" prop="cs">
                      <el-input v-model="dialogForm.cs"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12"> </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="备注：" prop="remark">
                      <el-input
                        style="width: 78%"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入内容"
                        v-model="dialogForm.remark"
                      ></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
            <div class="dialog-table">
              <div class="dialog-title">
                <h2>预算分解</h2>
                <h2>（万元）</h2>
              </div>
              <el-table stripe border :data="dialogTableData" highlight-current-row>
                <template v-for="item in dialogTableColumns" :key="item.columnKey">
                  <el-table-column
                    :prop="item.columnKey"
                    :label="item.columnValue"
                    width="180"
                    align="center"
                  >
                    <template #default="scope">
                      <el-input
                        @focus="focusHandle"
                        :oninput="(input) => inputChange(input)"
                        @blur="iptBlur(scope.row, $event)"
                        v-model="scope.row[item.columnKey]"
                        class="ipt"
                        style="width: 100%"
                      />
                    </template>
                  </el-table-column>
                </template>
              </el-table>
            </div>
            <template #footer>
              <span class="dialog-footer">
                <el-button type="primary" @click="updateMsgDataHandle">保 存</el-button>
                <el-button @click="cancelHandle">取 消</el-button>
              </span>
            </template>
          </el-dialog>
        </div>
      </div>
    </template>
  </div>
  <HelpModal ref="helpModalRef" />
</template>

<script>
import { defineComponent, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import baseService from '@/service/baseService'
import { Decimal } from 'decimal.js'
import { useGuide } from '@/hooks/useGuide'

export default defineComponent({
  name: '/budget-process/process-44',
  components: {
    userDialog,
    HelpModal,
    ToolbarButtons
  },
  setup() {
    const store = useStore()
    const dialogFormRef = ref('')
    const helpModalRef = ref('')
    // 只能输入中文、英文、数字,可以为空
    const checkInput = (rule, value, callback) => {
      if (value === '') {
        callback()
      } else {
        const reg = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
        if (!reg.test(value)) {
          callback(new Error('只能输入中文、英文、数字'))
        } else {
          callback()
        }
      }
    }
    return reactive({
      store,
      dialogFormRef,
      helpModalRef,
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      dialogTableData: [],
      dialogTableColumns: [],
      isShowPage: false,
      dialogUpload: true,
      checkInput,
      dialogFormRules: {
        zctmc: [{ validator: checkInput, trigger: 'blur' }],
        zgkbmmc: [{ validator: checkInput, trigger: 'blur' }]
      },
      dialogFormVisible: false,
      isQuery: false,
      searchShow: true,
      tableData: [],
      loading: false,
      userCode: '',
      userId: '',
      specialorgid: '',
      dialogFlag: '',
      dialogSearchData: {
        isYapList: [],
        xmlxList: []
      },
      projectTypeProps: {
        children: 'children',
        label: 'name'
      },
      dialogForm: {
        fjLists: [],
        zyssxbm: '',
        zgkbmmc: '',
        zyssxmc: '',
        yslxct: '',
        dnys: '',
        is_yap: '',
        xmlx: '',
        remark: '',
        cs: '',
        nd: new Date().getFullYear().toString()
      },
      formData: {
        zgkbmmc: '',
        zyssxmc: '',
        zscflag: '0'
      },
      deleteFlag: false,
      columns: [],
      multipleSelection: []
    })
  },
  mounted() {
    this.$refs.userDialog.getUser()
    this.getDynamicColumn()
  },
  methods: {
    focusHandle(event) {
      if (event.target.value === '-') event.target.value = ''
    },
    inputChange(event) {
      event.target.value =
        ('' + event.target.value)
          .replace(/[^\d^.-]+/g, '') // 包括负号的匹配
          .replace(/^0+(\d)/, '$1')
          .replace(/^\./, '0.')
          .match(/^[-]?\d*(\.?\d{0,6})/g)[0] || ''
      event.target.style.background = 'green'
      event.target.style.color = 'white'
    },
    getHelpMessageHandle() {
      this.$refs.helpModalRef.showModal = true
    },
    formatHandle(row, column, cellValue) {
      if (!cellValue || cellValue === '0') return '-'
      return cellValue
    },
    getProjectTypeData() {
      let startDate = new Date().getFullYear()
      if (this.dialogForm.nd) {
        startDate = this.dialogForm.nd
      }
      this.loading = true
      const params = {
        parentId: '0',
        startDate: startDate
      }
      baseService.post('process40/getProTypeTreeNode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.dialogSearchData.xmlxList = this.resetProjectType(res.data)
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    resetProjectType(xmlxList) {
      return xmlxList.map((item) => {
        // 如果没有children属性
        if (!item.children || item.children.length === 0) {
          return {
            value: item.id,
            label: item.name
          }
        }
        return {
          value: item.id,
          label: item.name,
          children: item.children ? this.resetProjectType(item.children) : []
        }
      })
    },
    getDynamicColumn() {
      this.columns = []
      baseService.get('process42/getDynamicColumn').then((res) => {
        if (res.success) {
          this.columns = res.data
        } else {
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    iptBlur(row) {
      // 判断是“-”，设置默认值为0
      // 求和
      let sum = 0
      const obj = { ...row }
      for (const key in obj) {
        if (!obj[key] || obj[key] === '-') {
          obj[key] = 0
        }
        if (key !== 'id') {
          sum = Decimal.add(sum, obj[key])
        }
      }
      this.dialogForm.dnys = sum.toFixed(6)
    },
    // 随机生成 固定YSCT-生成10位大小写字母和数字
    randomString(len) {
      len = len || 10
      var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      var maxPos = $chars.length
      var pwd = ''
      for (var i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos))
      }
      return 'YSCT-' + pwd
    },
    toggleSelection(rows) {
      if (rows) {
        rows.forEach((row) => {
          this.$refs.multipleTable.toggleRowSelection(row)
        })
      } else {
        this.$refs.multipleTable.clearSelection()
      }
    },
    getIsDeleteData(flag) {
      let hint = ''
      if (flag) hint = flag === 'delete' ? '删除' : '恢复删除'
      if (this.multipleSelection.length === 0) {
        ElMessage({
          type: 'warning',
          message: '请选择要' + hint + '的数据'
        })
        return
      }
      // 根据flag判断是删除还是恢复删除，如果是删除标识，点击恢复按钮提示
      if (flag === 'recover') {
        const isDelete = this.multipleSelection.some((item) => item.zscflag === '未删除')
        if (isDelete) {
          ElMessage({
            type: 'warning',
            message: '请选择已删除的数据'
          })
          return
        }
      } else {
        const isDelete = this.multipleSelection.some((item) => item.zscflag === '已删除')
        if (isDelete) {
          ElMessage({
            type: 'warning',
            message: '请选择未删除的数据'
          })
          return
        }
      }
      ElMessageBox.confirm('是否' + hint + '选中数据?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          baseService
            .post(
              `process42/updateDelStatus?id=${this.multipleSelection
                .map((item) => item.id)
                .join(',')}&status=${flag === 'delete' ? '1' : '0'}`
            )
            .then((res) => {
              this.loading = true
              if (res.success) {
                this.loading = true
                ElMessage({
                  type: 'success',
                  message: flag === 'delete' ? '删除成功' : '恢复成功'
                })
                this.loadData()
              } else {
                this.loading = false
                ElMessage({
                  type: 'error',
                  message: res.msg
                })
              }
            })
        })
        .catch(() => {
          ElMessage({
            type: 'info',
            message: '已取消' + hint
          })
        })
    },
    handleSelectionChange(val) {
      this.multipleSelection = val
    },
    changeValue(val) {
      this.formData.zscflag = val ? '1' : '0'
    },
    cancelHandle() {
      this.dialogFormVisible = false
      for (const key in this.dialogForm) {
        // 清空表单
        // 如果是年度，设置为当前年
        if (key === 'nd') {
          this.dialogForm[key] = new Date().getFullYear().toString()
        } else {
          this.dialogForm[key] = ''
        }
      }
    },
    updateMsgDataHandle() {
      this.dialogForm.fjLists = []
      for (const key in this.dialogTableData[0]) {
        if (key !== 'id') {
          this.dialogForm.fjLists.push({
            fjYs: this.dialogTableData[0][key],
            yjdw: key
          })
        }
      }
      // 判断this.dialogForm.xmlx是数组
      if (Array.isArray(this.dialogForm.xmlx)) {
        this.dialogForm.xmlx = this.dialogForm.xmlx
          ? this.dialogForm.xmlx[this.dialogForm.xmlx.length - 1].toString()
          : ''
      }
      // 判断dialogForm.fjLists
      if (this.dialogForm.fjLists) {
        this.dialogForm.fjLists.forEach((item) => {
          if (item.fjYs === '-') {
            item.fjYs = '0'
          }
        })
      }
      // 判断dialogForm.dnys是否为空
      if (!this.dialogForm.dnys) {
        this.dialogForm.dnys = '0'
      }
      baseService
        .post('process42/add', {
          ...this.dialogForm
        })
        .then((res) => {
          if (res.success) {
            ElMessage({
              type: 'success',
              message: this.dialogFlag === 'add' ? '添加成功' : '修改成功'
            })
            this.dialogFormVisible = false
            this.dialogForm = {
              id: '',
              ctName: '',
              gkbmName: ''
            }
            this.loadData()
          } else {
            ElMessage({
              type: 'error',
              message: this.dialogFlag === 'add' ? '添加失败' : '修改失败'
            })
          }
        })
    },
    async getFjDynamicColumn() {
      this.dialogTableColumns = []
      await baseService.get('process42/getFjDynamicColumn').then((res) => {
        if (res.success) {
          this.dialogTableColumns = res.data
        } else {
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    async addNewTermHandle() {
      this.dialogFlag = 'add'
      this.getProjectTypeData()
      await this.getFjDynamicColumn()
      this.getComboData([this.dialogSearchData.isYapList], ['PRE_ARR_STATUS'])
      this.dialogFormVisible = true
      this.dialogTableData = []
      let obj = {}
      this.dialogTableColumns.forEach((item) => {
        obj[item.columnKey] = '-'
      })
      this.dialogTableData.push(obj)
      this.dialogForm.zyssxbm = this.randomString()
    },
    async updateMaintenancePage(row) {
      this.dialogFlag = 'update'
      await this.getFjDynamicColumn()
      await this.getProjectTypeData()
      await this.getComboData([this.dialogSearchData.isYapList], ['PRE_ARR_STATUS'])
      this.dialogFormVisible = true
      // 将row的值赋给dialogTableData
      this.dialogTableData = []
      let obj = {}
      this.dialogTableColumns.forEach((item) => {
        if (row[item.columnKey] === '0') obj[item.columnKey] = '-'
        else obj[item.columnKey] = row[item.columnKey]
      })
      this.dialogTableData.push(obj)
      let formObj = { ...row }
      // 删除formObj中和obj相同的字段
      for (const key in obj) {
        delete formObj[key]
      }
      // 判断formObj[row_id]是否存在,存在则删除
      if (formObj['row_id']) {
        delete formObj['row_id']
      }
      this.dialogForm = formObj
    },
    getComboData(combo, values) {
      const params = {
        codes: values
      }
      baseService.post('process40/getComCodeByCode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          combo.forEach((item, index) => {
            item.splice(0, item.length)
            res.data[values[index]].forEach((item) => {
              item.value = item.code
              item.label = item.name
              item.disabled = false
            })
            item.push(...res.data[values[index]])
          })
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    pageChangeHandle(currentPageNum) {
      this.page.page = currentPageNum
      this.loadData()
    },
    limitChangeHandle(currentLimitNum) {
      this.page.page = 1
      this.page.limit = currentLimitNum
      this.loadData()
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.roleCode = parseInt(this.$refs.userDialog.roleCode)
      this.isQuery = this.$refs.userDialog.isQuery
      if (this.isQuery) {
        this.isShowPage = true
        const { startGuide } = useGuide({
          moduleKey: 'process-44',
          tragetSelector: '.toolbar-guide-icon',
          onKnow: () => {},
          onNoMoreRemind: () => {}
        })
        startGuide()
      }
    },
    //项目环节
    listShow(value, checked) {
      this.columns.forEach((item) => {
        if (item.columnKey === value) {
          item.checked = checked
        }
      })
    },
    setTableHeight() {
      if (this.searchShow) {
        this.$refs.contentTables.style.height = 'calc(100% - 55px)'
      } else {
        this.$refs.contentTables.style.height = 'calc(100% - 22px)'
      }
    },
    //搜索按钮
    loadData() {
      this.loading = true
      this.multipleSelection = []
      this.toggleSelection()
      baseService
        .post('process42/getList/', {
          ...this.formData,
          page: this.page.page,
          limit: this.page.limit
        })
        .then((res) => {
          if (res.success) {
            this.loading = false
            this.tableData = res.data.records
            this.page.total = res.data.total
          } else {
            this.loading = false
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
    },
    //重置按钮
    reset() {
      this.formData = {
        zgkbmmc: '',
        zyssxmc: '',
        zscflag: '0'
      }
      this.multipleSelection = []
      this.toggleSelection()
      this.deleteFlag = false
    },
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },
    // 数据导出
    exportData() {
      baseService
        .export('/process42/exportNew', {
          ...this.formData
        })
        .then((res) => {
          this.loading = false
          const blob = res
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          // 获取文件名
          let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
          dom.download = `${decodeURI(decodeURI(filename))}`
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
        })
    }
  }
})
</script>

<style lang="less" scoped>
.dropdown-max {
  height: 400px;
}
.setstyle {
  height: auto;
  padding: 0 0 10px 0 !important;
  margin: 0;
  cursor: default !important;
}

.date_width {
  width: 100% !important;

  :deep(.el-date-editor) {
    width: 100%;
  }
}

.process {
  width: 100%;
  height: calc(100vh - 130px);
  padding: 10px;
  .completion {
    :deep(.el-form-item__content) {
      display: flex;

      .el-select {
        width: 80% !important;
        padding-right: 10px;
      }
    }
  }

  .dialog-form {
    .el-input {
      width: 50%;
    }

    h2 {
      line-height: 24px;
      font-size: 16px;
      color: #007cba;
    }
  }

  .dialog-table {
    h2 {
      line-height: 24px;
      font-size: 16px;
      color: #007cba;
    }

    .dialog-title {
      display: flex;
      justify-content: space-between;
    }
  }

  .budgetPeriod {
    :deep(.el-input) {
      width: 100%;
    }
  }

  .cacelDel {
    :deep(.el-select-dropdown__wrap) {
      max-height: 500px !important;
    }

    :deep(.el-tag__close) {
      display: none;
    }
  }

  .formStyle {
    .el-form-item {
      width: 100%;
      margin-bottom: 4px;

      :deep(.el-form-item__label) {
        font-size: 13px;
      }

      .el-select {
        width: 100%;
      }
    }
  }

  .content_table {
    margin-top: -5px;
    height: calc(100% - 55px);
    overflow: hidden;

    .content_table_center {
      height: calc(100% - 60px);
    }
  }

  .topBox {
    .title {
      width: 100%;
      color: #00706b;
      display: flex;
      margin-bottom: 10px;
      .titleBox {
        width: 50%;
      }

      .searchBox {
        width: 50%;
        text-align: right;

        .searchShow {
          cursor: pointer;
          color: #00706b;
          margin-right: 10px;
        }
      }
    }
  }

  .ipt {
    :deep(.el-input__inner) {
      text-align: center;
    }
  }
}
</style>
