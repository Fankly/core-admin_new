<template>
  <div class="container-main">
    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
    <template v-if="isShowPage">
      <div v-loading="loading" class="process" element-loading-text="正在从服务器获取数据.....">
        <div class="topBox">
          <div class="title">
            <div class="titleBox">
              <h2>项目台账备注管理</h2>
            </div>
            <div class="searchBox">
              <el-dropdown
                style="margin-right: 30px; cursor: pointer"
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
                        v-model="item.checked"
                        @change="listShow(item.columnKey, item.checked)"
                      >
                        {{ item.columnName }}
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
              :label-width="110"
            >
              <el-row class="rowStyle">
                <el-col :span="6">
                  <el-form-item label="项目名称：">
                    <el-input v-model="formData.xmmc"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="国网项目编码：">
                    <copyTextBox ref="gwxmbm"></copyTextBox>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="项目性质：">
                    <el-select v-model="formData.xmxz" @change="getProjectPackName" multiple>
                      <el-option
                        v-for="(item, index) in searchData.projectNature"
                        :key="index"
                        :label="item.label"
                        :value="item.value"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="项目类型：">
                    <TreeSelect
                      ref="xmlx"
                      @clearData="clearDataHandle"
                      :is-leaf="false"
                      data-type="id"
                      :default-props="projectTypeProps"
                      @selectChange="getProjectType"
                      style="width: 100%"
                      :data="searchData.projectTypeData"
                      node-key="id"
                    ></TreeSelect>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="6">
                  <el-form-item label="一级分类：">
                    <el-select
                      v-model="formData.yjfl"
                      @change="() => getLevelData(formData.yjfl, 'ejfl')"
                      clearable
                    >
                      <el-option
                        v-for="(item, index) in searchData.yjfl"
                        :key="index"
                        :label="item.label"
                        :value="item"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="二级分类：">
                    <el-select
                      v-model="formData.ejfl"
                      @change="() => getLevelData(formData.ejfl, 'sjfl')"
                      clearable
                    >
                      <el-option
                        v-for="(item, index) in searchData.ejfl"
                        :key="index"
                        :label="item.label"
                        :value="item"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="三级分类：">
                    <el-select @change="getProjectPackName" v-model="formData.sjfl" clearable>
                      <el-option
                        v-for="(item, index) in searchData.sjfl"
                        :key="index"
                        :label="item.label"
                        :value="item"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="归口部门：">
                    <TreeSelect
                      ref="dept"
                      :is-leaf="false"
                      data-type="objCode"
                      :is-all="false"
                      :default-props="defaultProps"
                      :data="searchData.departmentData"
                      @selectChange="getChangeDepData"
                      style="width: 100%"
                      node-key="objCode"
                    ></TreeSelect>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="6">
                  <el-form-item label="项目包名称：">
                    <el-select v-model="formData.xmbName" multiple collapse-tags>
                      <el-option
                        v-for="(item, index) in searchData.projectPackName"
                        :key="index"
                        :label="item.name"
                        :value="item.code"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="一二级单位：">
                    <TreeSelect
                      ref="unit"
                      :is-leaf="false"
                      data-type="code"
                      :is-all="true"
                      :default-props="defaultProps"
                      @selectChange="getChangeUnitData"
                      style="width: 100%"
                      :data="searchData.unitData"
                      node-key="objId"
                    ></TreeSelect>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="年度：">
                    <el-date-picker
                      :clearable="false"
                      @change="getProjectPackName"
                      style="width: 100%"
                      v-model="formData.year"
                      type="year"
                      placeholder="选择年"
                    ></el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="6" style="text-align: right; font-size: 12px">
                  <el-button
                    v-permission="'SEARCH'"
                    size="mini"
                    v-debounce="[loadData]"
                    type="primary"
                    icon="el-icon-search"
                    >查 询
                  </el-button>
                  <el-button
                    v-permission="'RESET'"
                    size="mini"
                    icon="el-icon-refresh-right"
                    @click="reset"
                    >重 置
                  </el-button>
                  <el-button
                    v-permission="'EXPORT'"
                    size="mini"
                    v-debounce="[exportData]"
                    type="warning"
                    icon="el-icon-download"
                    >导 出
                  </el-button>
                  <el-upload
                    v-permission="'IMPORT'"
                    style="display: inline; padding: 0 0 0 10px"
                    accept=".xlsx,.xls"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleChange"
                  >
                    <el-button size="mini" type="success" icon="el-icon-upload">导 入</el-button>
                  </el-upload>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>
        <div class="content_table" ref="contentTables">
          <div class="content_table_center">
            <el-table
              @row-dblclick="updateMaintenancePage"
              ref="tableName"
              stripe
              border
              height="100%"
              :data="example"
              row-key="id"
              style="width: 100%; margin-top: 10px"
              :header-cell-style="{ 'text-align': 'center' }"
            >
              <template v-for="item in columns" :key="item.columnKey">
                <el-table-column
                  :show-overflow-tooltip="true"
                  :prop="item.columnKey"
                  v-if="item.columnKey === 'xmmc' && item.checked"
                  width="200"
                  :label="item.columnName"
                  fixed
                ></el-table-column>
                <el-table-column
                  :prop="item.columnKey"
                  show-overflow-tooltip
                  align="center"
                  v-else-if="item.columnKey === 'gwxmbm' && item.checked"
                  width="200"
                  :label="item.columnName"
                  fixed
                ></el-table-column>
                <el-table-column
                  :prop="item.columnKey"
                  show-overflow-tooltip
                  :formatter="
                    (row, column, cellValue) => formatHandle(row, column, cellValue, item.columnKey)
                  "
                  align="right"
                  v-else-if="
                    (item.columnKey === 'dnys' || item.columnKey === 'dncwzc') && item.checked
                  "
                  width="200"
                  :label="item.columnName"
                ></el-table-column>
                <el-table-column
                  :prop="item.columnKey"
                  show-overflow-tooltip
                  :formatter="
                    (row, column, cellValue) => formatHandle(row, column, cellValue, item.columnKey)
                  "
                  align="center"
                  v-else-if="item.checked && setAlignCenter(item.columnKey)"
                  width="200"
                  :label="item.columnName"
                ></el-table-column>
                <el-table-column
                  :prop="item.columnKey"
                  :formatter="
                    (row, column, cellValue) => formatHandle(row, column, cellValue, item.columnKey)
                  "
                  align="center"
                  v-else-if="item.checked"
                  show-overflow-tooltip
                  width="200"
                  :label="item.columnName"
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
          <el-dialog
            top="10px"
            width="50%"
            title="项目台账备注维护页面"
            v-model="dialogFormVisible"
          >
            <el-form
              ref="dialogFormRef"
              label-position="right"
              :label-width="120"
              :model="dialogForm"
            >
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="国网项目编码：" prop="gwxmbm">
                    <el-input v-model="dialogForm.gwxmbm" :disabled="true"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="项目名称：" prop="xmmc">
                    <el-input v-model="dialogForm.xmmc" :disabled="true"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="业务备注：" prop="zywbz">
                    <el-input v-model="dialogForm.zywbz"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="重点任务：" prop="zzdrw">
                    <el-input v-model="dialogForm.zzdrw"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="备注1：" prop="zbz1">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz1"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注2：" prop="zbz2">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz2"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注3：" prop="zbz3">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz3"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注4：" prop="zbz4">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz4"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注5：" prop="zbz5">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz5"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注6：" prop="zbz6">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz6"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注7：" prop="zbz7">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz7"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注8：" prop="zbz8">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz8"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注9：" prop="zbz9">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz9"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注10：" prop="zbz10">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz10"
                  maxlength="100"
                ></el-input>
              </el-form-item>
            </el-form>
            <template #footer>
              <div class="dialog-footer" style="text-align: center">
                <el-button type="primary" @click="updateMsgDataHandle" plain>确 定</el-button>
                <el-button @click="dialogFormVisible = false" type="info" plain>取 消</el-button>
              </div>
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
import { ElMessage } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import TreeSelect from '@/components/select/TreeSelect.vue'
import baseService from '@/service/baseService'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

export default defineComponent({
  name: '/budget-process/process-43',
  components: {
    TreeSelect,
    HelpModal,
    ToolbarButtons,
    copyTextBox,
    userDialog
  },
  setup() {
    const store = useStore()
    const dialogFormRef = ref('')
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
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      isShowPage: false,
      dialogUpload: true,
      checkInput,
      dialogFormRules: {
        zywbz: [{ validator: checkInput, trigger: 'blur' }],
        zzdrw: [{ validator: checkInput, trigger: 'blur' }]
      },
      dialogFormVisible: false,
      isQuery: false,
      searchShow: true,
      segment: [],
      example: [],
      loading: false,
      userCode: '',
      userId: '',
      specialorgid: '',
      searchData: {
        projectTypeData: [],
        unitData: [],
        yjfl: [],
        ejfl: [],
        sjfl: [],
        projectPackName: [],
        projectNature: [],
        departmentData: []
      },
      dialogForm: {
        zywbz: '',
        zzdrw: '',
        xmmc: '',
        gwxmbm: '',
        zbz1: '',
        zbz2: '',
        zbz3: '',
        zbz4: '',
        zbz5: '',
        zbz6: '',
        zbz7: '',
        zbz8: '',
        zbz9: '',
        zbz10: ''
      },
      formData: {
        yjfl: [],
        ejfl: [],
        sjfl: [],
        yjdw: [],
        ejdw: [],
        xmxz: [],
        xmlx: '',
        xmmc: '',
        gkbm: [],
        xmbName: [],
        year: new Date().getFullYear().toString()
      },
      columns: [
        {
          columnKey: 'xmmc',
          columnName: '项目名称',
          checked: true
        },
        {
          columnKey: 'gwxmbm',
          columnName: '国网项目编码',
          checked: true
        },
        {
          columnKey: 'zywbz',
          columnName: '业务备注',
          checked: true
        },
        {
          columnKey: 'zzdrw',
          columnName: '重点任务',
          checked: true
        },
        {
          columnKey: 'zbz1',
          columnName: '备注1',
          checked: true
        },
        {
          columnKey: 'zbz2',
          columnName: '备注2',
          checked: true
        },
        {
          columnKey: 'zbz3',
          columnName: '备注3',
          checked: true
        },
        {
          columnKey: 'zbz4',
          columnName: '备注4',
          checked: true
        },
        {
          columnKey: 'zbz5',
          columnName: '备注5',
          checked: true
        },
        {
          columnKey: 'zbz6',
          columnName: '备注6',
          checked: true
        },
        {
          columnKey: 'zbz7',
          columnName: '备注7',
          checked: true
        },
        {
          columnKey: 'zbz8',
          columnName: '备注8',
          checked: true
        },
        {
          columnKey: 'zbz9',
          columnName: '备注9',
          checked: true
        },
        {
          columnKey: 'zbz10',
          columnName: '备注10',
          checked: true
        },
        {
          columnKey: 'proType',
          columnName: '项目类型',
          checked: true
        },
        {
          columnKey: 'xmbName',
          columnName: '项目包名称',
          checked: true
        },
        {
          columnKey: 'nd',
          columnName: '年度',
          checked: true
        },
        {
          columnKey: 'yjdw',
          columnName: '一级单位',
          checked: true
        },
        {
          columnKey: 'ejdw',
          columnName: '二级单位',
          checked: true
        },
        {
          columnKey: 'gkbm',
          columnName: '归口部门',
          checked: true
        },
        {
          columnKey: 'dnys',
          columnName: '当年预算（万元）',
          checked: true
        },
        {
          columnKey: 'dncwzc',
          columnName: '当年结算(不含税)(万元)',
          checked: true
        },
        {
          columnKey: 'xmxz',
          columnName: '项目性质',
          checked: true
        },
        {
          columnKey: 'saptime',
          columnName: '立项时间',
          checked: true
        },
        {
          columnKey: 'yjfl',
          columnName: '一级分类',
          checked: true
        },
        {
          columnKey: 'ejfl',
          columnName: '二级分类',
          checked: true
        },
        {
          columnKey: 'sjfl',
          columnName: '三级分类',
          checked: true
        },
        {
          columnKey: 'ztimestamp',
          columnName: '更新时间',
          checked: true
        }
      ],
      defaultProps: {
        children: 'children',
        label: 'text'
      },
      projectTypeProps: {
        children: 'children',
        label: 'name'
      },
      fileList: [
        {
          name: 'food.jpeg',
          url: 'https://jsonplaceholder.typicode.com/posts/'
        }
      ]
    })
  },
  watch: {
    // 监听三级分类
    'formData.sjfl': {
      handler: function (val) {
        if (!val) {
          // 清空项目包名称
          this.formData.xmbName = []
          // 调用项目包名称
          this.getProjectPackName()
        }
      }
    }
  },
  mounted() {
    this.$refs.userDialog.getUser(this.userId, this.userCode)
    this.getDeptData()
    this.getProjectTypeData()
    this.getUnitData()
    this.getFirstLevelData()
    this.getProjectPackName()
    this.getComboData('projectNature', 'XMXZ')
  },
  methods: {
    getHelpMessageHandle() {
      this.$refs.helpModalRef.showModal = true
    },
    clearDataHandle() {
      if (Array.isArray(this.formData.xmlx)) {
        this.formData.xmlx.length = 0
      } else {
        this.formData.xmlx = ''
      }
    },
    lazyHandle(node, resolve) {
      if (node.level === 0) {
        const params = {
          parentCode: null,
          rootCode: 'childtree:CBZX',
          objId: -1,
          level: 0
        }
        if (node.data.rootCode) {
          params.rootCode = node.data.rootCode
          params.parentCode = 'CBZX'
        }
        baseService.post('process40/getTreeNode/', params).then((res) => {
          if (res.success) {
            resolve(res.data)
          } else {
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
      } else if (node.level >= 1) {
        const params = {
          parentCode: null,
          rootCode: 'childtree:CBZX',
          objId: node.data.objId,
          level: node.level
        }
        baseService.post('process40/getTreeNode/', params).then((res) => {
          if (res.success) {
            res.data ? resolve(res.data) : resolve([])
          } else {
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
      } else {
        resolve([])
      }
    },
    getDeptData(ejdw) {
      const params = {
        parentCode: null,
        rootCode: 'childtree:CBZX',
        objId: -1,
        level: 0
      }
      if (ejdw) {
        params.rootCode = ejdw
        params.parentCode = 'CBZX'
      }
      baseService.post('process40/getTreeNodeCbzx/', params).then((res) => {
        if (res.success) {
          this.searchData.departmentData = res.data
        } else {
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    uploadExcelFile(file, uuid) {
      this.loading = true
      const formData = new FormData()
      formData.append('file', file.raw)
      formData.append('uuid', uuid)
      baseService.post('process41/import/', formData).then((res) => {
        if (res.success) {
          this.loading = false
          ElMessage({
            type: 'success',
            message: '导入成功'
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
    },
    handleChange(file) {
      if (!file.raw.type.includes('.sheet') && !file.raw.type.includes('.ms-excel')) {
        ElMessage.error('请上传Excel文件!')
        return
      }
      // 实现excel导入
      const formData = new FormData()
      formData.append('file', file.raw)
      baseService.post('process41/importCheck/', formData).then((res) => {
        if (res.success) {
          if (res.data.pass) {
            this.uploadExcelFile(file, res.data.uuid)
          } else {
            this.$confirm('Excel文件中有存在未填写情况, 是否继续导入?', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            })
              .then(() => {
                this.uploadExcelFile(file, res.data.uuid)
              })
              .catch(() => {
                this.$message({
                  type: 'info',
                  message: '取消导入'
                })
              })
          }
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    updateLedgeHandle: function () {
      const params = this.dialogForm
      delete params.xmmc
      baseService.post('process41/updateTZ/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.loadData()
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    updateMsgDataHandle: function () {
      /*this.$refs.dialogFormRef.validate((valid) => {
        if (valid) {
          // 提交数据
          this.updateLedgeHandle();
          this.dialogFormVisible = false;
        } else {
          return false;
        }
      });*/
      this.updateLedgeHandle()
      this.dialogFormVisible = false
    },
    setAlignCenter(columnkey) {
      const arr = ['yjdw', 'ejdw', 'yjfl', 'ejfl', 'sjfl']
      return arr.includes(columnkey)
    },
    formatHandle(row, column, cellValue, columnKey) {
      if (columnKey === 'dnys' || columnKey === 'dncwzc') {
        return cellValue ? parseFloat(cellValue).toFixed(4) : '0.0000'
      } else if (cellValue === null || cellValue === '') {
        return '-'
      }
      return cellValue
    },
    // 归口部门
    getChangeDepData(value) {
      this.formData.gkbm = value
    },
    getComboData(flag, code) {
      // 判断是否是数组
      code = Array.isArray(code) ? code : [code]
      const params = {
        codes: code
      }
      baseService.post('process40/getComCodeByCode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          res.data[code[0]].map((item) => {
            this.searchData[flag].push({
              value: item.code,
              label: item.name
            })
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
    getProjectPackName() {
      this.formData.xmbName = []
      this.loading = true
      let xmxzValue = ''
      let sjflValue = ''
      let xmlx = ''
      if (this.formData.xmxz && this.formData.xmxz.length > 0) {
        xmxzValue = this.formData.xmxz.join(',')
      }
      if (this.formData.sjfl) {
        sjflValue = this.formData.sjfl.value
      }
      if (this.formData.year) {
        // Wed Jan 01 2025 00:00:00 GMT+0800 (中国标准时间)获取年份
        this.formData.year = new Date(this.formData.year).getFullYear().toString()
      }
      if (this.formData.xmlx) {
        xmlx = this.formData.xmlx.join(',')
      }
      const params = {
        year: this.formData.year,
        xmlx: xmlx,
        xmblx: '',
        xmxz: xmxzValue,
        sjfl: sjflValue,
        xmbid: ''
      }
      baseService.post('process40/getXmbArr/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.searchData.projectPackName = res.data
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    getLevelData(levelValue, flag) {
      if (flag === 'ejfl') {
        this.searchData.ejfl = []
        this.searchData.sjfl = []
        this.formData.ejfl = ''
        this.formData.sjfl = ''
      } else if (flag === 'sjfl') {
        this.searchData.sjfl = []
        this.formData.sjfl = ''
      }
      if (!levelValue) {
        return
      }
      this.loading = true
      const params = {
        parentId: levelValue.id
      }
      baseService.post('process40/getComCodeByParent/', params).then((res) => {
        if (res.success) {
          this.loading = false
          res.data.forEach((item) => {
            this.searchData[flag].push({
              value: item.code,
              label: item.name,
              id: item.id
            })
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
    getFirstLevelData() {
      this.loading = true
      const params = {
        rootCode: 'GWXMFL'
      }
      baseService.post('process40/getRootComCode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          res.data.forEach((item) => {
            this.searchData.yjfl.push({
              value: item.code,
              label: item.name,
              id: item.id
            })
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
    updateMaintenancePage(row) {
      this.dialogFormVisible = true
      /*     this.dialogForm.gwxmbm = row.gwxmbm;
      this.dialogForm.xmmc = row.xmmc;
      this.dialogForm.zywbz = row.zywbz;
      this.dialogForm.zzdrw = row.zzdrw; */
      for (const key in this.dialogForm) {
        this.dialogForm[key] = row[key]
      }
    },
    getChangeUnitData(value) {
      // 设置一级单位和二级单位清空
      this.formData.yjdw = []
      this.formData.ejdw = []
      let ejdw = ''
      value.forEach((item) => {
        if (item.level === 1) {
          this.formData.yjdw.push(item.objCode)
        } else if (item.level === 2) {
          this.formData.ejdw.push(item.objCode)
          ejdw += item.objCode + ','
        }
      })
      ejdw = ejdw.substring(0, ejdw.length - 1)
      this.$refs.dept.clearSelect()
      this.getDeptData(ejdw)
      /*this.lazyHandle({ level: 0, data: { rootCode: ejdw } }, (res) => {
        this.searchData.departmentData = res;
      });*/
    },
    getUnitData() {
      this.loading = true
      const params = {
        parentCode: null,
        rootCode: 'childtree:DW_COM',
        objId: -1,
        level: 0
      }
      baseService.post('process40/getTreeNode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.searchData.unitData = res.data
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    getProjectTypeData() {
      let startDate = new Date().getFullYear()
      if (this.searchData.ND) {
        startDate = this.searchData.ND
      }
      this.loading = true
      const params = {
        parentId: '0',
        startDate: startDate
      }
      baseService.post('process40/getProTypeTreeNode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.searchData.projectTypeData = res.data
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    getProjectType(value) {
      this.formData.xmlx = value
      this.getProjectPackName()
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
        setTimeout(() => {
          this.isShowPage = true
        }, 500)
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
        this.$refs.contentTables.style.height = 'calc(100% - 116px)'
      } else {
        this.$refs.contentTables.style.height = 'calc(100% - 17px)'
      }
    },
    //搜索按钮
    loadData() {
      this.loading = true
      const params = {
        specialorgid: this.specialorgid,
        roleCode: this.roleCode,
        page: this.page.page,
        limit: this.page.limit,
        yjfl: this.formData.yjfl ? this.formData.yjfl.value : '',
        ejfl: this.formData.ejfl ? this.formData.ejfl.value : '',
        sjfl: this.formData.sjfl ? this.formData.sjfl.value : '',
        yjdw: this.formData.yjdw ? this.formData.yjdw : [],
        ejdw: this.formData.ejdw ? this.formData.ejdw : [],
        xmxz: this.formData.xmxz ? this.formData.xmxz : '',
        xmlx: this.formData.xmlx ? this.formData.xmlx : [],
        xmmc: this.formData.xmmc ? this.formData.xmmc : '',
        gkbm: this.formData.gkbm ? this.formData.gkbm : [],
        nd: this.formData.year ? this.formData.year : new Date().getFullYear().toString(),
        gwxmbm: this.$refs.gwxmbm.array ? this.$refs.gwxmbm.array : '',
        xmbName: this.formData.xmbName ? this.formData.xmbName : []
      }
      baseService.post('process41/getList/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.page.total = res.data.total
          this.example = res.data.records
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
      this.formData.yjfl = ''
      this.formData.ejfl = ''
      this.formData.sjfl = ''
      this.formData.yjdw = ''
      this.formData.ejdw = ''
      this.formData.xmxz = []
      this.formData.xmlx = ''
      this.formData.year = new Date().getFullYear().toString()
      this.formData.xmmc = ''
      this.formData.xmbName = []
      this.$refs.gwxmbm.clear()
      this.$refs.xmlx.clearSelect()
      this.$refs.unit.clearSelect()
      this.$refs.dept.clearSelect()
      this.searchData.ejfl = []
      this.searchData.sjfl = []
      // 调用项目包名称
      this.getProjectPackName()
    },
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },
    // 数据导出
    exportData() {
      this.loading = true
      this.loadData()
      const params = {
        specialorgid: this.specialorgid,
        roleCode: this.roleCode,
        page: this.page.page,
        limit: this.page.limit,
        yjfl: this.formData.yjfl ? this.formData.yjfl.value : '',
        ejfl: this.formData.ejfl ? this.formData.ejfl.value : '',
        sjfl: this.formData.sjfl ? this.formData.sjfl.value : '',
        yjdw: this.formData.yjdw ? this.formData.yjdw : [],
        ejdw: this.formData.ejdw ? this.formData.ejdw : [],
        xmxz: this.formData.xmxz ? this.formData.xmxz : '',
        xmlx: this.formData.xmlx ? this.formData.xmlx : [],
        xmmc: this.formData.xmmc ? this.formData.xmmc : '',
        gkbm: this.formData.gkbm ? this.formData.gkbm : [],
        nd: this.formData.year ? this.formData.year : new Date().getFullYear().toString(),
        gwxmbm: this.$refs.gwxmbm.array ? this.$refs.gwxmbm.array : '',
        xmbName: this.formData.xmbName ? this.formData.xmbName : ''
      }
      baseService.export('/process41/export', params).then((res) => {
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '战略预算-项目台账备注管理清单.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
        this.loading = false
      })
    }
  }
})
</script>

<style lang="less" scoped>
.process_43 {
  display: none;
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
    height: calc(100% - 116px);
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

      .titleBox {
        width: 50%;
        text-align: right;

        h2 {
          font-size: 16px;
          margin: 0 0 4px 0;
        }
      }

      .searchBox {
        width: 50%;
        text-align: right;

        .searchShow {
          cursor: pointer;
          color: #00706b;
          margin-right: 18px;
        }
      }
    }
  }
}
</style>
