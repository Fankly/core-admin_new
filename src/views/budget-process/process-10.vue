<template>
  <div class="genFrameWork" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>通用服务执行总览</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon class="el-icon-s-operation">
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
        <el-form label-position="left" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <allProjectType class="formWidth" ref="type"></allProjectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="提报日期：">
                <el-date-picker
                  v-model="dataList.time"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  :picker-options="pickerOptions0"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="展示维度：">
                <el-radio-group v-model="dataList.select" @change="changeCompany">
                  <el-radio :label="0" border style="margin-right: 10px">单位</el-radio>
                  <el-radio :label="1" border>类型</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" @click="search">查 询</el-button>
                <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
                <el-button type="warning" icon="el-icon-download" @click="exportBtn">导 出</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <el-table
      stripe
      border
      :data="example"
      v-if="tableHeight"
      :height="tableHeight"
      style="width: 100%"
      row-key="id"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column prop="id1" fixed label="单位/项目类型" width="250">
        <template #default="scope">
          <span style="cursor: pointer" v-if="scope.row.children">{{ scope.row.name }}</span>
          <div style="width: 100%; text-align: center" v-else>{{ scope.row.name }}</div>
        </template>
      </el-table-column>

      <el-table-column width="160" prop="dataMap.ysmbz" align="right" label="年度预算" fixed />

      <el-table-column label="招投标" v-if="columnObj.ztb">
        <el-table-column width="160" prop="dataMap.zbje" align="center" label="招标金额"></el-table-column>
        <el-table-column width="160" prop="dataMap.zaobjexz" align="center" label="招标金额（修正）"></el-table-column>
        <el-table-column width="160" prop="dataMap.zhszj" align="center" label="中标金额"></el-table-column>
        <el-table-column width="160" prop="dataMap.zhongbjexz" align="center" label="中标金额（修正）"></el-table-column>
        <el-table-column width="160" prop="dataMap.zxqzbz" align="center" label="需求招标中"></el-table-column>
      </el-table-column>
      <el-table-column label="合同签订（框架合同）" v-if="columnObj.htqdkj">
        <el-table-column width="160" prop="dataMap.zhtje" align="center" label="合同签订"></el-table-column>
        <el-table-column width="160" prop="dataMap.htqdxz" align="center" label="合同签订（修正）"></el-table-column>
        <el-table-column width="160" prop="dataMap.zhtqdz" align="center" label="合同签订中"></el-table-column>
      </el-table-column>
      <el-table-column label="合同签订（标准合同）" v-if="columnObj.htqdbz">
        <el-table-column width="160" prop="dataMap.zhtje2" align="center" label="合同签订"></el-table-column>
        <el-table-column width="160" prop="dataMap.htqdxz2" align="center" label="合同签订（修正）"></el-table-column>
        <el-table-column width="160" prop="dataMap.zhtqdz2" align="center" label="合同签订中"></el-table-column>
      </el-table-column>
      <el-table-column label="合同履约（执行协议）" v-if="columnObj.htlyzx">
        <el-table-column width="160" align="center" prop="dataMap.zzxhtje" label="执行合同签订"></el-table-column>
        <el-table-column width="160" align="center" prop="dataMap.zhtrzzje" label="服务确认金额"></el-table-column>
        <el-table-column width="160" align="center" prop="dataMap.fwqrjexz" label="服务确认金额（修正）"></el-table-column>
      </el-table-column>
      <el-table-column label="合同履约（标准合同）" v-if="columnObj.htlybz">
        <el-table-column width="160" align="center" prop="dataMap.zhtrzzje2" label="服务确认金额"></el-table-column>
        <el-table-column width="160" align="center" prop="dataMap.fwqrjexz2" label="服务确认金额（修正）"></el-table-column>
      </el-table-column>
    </el-table>

    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  </div>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import allProjectType from '@/components/select/allProjectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'
export default defineComponent({
  name: '/budget-process/process-10',
  components: {
    projectType,
    affiliatedUnit,
    userDialog,
    allProjectType
  },
  setup() {
    const store = useStore()
    const helpHandle = () => {
      const url = store.getters.getMenuMsg.url
      showHelpMsg(url)
    }
    return reactive({
      helpHandle,
      store,
      searchShow: true,
      dataList: {
        time: [],
        select: 0
      },
      segment: [
        {
          value: 'ztb',
          label: '招投标',
          checked: true
        },
        {
          value: 'htqdkj',
          label: '合同签订（框架合同）',
          checked: true
        },
        {
          value: 'htqdbz',
          label: '合同签订（标准合同）',
          checked: true
        },
        {
          value: 'htlyzx',
          label: '合同履约（执行协议）',
          checked: true
        },
        {
          value: 'htlybz',
          label: '合同履约（标准合同）',
          checked: true
        }
      ],
      columnObj: {},
      segmentIds: [],
      example: [],
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      loading: false,
      userCode: '',
      userId: '',
      specialorgid: ''
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
    this.getTime()
    this.loading = true
    this.$refs.userDialog.getUser(this.userId, this.userCode)
  },
  methods: {
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 40 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 40 + 'px'
      }
    },
    getTime() {
      let date = new Date()
      let year = date.getFullYear()
      let month = date.getMonth() + 1
      let day = date.getDay()
      month = month > 9 ? month : '0' + month
      day = day > 9 ? day : '0' + day
      let start = year + '-' + '01' + '-' + '01'
      let last = year + '-' + month + '-' + day
      this.dataList.time.push(start)
      this.dataList.time.push(last)
    },
    loadData() {
      this.loading = true
      const params = {
        qkjxmlxbms: [],
        qkjejdws: [],
        sbadat: '',
        ebadat: '',
        wd: this.dataList.select,
        specialorgid: this.specialorgid
      }

      if (this.$refs.type.selectList.length > 0) {
        params.qkjxmlxbms = this.$refs.type.selectList
      } else {
        params.qkjxmlxbms = this.$refs.type.allId
      }

      if (this.$refs.company.selectList.length > 0) {
        params.qkjejdws = this.$refs.company.selectList
      } else {
        params.qkjejdws = this.$refs.company.allId
      }
      if (this.dataList.time) {
        params.sbadat = this.dataList.time[0]
        params.ebadat = this.dataList.time[1]
      }
      baseService.post('/process/process10/', params).then((res) => {
        if (res.success == true) {
          this.loading = false
          this.example = res.data
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
      const params = {
        qkjxmlxbms: [],
        qkjejdws: [],
        sbadat: '',
        ebadat: '',
        wd: this.dataList.select,
        specialorgid: this.specialorgid
      }

      if (this.$refs.type.selectList.length > 0) {
        params.qkjxmlxbms = this.$refs.type.selectList
      } else {
        params.qkjxmlxbms = this.$refs.type.allId
      }

      if (this.$refs.company.selectList.length > 0) {
        params.qkjejdws = this.$refs.company.selectList
      } else {
        params.qkjejdws = this.$refs.company.allId
      }
      if (this.dataList.time) {
        params.sbadat = this.dataList.time[0]
        params.ebadat = this.dataList.time[1]
      }
      baseService.export('/process/process10/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '通用服务执行总览.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },
    //搜索按钮
    search() {
      this.loadData()
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
    //重置按钮
    reset() {
      this.dataList.select = 0
      this.dataList.time = []
      this.getTime()
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.example = []
      this.loadData()
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.$refs.company.getAffiliatedUnit(this.specialorgid)
    }
  }
})
</script>

<style lang="less" scoped>
.genFrameWork {
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

    .searchBox {
      width: 50%;
      text-align: right;

      .searchShow {
        cursor: pointer;
        color: #00706b;
        box-shadow: 0 0 0 0.3;
      }
    }
  }
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-range-separator) {
  padding: 0;
}
</style>
