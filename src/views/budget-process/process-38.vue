<template>
  <div class="accounts38" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>设备关联项目成本明细情况</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon style="font-size: 18px" class="el-icon-s-operation">
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
                  <el-option v-for="item in yjdw" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级单位：">
                <el-select class="formWidth" v-model="ejdwValue" clearable placeholder="请选择">
                  <el-option v-for="item in ejdw" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="三级分类：">
                <el-select class="formWidth" v-model="sjflValue" clearable placeholder="请选择">
                  <el-option v-for="item in sjfl" :key="item.code" :label="item.name" :value="item.code"> </el-option>
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
                <el-select class="formWidth" v-model="sfgjsb" placeholder="请选择" clearable>
                  <el-option v-for="item in selectList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="是否关联资产：">
                <el-select class="formWidth" v-model="sfglzc" placeholder="请选择" clearable>
                  <el-option v-for="item in selectList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
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
              <el-button type="primary" icon="el-icon-search" style="margin-left: 120px" @click="loadData"> 查询 </el-button>
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
      :span-method="objectSpanMethod"
      row-key="id"
      style="width: 100%; margin-top: 10px"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column fixed label="一级单位" prop="yjdwmc" width="200" v-if="columnObj.yjdw"> </el-table-column>
      <el-table-column fixed label="二级单位" prop="ejdwmc" width="200" v-if="columnObj.ejdw"> </el-table-column>
      <el-table-column label="PMS设备编号" prop="pmsbm" width="200" v-if="columnObj.pmssbbh"> </el-table-column>
      <el-table-column label="PMS设备名称" prop="pmsmc" width="200" v-if="columnObj.pmssbmc"> </el-table-column>
      <el-table-column label="国网项目编码" prop="gwxmbm" width="200" v-if="columnObj.gwxmbm"> </el-table-column>
      <el-table-column label="储备编码" prop="cbbm" width="200" v-if="columnObj.cbbm"> </el-table-column>
      <el-table-column label="项目名称" prop="xmmc" width="200" v-if="columnObj.xmmc"> </el-table-column>
      <el-table-column label="项目分类（三级分类）" prop="xmflmc" width="200" v-if="columnObj.xmfl"> </el-table-column>
      <el-table-column label="当年预算金额（万元）" prop="dnys" width="200" v-if="columnObj.dnysje"> </el-table-column>
      <el-table-column label="累计投入金额（万元）" prop="ljtr" width="200" v-if="columnObj.ljtrje"> </el-table-column>
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
  name: '/budget-process/process-38',
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
          value: 'pmssbbh',
          label: 'PMS设备编号',
          checked: true
        },
        {
          value: 'pmssbmc',
          label: 'PMS设备名称',
          checked: true
        },
        {
          value: 'gwxmbm',
          label: '国网项目编码',
          checked: true
        },
        {
          value: 'cbbm',
          label: '储备编码',
          checked: true
        },
        {
          value: 'xmmc',
          label: '项目名称',
          checked: true
        },
        {
          value: 'xmfl',
          label: '项目分类（三级分类）',
          checked: true
        },
        {
          value: 'dnysje',
          label: '当年预算金额（万元）',
          checked: true
        },
        {
          value: 'ljtrje',
          label: '累计投入金额（万元）',
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
      spanArr: [], // 用于存放需要合并的行的个数
      spanArr1: [], // 用于存放需要合并的行的个数
      spanArr2: [], // 用于存放需要合并的行的个数
      spanIndex: 0, // 记录spanArr数组的下标
      spanIndex1: 0, // 记录spanArr数组的下标
      spanIndex2: 0, // 记录spanArr数组的下标
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
      year: new Date().getFullYear().toString()
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
      if (this.searchShow === true) {
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
        if (i === value) {
          this.columnObj[i] = checked
        }
      }
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
    },
    loadData() {
      this.spanArr = []
      this.spanArr1 = []
      this.spanArr2 = []
      this.spanIndex = 0
      this.spanIndex1 = 0
      this.spanIndex2 = 0
      this.example = []
      this.loading = true
      let params = {
        specialorgid: this.specialorgid,
        page: this.page.page,
        limit: this.page.limit,
        yjdw: this.yjdwValue,
        ejdw: this.ejdwValue,
        sjfl: this.sjflValue,
        cbbms: this.$refs.cbbm.array,
        gwxmbms: this.$refs.gwxmbm.array,
        xmmc: this.projectName,
        sfgjsb: this.sfgjsb,
        sfglzc: this.sfglzc,
        nd: this.year
      }
      baseService.post('/process36/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.example = res.data.records
          this.page.total = res.data.total
          this.getSpanArr(this.example)
          this.getSpanArr1(this.example)
          this.getSpanArr2(this.example)
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
        cbbms: this.$refs.cbbm.array,
        gwxmbms: this.$refs.gwxmbm.array,
        xmmc: this.projectName,
        sfgjsb: this.sfgjsb,
        sfglzc: this.sfglzc,
        nd: this.year
      }
      baseService.export('/process36/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '设备关联项目成本明细情况.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
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
          if (data[i].pmsbm === data[i - 1].pmsbm) {
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
    objectSpanMethod({ rowIndex, columnIndex }) {
      if (columnIndex == 0) {
        const _row = this.spanArr[rowIndex] // 行数
        const _col = _row > 0 ? 1 : 0 // 列数
        return {
          rowspan: _row,
          colspan: _col
        }
      } else if (columnIndex === 1) {
        const _row = this.spanArr1[rowIndex] // 行数
        const _col = _row > 0 ? 1 : 0 // 列数
        return {
          rowspan: _row,
          colspan: _col
        }
      } else if (columnIndex < 4) {
        const _row = this.spanArr2[rowIndex] // 行数
        const _col = _row > 0 ? 1 : 0 // 列数
        return {
          rowspan: _row,
          colspan: _col
        }
      }
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
    reset() {
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
    }
  }
})
</script>

<style lang="less" scoped>
.accounts38 {
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
