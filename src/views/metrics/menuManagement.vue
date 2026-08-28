<!-- 菜单帮助 -->
<template>
  <div class="container" >
    <div class="cont_btn">
      <div class="contbtn_left">
        <div class="pageListCont">
          <!-- :default-expand-all="true" -->
          <el-tree ref="treeRef" node-key="id" :default-expanded-keys="defaultExpandKeys" :filter-node-method="filterTreeData" :highlight-current="true" @node-click="handlerNodeClick" :data="pageList" :props="defaultProps" :expand-on-click-node="false" />
        </div>
      </div>
      <div class="conbtn_right">
        <el-tabs type="border-card" v-model="tabNum" v-show="isShowPage">
          <el-tab-pane label="帮助配置" name="1" >
            <div style="margin-bottom: 10px">
              <el-button :disabled="isPublish" size="mini" type="primary" plain @click="handlerBtn('save')">保 存</el-button>
              <el-button :disabled="isPublish" size="mini" type="primary" plain @click="handlerBtn('publish')">发 布</el-button>
              <el-button :disabled="!isPublish" size="mini" type="primary" plain @click="handlerBtn('unpublish')">取消发布</el-button>
            </div>
            <el-form  :disabled="isPublish" label-suffix=" : " ref="ruleFormRef" label-width="120px" label-position="right" :model="FromData" :hide-required-asterisk="false">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="表格说明行数" prop="major">
                    <el-input-number v-model="FromData.tabRows" :min="0" :max="5" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="帮助信息" prop="major">
                    <basic-editor ref="basicEditorRef"/>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
            <div style="height: 400px">
              <proTable @selection-change="selectionChange" ref="proTableRef" :data="pageData" :search-col="4" :columns="tableColumns"  :pagination="false">
                <template #tableHeader="scope">
                  <el-button :disabled="isPublish" size="mini" type="primary" plain @click="handlerBtnTable('add', scope.selectedList)">新 增</el-button>
                  <el-button :disabled="!scope.isSelected || isPublish" size="mini" type="primary" plain @click="handlerBtnTable('del', scope.selectedList)">删 除</el-button>
                </template>
              </proTable>
            </div>
          </el-tab-pane>
          <el-tab-pane label="附件信息" name="2">
            <div style="height: 500px"  v-loading="loading">
              <proTable @selection-change="selectionChange" :cell-style="columnStyle" @cell-click="downloadReport" ref="proDataRef" :data="pageData1" :search-col="4" :columns="tableColumns1" @row-click="handerClickTable"  :pagination="false">
                <template #tableHeader="scope">
                  <el-upload style="display: inline; padding: 0 0 0 10px" :on-change="uploadHandle" :auto-upload="false" :show-file-list="false">
                    <el-button :disabled="isPublish" size="mini" type="success" icon="el-icon-upload">上 传</el-button>
                  </el-upload>
                  <!-- <el-button size="mini" :disabled="!scope.isSelected && isPublish" type="primary" style="margin-left: 10px" plain @click="handlerBtn1('download', scope.selectedList)">批量下载</el-button> -->
                  <el-button size="mini" :disabled="!scope.isSelected || isPublish" type="primary" plain style="margin-left: 10px" @click="handlerBtn1('del', scope.selectedList)">删 除</el-button>
                </template>
              </proTable>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>
  
  <script lang="ts">
export default {
  name: "/metrics/menuManagement"
};
</script>
  <script setup lang="ts">
import proTable from "@/components/ProTable/index.vue"; //表格组件
import { h } from "vue";
import { onMounted, ref, reactive, nextTick, computed, shallowRef } from "vue";
import { ElMessage, ElMessageBox, ElInput } from "element-plus";
import { menuList, downloadFj, getConfigByMenuId, updateConfigStatus, saveConfig, listFj, deleteFj } from "@/api/metrics/index";
import baseService from "@/service/baseService";
import BasicEditor from "@/components/base/BasicEditor.vue"; //表格组件

const userInfo = ref<any>(); //用户信息
const loading = ref(false);
const isShowPage = ref(false);
const chooseNode = ref<any>({}); //节点id
const treeRef = ref(); //树ref
const tabNum = ref("1");
const proTableRef = ref(); //表格ref
const basicEditorRef = ref() //richText
const proDataRef = ref();
const pageList = ref([]); //左侧菜单树
const pageData = ref<any[]>([]); //表格数据
const pageData1 = ref<any[]>([]); //表格数据
const isPublish = ref<boolean>(false); //是否发布
// 帮助配置-基本信息配置
const FromData = ref<any>({});
const defaultProps = {
  children: "children",
  label: "name"
};
const defaultExpandKeys = computed(() => {
  const keys: any = [];
  pageList.value.forEach((item: any) => {
    keys.push(item.id);
    item.children.forEach((child: any) => keys.push(child.id));
  });
  return keys;
});

onMounted(async () => {
  isShowPage.value = false;
  await initParamLists();
});
// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  if (column.label == "附件名称") {
    return "color:#00706b;cursor: pointer;";
  }
};
// 下载附件
const downloadReport = async (row: any, column: any) => {
  if (column.label == "附件名称") {
    try {
      loading.value = true;
      const blob: any = await downloadFj({ fileName: row.fjmc, uuid: row.uuid });
      let dom = document.createElement("a");
      let url = window.URL.createObjectURL(blob);
      dom.href = url;
      // 获取文件名
      let filename = row.fjmc;
      dom.download = `${decodeURI(decodeURI(filename))}`;
      document.body.appendChild(dom);
      dom.click();
      document.body.removeChild(dom);
      window.URL.revokeObjectURL(url);
      loading.value = false;
    } catch (e: any) {
      console.error(e.toString());
    }
  }
};

// 帮助管理-按钮点击事件
const handlerBtn = async (val: any) => {
  if (val == "save") {    
    FromData.value.helpInfo = basicEditorRef.value?.valueHtml
    const params = {
      ...FromData.value,
      configDetailList: pageData.value,
      menuId: chooseNode.value.id,
      status: "0"
    };
    let res = await saveConfig(params);
    if (res.success) {
      sum.value = 0;
      ElMessage.success("保存成功");
      menuData(chooseNode.value.id);
    } else {
      ElMessage.error(res.msg);
    }
  } else if (val == "publish") {
    if (!FromData.value.configId) {
      return ElMessage.warning("请维护帮助信息并保存");
    }
    const params = {
      configId: FromData.value.configId,
      status: "1"
    };
    let res = await updateConfigStatus(params);
    if (res.success) {
      ElMessage.success("发布成功");
      menuData(chooseNode.value.id);
    } else {
      ElMessage.error(res.msg);
    }
  } else if (val == "unpublish") {
    const params = {
      configId: FromData.value.configId,
      status: "0"
    };
    let res = await updateConfigStatus(params);
    if (res.success) {
      ElMessage.success("取消发布成功");
      menuData(chooseNode.value.id);
    } else {
      ElMessage.error(res.msg);
    }
  }
};
const sum = ref<number>(0);
const handlerBtnTable = (val: any, selectedList: any) => {
  if (val == "add") {
    sum.value++;
    pageData.value.push({ id: sum.value, configId: FromData.value.configId });
    proTableRef.value?.clearSelection();
  } else if (val == "del") {
    if (selectedList.length != 1) {
      return ElMessage.warning("请选择一条数据");
    }
    const index = pageData.value.findIndex((item: any) => item == selectedList[0]);
    pageData.value.splice(index, 1);
    proTableRef.value?.clearSelection();
  }
};
// 点击树
const handlerNodeClick = (data: any) => {
  if (data.children.length == 0) {
    loading.value = true;
    chooseNode.value = data;
    menuData(chooseNode.value.id);
  } else {
    isShowPage.value = false;
  }
};
// 附件管理-按钮点击事件
const handlerBtn1 = async (val: any, selectedList: any) => {
  if (selectedList.length != 1) {
    return ElMessage.warning("请选择一条数据");
  }
  if (val == "del") {
    ElMessageBox.confirm("确定要删除所选附件？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        let res = await deleteFj(selectedList[0].fjId);
        if (res.success) {
          ElMessage.success("删除成功！");
          await menuData(chooseNode.value.id);
        } else {
          ElMessage.error(res.msg);
        }
      })
      .catch((error: any) => {
        console.log(error);
      });
  }
};
// 末级才生效
const filterTreeData = (val: string, data: any) => {
  if (!val) return true;
  return data.name.indexOf(val) !== -1;
};
// 上传
const uploadHandle = async (file: any) => {
  const formData = new FormData();
  formData.append("files", file.raw);
  formData.append("fileNames", file.name);
  formData.append("menuId", chooseNode.value.id);
  let res = await baseService.post("/sys/menuConfig/uploadFj", formData);
  if (res.success) {
    ElMessage.success("上传成功");
    menuData(chooseNode.value.id);
  } else {
    ElMessage.error(res.msg);
  }
};
const tableColumns = reactive<any>([
  { type: "selection", width: 50 },
  { type: "index", width: 50, label: "序号" },
  {
    prop: "tabFlag",
    label: "TAB标签",
    width: "180",
    render: ({ row }: any) => {
      return h(ElInput, {
        disabled: isPublish.value,
        modelValue: row.tabFlag,
        "onUpdate:modelValue": (val: any) => (row.tabFlag = val)
      });
    }
  },
  {
    prop: "fieldCode",
    label: "字段编码",
    width: "100",
    render: ({ row }: any) => {
      return h(ElInput, {
        disabled: isPublish.value,
        modelValue: row.fieldCode,
        "onUpdate:modelValue": (val: any) => (row.fieldCode = val)
      });
    }
  },
  {
    prop: "fieldValue1",
    label: "字段说明1",
    render: ({ row }: any) => {
      return h(ElInput, {
        disabled: isPublish.value,
        modelValue: row.fieldValue1,
        "onUpdate:modelValue": (val: any) => (row.fieldValue1 = val)
      });
    }
  },
  {
    prop: "fieldValue2",
    label: "字段说明2",
    render: ({ row }: any) => {
      return h(ElInput, {
        disabled: isPublish.value,
        modelValue: row.fieldValue2,
        "onUpdate:modelValue": (val: any) => (row.fieldValue2 = val)
      });
    }
  },
  {
    prop: "fieldValue3",
    label: "字段说明3",
    render: ({ row }: any) => {
      return h(ElInput, {
        disabled: isPublish.value,
        modelValue: row.fieldValue3,
        "onUpdate:modelValue": (val: any) => (row.fieldValue3 = val)
      });
    }
  },
  {
    prop: "fieldValue4",
    label: "字段说明4",
    render: ({ row }: any) => {
      return h(ElInput, {
        disabled: isPublish.value,
        modelValue: row.fieldValue4,
        "onUpdate:modelValue": (val: any) => (row.fieldValue4 = val)
      });
    }
  },
  {
    prop: "fieldValue5",
    label: "字段说明5",
    render: ({ row }: any) => {
      return h(ElInput, {
        disabled: isPublish.value,
        modelValue: row.fieldValue5,
        "onUpdate:modelValue": (val: any) => (row.fieldValue5 = val)
      });
    }
  }
]);
const tableColumns1 = reactive<any>([
  { type: "selection", width: 50 },
  { type: "index", width: 50, label: "序号" },
  { prop: "fjmc", label: "附件名称", width: "300" },
  { prop: "instime", label: "上传时间", width: "150" }
]);
// 页签数据
const menuData = async (id: any) => {
  loading.value = true;
  const res: any = await getConfigByMenuId(id);
  const root: any = await listFj(id);
  if (res.success && root.success) {
      proTableRef.value?.clearSelection();
      isPublish.value = res.data?.status == "1";
      FromData.value = {
        tabRows: res.data?.tabRows,
        helpInfo: res.data?.helpInfo,
        configId: res.data?.configId,
      }
      pageData.value = res.data?.configDetailList ? res.data?.configDetailList : [];
      basicEditorRef.value.valueHtml = res.data?.helpInfo
      if(res.data?.status == "1" ){
        basicEditorRef.value?.editorRef.disable()
      }else{
        basicEditorRef.value?.editorRef.enable()
      }
      proDataRef.value?.clearSelection();
      pageData1.value = root.data ? root.data : [];
      isShowPage.value = true;
      loading.value = false;
  }
};
const initParamLists = async () => {
  // 获取菜单树
  const publicCodeList = await menuList();
  if (publicCodeList.success && publicCodeList.data.length !== 0) {
    pageList.value = publicCodeList.data;
  }
};
// 单选
const selectionChange = (selection: any) => {
  if (selection.length > 1) {
    nextTick(() => {
      if (tabNum.value == "1") {
        proTableRef.value?.clearSelection();
        proTableRef.value?.element.toggleRowSelection(selection[selection.length - 1]);
      } else {
        proDataRef.value?.clearSelection();
        proDataRef.value?.element.toggleRowSelection(selection[selection.length - 1]);
      }
    });
  }
};
// 点击行选中
const handerClickTable = async (val: any) => {
  nextTick(() => {
    if (tabNum.value == "1") {
      proTableRef.value?.clearSelection();
      proTableRef.value?.element.toggleRowSelection(val);
    } else {
      proDataRef.value?.clearSelection();
      proDataRef.value?.element.toggleRowSelection(val);
    }
  });
};
</script>
  
  <style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
.pageName {
  margin-bottom: 20px;
  font-size: 20px;
  letter-spacing: 2px;
  font-weight: bold;
}
.cont_btn {
  width: 100%;
  height: 90%;
  display: flex;
  justify-content: space-evenly;
}
.contbtn_left {
  width: 19%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  overflow: hidden;
  overflow-y: auto;
  .pageListCont {
    width: 90%;
    height: 90%;
  }
}
.conbtn_right {
  width: 82%;
  height: 100%;
  padding: 0px 10px;
  box-sizing: border-box;
  border-radius: 8px;
  .btnList {
    width: 320px;
    display: flex;
    justify-content: space-between;
  }
}
</style>
  