<template>
  <div class="process" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>表数据统计</h2>
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
          <span class="searchShow" v-if="searchShow == false" @click="showSearch(true)">
            <i class="el-icon-arrow-down"></i>
          </span>
          <span class="searchShow" @click="showSearch(false)" v-else>
            <i class="el-icon-arrow-up"></i>
          </span>
        </div>
      </div>
      <div class="search" v-show="searchShow">
        <el-form :inline="true" label-width="120px">
          <el-row>
            <el-col :span="8">
              <el-form-item label="年度：">
                <el-date-picker :clearable="false" type="year" value-format="YYYY" v-model="searchForm.nd"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="月度：">
                <el-select v-model="searchForm.yd">
                  <el-option v-for="item in ydList" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-button type="primary" icon="el-icon-search" style="margin-left: 120px" @click="loadData"> 查询 </el-button>
              <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
    <div class="table">
      <el-table
        height="100%"
        stripe
        border
        :data="example"
        row-key="id"
        style="width: 100%; margin-top: 10px"
        :cell-style="{ 'text-align': 'center' }"
        :header-cell-style="{ 'text-align': 'center' }"
      >
        <el-table-column label="表名" prop="tableName" v-if="columnObj.tableName"></el-table-column>
        <el-table-column label="表简称" prop="tableShortName" v-if="columnObj.tableShortName"></el-table-column>
        <el-table-column label="本地表数据量" prop="num" v-if="columnObj.num"></el-table-column>
        <el-table-column label="HANA数据量" prop="hanaNum" v-if="columnObj.hanaNum"></el-table-column>
      </el-table>
    </div>
  </div>
  <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

export default defineComponent({
  name: '/statistics/dataStatistics',
  components: { userDialog },
  setup() {
    const store = useStore()
    return reactive({
      store,
      ydList: [
        {
          value: '1',
          label: '1月'
        },
        {
          value: '2',
          label: '2月'
        },
        {
          value: '3',
          label: '3月'
        },
        {
          value: '4',
          label: '4月'
        },
        {
          value: '5',
          label: '5月'
        },
        {
          value: '6',
          label: '6月'
        },
        {
          value: '7',
          label: '7月'
        },
        {
          value: '8',
          label: '8月'
        },
        {
          value: '9',
          label: '9月'
        },
        {
          value: '10',
          label: '10月'
        },
        {
          value: '11',
          label: '11月'
        },
        {
          value: '12',
          label: '12月'
        }
      ],
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
      searchForm: {
        nd: new Date().getFullYear().toString(),
        yd: (new Date().getMonth() + 1).toString()
      },
      segment: [
        {
          value: 'tableName',
          label: '表名',
          checked: true
        },
        {
          value: 'tableShortName',
          label: '表简称',
          checked: true
        },
        {
          value: 'num',
          label: '本地表数据量',
          checked: true
        },
        {
          value: 'hanaNum',
          label: 'HANA数据量',
          checked: true
        }
      ],
      dialogVisible: false
    })
  },
  created() {
    this.handleColumn()
  },
  mounted() {
    this.loading = true
    this.$refs.userDialog.getUser(this.userId, this.userCode)
  },

  methods: {
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
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
      this.example = []
      this.loading = true
      baseService.get(`dataCount/?nd=${this.searchForm.nd}&yd=${this.searchForm.yd}`).then((res) => {
        if (res.success) {
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

    reset() {
      this.searchForm.nd = new Date().getFullYear().toString()
      this.searchForm.yd = (new Date().getMonth() + 1).toString()
      this.loadData()
    }
  }
})
</script>

<style lang="less">
.process {
  height: calc(100vh - 140px);

  .topBox {
    height: 100px;

    .title {
      width: 100%;
      color: #00706b;
      display: flex;
      height: 30px;

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

    .search {
      width: 100%;
      height: 50px;
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

  .table {
    height: calc(100% - 120px);
  }

  .el-switch__core {
    background-color: #ccc !important;
  }
}
</style>
