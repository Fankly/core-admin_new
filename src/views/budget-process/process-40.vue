<template>
  <div class="accounts40" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目建设规模查询报表</h2>
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
                <el-dropdown-item v-for="item in segment" :key="item.label">
                  <el-checkbox style="margin-right: 10px" v-model="item.checked" @change="listShow(item.label, item.checked)"></el-checkbox>
                  {{ item.value }}
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
              <el-form-item label="年度：">
                <el-date-picker v-model="year" value-format="YYYY" type="year" placeholder="选择年"></el-date-picker>
              </el-form-item>
            </el-col>
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
      :span-method="objectSpanMethod"
      row-key="id"
      style="width: 100%; margin-top: 10px"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column fixed label="一级单位" prop="yjdwName" width="200" v-if="columnObj.yjdwName"> </el-table-column>
      <el-table-column fixed label="二级单位" prop="ejdwName" width="200" v-if="columnObj.ejdwName"> </el-table-column>
      <el-table-column label="项目名称" prop="xmmc" width="200" v-if="columnObj.xmmc"> </el-table-column>
      <el-table-column label="项目编码" prop="xmbm" width="200" v-if="columnObj.xmbm"> </el-table-column>
      <el-table-column label="国网项目编码" prop="gwxmbm" width="200" v-if="columnObj.gwxmbm"> </el-table-column>
      <el-table-column label="项目分类（三级分类）" prop="sjflName" width="200" v-if="columnObj.sjflName"> </el-table-column>
      <el-table-column label="项目包名称" prop="xmbmc" width="200" v-if="columnObj.xmbmc"> </el-table-column>
      <el-table-column label="当年预算（万元）" prop="dnys" width="200" v-if="columnObj.dnys"> </el-table-column>
      <el-table-column label="单项目" v-if="columnObj.dxm">
        <el-table-column prop="dxmgt" label="杆塔(根)"></el-table-column>
        <el-table-column prop="dxmdlfzx" label="电缆分支箱(只)"></el-table-column>
        <el-table-column prop="dxmjkxl" label="架空线路(Km)"></el-table-column>
        <el-table-column prop="dxmdlxl" label="电缆线路(Km)"></el-table-column>
      </el-table-column>
      <el-table-column label="台区" v-if="columnObj.tq">
        <el-table-column prop="tqgt" label="杆塔(根)"></el-table-column>
        <el-table-column prop="tqdlfzx" label="电缆分支箱(只)"></el-table-column>
        <el-table-column prop="tqjkxl" label="架空线路(Km)"></el-table-column>
        <el-table-column prop="tqdlxl" label="电缆线路(Km)"></el-table-column>
      </el-table-column>
    </el-table>
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
  name: '/budget-process/process-40',
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
          value: '一级单位',
          label: 'yjdwName',
          checked: true
        },
        {
          value: '二级单位',
          label: 'ejdwName',
          checked: true
        },
        {
          value: '项目名称',
          label: 'xmmc',
          checked: true
        },
        {
          value: '项目编码',
          label: 'xmbm',
          checked: true
        },
        {
          value: '国网项目编码',
          label: 'gwxmbm',
          checked: true
        },
        {
          value: '项目分类(三级分类)',
          label: 'sjflName',
          checked: true
        },
        {
          value: '项目包名称',
          label: 'xmbmc',
          checked: true
        },
        {
          value: '项目包编码',
          label: 'xmbbm',
          checked: true
        },
        {
          value: '当年预算(万元)',
          label: 'dnys',
          checked: true
        },
        {
          value: '单项目',
          label: 'dxm',
          checked: true
        },
        {
          value: '台区',
          label: 'tq',
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
      spanIndex: 0, // 记录spanArr数组的下标
      spanIndex1: 0, // 记录spanArr数组的下标
      //一级单位
      yjdw: [],
      yjdwValue: '',
      //二级单位
      ejdw: [],
      ejdwValue: '',
      // 项目名称
      projectName: '',
      //本地下拉数据
      selectList: [
        { code: '0', name: '否' },
        { code: '1', name: '是' }
      ],
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
        this.segmentIds.push(item.label)
        this.columnObj[item.label] = item.checked
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
      this.spanIndex = 0
      this.spanIndex1 = 0
      this.spanIndex2 = 0
      this.example = []
      this.loading = true
      let params = {
        specialorgid: this.specialorgid,
        current: this.page.page,
        size: this.page.limit,
        yjdw: this.yjdwValue,
        ejdw: this.ejdwValue,
        xmbms: this.$refs.cbbm.array,
        gwxmbms: this.$refs.gwxmbm.array,
        xmmc: this.projectName,
        nd: this.year
      }
      baseService.post('/process38/getDataPage', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.example = res.data.records
          this.page.total = res.data.total
          this.getSpanArr(this.example)
          this.getSpanArr1(this.example)
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
        cbbms: this.$refs.cbbm.array,
        gwxmbms: this.$refs.gwxmbm.array,
        xmmc: this.projectName,
        nd: this.year
      }
      baseService.export('/process38/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '项目建设规模查询报表.xlsx'
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
          if (data[i].yjdwName === data[i - 1].yjdwName) {
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
          if (data[i].ejdwName === data[i - 1].ejdwName) {
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
      }
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
    reset() {
      this.page.page = 1
      this.page.limit = 10
      this.page.total = 0
      this.yjdwValue = ''
      this.ejdwValue = ''
      this.ejdw = []
      this.$refs.cbbm.clear()
      this.$refs.gwxmbm.clear()
      this.projectName = ''
      this.year = new Date().getFullYear().toString()
      this.example = []
      this.loadData()
    }
  }
})
</script>

<style scoped lang="less">
.accounts40 {
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
