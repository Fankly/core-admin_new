<template>
  <div class="first-container">
    <div class="base-msg" v-if="!matterBaseMsg.isCity">
      <el-button class="title-button" @click="isShowSearch = !isShowSearch" type="text">
        <h3 class="sub-title">
          事项基本信息
          <span>
            <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span>
        </h3>
      </el-button>
      <el-form :disabled="true" v-show="!isShowSearch" ref="formRef" label-width="130px" label-position="right">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="事项编码：">
              <el-input v-model="matterBaseMsg.yssxbm"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="事项名称：">
              <el-input maxlength="128" v-model="matterBaseMsg.yssxmc"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="一级单位：">
              <el-input v-model="matterBaseMsg.yjdwName"> </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="二级单位：">
              <el-input v-model="matterBaseMsg.ejdwName"> </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="归口部门：">
              <el-input v-model="matterBaseMsg.gkbmmc"> </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="处室：">
              <el-input v-model="matterBaseMsg.csmc"> </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="资金来源：">
              <el-input v-model="matterBaseMsg.zjlyName"> </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类型：" prop="xmlxList">
              <el-input v-model="matterBaseMsg.xmlxName"> </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="重点投向：" prop="yslxctId">
              <el-input v-model="matterBaseMsg.yslxctName"> </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否预安排：" prop="isYap">
              <el-input v-model="matterBaseMsg.isYapName"> </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="事项预算(万元)：" prop="sxys">
              <el-input v-model="matterBaseMsg.sxys"> </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="事项性质：">
              <el-input v-model="matterBaseMsg.sxxzName"> </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="备注：">
              <el-input v-model="matterBaseMsg.remark" maxlength="50" type="textarea" row="3" resize="none" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="outbound" v-if="!matterBaseMsg.isCity">
      <el-button class="title-button" @click="isShowOutbound = !isShowOutbound" type="text">
        <h3 class="sub-title">
          事项出库信息
          <span>
            <i :class="isShowOutbound ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span>
        </h3>
      </el-button>
      <div class="formData">
        <el-form :disabled="true" v-show="!isShowOutbound" label-width="130px" label-position="right">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="出库年份：">
                <el-input v-model="matterBaseMsg.nd"> </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目包名称：">
                <el-input v-model="matterBaseMsg.xmbmc"> </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
    <div class="unit-msg">
      <el-button class="title-button" @click="isShowTable = !isShowTable" type="text">
        <h3 class="sub-title">
          实施单位及费用安排
          <span>
            <i :class="isShowTable ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span>
        </h3>
      </el-button>
      <div v-show="!isShowTable" class="unit-table">
        <el-table size="mini" :summary-method="getSummaries" show-summary :data="unitTableData" border stripe>
          <el-table-column width="250" prop="dwName" header-align="center" label="实施单位" align="center"></el-table-column>
          <el-table-column prop="fjYs" align="right" header-align="center" label="费用安排（万元）"> </el-table-column>
          <el-table-column prop="ztimestamp" header-align="center" align="center" label="新增时间"></el-table-column>
          <el-table-column prop="zhggrq" header-align="center" align="center" label="最近更新时间"></el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "MatterDeclMsg"
};
</script>

<script setup lang="ts">
import { getChildData } from "@/api/matter/yssxMatter";
import { getYssxDetailByCity } from "@/api/statistics/yssxtjfx";
import { Decimal } from "decimal.js";
import { ElMessage } from "element-plus";
import { ref, defineProps, toRef, watch } from "vue";
import { DetailParams, RowVo } from "../interface";

interface Props {
  detailParams: RowVo & DetailParams;
}

const props = defineProps<Props>();

const isShowSearch = ref(false);
const isShowTable = ref(false);
const isShowOutbound = ref(false);
const totalSum = ref(0);

const unitTableData = ref([]);

const matterBaseMsg = toRef(props, "detailParams");

const getSummaries = (params: any) => {
  const { columns, data } = params;
  const sums: any = [];
  columns.forEach((column: any, index: any) => {
    if (index === 0) {
      sums[index] = "合计";
      return;
    }
    if (data) {
      const values = data.map((item: any) => item[column.property]);
      if (column.property === "fjYs") {
        if (!values.every((value: any) => isNaN(value) && value !== "")) {
          sums[index] = values.reduce((prev: any, curr: any) => {
            let value = curr;
            if (!isNaN(value)) {
              if (!value) value = 0;
              return Decimal.add(prev, value);
            } else {
              return prev;
            }
          }, 0);
          totalSum.value = sums[index];
          sums[index] += " （万元）";
        } else {
          sums[index] = "";
        }
      }
    }
  });
  return sums;
};

const getTableData = async () => {
  let res = null;
  if (props.detailParams.isCity) {
    res = await getYssxDetailByCity(matterBaseMsg.value.id);
  } else {
    res = await getChildData({
      id: matterBaseMsg.value.id,
      yssxId: matterBaseMsg.value.yssxId,
      jd: 2,
      specialorgid: matterBaseMsg.value.dwId
    });
  }
  if (res.success) {
    unitTableData.value = res.data;
  } else {
    ElMessage.error(res.msg);
  }
};

watch(
  () => matterBaseMsg.value.id,
  () => {
    getTableData();
  },
  {
    immediate: true
  }
);
</script>

<style scoped lang="less">
.first-container {
  position: relative;
  height: 820px;
  padding: 10px 34px;

  overflow-x: hidden;

  .outbound {
    .formData {
      height: 40px;
    }
  }

  .unit-msg {
    width: 100%;

    .unit-table {
      width: 100%;
    }
  }
}

.input-postion {
  width: 100%;
  :deep(.el-input__inner) {
    text-align: left;
  }
}

.operation {
  margin-top: 10px;
  text-align: center;
}

:deep(.el-table) {
  display: flex;
  flex-direction: column;
}

:deep(.el-table__body-wrapper) {
  order: 1;
}

.sub-title {
  font-size: 18px;
}

.title-button {
  margin: 0 0 10px 0;
  padding: 0;
  height: 40px;
}
</style>
