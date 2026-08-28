<template>
  <div class="accounts34 newStyle" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="operation">
      <div class="btnBox" @click="addNew">创建</div>
      <div class="btnBox">修改</div>
      <div class="btnBox">删除</div>
      <div class="btnBox">查看</div>
      <div class="btnBox">提交</div>
      <div class="btnBox">导入</div>
      <div class="btnBox">导 出</div>
      <div class="btnBox">流程图</div>
      <div class="btnBox">绑定辞条</div>
    </div>

    <div class="searchBox">
      <el-form label-width="110px" label-position="left">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="预算立项词条：">
              <el-input></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="省管部门：">
              <el-input></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="省管处室：">
              <el-input></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="审核流转状态：">
              <el-input></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="立项来源：">
              <el-input class="formWidth"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="一级单位：">
              <el-input class="formWidth"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="二级单位：">
              <el-input class="formWidth"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="归口部门：">
              <el-input class="formWidth"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="资金来源：">
              <el-input class="formWidth"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="储备编码：">
              <el-input class="formWidth"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目名称：">
              <el-input class="formWidth"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6" class="btnPostion">
            <el-button @click="search">搜索</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="tabBox" v-if="tabsType == '1'">
      <div class="tabBtn" @click="tabsChange('1')">本级申报储备项目</div>
      <div class="tabBtn1" @click="tabsChange('2')">下级上报储备项目</div>
    </div>
    <div class="tabBox1" v-else>
      <div class="tabBtn" @click="tabsChange('1')">本级申报储备项目</div>
      <div class="tabBtn1" @click="tabsChange('2')">下级上报储备项目</div>
    </div>
    <div class="tableBox">
      <div v-if="tabsType == '1'">
        <el-table
          v-if="tableHeight"
          :height="tableHeight"
          stripe
          border
          ref="multipleTable"
          :data="tableData"
          tooltip-effect="dark"
          style="width: 100%"
          :default-sort="{ prop: 'date', order: 'descending' }"
          :cell-style="{ 'text-align': 'center' }"
          :header-cell-style="{ 'text-align': 'center' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55"> </el-table-column>
          <el-table-column label="序号" type="index" width="60"> </el-table-column>
          <el-table-column label="预算立项辞条" width="280"> </el-table-column>
          <el-table-column label="省管部门" width="280"> </el-table-column>
          <el-table-column label="项目名称" width="280"> </el-table-column>
          <el-table-column label="储备编码" width="280"> </el-table-column>
          <el-table-column label="立项来源" width="280"> </el-table-column>
          <el-table-column label="资金来源" width="280"> </el-table-column>
          <el-table-column label="首次申报预算（不含税）/万元" width="280"> </el-table-column>
          <el-table-column label="一级单位" width="280"> </el-table-column>
          <el-table-column label="二级单位" width="280"> </el-table-column>
          <el-table-column label="市管部门" width="280"> </el-table-column>
          <el-table-column label="成本中心" width="280"> </el-table-column>
          <el-table-column label="是否草稿" width="280"> </el-table-column>
          <el-table-column label="智能审核状态" width="280"> </el-table-column>
          <el-table-column label="审核流转状态" width="280"> </el-table-column>
          <el-table-column label="流程环节" width="280"> </el-table-column>
          <el-table-column label="创建时间" width="280" sortable> </el-table-column>
          <el-table-column label="创建人" width="280"> </el-table-column>
        </el-table>
      </div>
      <div v-else>
        <el-table
          v-if="tableHeight"
          :height="tableHeight"
          stripe
          border
          ref="multipleTable"
          :data="tableData"
          tooltip-effect="dark"
          style="width: 100%"
          :default-sort="{ prop: 'date', order: 'descending' }"
          :cell-style="{ 'text-align': 'center' }"
          :header-cell-style="{ 'text-align': 'center' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55"> </el-table-column>
          <el-table-column label="序号" type="index" width="60"> </el-table-column>
          <el-table-column label="预算立项辞条" width="280"> </el-table-column>
          <el-table-column label="省管部门" width="280"> </el-table-column>
          <el-table-column label="项目名称" width="280"> </el-table-column>
          <el-table-column label="储备编码" width="280"> </el-table-column>
          <el-table-column label="立项来源" width="280"> </el-table-column>
          <el-table-column label="资金来源" width="280"> </el-table-column>
          <el-table-column label="首次申报预算（不含税）/万元" width="280"> </el-table-column>
          <el-table-column label="一级单位" width="280"> </el-table-column>
          <el-table-column label="二级单位" width="280"> </el-table-column>
          <el-table-column label="市管部门" width="280"> </el-table-column>
          <el-table-column label="成本中心" width="280"> </el-table-column>
          <el-table-column label="是否草稿" width="280"> </el-table-column>
          <el-table-column label="智能审核状态" width="280"> </el-table-column>
          <el-table-column label="审核流转状态" width="280"> </el-table-column>
          <el-table-column label="流程环节" width="280"> </el-table-column>
          <el-table-column label="创建时间" width="280" sortable> </el-table-column>
          <el-table-column label="创建人" width="280"> </el-table-column>
        </el-table>
      </div>
    </div>
    <el-pagination
      :current-page="page.current"
      background
      align="center"
      :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
    </el-pagination>

    <el-dialog v-model="addDia" fullscreen="true" custom-class="attribute" @opened="openHeight" @closed="closeList" :title="title" width="60%">
      <div class="searchBox">
        <el-form :inline="true" label-width="110px" label-position="left">
          <el-row>
            <el-col :span="8">
              <el-form-item label="预算立项词条：">
                <el-input></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="辞条唯一码：">
                <el-input></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="项目类型：">
                <el-input></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="省管部门：">
                <el-input></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="省管处室：">
                <el-input></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-button type="warning">搜索</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <el-table
        border
        stripe
        ref="multipleTable"
        v-if="bodyHeight"
        :height="bodyHeight"
        :data="tableData"
        tooltip-effect="dark"
        style="width: 100%"
        :default-sort="{ prop: 'date', order: 'descending' }"
        :cell-style="{ 'text-align': 'center' }"
        :header-cell-style="{ 'text-align': 'center' }"
        @selection-change="addNewHandleSelectionChange"
      >
        <el-table-column type="selection" width="55"> </el-table-column>
        <el-table-column label="预算立项辞条" width="280"> </el-table-column>
        <el-table-column label="省管部门" width="280"> </el-table-column>
        <el-table-column label="项目名称" width="280"> </el-table-column>
        <el-table-column label="储备编码" width="280"> </el-table-column>
        <el-table-column label="立项来源" width="280"> </el-table-column>
        <el-table-column label="资金来源" width="280"> </el-table-column>
        <el-table-column label="首次申报预算（不含税）/万元" width="280"> </el-table-column>
        <el-table-column label="一级单位" width="280"> </el-table-column>
        <el-table-column label="二级单位" width="280"> </el-table-column>
        <el-table-column label="市管部门" width="280"> </el-table-column>
        <el-table-column label="成本中心" width="280"> </el-table-column>
        <el-table-column label="是否草稿" width="280"> </el-table-column>
        <el-table-column label="智能审核状态" width="280"> </el-table-column>
        <el-table-column label="审核流转状态" width="280"> </el-table-column>
        <el-table-column label="流程环节" width="280"> </el-table-column>
        <el-table-column label="创建时间" width="280" sortable> </el-table-column>
        <el-table-column label="创建人" width="280"> </el-table-column>
      </el-table>
      <el-pagination
        :current-page="addnewPage.current"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="addnewHandleSizeChange"
        @current-change="addnewHandleCurrentChange"
      >
      </el-pagination>
      <div class="btnBox">
        <el-button @click="ctqr" class="qdBtn">确定</el-button>
        <el-button @click="addDia = false">关闭</el-button>
      </div>
    </el-dialog>
    <el-dialog v-model="cblrDia" title="储备录入" fullscreen="true" width="100%" custom-class="technological">
      <div class="lcBtn">
        <div class="btnBox" v-if="buttonState == '基本信息'" @click="changebtn('基本信息')">基本信息</div>
        <div class="btnBoxTwo" v-else @click="changebtn('基本信息')">基本信息</div>
        <div class="btnBox" v-if="buttonState == '预算申报'" @click="changebtn('预算申报')">预算申报</div>
        <div class="btnBoxTwo" v-else @click="changebtn('预算申报')">预算申报</div>
        <div class="btnBox" v-if="buttonState == '附件信息'" @click="changebtn('附件信息')">附件信息</div>
        <div class="btnBoxTwo" v-else @click="changebtn('附件信息')">附件信息</div>
        <div class="btnBox" v-if="buttonState == '智能审核'" @click="changebtn('智能审核')">智能审核</div>
        <div class="btnBoxTwo" v-else @click="changebtn('智能审核')">智能审核</div>
        <div class="btnBox" v-if="buttonState == '流程履历'" @click="changebtn('流程履历')">流程履历</div>
        <div class="btnBoxTwo" v-else @click="changebtn('流程履历')">流程履历</div>
      </div>
      <div v-if="buttonState == '基本信息'">
        <div class="formBox">
          <div>
            <div class="formLattice">
              <el-form label-width="120px" label-position="left">
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="生成时间">
                      <div class="formInputBox">
                        <el-input></el-input>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>

            <div class="titleLattice">基本信息</div>

            <div class="formLattice">
              <el-form label-width="120px" label-position="left">
                <el-row>
                  <el-col v-for="(item, i) in this.essentialInformation" :key="i" :span="item.span">
                    <el-form-item :label="item.name" v-if="item.inputType == '1'">
                      <div class="formInputBox">
                        <el-input v-model="formValue[item.columnName]"></el-input>
                      </div>
                    </el-form-item>
                    <el-form-item :label="item.name" v-if="item.inputType == '3'">
                      <el-select
                        v-model="formValue[item.columnName]"
                        filterable
                        :clearable="true"
                        placeholder="请选择"
                        @change="linkage(item.name, formValue[item.columnName])"
                      >
                        <el-option v-for="item in item.options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item :label="item.name" v-if="item.inputType == '8'">
                      <el-input v-model="formValue[item.columnName]" type="textarea" :rows="8"> </el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
            <div class="titleLattice">专业管理</div>
            <div class="formLattice">
              <el-form label-width="120px" label-position="left">
                <el-row>
                  <el-col v-for="(item, i) in this.professionalManagement" :key="i" :span="item.span">
                    <el-form-item :label="item.name" v-if="item.inputType == '1'">
                      <div class="formInputBox">
                        <el-input v-model="formValue[item.columnName]"></el-input>
                      </div>
                    </el-form-item>
                    <el-form-item :label="item.name" v-if="item.inputType == '3'">
                      <el-select v-model="formValue[item.columnName]" placeholder="请选择">
                        <el-option v-for="item in item.options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item :label="item.name" v-if="item.inputType == '8'">
                      <el-input v-model="formValue[item.columnName]" type="textarea" :rows="8"> </el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </div>
        </div>
        <div class="bottomBtnBox">
          <el-button class="btnStyle">保存</el-button>
          <el-button class="btnStyle">暂存</el-button>
          <el-button>关闭</el-button>
        </div>
      </div>
      <div v-if="buttonState == '预算申报'">
        <div class="formBox" style="padding-bottom: 250px">
          <div>
            <div class="formLattice">
              <el-form label-width="120px" label-position="left">
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="预算申报总金额">
                      <div class="formInputBox">
                        <el-input></el-input>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="工作内容">
                      <el-input type="textarea" placeholder="最多不超过200个字" :rows="20"> </el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </div>
        </div>
        <div class="bottomBtnBox">
          <el-button class="btnStyle">保存</el-button>
          <el-button class="btnStyle">暂存</el-button>
          <el-button>关闭</el-button>
        </div>
      </div>
      <div v-if="buttonState == '附件信息'">
        <div class="formBox">
          <div>
            <div class="formLattice">
              <el-form label-width="180px" label-position="left">
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="预算申报总金额/(万元)">
                      <div class="formInputBox">
                        <el-input></el-input>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="初次批复文号">
                      <div class="formInputBox">
                        <el-input></el-input>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="国网批复文号">
                      <div class="formInputBox">
                        <el-input></el-input>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="批准概算文号">
                      <div class="formInputBox">
                        <el-input></el-input>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="开工批准文号">
                      <div class="formInputBox">
                        <el-input></el-input>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
            <div class="titleLattice">可研报告/项目建议书</div>
            <el-table
              height="200px"
              stripe
              border
              ref="multipleTable"
              :data="tableData"
              tooltip-effect="dark"
              style="width: 100%"
              :default-sort="{ prop: 'date', order: 'descending' }"
              :cell-style="{ 'text-align': 'center' }"
              :header-cell-style="{ 'text-align': 'center' }"
            >
              <el-table-column label="序号" type="index"> </el-table-column>
              <el-table-column label="附件名称"> </el-table-column>
              <el-table-column label="删除" width="100">
                <template #default="scope">
                  <div style="width: 100%">
                    <div class="deleteBtn"></div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <div class="titleLattice">(可研)评审意见</div>
            <el-table
              height="200px"
              stripe
              border
              ref="multipleTable"
              :data="tableData"
              tooltip-effect="dark"
              style="width: 100%"
              :default-sort="{ prop: 'date', order: 'descending' }"
              :cell-style="{ 'text-align': 'center' }"
              :header-cell-style="{ 'text-align': 'center' }"
            >
              <el-table-column label="序号" type="index"> </el-table-column>
              <el-table-column label="附件名称"> </el-table-column>
              <el-table-column label="删除" width="100">
                <template #default="scope">
                  <div style="width: 100%">
                    <div class="deleteBtn"></div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <div class="titleLattice">(可研)批复意见</div>
            <el-table
              height="200px"
              stripe
              border
              ref="multipleTable"
              :data="tableData"
              tooltip-effect="dark"
              style="width: 100%"
              :default-sort="{ prop: 'date', order: 'descending' }"
              :cell-style="{ 'text-align': 'center' }"
              :header-cell-style="{ 'text-align': 'center' }"
            >
              <el-table-column label="序号" type="index"> </el-table-column>
              <el-table-column label="附件名称"> </el-table-column>
              <el-table-column label="删除" width="100">
                <template #default="scope">
                  <div style="width: 100%">
                    <div class="deleteBtn"></div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <div class="bottomBtnBox">
          <el-button class="btnStyle">保存</el-button>
          <el-button class="btnStyle">暂存</el-button>
          <el-button>上传附件</el-button>
          <el-button>关闭</el-button>
        </div>
      </div>
      <div v-if="buttonState == '智能审核'">
        <div class="formBox">
          <div class="titleLattice">智能审核信息</div>
          <div class="formLattice">
            <el-form label-width="180px" label-position="left">
              <el-row>
                <el-col :span="12">
                  <el-form-item label="资本化日期">
                    <div class="formInputBox">
                      <el-input></el-input>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="资产原值">
                    <div class="formInputBox">
                      <el-input></el-input>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="设备编号">
                    <div class="formInputBox">
                      <el-input></el-input>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="设备名称">
                    <div class="formInputBox">
                      <el-input></el-input>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="项目内容">
                    <div class="formInputBox">
                      <el-input></el-input>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="资产编号">
                    <div class="formInputBox">
                      <el-input></el-input>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="实施内容">
                    <div class="formInputBox">
                      <el-input></el-input>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="资产名称">
                    <div class="formInputBox">
                      <el-input></el-input>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="申报预算（万元）">
                    <div class="formInputBox">
                      <el-input></el-input>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
          <div class="titleLattice">智能审核结果</div>

          <div class="znshBtnBox">
            <el-button>
              <div class="see">
                <img src="@/assets/comprehensive/see.png" alt="" />
                查看
              </div>
            </el-button>
            <el-button>
              <div class="see">
                <img src="@/assets/comprehensive/exp.png" alt="" />
                导出
              </div>
            </el-button>
          </div>
          <el-table
            height="200px"
            stripe
            border
            ref="multipleTable"
            :data="tableData"
            tooltip-effect="dark"
            style="width: 100%"
            :default-sort="{ prop: 'date', order: 'descending' }"
            :cell-style="{ 'text-align': 'center' }"
            :header-cell-style="{ 'text-align': 'center' }"
          >
            <el-table-column type="selection" width="55"> </el-table-column>
            <el-table-column label="序号" type="index" width="55"> </el-table-column>
            <el-table-column label="审核类型"> </el-table-column>
            <el-table-column label="规则名称"> </el-table-column>
            <el-table-column label="审核结果"> </el-table-column>
          </el-table>

          <div class="titleLattice">智能审核结果确认</div>
          <div class="textAreaBox">
            <el-input type="textarea" :rows="6"></el-input>
            <div class="twoBox">
              <el-button style="margin-right: 50px">智能审核</el-button>
              <el-button>结果确认</el-button>
            </div>
          </div>
        </div>
        <div class="bottomBtnBox">
          <el-button class="btnStyle">保存</el-button>
          <el-button class="btnStyle">暂存</el-button>
          <el-button>关闭</el-button>
        </div>
      </div>
      <div v-if="buttonState == '流程履历'">
        <div class="formBox">
          <el-table
            height="200px"
            stripe
            border
            ref="multipleTable"
            :data="tableData"
            tooltip-effect="dark"
            style="width: 100%"
            :default-sort="{ prop: 'date', order: 'descending' }"
            :cell-style="{ 'text-align': 'center' }"
            :header-cell-style="{ 'text-align': 'center' }"
          >
            <el-table-column type="selection" width="55"> </el-table-column>
            <el-table-column label="操作流程"> </el-table-column>
            <el-table-column label="步骤流程"> </el-table-column>
            <el-table-column label="审批时间"> </el-table-column>
            <el-table-column label="处理部门"> </el-table-column>
            <el-table-column label="处理人"> </el-table-column>
            <el-table-column label="审批结果"> </el-table-column>
            <el-table-column label="审批意见"> </el-table-column>
          </el-table>
        </div>
        <div class="bottomBtnBox">
          <el-button class="btnStyle">保存</el-button>
          <el-button class="btnStyle">暂存</el-button>
          <el-button>关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>

  <!-- <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog> -->
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import Centralized from '@/components/select/Centralized.vue'
import { showHelpMsg } from '@/utils/message'

export default defineComponent({
  name: '/budget-process/process-34',
  components: {
    userDialog,
    Centralized
  },
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
      userCode: '',
      userId: '',
      specialorgid: '',
      heightNum: '',
      btnHeight: '',
      searchHeight: '',
      tabsHeight: '',
      tableHeight: '',
      tabsType: '1',

      tableData: [],
      multipleSelection: [],
      //分页
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },

      addDia: false,
      addNewMultipleSelection: [],
      bodyHeight: '',
      title: '',
      //创建分页
      addnewPage: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },

      cblrDia: false,
      buttonState: '基本信息',
      formValue: {},
      essentialInformation: [],
      professionalManagement: [],

      ruleForm: {
        title: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入活动名称', trigger: 'blur' },
          { min: 3, max: 5, message: '长度在 3 到 5 个字符', trigger: 'blur' }
        ]
      },
      upShow: false
    })
  },

  mounted() {
    // this.loading = false;
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.btnHeight = document.querySelector('.operation').clientHeight
    this.searchHeight = document.querySelector('.searchBox').clientHeight
    this.tabsHeight = document.querySelector('.tabBox').clientHeight
    this.setTableHeight()
  },

  methods: {
    loadData() {
      const params = {}
      baseService.post('/cblrjsh/getTabColumns', params).then((res) => {
        console.log(res)
      })
    },
    //搜索按钮
    search() {
      this.loadData()
    },

    //表格tabs切换
    tabsChange(val) {
      this.tabsType = val
    },
    //设置表格高度
    setTableHeight() {
      this.tableHeight = this.heightNum - this.btnHeight - this.searchHeight - 90 + 'px'
    },

    //表格复选框
    handleSelectionChange(val) {
      this.multipleSelection = val
    },

    //分页
    handleSizeChange(val) {
      console.log(`每页 ${val} 条`)
    },
    //分页
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`)
    },

    showBtn(val) {
      if (val.props.label == '附件信息') {
        this.upShow = true
      } else {
        this.upShow = false
      }
    },
    //创建
    addNew() {
      this.addDia = true
      this.title = '预算立项辞条选择'
    },

    //创建后获取dialog的body高度
    openHeight() {
      let height = document.querySelector('.attribute').clientHeight
      let title = document.querySelector('.el-dialog__header').clientHeight
      this.bodyHeight = height - title - 160 + 'px'
    },
    //创建dialog关闭后清除数据
    closeList() {
      this.addNewMultipleSelection = []
    },
    //创建dialog表格复选框
    addNewHandleSelectionChange(val) {
      this.addNewMultipleSelection = val
    },
    //分页
    addnewHandleSizeChange(val) {
      console.log(`每页 ${val} 条`)
      width = '100'
    },
    //分页
    addnewHandleCurrentChange(val) {
      console.log(`当前页: ${val}`)
    },
    //创建选择辞条确认
    ctqr() {
      if (this.addNewMultipleSelection.length == 0) {
        ElMessage({
          type: 'info',
          message: '请选择一条数据'
        })
      } else if (this.addNewMultipleSelection.length > 1) {
        ElMessage({
          type: 'info',
          message: '请选择一条数据'
        })
      } else {
        this.cblrDia = true
        let length = 0
        const params = { opType: 'add', projectType: '0', entryId: '97823', ctlx: '1', xmlxId: '43424558' }
        baseService.post('/cblrjsh/getTabColumns', params).then((res) => {
          res.data.data.item.forEach((item) => {
            if (item.inputType == '8') {
              item.span = 24
            } else if (item.inputType == '3') {
              if (item.name == '一级单位') {
                baseService.get(`/commonQmys/getDwComCode?code=YJDW&orgId=20000442308`).then((row) => {
                  if (res.success) {
                    row.data.forEach((val) => {
                      val.value = val.yjdwCode
                      val.label = val.yjdwName
                    })
                    item.options = row.data
                  } else {
                    ElMessage({
                      type: 'info',
                      message: `获取${item.name}失败`
                    })
                  }
                })
              } else if (item.name == '资产性质') {
                baseService.get(`/commonQmys/getDictData?comCode=ZCXZ`).then((row) => {
                  if (res.success) {
                    row.data.forEach((val) => {
                      val.value = val.code
                      val.label = val.name
                    })
                    item.options = row.data
                  } else {
                    ElMessage({
                      type: 'info',
                      message: `获取${item.name}失败`
                    })
                  }
                })
              } else if (item.name == '实施部门') {
                baseService.get(`/commonQmys/getDictData?comCode=GKBM`).then((row) => {
                  if (res.success) {
                    row.data.forEach((val) => {
                      val.value = val.code
                      val.label = val.name
                    })
                    item.options = row.data
                  } else {
                    ElMessage({
                      type: 'info',
                      message: `获取${item.name}失败`
                    })
                  }
                })
              } else if (item.name == '电压等级') {
                baseService.get(`/commonQmys/getDydj?sjfl=${res.data.info.sjfl}`).then((row) => {
                  if (res.success) {
                    row.data.forEach((val) => {
                      val.value = val.code
                      val.label = val.name
                    })
                    item.options = row.data
                  } else {
                    ElMessage({
                      type: 'info',
                      message: `获取${item.name}失败`
                    })
                  }
                })
              } else if (item.name == '线路类型') {
                baseService.get(`/commonQmys/judgeSthBySJFL?sjfl=${res.data.info.sjfl}`).then((row) => {
                  if (row.success) {
                    if (row.data.xllxIsRequired) {
                      console.log('展示')
                    } else {
                      for (let i = 0; i < this.essentialInformation.length; i++) {
                        if (this.essentialInformation[i].name == item.name) {
                          this.essentialInformation.splice(i, 1)
                        }
                      }
                    }
                  } else {
                    ElMessage({
                      type: 'info',
                      message: `获取${item.name}失败`
                    })
                  }
                })
              } else if (item.name == '省管部门') {
                baseService.get(`/commonQmys/getSGBM?code=`).then((row) => {
                  if (res.success) {
                    row.data.forEach((val) => {
                      val.value = val.code
                      val.label = val.name
                    })
                    item.options = row.data
                  } else {
                    ElMessage({
                      type: 'info',
                      message: `获取${item.name}失败`
                    })
                  }
                })
              } else if (item.name == '是否调度端项目') {
                let array = [
                  {
                    value: '0',
                    label: '否'
                  },
                  {
                    value: '1',
                    label: '是'
                  }
                ]
                item.options = array
              } else if (item.name == '是否研发投入') {
                let array = [
                  {
                    value: '0',
                    label: '否'
                  },
                  {
                    value: '1',
                    label: '是'
                  }
                ]
                item.options = array
              }

              item.span = 12
            } else {
              item.span = 12
            }
          })
          this.formValue = res.data.info
          for (let i = 0; i < res.data.data.item.length; i++) {
            if (res.data.data.item[i].name == '实施内容') {
              length = i + 1
            }
          }
          for (let i = 0; i < length; i++) {
            this.essentialInformation.push(res.data.data.item[i])
          }
          for (let i = length; i < res.data.data.item.length; i++) {
            this.professionalManagement.push(res.data.data.item[i])
          }
        })
      }
    },
    //基本信息联动获取数据
    linkage(name, code) {
      if (name == '一级单位') {
        //二级单位
        baseService.get(`/commonQmys/getDwComCode?code=EJDW&orgId=20000442308`).then((res) => {
          if (res.success) {
            res.data.forEach((item) => {
              item.value = item.ejdwCode
              item.label = item.ejdwName
            })
            this.essentialInformation.forEach((item) => {
              if (item.name == '二级单位') {
                item.options = res.data
              }
            })
            this.professionalManagement.forEach((item) => {
              if (item.name == '二级单位') {
                item.options = res.data
              }
            })
          } else {
            ElMessage({
              type: 'info',
              message: `获取二级单位失败`
            })
          }
        })

        //市管部门
        baseService.get(`/commonQmys/getCbzxDepts?spOrgId=${code}`).then((res) => {
          if (res.success) {
            res.data.forEach((item) => {
              item.value = item.code
              item.label = item.name
            })
            this.essentialInformation.forEach((item) => {
              if (item.name == '市管部门') {
                item.options = res.data
              }
            })
            this.professionalManagement.forEach((item) => {
              if (item.name == '市管部门') {
                item.options = res.data
              }
            })
          } else {
            ElMessage({
              type: 'info',
              message: `获取市管部门失败`
            })
          }
        })
      } else if (name == '二级单位') {
        //利润中心
        baseService.get(`/commonQmys/getProfitCenter?spOrgId=${code}`).then((res) => {
          if (res.success) {
            res.data.forEach((item) => {
              item.value = item.code
              item.label = item.name
            })
            this.essentialInformation.forEach((item) => {
              if (item.name == '利润中心') {
                item.options = res.data
              }
            })
            this.professionalManagement.forEach((item) => {
              if (item.name == '利润中心') {
                item.options = res.data
              }
            })
          } else {
            ElMessage({
              type: 'info',
              message: `获取利润中心失败`
            })
          }
        })
      } else if (name == '利润中心') {
        //成本中心
        baseService.get(`/commonQmys/getApplyCenterByProfitCenter?code=${code}`).then((res) => {
          if (res.success) {
            res.data.forEach((item) => {
              item.value = item.code
              item.label = item.name
            })
            this.essentialInformation.forEach((item) => {
              if (item.name == '成本中心') {
                item.options = res.data
              }
            })
            this.professionalManagement.forEach((item) => {
              if (item.name == '成本中心') {
                item.options = res.data
              }
            })
          } else {
            ElMessage({
              type: 'info',
              message: `获取成本中心失败`
            })
          }
        })
      } else if (name == '成本中心') {
        //归口部门
        baseService.get(`/commonQmys/getGKBMByApplyCenter?applyCenterValue=${code}`).then((res) => {
          if (res.success) {
            res.data.forEach((item) => {
              item.value = item.code
              item.label = item.name
            })
            this.essentialInformation.forEach((item) => {
              if (item.name == '归口部门') {
                item.options = res.data
              }
            })
            this.professionalManagement.forEach((item) => {
              if (item.name == '归口部门') {
                item.options = res.data
              }
            })
          } else {
            ElMessage({
              type: 'info',
              message: `获取归口部门失败`
            })
          }
        })
      } else if (name == '省管部门') {
        //省管处室
        baseService.get(`/commonQmys/getSGBM?code=${code}`).then((res) => {
          if (res.success) {
            res.data.forEach((item) => {
              item.value = item.code
              item.label = item.name
            })
            this.essentialInformation.forEach((item) => {
              if (item.name == '省管处室') {
                item.options = res.data
              }
            })
            this.professionalManagement.forEach((item) => {
              if (item.name == '省管处室') {
                item.options = res.data
              }
            })
            console.log(this.essentialInformation)
            console.log(this.professionalManagement)
          } else {
            ElMessage({
              type: 'info',
              message: `获取省管处室失败`
            })
          }
        })
      }
    },
    //流程按钮切换
    changebtn(val) {
      this.buttonState = val
    }
  }
})
</script>

<style lang="less" scoped>
.accounts34 {
  padding: 10px;

  .operation {
    display: flex;

    .btnBox {
      width: 110px;
      height: 50px;
      background-image: url('@/assets/comprehensive/Unchecked.png');
      background-repeat: no-repeat;
      margin: 0 2px;
      text-align: center;
      line-height: 35px;
      color: #fff;
      font-weight: 500;
      cursor: pointer;
    }
  }

  .searchBox {
    .el-button {
      background: #509b99;
      border: 1px solid #509b99;
      color: #fff;
    }
  }

  .tabBox {
    display: flex;

    .tabBtn {
      width: 160px;
      height: 26px;
      background-image: url('@/assets/comprehensive/tabTrue.jpg');
      background-repeat: no-repeat;
      text-align: center;
      line-height: 26px;
      font-weight: 500;
      color: #fff;
      cursor: pointer;
    }

    .tabBtn1 {
      width: 160px;
      height: 26px;
      background-image: url('@/assets/comprehensive/tabFalse.jpg');
      background-repeat: no-repeat;
      text-align: center;
      line-height: 26px;
      font-weight: 500;
      color: black;
      cursor: pointer;
    }
  }

  .tabBox1 {
    display: flex;

    .tabBtn {
      width: 160px;
      height: 26px;
      background-image: url('@/assets/comprehensive/tabFalse.jpg');
      background-repeat: no-repeat;
      text-align: center;
      line-height: 26px;
      font-weight: 500;
      color: black;
      cursor: pointer;
    }

    .tabBtn1 {
      width: 160px;
      height: 26px;
      background-image: url('@/assets/comprehensive/tabTrue.jpg');
      background-repeat: no-repeat;
      text-align: center;
      line-height: 26px;
      font-weight: 500;
      color: #fff;
      cursor: pointer;
    }
  }

  .tableBox {
    width: 100%;
    margin-top: 10px;
  }
}

.attribute {
  .el-dialog__header {
    background-color: rgb(241, 241, 241);
    height: 56px;
  }

  .el-dialog__title {
    color: rgb(44, 44, 44) !important;
    font-weight: 700;
  }

  .el-pagination {
    float: left;
  }

  .btnBox {
    float: right;
    padding: 2px 5px;
    margin-top: 10px;

    .qdBtn {
      background: #509b99;
      border: 1px solid #509b99;
      color: #fff;
    }
  }

  .searchBox {
    width: 100%;
    margin-top: 10px;
  }
}

.technological {
  .el-dialog__header {
    background-color: rgb(241, 241, 241);
    height: 56px;
  }

  .el-dialog__title {
    color: rgb(44, 44, 44) !important;
    font-weight: 700;
  }

  .lcBtn {
    display: flex;
    margin-top: 10px;

    .btnBox {
      width: 110px;
      background-image: url('@/assets/comprehensive/checked.png');
      background-repeat: no-repeat;
      margin: 0 2px;
      text-align: center;
      line-height: 35px;
      color: #fff;
      font-weight: 500;
      cursor: pointer;
    }

    .btnBoxTwo {
      width: 110px;
      background-image: url('@/assets/comprehensive/Unchecked.png');
      background-repeat: no-repeat;
      margin: 0 2px;
      text-align: center;
      line-height: 35px;
      color: #fff;
      font-weight: 500;
      cursor: pointer;
    }
  }

  .bottomBtnBox {
    padding: 10px 0;
    margin-left: 80%;

    .btnStyle {
      background: #509b99;
      border: 1px solid #509b99;
      color: #fff;
    }
  }

  .formBox {
    width: 100%;
    background-color: #f7f7f7;

    .deleteBtn {
      width: 25px;
      height: 25px;
      background-image: url('@/assets/comprehensive/delete.png');
      background-repeat: no-repeat;
      cursor: pointer;
      margin: auto;
    }

    .el-select--small {
      width: 60%;
    }

    .formLattice {
      padding-left: 20px;
      padding-top: 10px;

      .el-textarea {
        width: 82%;
      }

      .formInputBox {
        .el-input--small .el-input__inner {
          width: 60%;
        }
      }
    }

    .titleLattice {
      width: 100%;
      height: 30px;
      background-color: #a3c9c8;
      font-size: 14px;
      font-weight: 700;
      color: #38475c;
      line-height: 30px;
      padding-left: 20px;
    }

    .znshBtnBox {
      width: 200px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;

      .el-button {
        border: none;

        .see {
          img {
            margin-right: 5px;
            width: 12px;
            height: 12px;
          }

          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 12px;
          font-weight: 700;
        }
      }
    }

    .textAreaBox {
      width: 90%;
      margin: 10px auto;
      padding: 20px 0;

      .twoBox {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 20px;

        .el-button {
          border-color: #509d9d;
          color: #509b99;
          font-size: 15px;
          font-weight: 700;
        }
      }
    }
  }
}
</style>
