<template>
  <div class="accounts36" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目关联设备资产明细情况</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon class="el-icon-s-operation" style="font-size: 18px">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in segment" :key="item.value">
                  <el-checkbox style="margin-right: 10px" v-model="item.checked" @change="listShow(item.value, item.checked)"></el-checkbox>
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span style="margin-right: 20px">
            <span class="searchShow" v-if="searchShow == false" @click="showSearch(true)">
              <i style="font-size: 18px" class="el-icon-arrow-down"></i>
            </span>
            <span class="searchShow" @click="showSearch(false)" v-else>
              <i style="font-size: 18px" class="el-icon-arrow-up"></i>
            </span>
          </span>
          <span class="searchShow">
            <i style="font-size: 18px" class="el-icon-question" @click="helpHandle"></i>
          </span>
        </div>
      </div>
      <div class="search" v-show="searchShow">
        <el-form label-width="110px" label-position="left">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="一级单位：">
                <el-select class="formWidth" v-model="yjdwValue" clearable placeholder="请选择" @change="getEjdw(yjdwValue)">
                  <el-option v-for="item in yjdw" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级单位：">
                <el-select class="formWidth" v-model="ejdwValue" clearable placeholder="请选择">
                  <el-option v-for="item in ejdw" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="三级分类：">
                <el-select class="formWidth" v-model="sjflValue" clearable placeholder="请选择">
                  <el-option v-for="item in sjfl" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="储备编码：">
                <copyTextBox class="formWidth" ref="cbbm"></copyTextBox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="国网项目编码：">
                <copyTextBox class="formWidth" ref="gwxmbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input class="formWidth" v-model="projectName"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="是否挂接设备：">
                <el-select class="formWidth" v-model="sfgjsb" clearable placeholder="请选择">
                  <el-option v-for="item in selectList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="是否关联资产：">
                <el-select class="formWidth" v-model="sfglzc" clearable placeholder="请选择">
                  <el-option v-for="item in selectList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="年度：">
                <el-date-picker v-model="year" value-format="YYYY" type="year" placeholder="选择年"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-button type="primary" icon="el-icon-search" @click="loadData"> 查询 </el-button>
              <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
              <el-button type="warning" icon="el-icon-download" @click="exportBtn">导 出</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
    <el-table
      stripe
      border
      v-if="tableHeight"
      :height="tableHeight"
      :data="example"
      row-key="id"
      style="width: 100%; margin-top: 10px"
      :span-method="objectSpanMethod"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="一级单位" fixed prop="yjdwName" width="250" v-if="columnObj.yjdw"></el-table-column>
      <el-table-column label="二级单位" fixed prop="ejdwName" width="250" v-if="columnObj.ejdw"></el-table-column>
      <el-table-column label="项目名称" prop="xmmc" width="250" v-if="columnObj.xmmc"></el-table-column>
      <el-table-column label="国网项目编码" prop="gwxmbm" width="250" v-if="columnObj.gwxmbm"></el-table-column>
      <el-table-column label="项目类型（三级分类）" prop="sjflName" width="250" v-if="columnObj.xmfl"></el-table-column>
      <el-table-column label="项目包名称" prop="xmbmc" width="250" v-if="columnObj.xmbmc"></el-table-column>
      <el-table-column label="项目包编码" prop="xmbbm" width="250" v-if="columnObj.xmbbm"></el-table-column>
      <el-table-column label="当年预算（万元）" prop="dnys" width="250" v-if="columnObj.dnys"></el-table-column>
      <el-table-column label="立项时间" prop="saptime" width="250" v-if="columnObj.saptime"></el-table-column>
      <el-table-column label="是否打捆" prop="sfdk" width="250" v-if="columnObj.sfdk"></el-table-column>
      <el-table-column label="明细编码" prop="mxbm" width="250" v-if="columnObj.mxbm"></el-table-column>
      <el-table-column label="明细名称" prop="mxmc" width="250" v-if="columnObj.mxmc"></el-table-column>
      <el-table-column label="是否挂接设备" prop="sfgjsb" width="250" v-if="columnObj.sfgjsb"></el-table-column>
      <el-table-column label="是否关联资产" prop="sfglzc" width="250" v-if="columnObj.sfglzc"></el-table-column>
      <el-table-column label="占比（%）" width="250" v-if="columnObj.zb">
        <template #default="scope">
          <div v-if="scope.row.zb <= 50">{{ scope.row.zb }}</div>
          <div v-else style="color: red">{{ scope.row.zb }}</div>
        </template>
      </el-table-column>
      <el-table-column label="PMS设备编码" prop="equipcode" width="250" v-if="columnObj.equipcode"></el-table-column>
      <el-table-column label="PMS设备名称" prop="materialName" width="250" v-if="columnObj.materialName"></el-table-column>
      <el-table-column label="ERP资产编号" prop="astnum" width="250" v-if="columnObj.astnum"></el-table-column>
      <el-table-column label="ERP资产名称" prop="astname" width="250" v-if="columnObj.astname"></el-table-column>
      <el-table-column label="ERP资产明细类编码" prop="erpzcmxl" width="250" v-if="columnObj.erpzcmxl"></el-table-column>
      <el-table-column label="ERP资产明细类名称" prop="erpzcmc" width="250" v-if="columnObj.erpzcmc"></el-table-column>
      <el-table-column label="电压等级" prop="dydj" width="250" v-if="columnObj.dydj"></el-table-column>
      <el-table-column label="资产原值(万元)" prop="originalequipvalue" width="250" v-if="columnObj.originalequipvalue"></el-table-column>
      <el-table-column label="资产净值(万元)" prop="netastvalue" width="250" v-if="columnObj.netastvalue"></el-table-column>
      <el-table-column label="资本化日期" prop="asttime" width="250" v-if="columnObj.asttime"></el-table-column>
      <el-table-column label="是否用户资产未移交" prop="iszzsb" width="250" v-if="columnObj.iszzsb"></el-table-column>
      <el-table-column label="名称匹配度" prop="mcppd" width="250" v-if="columnObj.mcppd"></el-table-column>
      <el-table-column label="资产属性" prop="zcsx" width="250" v-if="columnObj.zcsx"></el-table-column>
    </el-table>
    <el-pagination
      :current-page="page.current"
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
  <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import { showHelpMsg } from '@/utils/message'

export default defineComponent({
  name: '/budget-process/process-36',
  components: { userDialog, copyTextBox },
  setup() {
    const store = useStore()
    const helpHandle = () => {
      const url = store.getters.getMenuMsg.url
      showHelpMsg(url)
    }
    return reactive({
      store,
      helpHandle,
      loading: false,
      searchShow: true,
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      userCode: '',
      userId: '',
      specialorgid: '',
      example: [],
      dialogExample: [],
      columnObj: {},
      segmentIds: [],
      segment: [
        {
          value: 'yjdw',
          label: '一级单位',
          checked: true
        },
        {
          value: 'ejdw',
          label: '二级单位',
          checked: true
        },
        {
          value: 'xmmc',
          label: '项目名称',
          checked: true
        },
        {
          value: 'gwxmbm',
          label: '国网项目编码',
          checked: true
        },
        {
          value: 'xmfl',
          label: '项目类型（三级分类）',
          checked: true
        },
        {
          value: 'xmbmc',
          label: '项目包名称',
          checked: true
        },
        {
          value: 'xmbbm',
          label: '项目包编码',
          checked: true
        },
        {
          value: 'dnys',
          label: '当年预算（万元）',
          checked: true
        },
        {
          value: 'saptime',
          label: '立项时间',
          checked: true
        },
        {
          value: 'sfdk',
          label: '是否打捆',
          checked: true
        },
        {
          value: 'mxbm',
          label: '明细编码',
          checked: true
        },
        {
          value: 'mxmc',
          label: '明细名称',
          checked: true
        },
        {
          value: 'sfgjsb',
          label: '是否挂接设备',
          checked: true
        },
        {
          value: 'sfglzc',
          label: '是否关联资产',
          checked: true
        },
        {
          value: 'zb',
          label: '占比（%）',
          checked: true
        },
        {
          value: 'equipcode',
          label: 'PMS设备编码',
          checked: true
        },
        {
          value: 'materialName',
          label: 'PMS设备名称',
          checked: true
        },
        {
          value: 'astnum',
          label: 'ERP资产编号',
          checked: true
        },
        {
          value: 'astname',
          label: 'ERP资产名称',
          checked: true
        },
        {
          value: 'erpzcmxl',
          label: 'ERP资产明细类编码',
          checked: true
        },
        {
          value: 'erpzcmc',
          label: 'ERP资产明细类名称',
          checked: true
        },
        {
          value: 'dydj',
          label: '电压等级',
          checked: true
        },
        {
          value: 'originalequipvalue',
          label: '资产原值(万元)',
          checked: true
        },
        {
          value: 'netastvalue',
          label: '资产净值(万元)',
          checked: true
        },
        {
          value: 'asttime',
          label: '资本化日期',
          checked: true
        },
        {
          value: 'iszzsb',
          label: '是否用户资产未移交',
          checked: true
        },
        {
          value: 'mcppd',
          label: '名称匹配度',
          checked: true
        },
        {
          value: 'zcsx',
          label: '资产属性',
          checked: true
        }
      ],
      dataList: {
        month: new Date(),
        post1: ''
      },
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      //   跨行所需数据
      flag: 0,
      spanArr: [], // 用于存放需要合并的行的个数
      spanArr1: [], // 用于存放需要合并的行的个数
      spanArr2: [], // 用于存放需要合并的行的个数
      spanArr3: [], // 用于存放需要合并的行的个数
      spanArr4: [], // 用于存放需要合并的行的个数
      spanIndex: 0, // 记录spanArr数组的下标
      spanIndex1: 0, // 记录spanArr数组的下标
      spanIndex2: 0, // 记录spanArr数组的下标
      spanIndex3: 0, // 记录spanArr数组的下标
      spanIndex4: 0, // 记录spanArr数组的下标
      //一级单位
      yjdw: [],
      yjdwValue: '',
      //二级单位
      ejdw: [],
      ejdwValue: '',
      // 三级分类
      sjfl: [],
      sjflValue: '',
      // 项目名称
      projectName: '',
      //本地下拉数据
      selectList: [
        { code: '0', name: '否' },
        { code: '1', name: '是' }
      ],
      // 是否挂接设备
      sfgjsb: '',
      // 是否关联资产
      sfglzc: '',
      // 年度
      year: new Date().getFullYear().toString(),
      dialogVisible: false
    })
  },
  created() {
    this.handleColumn()
    //获取一级单位
    baseService.get('/commonCode/getYjdw').then((res) => {
      if (res.success) {
        this.yjdw = res.data
      } else {
        this.loading = false
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
    //获取三级分类
    baseService.get('/commonCode/getSjfl').then((res) => {
      if (res.success) {
        this.sjfl = res.data
      } else {
        this.loading = false
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
  },
  mounted() {
    this.topHeight = document.querySelector('.topBox').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.setTableHeight()
    this.loading = true
    this.$refs.userDialog.getUser(this.userId, this.userCode)
  },

  methods: {
    //根据一级单位获取二级单位
    getEjdw(code) {
      baseService.get(`/commonCode/getEjdwByYjdw?yjdw=${code}`).then((res) => {
        if (res.success) {
          this.ejdw = res.data
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    //计算表格高度
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 80 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 80 + 'px'
      }
    },
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },
    //处理环节数据
    handleColumn() {
      this.segment.forEach((item) => {
        this.segmentIds.push(item.value)
        this.columnObj[item.value] = item.checked
      })
    },

    //项目环节
    listShow(value, checked) {
      for (let i in this.columnObj) {
        if (i == value) {
          this.columnObj[i] = checked
        }
      }
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
    },
    loadData() {
      this.flag = 0
      this.spanArr = []
      this.spanArr1 = []
      this.spanArr2 = []
      this.spanArr3 = []
      this.spanArr4 = []
      this.spanIndex = 0
      this.spanIndex1 = 0
      this.spanIndex2 = 0
      this.spanIndex3 = 0
      this.spanIndex4 = 0
      this.example = []
      this.loading = true
      let params = {
        specialorgid: this.specialorgid,
        page: this.page.page,
        limit: this.page.limit,
        yjdw: this.yjdwValue,
        ejdw: this.ejdwValue,
        sjfl: this.sjflValue,
        xmbms: this.$refs.cbbm.array,
        gwxmbms: this.$refs.gwxmbm.array,
        xmmc: this.projectName,
        sfglzc: this.sfglzc,
        sfgjsb: this.sfgjsb,
        year: this.year
      }

      baseService.post('/process35/getDataPage', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.example = res.data.records
          this.page.total = res.data.total
          this.getSpanArr(this.example)
          this.getSpanArr1(this.example)
          this.getSpanArr2(this.example)
          this.getSpanArr3(this.example)
          this.getSpanArr4(this.example)
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    exportBtn() {
      this.loading = true
      let params = {
        specialorgid: this.specialorgid,
        page: this.page.page,
        limit: this.page.limit,
        yjdw: this.yjdwValue,
        ejdw: this.ejdwValue,
        sjfl: this.sjflValue,
        xmbms: this.$refs.cbbm.array,
        gwxmbms: this.$refs.gwxmbm.array,
        xmmc: this.projectName,
        sfglzc: this.sfglzc,
        sfgjsb: this.sfgjsb,
        year: this.year
      }
      baseService.export('/process35/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '项目关联设备资产明细情况.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },
    reset() {
      this.flag = 0
      this.page.page = 1
      this.page.limit = 10
      this.page.total = 0
      this.yjdwValue = ''
      this.ejdwValue = ''
      this.ejdw = []
      this.sjflValue = ''
      this.$refs.cbbm.clear()
      this.$refs.gwxmbm.clear()
      this.projectName = ''
      this.sfglzc = ''
      this.sfgjsb = ''
      this.year = new Date().getFullYear().toString()
      this.example = []
      this.loadData()
    },
    // 分页控件当前页修改事件
    pageChangeHandle(currentPageNum) {
      this.page.page = currentPageNum
      this.loadData()
    },
    // 分页控件请求数量修改事件
    limitChangeHandle(currentLimitNum) {
      this.page.limit = currentLimitNum
      this.loadData()
    },
    getSpanArr(data) {
      let len = 0
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          len += 1
          this.spanArr.push(1)
          this.spanIndex = 0
        } else {
          // 判断当前行与前一行内容是否相同
          if (data[i].yjdw === data[i - 1].yjdw) {
            this.spanArr[this.spanIndex] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
            this.spanArr.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
            len += 1
          } else {
            len = 1
            this.spanArr.push(1) // 否则，依旧是一行
            this.spanIndex = i
          }
        }
      }
    },
    getSpanArr1(data) {
      let len = 0
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          len += 1
          this.spanArr1.push(1)
          this.spanIndex1 = 0
        } else {
          // 判断当前行与前一行内容是否相同
          if (data[i].ejdw === data[i - 1].ejdw) {
            this.spanArr1[this.spanIndex1] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
            this.spanArr1.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
            len += 1
          } else {
            len = 1
            this.spanArr1.push(1) // 否则，依旧是一行
            this.spanIndex1 = i
          }
        }
      }
    },
    getSpanArr2(data) {
      let len = 0
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          len += 1
          this.spanArr2.push(1)
          this.spanIndex2 = 0
        } else {
          // 判断当前行与前一行内容是否相同
          if (data[i].gwxmbm === data[i - 1].gwxmbm) {
            this.spanArr2[this.spanIndex2] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
            this.spanArr2.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
            len += 1
          } else {
            len = 1
            this.spanArr2.push(1) // 否则，依旧是一行
            this.spanIndex2 = i
          }
        }
      }
    },
    getSpanArr3(data) {
      let len = 0
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          len += 1
          this.spanArr3.push(1)
          this.spanIndex3 = 0
        } else {
          // 判断当前行与前一行内容是否相同
          if (data[i].gwxmbm === data[i - 1].gwxmbm && data[i].mxbm === data[i - 1].mxbm) {
            this.spanArr3[this.spanIndex3] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
            this.spanArr3.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
            len += 1
          } else {
            len = 1
            this.spanArr3.push(1) // 否则，依旧是一行
            this.spanIndex3 = i
          }
        }
      }
    },
    getSpanArr4(data) {
      let len = 0
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          len += 1
          this.spanArr4.push(1)
          this.spanIndex4 = 0
        } else {
          // 判断当前行与前一行内容是否相同
          if (data[i].gwxmbm === data[i - 1].gwxmbm && data[i].mxbm === data[i - 1].mxbm) {
            this.spanArr4[this.spanIndex4] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
            this.spanArr4.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
            len += 1
          } else {
            len = 1
            this.spanArr4.push(1) // 否则，依旧是一行
            this.spanIndex4 = i
          }
        }
      }
    },
    objectSpanMethod({ rowIndex, columnIndex }) {
      if (columnIndex === 0) {
        const _row = this.spanArr[rowIndex] // 行数
        const _col = _row > 0 ? 1 : 0 // 列数
        return {
          rowspan: _row,
          colspan: _col
        }
      }
      if (columnIndex === 1) {
        const _row = this.spanArr1[rowIndex] // 行数
        const _col = _row > 0 ? 1 : 0 // 列数
        return {
          rowspan: _row,
          colspan: _col
        }
      }
      if (columnIndex < 10) {
        const _row = this.spanArr2[rowIndex] // 行数
        const _col = _row > 0 ? 1 : 0 // 列数
        return {
          rowspan: _row,
          colspan: _col
        }
      }
      if (columnIndex === 10) {
        const _row = this.spanArr4[rowIndex] // 行数
        const _col = _row > 0 ? 1 : 0 // 列数
        return {
          rowspan: _row,
          colspan: _col
        }
      }
      if (columnIndex > 10 && columnIndex <= 14) {
        const _row = this.spanArr3[rowIndex] // 行数
        const _col = _row > 0 ? 1 : 0 // 列数
        return {
          rowspan: _row,
          colspan: _col
        }
      }
    }
  }
})
</script>

<style lang="less" scoped>
.accounts36 {
  padding: 10px;

  .title {
    width: 100%;
    color: #00706b;
    display: flex;

    .titleBox {
      width: 50%;
      text-align: right;

      h2 {
        font-size: 16px;
        margin: 0;
        margin-bottom: 20px;
      }
    }
  }

  .searchBox {
    width: 50%;
    text-align: right;

    .searchShow {
      cursor: pointer;
      color: #00706b;
    }
  }

  .el-switch__core {
    background-color: #ccc !important;
  }
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-range-separator) {
  padding: 0;
}
</style>
