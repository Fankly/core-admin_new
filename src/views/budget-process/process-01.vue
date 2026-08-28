<template>
  <div class="browse" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>预算全过程总览</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer; font-size: 18px" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon class="el-icon-s-operation" style="cursor: pointer; font-size: 18px">
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
          <span style="margin-right: 20px; cursor: pointer; font-size: 18px">
            <span class="searchShow" v-if="searchShow == false" @click="showSearch(true)">
              <i class="el-icon-arrow-down"></i>
            </span>
            <span class="searchShow" @click="showSearch(false)" v-else>
              <i class="el-icon-arrow-up"></i>
            </span>
          </span>
          <span class="searchShow" style="cursor: pointer; font-size: 18px">
            <i class="el-icon-question" @click="helpHandle"></i>
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
              <el-form-item label="截至日期：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="展示版本：">
                <el-select class="formWidth" v-model="value" placeholder="请选择" @change="tableType">
                  <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="统计纬度：">
                <el-radio-group v-model="dataList.select">
                  <el-radio :label="0" border style="margin-right: 10px">单位</el-radio>
                  <el-radio :label="1" border>类型</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
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
      v-if="tableHeight"
      v-show="detailedTableJJb == true"
      :height="tableHeight"
      :data="example"
      row-key="id"
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="单位/项目类型" width="250" fixed>
        <template #default="scope">
          <span style="cursor: pointer" v-if="scope.row.children">{{ scope.row.name }}</span>
          <div style="width: 100%; text-align: center" v-else>{{ scope.row.name }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="dataMap.ysmbz" label="年度预算（万元）" align="right" width="150" fixed />
      <el-table-column label="项目储备与立项" v-if="columnObj.cbylx">
        <el-table-column label="已立项" align="left" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ylxxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.erpjdys + '万元' }}</div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="招投标(修正)" v-if="columnObj.zybxz">
        <el-table-column align="left" label="需求提报合计（修正）" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.xqtbxzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.hjxqtbxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.hjxqtbxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="中标结果合计（修正）" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zbjgxzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用中标：' + scope.row.dataMap.hjzbjgxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化中标：' + scope.row.dataMap.hjzbjgxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="合同签订(修正)" v-if="columnObj.htqd">
        <el-table-column align="left" label="合同签订合计（修正）" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.tyhtqdxzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '合同金额：' + scope.row.dataMap.tyhtqdxzs + '万元' }}</div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目审计" v-if="columnObj.xmsj">
        <el-table-column align="left" label="结算送审" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ljssjexms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '送审金额（含税）：' + scope.row.dataMap.ljssje + '万元' }} </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="结算与资金支付" v-if="columnObj.jsyzjzf">
        <el-table-column align="left" label="当年财务支出(含税)" width="320">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzcb_hsxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '财务支出：' + scope.row.dataMap.ndzc_hs + '万元' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '物资支出：' + scope.row.dataMap.ndwzzc_hs + '万元' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '服务支出：' + scope.row.dataMap.ndfwzc_hs + '万元' }}</div>
          </template>
        </el-table-column>

        <el-table-column align="left" label="当年财务支出(不含税)" width="320">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzcb_hsxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '财务支出：' + scope.row.dataMap.ndzcb_hs + '万元' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '物资支出：' + scope.row.dataMap.ndwzzc_bhs + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '服务支出：' + scope.row.dataMap.ndfwzc_bhs + '万元' }} </div>
          </template>
        </el-table-column>

        <el-table-column align="left" label="当年资金支付" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zjzfjexms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '当年支付金额：' + scope.row.dataMap.zjzfje + '万元' }}</div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="决算与增资" v-if="columnObj.jsyzz">
        <el-table-column align="left" label="正式增资金额" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zszzjexms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '累计正式增资金额：' + scope.row.dataMap.zszzje + '万元' }} </div>
          </template>
        </el-table-column>
      </el-table-column>
    </el-table>

    <el-table
      stripe
      border
      v-if="tableHeight"
      v-show="detailedTableJJb == false"
      :height="tableHeight"
      :data="example"
      row-key="id"
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="单位/项目类型" width="250" fixed>
        <template #default="scope">
          <span style="cursor: pointer" v-if="scope.row.children">{{ scope.row.name }}</span>
          <div style="width: 100%; text-align: center" v-else>{{ scope.row.name }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="dataMap.ysmbz" label="年度预算（万元）" align="right" width="150" fixed />

      <el-table-column label="项目储备与立项" v-if="columnObj.cbylx">
        <el-table-column label="已立项" align="left" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ylxxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.erpjdys + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="detailedTable" label="未立项" align="left" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '未立项规模：' + scope.row.dataMap.xmcbylx + '万元' }}</div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column v-if="detailedTable && columnObj.zybfxz" label="招投标(非修正)">
        <el-table-column align="left" label="需求提报(合计)" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.xqtbfxzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.hjxqtbxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.hjxqtbxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="物资需求提报" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbxqtb_wzxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.wzxqtbfxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.wzxqtbfxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="服务需求提报" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbxqtb_fwxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.fwxqtbfxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.fwxqtbfxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="中标结果(合计)" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zbjgfxzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.hjzbjgfxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化中标：' + scope.row.dataMap.hjzbjgfxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="物资中标结果" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzhongbje_wzxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.wzzbjgfxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化中标：' + scope.row.dataMap.wzzbjgfxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="服务中标结果" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzhongbje_fwxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.fwzbjgfxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化中标：' + scope.row.dataMap.fwzbjgfxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="招投标(修正)" v-if="columnObj.zybxz">
        <el-table-column align="left" label="需求提报(合计)" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.xqtbxzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.hjxqtbxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.hjxqtbxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column v-if="detailedTable" align="left" label="物资需求提报" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbxqtb_wzxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.wzxqtbxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.wzxqtbxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column v-if="detailedTable" align="left" label="服务需求提报" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbxqtb_fwxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.fwxqtbxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.fwxqtbxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="中标结果(合计)" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zbjgxzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用中标：' + scope.row.dataMap.hjzbjgxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化中标：' + scope.row.dataMap.hjzbjgxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column v-if="detailedTable" align="left" label="物资中标结果" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzhongbje_wzxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用中标：' + scope.row.dataMap.wzzbjgxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化中标：' + scope.row.dataMap.wzzbjgxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column v-if="detailedTable" align="left" label="服务中标结果" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzhongbje_fwxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用中标：' + scope.row.dataMap.fwzbjgxz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化中标：' + scope.row.dataMap.fwzbjgxz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="需求招标中(合计)" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.xqzbzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.hjxqzbz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.hjxqzbz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column v-if="detailedTable" align="left" label="物资需求招标中" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbz_wzxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.wzxqzbz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.wzxqzbz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column v-if="detailedTable" align="left" label="服务需求招标中" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbz_fwxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '通用招标：' + scope.row.dataMap.fwxqzbz_ty + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目化招标：' + scope.row.dataMap.fwxqzbz_xmh + '万元' }} </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column v-if="detailedTable && columnObj.htqdfxz" label="合同签订(非修正)">
        <el-table-column align="left" label="合同签订(合计)" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.tyhtqdfxzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '合同金额：' + scope.row.dataMap.tyhtqdfxzs + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="物资采购合同" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbhtje_wzxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '合同金额：' + scope.row.dataMap.ndzbhtje_wz + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="服务合同签订" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbhtje_fwxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '合同金额：' + scope.row.dataMap.ndzbhtje_fw + '万元' }} </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="合同签订(修正)" v-if="columnObj.htqd">
        <el-table-column align="left" label="合同签订(合计)" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.tyhtqdxzc + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '合同金额：' + scope.row.dataMap.tyhtqdxzs + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="物资采购合同签订" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbhtje_wzxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '合同金额：' + scope.row.dataMap.ndzbhtje_wzxz + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="服务合同签订" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbhtje_fwxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '合同金额：' + scope.row.dataMap.ndzbhtje_fwxz + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="签订中(合计)" width="300">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '金额：' + scope.row.dataMap.qdz + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="物资合同签订中" width="300" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '金额：' + scope.row.dataMap.ndzbhtqdz_wz + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="服务合同签订中" width="300" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '金额：' + scope.row.dataMap.ljbjhtjeqdz + '万元' }}</div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column v-if="columnObj.xmss" label="项目实施">
        <el-table-column align="left" label="已开工" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zsjksxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目预算金额：' + scope.row.dataMap.zsjksys + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="未开工" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.wsjksxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目预算金额：' + scope.row.dataMap.wsjksys + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="物资到货(非修正)" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbdhxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '物资到货金额：' + scope.row.dataMap.ndzbdhje + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="物资到货(修正)" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzbdhxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '物资到货金额：' + scope.row.dataMap.ndzbdhjexz + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="在途物资" width="320">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '物资合同金额-已到货金额：' + scope.row.dataMap.ndzbghzje + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="物资领用（含税）" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.xmwzlyje_xms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '物资领用金额：' + scope.row.dataMap.wzlyhs + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="库存物资" width="320">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '到货物资金额-已领用金额：' + scope.row.dataMap.ndlyje_hs + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="预算调整" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.erpndysbdxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '调整合计金额：' + scope.row.dataMap.erpndysbd + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="已竣工" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zsjjgxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目预算金额：' + scope.row.dataMap.zsjjgys + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="未竣工" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.sgzxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目预算金额：' + scope.row.dataMap.sgzys + '万元' }}</div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目审计" v-if="columnObj.xmsj">
        <el-table-column align="left" label="结算送审" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ljssjexms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '送审金额（含税）：' + scope.row.dataMap.ljssje + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="审计中" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.sjzxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '送审金额：' + scope.row.dataMap.ljssje2 + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="结算审定" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jssdxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '审定金额（含税）：' + scope.row.dataMap.ljsdje + '万元' }} </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="结算与资金支付" v-if="columnObj.jsyzjzf">
        <el-table-column align="left" label="当年财务支出(含税)" width="320">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzcb_hsxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '财务支出：' + scope.row.dataMap.ndzc_hs + '万元' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '物资支出：' + scope.row.dataMap.ndwzzc_hs + '万元' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '服务支出：' + scope.row.dataMap.ndfwzc_hs + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="当年财务支出(不含税)" width="320">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzcb_hsxms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '财务支出：' + scope.row.dataMap.ndzcb_hs + '万元' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '物资支出：' + scope.row.dataMap.ndwzzc_bhs + '万元' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '服务支出：' + scope.row.dataMap.ndfwzc_bhs + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="当年资金支付" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zjzfjexms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '当年支付金额：' + scope.row.dataMap.zjzfje + '万元' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="累计资金支付" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ljzjzfjexms + '个' }} </div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '累计资金支付金额：' + scope.row.dataMap.ljzjzfje + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="未清理往来金额" width="240" v-if="detailedTable">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.wqlwlxms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '累计未清理往来金额：' + scope.row.dataMap.wqlwl + '万元' }} </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="决算与增资" v-if="columnObj.jsyzz">
        <el-table-column align="left" label="正式增资" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zszzjexms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '累计正式增资金额：' + scope.row.dataMap.zszzje + '万元' }} </div>
          </template>
        </el-table-column>
        <el-table-column align="left" label="在建工程金额" width="240">
          <template #default="scope">
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zjgcyexms + '个' }}</div>
            <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '在建工程余额：' + scope.row.dataMap.zjgcye + '万元' }}</div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column v-if="detailedTable && columnObj.xmgb" align="left" label="项目关闭" width="240">
        <template #default="scope">
          <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ygbxms + '个' }}</div>
          <div style="cursor: pointer" v-if="scope.row.dataMap">{{ '预算金额：' + scope.row.dataMap.ygbys + '万元' }}</div>
        </template>
      </el-table-column>
    </el-table>

    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  </div>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import allProjectType from '@/components/select/allProjectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import Sortable from 'sortablejs'
import { showHelpMsg } from '@/utils/message'
export default defineComponent({
  name: '/budget-process/process-01',
  components: {
    allProjectType,
    affiliatedUnit,
    userDialog
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
      detailedTable: false,
      detailedTableJJb: false,
      options: [
        {
          label: '总览表-简洁版',
          value: 'jjb'
        },
        {
          label: '总览表-详细表',
          value: true
        },
        {
          label: '总览表-默认显示字段',
          value: false
        }
      ],
      value: false,
      columnObj: {},
      segmentIds: [],
      segment: [
        {
          value: 'cbylx',
          label: '项目储备与立项',
          checked: true
        },
        {
          value: 'zybfxz',
          label: '招投标（非修正）',
          checked: true
        },
        {
          value: 'zybxz',
          label: '招投标（修正）',
          checked: true
        },
        {
          value: 'htqdfxz',
          label: '合同签订（非修正）',
          checked: true
        },
        {
          value: 'htqd',
          label: '合同签订',
          checked: true
        },
        {
          value: 'xmss',
          label: '项目实施',
          checked: true
        },
        {
          value: 'xmsj',
          label: '项目审计',
          checked: true
        },
        {
          value: 'jsyzjzf',
          label: '结算与资金支付',
          checked: true
        },
        {
          value: 'jsyzz',
          label: '决算与增资',
          checked: true
        },
        {
          value: 'xmgb',
          label: '项目关闭',
          checked: true
        }
      ],
      example: [],
      dataList: {
        month: new Date(),
        select: 0
      },
      searchShow: true,
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

    tableType() {
      if (this.value == 'jjb') {
        this.detailedTableJJb = true
      } else {
        this.detailedTableJJb = false
        this.detailedTable = this.value
      }
    },

    async loadData() {
      this.loading = true
      if (this.dataList.month) {
        const params = {
          qkjxmlxbms: [],
          qkjejdws: [],
          zyear: '',
          zmonth: '',
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
        if (this.dataList.month != '') {
          let time = new Date(this.dataList.month)
          let zyear = time.getFullYear()
          let zmonth = time.getMonth() + 1
          params.zyear = JSON.stringify(zyear)
          params.zmonth = JSON.stringify(zmonth)
        }
        await baseService.post('/process/process01/', params).then((res) => {
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
      } else {
        this.loading = false
        ElMessage({
          message: '请选择日期查询',
          iconClass: 'el-icon-search',
          customClass: 'tipsBox'
        })
      }
    },

    exportBtn() {
      this.loading = true
      if (this.dataList.month) {
        const params = {
          qkjxmlxbms: [],
          qkjejdws: [],
          zyear: '',
          zmonth: '',
          wd: this.dataList.select,
          specialorgid: this.specialorgid,
          show_type: ''
        }
        if (this.value == 'jjb') {
          params.show_type = 0
        } else if (this.value == true) {
          params.show_type = 1
        } else {
          params.show_type = 2
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
        if (this.dataList.month != '') {
          let time = new Date(this.dataList.month)
          let zyear = time.getFullYear()
          let zmonth = time.getMonth() + 1
          params.zyear = JSON.stringify(zyear)
          params.zmonth = JSON.stringify(zmonth)
        }
        baseService.export('/process/process01/export', params).then((res) => {
          this.loading = false
          const blob = res
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          dom.download = '预算全过程总览.xlsx'
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
        })
      } else {
        this.loading = false
        ElMessage({
          message: '请选择日期查询',
          iconClass: 'el-icon-search',
          customClass: 'tipsBox'
        })
      }
    },

    //查询按钮
    search() {
      this.loadData()
    },

    //重置按钮
    reset() {
      this.dataList.month = new Date()
      this.dataList.select = 0
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.detailedTable = false
      this.example = []
      this.loadData()
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
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
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
.browse {
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

  .el-switch__core {
    background-color: #ccc !important;
  }
}

:deep(.el-date-editor) {
  width: 100%;
}
</style>
