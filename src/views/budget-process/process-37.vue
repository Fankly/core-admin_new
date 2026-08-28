<template>
  <div class="accounts37" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目关联设备资产总览</h2>
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
        <el-form label-position="left" label-width="120px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="立项时间开始：">
                <el-date-picker
                  v-model="dataList.start"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="date"
                  placeholder="请选择开始时间"
                  :clearable="false"
                >
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="立项时间结束：">
                <el-date-picker
                  v-model="dataList.end"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="date"
                  placeholder="请选择结束时间"
                  :clearable="false"
                >
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="年度：">
                <el-date-picker v-model="year" value-format="YYYY" type="year" placeholder="选择年"> </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6" class="btnPostion">
              <el-button type="primary" icon="el-icon-search" @click="loadData"> 查询</el-button>
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
      <el-table-column label="单位" prop="yjdwName" width="150" v-if="columnObj.dw"> </el-table-column>
      <el-table-column label="Z701配网专项成本" v-if="columnObj.z701">
        <el-table-column label="设备挂接率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z701sbNum, row.z701lxsl)" placement="top" effect="light">
                <span>{{ row.z701sbsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z701sbAmount, row.z701lxje)" placement="top" effect="light">
                <span>{{ row.z701sbje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="资产关联率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z701zcNum, row.z701lxsl)" placement="top" effect="light">
                <span>{{ row.z701zcsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z701zcAmount, row.z701lxje)" placement="top" effect="light">
                <span>{{ row.z701zcje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table-column>
      <el-table-column label="Z702农网专项成本（主业）" width="250" v-if="columnObj.z702">
        <el-table-column label="设备挂接率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z702sbNum, row.z702lxsl)" placement="top" effect="light">
                <span>{{ row.z702sbsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z702sbAmount, row.z702lxje)" placement="top" effect="light">
                <span>{{ row.z702sbje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="资产关联率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z702zcNum, row.z702lxsl)" placement="top" effect="light">
                <span>{{ row.z702zcsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z702zcAmount, row.z702lxje)" placement="top" effect="light">
                <span>{{ row.z702zcje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table-column>
      <el-table-column label="Z703业扩专项成本" width="250" v-if="columnObj.z703">
        <el-table-column label="设备挂接率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z703sbNum, row.z703lxsl)" placement="top" effect="light">
                <span>{{ row.z703sbsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z703sbAmount, row.z703lxje)" placement="top" effect="light">
                <span>{{ row.z703sbje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="资产关联率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z703zcNum, row.z703lxsl)" placement="top" effect="light">
                <span>{{ row.z703zcsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z703zcAmount, row.z703lxje)" placement="top" effect="light">
                <span>{{ row.z703zcje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table-column>
      <el-table-column label="Z248农村低压电网修理" v-if="columnObj.z248">
        <el-table-column label="设备挂接率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z248sbNum, row.z248lxsl)" placement="top" effect="light">
                <span>{{ row.z248sbsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z248sbAmount, row.z248lxje)" placement="top" effect="light">
                <span>{{ row.z248sbje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="资产关联率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z248zcNum, row.z248lxsl)" placement="top" effect="light">
                <span>{{ row.z248zcsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z248zcAmount, row.z248lxje)" placement="top" effect="light">
                <span>{{ row.z248zcje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table-column>
    </el-table>
  </div>

  <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { showHelpMsg } from '@/utils/message'

export default defineComponent({
  name: '/budget-process/process-37',
  components: { userDialog },
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
          value: 'dw',
          label: '单位',
          checked: true
        },
        {
          value: 'z701',
          label: 'Z701配网专项成本',
          checked: true
        },
        {
          value: 'z702',
          label: 'Z702农网专项成本（主业）',
          checked: true
        },
        {
          value: 'z703',
          label: 'Z703业扩专项成本',
          checked: true
        },
        {
          value: 'z248',
          label: 'Z248农村低压电网修理',
          checked: true
        }
      ],
      dataList: {
        start: '',
        end: ''
      },
      year: new Date().getFullYear().toString()
    })
  },
  created() {
    this.handleColumn()
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
    // 展示百分比计算规则
    showPercentage(numOne, numTwo) {
      return numOne + '/' + numTwo
    },
    //计算表格高度
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 60 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 60 + 'px'
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
      this.loading = true
      let params = {
        specialorgid: this.specialorgid,
        lxkssj: this.dataList.start,
        lxjssj: this.dataList.end,
        year: this.year
      }
      baseService.post(`/process34/getData`, params).then((res) => {
        if (res.success) {
          this.example = res.data
          this.loading = false
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
      let params = {
        specialorgid: this.specialorgid,
        lxkssj: this.dataList.start,
        lxjssj: this.dataList.end,
        year: this.year
      }
      baseService.export(`/process34/export`, params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '项目关联设备资产总览.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },
    reset() {
      this.dataList.start = ''
      this.dataList.end = ''
      this.year = new Date().getFullYear().toString()
      this.example = []
      this.loadData()
    }
  }
})
</script>

<style lang="less" scoped>
.accounts37 {
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
