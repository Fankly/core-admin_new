<template>
  <div class="accounts33 newStyle" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="operation">
      <div class="btnBox" @click="newly">新建</div>
      <div class="btnBox" @click="translate">编辑</div>
      <div class="btnBox" @click="removeBtn">删除</div>
      <div class="btnBox" @click="attribute">属性明细</div>
      <div class="btnBox" @click="enable">启用</div>
      <div class="btnBox" @click="deactivate">停用</div>
      <div class="btnBox" @click="copy">复制</div>
    </div>
    <div class="btmBox">
      <div class="openBox" v-show="!display" @click="close">
        <img src="../../assets/comprehensive/right.png" alt="" />
      </div>
      <div class="treeBox" v-show="display">
        <div class="titleBox">
          <span>项目类别树</span>
          <img @click="close" src="../../assets/comprehensive/left.png" alt="" />
        </div>
        <proTypeTree ref="tree"></proTypeTree>
      </div>
      <div class="tableBox" :style="`width:${tableWidth}%`">
        <div class="searchBox">
          <div class="formBox">
            <el-form label-width="110px" label-position="left">
              <el-row :gutter="24">
                <el-col :span="6">
                  <el-form-item label="模板名称：">
                    <el-input class="formWidth" v-model="templateName"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="启用/停用">
                    <el-select class="formWidth" v-model="value" clearable placeholder="请选择">
                      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6"></el-col>
                <el-col :span="6" class="btnPostion">
                  <el-button @click="searchBtn">搜索</el-button>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <div class="lieBox">
            <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
              <span class="el-dropdown-link">
                <el-icon class="el-icon-s-operation">
                  <arrow-down />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="item in segment" :key="item.value">
                    <el-checkbox style="margin-right: 10px" v-model="item.checked"
                      @change="listShow(item.value, item.checked)"></el-checkbox>
                    {{ item.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <div class="tableBox1">
          <el-table v-if="tableHeight" :height="tableHeight" stripe border ref="multipleTable" :data="tableData"
            tooltip-effect="dark" :default-sort="{ prop: 'date', order: 'descending' }"
            :cell-style="{ 'text-align': 'center' }" :header-cell-style="{ 'text-align': 'center' }"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55"> </el-table-column>
            <el-table-column label="ID" prop="id" width="120" v-if="columnObj.id"> </el-table-column>
            <el-table-column label="模板编码" prop="code" width="280" v-if="columnObj.mbbm"> </el-table-column>
            <el-table-column label="模板名称" prop="name" width="280" v-if="columnObj.mbmc"> </el-table-column>
            <el-table-column label="项目类型" prop="xmlx" width="280" v-if="columnObj.xmlx"> </el-table-column>
            <el-table-column label="项目类型ID" prop="xmlxId" width="120" v-if="columnObj.xmlxid"> </el-table-column>
            <el-table-column label="更新时间" prop="updateTime" width="280" v-if="columnObj.gxsj"> </el-table-column>
            <el-table-column label="模板启用状态" width="280" v-if="columnObj.mbqyzt">
              <template #default="scope">
                <div v-if="scope.row.state == '1'">启用</div>
                <div v-else>停用</div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
    <el-pagination :current-page="page.current" background align="center" :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit" :total="parseInt(page.total + '')" layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange" @current-change="handleCurrentChange">
    </el-pagination>
  </div>

  <el-dialog v-model="newlyDia" custom-class="attributeDia" :title="disTtile" width="50%">
    <div style="height: 400px; margin-top: 10px; padding: 10px; background-color: rgb(241, 241, 241)">
      <el-form :inline="true" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="模板名称：">
              <el-input v-model="modelName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类型：">
              <el-select class="el-input-search" v-model="projectName">
                <el-option disabled style="height: auto; background-color: #fff" class="noDisabledCursor">
                  <proTypeTree @getName="getName" ref="tree2"></proTypeTree>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button class="el-newlyDia" @click="newSave">保存</el-button>
        <el-button @click="newlyDia = false"> 关闭 </el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-model="attributeDia" custom-class="attributeDia" @close="closeTableDialog" title="属性维护" width="80%">
    <div class="dialogHeight">
      <el-form>
        <el-row>
          <el-col :span="23">
            <el-button icon="el-icon-platform-eleme" @click="addition('insert')">新增</el-button>
            <el-button icon="el-icon-eleme" @click="save">保存</el-button>
            <el-button icon="el-icon-delete-solid" @click="deletntion('delete')">删除</el-button>
          </el-col>
          <el-col :span="1">
            <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
              <span class="el-dropdown-link">
                <el-icon class="el-icon-s-operation">
                  <arrow-down />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="item in columnObjDia" :key="item.value">
                    <el-checkbox style="margin-right: 10px" v-model="item.checked"
                      @change="listShowDia(item.value, item.checked)"></el-checkbox>
                    {{ item.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-col>
        </el-row>
      </el-form>
      <div class="tHeight">
        <el-table ref="table" border stripe associate-table :data="tableDataDia" height="550px" tooltip-effect="dark"
          style="width: 100%" :default-sort="{ prop: 'date', order: 'descending' }"
          :cell-style="{ 'text-align': 'center' }" :header-cell-style="{ 'text-align': 'center' }"
          @selection-change="handleSelectionChangeDia">
          <el-table-column type="selection" width="55"> </el-table-column>
          <el-table-column label="ID" prop="id" width="120" v-if="columnObjDia.id"> </el-table-column>
          <el-table-column label="序号" type="index" width="55"> </el-table-column>
          <el-table-column label="字段名称" width="280" v-if="columnObjDia.zdmc">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.name"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="字段编码" width="280" v-if="columnObjDia.zdbm">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.columnName"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="字段类型" width="280" v-if="columnObjDia.zdlx">
            <template #default="scope">
              <el-select @change="editTion('update', scope.row)" v-model="scope.row.columnType">
                <el-option v-for="item in zdlx" :key="item.code" :label="item.name" :value="item.code"> </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="控件类型" width="280" v-if="columnObjDia.kjlx">
            <template #default="scope">
              <el-select @change="editTion('update', scope.row)" v-model="scope.row.inputType">
                <el-option v-for="item in kjlx" :key="item.code" :label="item.name" :value="item.code"> </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="公共代码" width="280" v-if="columnObjDia.ggdm">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.commonCode"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="调用方法" width="280" v-if="columnObjDia.dyff">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.jsCode"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="是否必填" width="280" v-if="columnObjDia.sfbt">
            <template #default="scope">
              <el-select @change="editTion('update', scope.row)" v-model="scope.row.isRequired">
                <el-option v-for="item in sf" :key="item.code" :label="item.name" :value="item.code"> </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="TABID" width="280" v-if="columnObjDia.tabid">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.tabid"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="对应表名" width="280" v-if="columnObjDia.dybm">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.tableName"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="是否只读" width="280" v-if="columnObjDia.sfzd">
            <template #default="scope">
              <el-select @change="editTion('update', scope.row)" v-model="scope.row.isVisble">
                <el-option v-for="item in sf" :key="item.code" :label="item.name" :value="item.code"> </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="是否列表显示" width="280" v-if="columnObjDia.sflbxs">
            <template #default="scope">
              <el-select @change="editTion('update', scope.row)" v-model="scope.row.isGrid">
                <el-option v-for="item in sf" :key="item.code" :label="item.name" :value="item.code"> </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="排序（按照输入数字排序）" width="280" v-if="columnObjDia.px">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.plsx"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="默认值" width="280" v-if="columnObjDia.mez">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.defvalue"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="父子段编码" width="280" v-if="columnObjDia.fzdbm">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.parentColumn"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="宽度" width="280" v-if="columnObjDia.kd">
            <template #default="scope">
              <el-input @change="editTion('update', scope.row)" style="text-align: center"
                v-model="scope.row.width"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="TEMPLATE_ID" prop="templateId" width="280" v-if="columnObjDia.template_id">
          </el-table-column>
        </el-table>
      </div>
    </div>
  </el-dialog>
  <!-- <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog> -->
</template>

<script>
import { defineComponent, reactive } from "vue";
import baseService from "@/service/baseService";
import userDialog from "@/components/select/userDialog.vue";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";
import projectType from "@/components/select/projectType.vue";
import proTypeTree from "@/components/select/proTypeTree.vue";
import { showHelpMsg } from "@/utils/message"

export default defineComponent({
  name: "/budget-process/process-33",
  components: {
    userDialog,
    projectType,
    proTypeTree
  },
  setup () {
    const store = useStore();
    const helpHandle = () => {
      const url = store.getters.getMenuMsg.url;
      showHelpMsg(url);
    }
    return reactive({
      store,
      helpHandle,
      loading: false,
      userCode: "",
      userId: "",
      specialorgid: "",
      heightNum: "",
      topHeight: "",
      searchHeight: "",
      tableHeight: "",

      //搜索条件数据
      options: [
        {
          value: "1",
          label: "启用"
        },
        {
          value: "0",
          label: "停用"
        }
      ],
      value: "",
      templateName: "",

      //新增、编辑
      newlyDia: false,
      modelName: "",
      projectName: "",
      projectId: "",
      disTtile: "",
      tId: "",

      //属性明细
      tableDataDia: [],
      multipleSelectionDia: [],
      zdlx: [],
      kjlx: [],
      sf: [
        {
          name: "是",
          code: "1"
        },
        {
          name: "否",
          code: "0"
        }
      ],
      newList: [],
      editList: [],
      deleteList: [],

      saveLit: [],
      listId: 1,

      //分页
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: "1"
      },

      attributeDia: false,

      display: true,
      tableWidth: "80",
      tableData: [],

      multipleSelection: [],

      columnObj: {},
      segmentIds: [],
      segment: [
        {
          value: "id",
          label: "ID",
          checked: false
        },
        {
          value: "mbbm",
          label: "模板编码",
          checked: false
        },
        {
          value: "mbmc",
          label: "模板名称",
          checked: true
        },
        {
          value: "xmlx",
          label: "项目类型",
          checked: true
        },
        {
          value: "xmlxid",
          label: "项目类型ID",
          checked: true
        },
        {
          value: "gxsj",
          label: "更新时间",
          checked: true
        },
        {
          value: "mbqyzt",
          label: "模板启用状态",
          checked: true
        }
      ],
      columnObjDia: {},
      segmentIdsDia: [],
      columnObjDia: [
        {
          value: "id",
          label: "ID",
          checked: false
        },
        {
          value: "xh",
          label: "序号",
          checked: true
        },
        {
          value: "zdmc",
          label: "字段名称",
          checked: true
        },
        {
          value: "zdbm",
          label: "字段编码",
          checked: true
        },
        {
          value: "zdlx",
          label: "字段类型",
          checked: true
        },
        {
          value: "kjlx",
          label: "控件类型",
          checked: true
        },
        {
          value: "ggdm",
          label: "公共代码",
          checked: true
        },
        {
          value: "dyff",
          label: "调用方法",
          checked: true
        },
        {
          value: "sfbt",
          label: "是否必填",
          checked: true
        },
        {
          value: "tabid",
          label: "TABID",
          checked: true
        },
        {
          value: "dybm",
          label: "对应表名",
          checked: true
        },
        {
          value: "sfzd",
          label: "是否只读",
          checked: true
        },
        {
          value: "sflbxs",
          label: "是否列表显示",
          checked: true
        },
        {
          value: "px",
          label: "排序（按照输入数字排序）",
          checked: true
        },
        {
          value: "mez",
          label: "默认值",
          checked: true
        },
        {
          value: "fzdbm",
          label: "父子段编码",
          checked: true
        },
        {
          value: "kd",
          label: "宽度",
          checked: true
        },
        {
          value: "template_id",
          label: "TEMPLATE_ID",
          checked: false
        }
      ]
    });
  },
  watch: {
    display (val) {
      val == false ? (this.tableWidth = "99") : (this.tableWidth = "80");
    }
  },
  created () {
    this.handleColumn();
  },
  mounted () {
    this.heightNum = document.querySelector(".el-card").clientHeight;
    this.topHeight = document.querySelector(".operation").clientHeight;
    this.searchHeight = document.querySelector(".searchBox").clientHeight;
    this.setTableHeight();
  },

  methods: {
    //分页
    handleSizeChange (currentLimitNum) {
      this.page.limit = currentLimitNum;
      this.loadData();
    },
    handleCurrentChange (currentPageNum) {
      this.page.page = currentPageNum;
      this.loadData();
    },

    searchBtn () {
      this.loading = true;
      this.loadData();
    },

    loadData () {
      const params = {
        id: this.$refs.tree.treeId,
        name: this.templateName,
        state: this.value,
        page: this.page.page,
        size: this.page.limit
      };
      baseService.post("/xmsxwh/getRecords", params).then((res) => {
        if (res.success) {
          this.tableData = res.data.records;
          this.page.total = res.data.total;
          this.loading = false;
        } else {
          ElMessage({
            type: "error",
            message: res.msg
          });
          this.loading = false;
        }
      });
    },
    setTableHeight () {
      this.tableHeight = this.heightNum - this.topHeight - this.searchHeight - 70 + "px";
    },
    //处理环节数据
    handleColumn () {
      this.segment.forEach((item) => {
        this.segmentIds.push(item.value);
        this.columnObj[item.value] = item.checked;
      });
    },
    //项目环节
    listShow (value, checked) {
      for (let i in this.columnObj) {
        if (i == value) {
          this.columnObj[i] = checked;
        }
      }
    },

    //表格复选框
    handleSelectionChange (val) {
      this.multipleSelection = val;
    },

    //新建
    newly () {
      this.newlyDia = true;
      this.disTtile = "新建";
    },

    getName (name) {
      this.projectName = name;
    },
    //编辑
    translate () {
      if (this.multipleSelection.length == 0) {
        ElMessage({
          type: "error",
          message: "请选择一条需要编辑的数据"
        });
      } else if (this.multipleSelection.length > 1) {
        ElMessage({
          type: "error",
          message: "请选择一条需要编辑的数据"
        });
      } else {
        this.newlyDia = true;
        this.disTtile = "编辑";
        const params = {
          id: this.multipleSelection[0].id
        };
        baseService.get("/xmsxwh/getRecord", params).then((res) => {
          if (res.success) {
            this.modelName = res.data.name;
            this.projectName = res.data.xmlx;
            this.$refs.tree2.treeId = res.data.xmlxId;
            this.tId = res.data.id;
          }
        });
      }
    },

    //新建编辑保存按钮
    newSave () {
      let params = {};
      if (this.disTtile == "新建") {
        name = this.modelName;
        params.xmlxId = this.$refs.tree2.treeId;
      } else if (this.disTtile == "编辑") {
        params.id = this.tId;
        params.name = this.modelName;
        params.xmlxId = this.$refs.tree2.treeId;
      } else {
        params.copyFlag = "1";
        params.name = this.modelName;
        params.id = this.tId;
        params.copyId = this.multipleSelection[0].id;
        params.xmlxId = this.multipleSelection[0].xmlxId;
      }

      baseService.post("/xmsxwh/saveRecord", params).then((res) => {
        if (res.success) {
          this.newlyDia = false;
          this.loadData();
        } else {
          ElMessage({
            type: "error",
            message: res.msg
          });
        }
      });
    },

    //删除
    removeBtn () {
      this.loading = true;
      if (this.multipleSelection.length == 0) {
        ElMessage({
          type: "error",
          message: "请选择需要删除的数据"
        });
      } else {
        this.$confirm("此操作将永久删除该文件, 是否继续?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        })
          .then(() => {
            const params = {
              ids: []
            };
            this.multipleSelection.forEach((item) => {
              params.ids.push(item.id);
            });
            baseService.post("/xmsxwh/deleteRecords", params).then((res) => {
              if (res.success) {
                ElMessage({
                  type: "success",
                  message: "数据已删除"
                });
                this.loadData();
              } else {
                ElMessage({
                  type: "error",
                  message: res.msg
                });
                this.loading = false;
              }
            });
          })
          .catch(() => {
            this.$message({
              type: "info",
              message: "已取消删除"
            });
            this.loading = false;
          });
      }
    },

    //属性明细
    closeTableDialog () {
      // this.newList = [];
      // this.editList = [];
      // this.deleteList = [];
      this.saveLit = [];
    },
    attribute () {
      if (this.multipleSelection.length == 0) {
        ElMessage({
          type: "error",
          message: "请选择需要复制的数据"
        });
      } else if (this.multipleSelection.length > 1) {
        ElMessage({
          type: "error",
          message: "请选择一条需要复制的数据"
        });
      } else {
        const params = {
          templateId: this.multipleSelection[0].id
        };
        baseService.get("/xmsxwh/getCommonCode", { comCodeId: "1020" }).then((res) => {
          if (res.success) {
            this.zdlx = res.data;
          } else {
            ElMessage({
              type: "error",
              message: res.success
            });
          }
        });
        baseService.get("/xmsxwh/getCommonCode", { comCodeId: "1427" }).then((res) => {
          if (res.success) {
            this.kjlx = res.data;
          } else {
            ElMessage({
              type: "error",
              message: res.success
            });
          }
        });
        baseService.get("/xmsxwh/getColumnRecords", params).then((res) => {
          if (res.success) {
            this.tableDataDia = res.data;
            this.tableDataDia.forEach((item) => {
              item.action = "";
            });
            this.attributeDia = true;
            this.handleColumnDia();
          } else {
            ElMessage({
              type: "error",
              message: res.success
            });
          }
        });
      }
    },
    handleSelectionChangeDia (val) {
      this.multipleSelectionDia = val;
    },
    //新增按钮
    addition (type) {
      let object = {
        action: type,
        id: `新增${this.listId++}`,
        name: "",
        columnName: "",
        columnType: "",
        inputType: "",
        commonCode: "",
        jsCode: "",
        isRequired: "",
        tabid: "",
        tableName: "",
        isVisble: "",
        isGrid: "",
        plsx: "",
        defvalue: "",
        parentColumn: "",
        width: "",
        template_id: "",
        templateId: ""
      };

      this.tableDataDia.push(object);
      this.saveLit.push(object);
      let el = document.querySelector(".attributeDia .el-table--scrollable-y .el-table__body-wrapper");
      let el2 = document.querySelector(".attributeDia .el-table__body tbody");
      setTimeout(() => {
        object.template_id = this.multipleSelection[0].id;
        object.templateId = this.multipleSelection[0].id;
        const height = el2.clientHeight - el.clientHeight;
        if (height > 0) {
          el.scrollTop = height;
        }
      }, 200);
    },
    save () {
      if (this.saveLit.length == 0) {
        ElMessage({
          type: "success",
          message: "保存成功"
        });
      } else {
        this.saveLit.forEach((item) => {
          if (item.name == "") {
            ElMessage({
              type: "info",
              message: "新增数据请输入字段名称"
            });
          } else if (item.columnName == "") {
            ElMessage({
              type: "info",
              message: "新增数据请输入字段编码"
            });
          } else if (item.columnType == "") {
            ElMessage({
              type: "info",
              message: "新增数据请选择字段类型"
            });
          } else if (item.inputType == "") {
            ElMessage({
              type: "info",
              message: "新增数据请选择控件类型"
            });
          } else if (item.isRequired == "") {
            ElMessage({
              type: "info",
              message: "新增数据请选择是否必填"
            });
          } else if (item.tabid == "") {
            ElMessage({
              type: "info",
              message: "新增数据请输入TABID"
            });
          } else if (item.tableName == "") {
            ElMessage({
              type: "info",
              message: "新增数据请输入对应表名"
            });
          } else if (item.isVisble == "") {
            ElMessage({
              type: "info",
              message: "新增数据请选择是否只读"
            });
          } else if (item.isGrid == "") {
            ElMessage({
              type: "info",
              message: "新增数据请选择是否列表显示"
            });
          } else if (item.plsx == "") {
            ElMessage({
              type: "info",
              message: "新增数据请输入排序"
            });
          } else if (item.parentColumn == "") {
            ElMessage({
              type: "info",
              message: "新增数据请输入父子段编码"
            });
          } else if (item.width == "") {
            ElMessage({
              type: "info",
              message: "新增数据请输入宽度"
            });
          } else {
            const params = this.saveLit;
            baseService.post("/xmsxwh/saveColumnRecords", params).then((res) => {
              if (res.success) {
                ElMessage({
                  type: "success",
                  message: "保存成功"
                });
                this.saveLit = [];
                this.attribute();
              } else {
                ElMessage({
                  type: "error",
                  message: res.success
                });
              }
            });
          }
        });
      }
    },
    //删除按钮
    deletntion (type) {
      if (this.multipleSelectionDia.length == "0") {
        ElMessage({
          type: "error",
          message: "请选择需要删除的数据"
        });
      } else {
        this.multipleSelectionDia.forEach((item) => {
          //先删除表格里的数据
          for (let i = 0; i < this.tableDataDia.length; i++) {
            if (this.tableDataDia[i].id == item.id) {
              this.tableDataDia.splice(i, 1);
            }
          }

          //删除接口参数里的数据
          for (let i = 0; i < this.saveLit.length; i++) {
            if (this.saveLit[i].id == item.id) {
              if (this.saveLit[i].action == "insert") {
                this.saveLit.splice(i, 1);
              } else if (this.saveLit[i].action == "update") {
                this.saveLit[i].action = type;
              } else {
                item.action = "type";
                this.saveLit.push(item);
              }
            }
          }
        });
      }
    },
    //编辑
    editTion (type, row) {
      if (row.action == "") {
        row.action = type;
        this.saveLit.push(row);
      }
    },

    //启用
    enable () {
      if (this.multipleSelection.length == 0) {
        ElMessage({
          type: "error",
          message: "请选择一条需要启用的数据"
        });
      } else if (this.multipleSelection.length > 1) {
        ElMessage({
          type: "error",
          message: "请选择一条需要启用的数据"
        });
      } else if (this.multipleSelection[0].state == "1") {
        ElMessage({
          type: "error",
          message: "请选择一条需要启用的数据"
        });
      } else {
        this.loading = true;
        this.$confirm("此操作将启用该数据, 是否继续?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        })
          .then(() => {
            baseService.get(`/xmsxwh/startRecords?id=${this.multipleSelection[0].id}&xmlxId=${this.multipleSelection[0].xmlxId}`).then((res) => {
              if (res.success) {
                ElMessage({
                  type: "success",
                  message: "数据启用成功"
                });
                this.loadData();
              } else {
                ElMessage({
                  type: "error",
                  message: "数据启用失败"
                });
                this.loading = false;
              }
            });
          })
          .catch(() => {
            this.$message({
              type: "info",
              message: "已取消启用"
            });
            this.loading = false;
          });
      }
    },

    //停用
    deactivate () {
      if (this.multipleSelection.length == 0) {
        ElMessage({
          type: "error",
          message: "请选择需要停用的数据"
        });
      } else {
        this.loading = true;
        this.$confirm("此操作将停用该数据, 是否继续?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        })
          .then(() => {
            let array = [];
            this.multipleSelection.forEach((item) => {
              array.push(item.id);
            });

            if (array.indexOf("0") == -1) {
              const params = {
                ids: array
              };
              baseService.post("/xmsxwh/endRecords", params).then((res) => {
                if (res.success) {
                  ElMessage({
                    type: "success",
                    message: "数据停用成功"
                  });
                  this.loadData();
                } else {
                  ElMessage({
                    type: "success",
                    message: res.success
                  });
                  this.loading = false;
                }
              });
            } else {
              ElMessage({
                type: "error",
                message: "数据中携带以停用的数据"
              });
              this.loading = false;
            }
          })
          .catch(() => {
            this.$message({
              type: "info",
              message: "已取消停用"
            });
            this.loading = false;
          });
      }
    },

    //复制
    copy () {
      if (this.multipleSelection.length == 0) {
        ElMessage({
          type: "error",
          message: "请选择需要复制的数据"
        });
      } else if (this.multipleSelection.length > 1) {
        ElMessage({
          type: "error",
          message: "请选择一条需要复制的数据"
        });
      } else {
        this.newlyDia = true;
        this.disTtile = "复制";
        const params = {
          id: this.multipleSelection[0].id
        };
        baseService.get("/xmsxwh/getRecord", params).then((res) => {
          if (res.success) {
            this.modelName = res.data.name;
            this.projectName = res.data.xmlx;
            this.$refs.tree2.treeId = res.data.xmlxId;
            this.tId = res.data.id;
          }
        });
      }
    },

    //处理环节数据
    handleColumnDia () {
      this.columnObjDia.forEach((item) => {
        this.segmentIdsDia.push(item.value);
        this.columnObjDia[item.value] = item.checked;
      });
    },
    //项目环节
    listShowDia (value, checked) {
      for (let i in this.columnObjDia) {
        if (i == value) {
          this.columnObjDia[i] = checked;
        }
      }
    },

    close () {
      this.display = !this.display;
    },

    loadCompany () {
      this.loading = false;
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid);
    }
  }
});
</script>

<style lang="less" scoped>
.accounts33 {
  padding: 10px;

  .operation {
    display: flex;

    .btnBox {
      width: 110px;
      height: 50px;
      background-image: url("@/assets/comprehensive/Unchecked.png");
      background-repeat: no-repeat;
      margin: 0 2px;
      text-align: center;
      line-height: 35px;
      color: #fff;
      font-weight: 500;
      cursor: pointer;
    }
  }

  .btmBox {
    width: 100%;
    display: flex;

    .openBox {
      cursor: pointer;
    }

    .treeBox {
      width: 20%;
      border: 2px solid #509b99;
      overflow-x: hidden;
      overflow-y: auto;

      .titleBox {
        width: 100%;
        height: 30px;
        background-color: #509b99;
        line-height: 30px;

        span {
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          margin-left: 10px;
        }

        img {
          width: 13px;
          height: 13px;
          cursor: pointer;
          float: right;
          margin-right: 15px;
          margin-top: 8px;
        }
      }

      .searchBox {
        width: 100%;
        background-color: #509b99;
        height: 40px;
        opacity: 0.5;
        display: flex;
        justify-content: center;
        align-items: center;

        .el-input--small {
          width: 95%;
        }

        .el-input--small .el-input__inner {
          height: 30px;
          border-radius: 30px;
          color: rgb(10, 10, 10);
        }

        .el-input__inner::placeholder {
          color: black;
          font-weight: 700;
        }

        .el-input__inner {
          color: black;
          font-weight: 700;
        }
      }

      .sonTtreeBox {
        width: 100%;
        height: 500px;
      }
    }

    .treeBox::-webkit-scrollbar {
      display: none;
    }

    .tableBox {
      margin-left: 20px;

      .searchBox {
        width: 100%;
        display: flex;

        .formBox {
          width: 80%;

          .el-button {
            background: #509b99;
            border: 1px solid #509b99;
            color: #fff;
          }
        }

        .lieBox {
          width: 20%;
          text-align: right;
        }
      }

      .tableBox1 {
        width: 98%;
        overflow: auto;
      }
    }
  }
}

.attributeDia {
  .el-table thead th {
    background-color: #70c1b3 !important;
    font-size: 15px;
    color: #fff;
    border-color: #fff;
    font-weight: bold;
  }

  .el-table--enable-row-transition .el-table__body td {
    border-color: #fff;
  }

  .el-input--small .el-input__inner {
    border: none;
  }
}
</style>
