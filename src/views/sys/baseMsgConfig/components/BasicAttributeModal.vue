<template>
  <vxe-modal
    :loading="loading"
    position="center"
    title="基本信息维护"
    @close="handleCancel"
    v-model="isShowModal"
    width="50%"
    height="780"
    show-zoom
    show-footer
    resize
  >
    <template #default>
      <el-form ref="formRef" :model="formData" label-position="right" label-width="220px">
        <Grid :gap="[12, 0]" :cols="2">
          <GridItem>
            <el-form-item prop="yjfl">
              <template #label>
                <el-space :size="4">
                  <span>{{ `一级分类` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select
                  @change="(val:string)=>changeData('EJFL',val)"
                  @clear="() => clearData('YJFL')"
                  clearable
                  v-model="formData.yjfl"
                  class="select"
                >
                  <el-option v-for="item in fjList.yjfl" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="ejfl">
              <template #label>
                <el-space :size="4">
                  <span>{{ `二级分类` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select
                  @change="(val:string)=>changeData('SJFL',val)"
                  @clear="() => clearData('EJFL')"
                  clearable
                  collapse-tags
                  multiple
                  v-model="formData.ejfl"
                  class="select"
                >
                  <el-option v-for="item in fjList.ejfl" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sjfl">
              <template #label>
                <el-space :size="4">
                  <span>{{ `三级分类` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select @clear="() => clearData('SJFL')" clearable collapse-tags multiple v-model="formData.sjfl" class="select">
                  <el-option v-for="item in fjList.sjfl" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="dyxzCode">
              <template #label>
                <el-space :size="4">
                  <span>{{ `单元性质` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable collapse-tags multiple v-model="formData.dyxzCode" class="select">
                  <el-option v-for="item in publicDataList['DYXZ']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="ysbzCode">
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算编制方式` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.ysbzCode" class="select">
                  <el-option v-for="item in publicDataList['YSBZFS']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="ysspgn">
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算审批功能` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.ysspgn" class="select">
                  <el-option v-for="item in publicDataList['YSSPGN']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="byskz">
              <template #label>
                <el-space :size="4">
                  <span>{{ `包预算控制` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.byskz" class="select">
                  <el-option v-for="item in publicDataList['BYSKZ']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sxyskz">
              <template #label>
                <el-space :size="4">
                  <span>{{ `事项预算控制` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sxyskz" class="select">
                  <el-option v-for="item in publicDataList['SXYSKZ']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="hasprovince">
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算编制审批` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.hasprovince" class="select">
                  <el-option value="0" label="地市公司审批"></el-option>
                  <el-option value="1" label="省公司审批"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="yssfkz">
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算释放控制` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable collapse-tags multiple v-model="formData.yssfkz" class="select">
                  <el-option v-for="item in fjList.sffl" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sflr">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否录入` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sflr" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="mbzkkz">
              <template #label>
                <el-space :size="4">
                  <span>{{ `目标总控值控制(普通包)` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.mbzkkz" class="select">
                  <el-option value="0" label="控制"></el-option>
                  <el-option value="1" label="不控制"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="xmbtolerance">
              <template #label>
                <el-space :size="4">
                  <span>{{ `项目包容差（%）` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <input v-model="formData.xmbtolerance" v-number-input="'6'" class="number-input" />
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="mbztolerance">
              <template #label>
                <el-space :size="4">
                  <span>{{ `目标值容差（%）` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <input v-model="formData.mbztolerance" v-number-input="'6'" class="number-input" />
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfyxjdys">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否允许机动预算` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfyxjdys" class="select">
                  <el-option value="0" label="不允许"></el-option>
                  <el-option value="1" label="允许"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="cbjdlc">
              <template #label>
                <el-space :size="4">
                  <span>{{ `储备阶段流程` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.cbjdlc" class="select">
                  <el-option value="0" label="初始默认流程（不含下面两个流程）"></el-option>
                  <el-option value="1" label="日常运维项目流程（业务和财务都可发起）"></el-option>
                  <el-option value="2" label="标准成本项目流程（只有财务部门才能发起）"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfglzc">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否关联资产` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfglzc" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfjyzdtx">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否校验事项必填` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfjyzdtx" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfxyxqsh">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否需要需求审核` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfxyxqsh" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfxylhhs">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否需要联合会审` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfxylhhs" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfgmblr">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否允许规模包录入` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfgmblr" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfxmlr">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否需求录入` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfxmlr" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfywdj">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否业务冻结` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfywdj" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="gbdksfywdj">
              <template #label>
                <el-space :size="4">
                  <span>{{ `关闭打开业务冻结` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.gbdksfywdj" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="zcsjfl">
              <template #label>
                <el-space :size="4">
                  <span>{{ `资产三级分类` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable collapse-tags multiple v-model="formData.zcsjfl" class="select">
                  <el-option v-for="item in fjList.sjfl" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="zdtxName">
              <template #label>
                <el-space :size="4">
                  <span>{{ `重点投向` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input :readonly="true" v-model="formData.zdtxName">
                  <template #append>
                    <el-button class="el-icon-more" @click="showZdtxModal" />
                  </template>
                </el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="expenseCategory">
              <template #label>
                <el-space :size="4">
                  <span>{{ `费用类别` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.expenseCategory" class="select">
                  <el-option v-for="item in publicDataList['ZBCBFY']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="qgcCode">
              <template #label>
                <el-space :size="4">
                  <span>{{ `过程名称` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.qgcCode" class="select">
                  <el-option v-for="item in publicDataList['XMLB_QGCLCPZ']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="cblb">
              <template #label>
                <el-space :size="4">
                  <span>{{ `成本类别` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.cblb" class="select">
                  <el-option v-for="item in publicDataList['XMLB_CBLB']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="ysly">
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算来源` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable class="select" v-model="formData.ysly">
                  <el-option v-for="item in publicDataList['XMLB_YSLY']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="processingMode">
              <template #label>
                <el-space :size="4">
                  <span>{{ `处理模式` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable collapse-tags multiple v-model="formData.processingMode" class="select">
                  <el-option v-for="item in publicDataList['QMYS_CLMS']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="jhlx">
              <template #label>
                <el-space :size="4">
                  <span>{{ `计划类型` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.jhlx" class="select">
                  <el-option v-for="item in publicDataList['XMLB_JHLX']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="tabType">
              <template #label>
                <el-space :size="4">
                  <span>{{ `页签类型` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.tabType" class="select">
                  <el-option v-for="item in publicDataList['TAB_TYPE']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="xtly">
              <template #label>
                <el-space :size="4">
                  <span>{{ `系统来源` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.xtly" class="select">
                  <el-option v-for="item in publicDataList['ZLYS_XQLR_LYXT']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="isZgs">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否子公司` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.isZgs" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="isSgs">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否省公司` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.isSgs" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="zjsx">
              <template #label>
                <el-space :size="4">
                  <span>{{ `资金属性` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.zjsx" class="select">
                  <el-option v-for="item in publicDataList['XMLBPZ_ZJSX']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="mbzGkjb">
              <template #label>
                <el-space :size="4">
                  <span>{{ `管控级别` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.mbzGkjb" class="select">
                  <el-option v-for="item in publicDataList['MBZ_GKJB']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="isGjPspfwj">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否需要挂接评审及批复文件` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.isGjPspfwj" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="isBkk">
              <template #label>
                <el-space :size="4">
                  <span>{{ `不可控标识` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.isBkk" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="tghsRjh">
              <template #label>
                <el-space :size="4">
                  <span>{{ `跳过会审（仍建会）` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.tghsRjh" class="select" @change="handletghsRjhChange">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="tghsJe" :required="formData.tghsRjh === '1'" :rules="tghsJeRules">
              <template #label>
                <el-space :size="4">
                  <span>{{ `建会跳过会审金额` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.tghsJe" />
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="zyxtyys">
              <template #label>
                <el-space :size="4">
                  <span>{{ `专业系统已预审` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.zyxtyys" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="csbl" :rules="csblRules">
              <template #label>
                <el-space :size="4">
                  <span>{{ `抽审比例` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.csbl" placeholder="请输入0~1之间的数值" />
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="aiAuditInuseType">
              <template #label>
                <el-space :size="4">
                  <span>{{ `智能审核启用类型` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.aiAuditInuseType" class="select">
                  <el-option
                    v-for="item in publicDataList['AI_AUDIT_INUSE_TYPE_COM']"
                    :key="item.code"
                    :label="item.name"
                    :value="item.code"
                  ></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfjjcl">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否降级处理` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfjjcl" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="xqlrWfCode">
              <template #label>
                <el-space :size="4">
                  <span>{{ `需求录入流程编码` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.xqlrWfCode" placeholder="请输入需求录入流程编码" />
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="sfzdck">
              <template #label>
                <el-space :size="4">
                  <span>{{ `是否自动出库` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.sfzdck" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="wlzcbwtsmFjType">
              <template #label>
                <el-space :size="4">
                  <span>{{ `物料资成本问题说明附件` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.wlzcbwtsmFjType" placeholder="请输入物料资成本问题说明附件" />
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="ysbgSfkyxgztz">
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算变更是否可以修改总投资` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.ysbgSfkyxgztz" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="xqlrEdit">
              <template #label>
                <el-space :size="4">
                  <span>{{ `集中修改是否不可修改` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.xqlrEdit" class="select">
                  <el-option value="0" label="否"></el-option>
                  <el-option value="1" label="是"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
        </Grid>
      </el-form>
    </template>
    <template #footer>
      <div class="operation">
        <el-button type="primary" sizi="mini" @click="handleSave">保 存</el-button>
        <el-button type="primary" sizi="mini" @click="handleCancel">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
  <MatterModal @detail="detailData" ref="matterModalRef" />
</template>

<script setup lang="ts" name="BasicAttributeModal">
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import MatterModal from '@/views/sys/baseMsgConfig/components/MatterModal.vue'
import { nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getDataByParent, getESJfl, getPublicCodeList } from '@/api/common'
import { eidtBaseInfo } from '@/api/sys/proCategory'
import VXETable from 'vxe-table'
import { cloneDeep } from 'lodash'

interface AcceptParams {
  ids: string[]
  dwId: string
  roleCode: string
}

interface PublicDataList {
  [key: string]: PublicData[]
}

interface PublicData {
  code: string
  name: string
}

const emit = defineEmits(['saveDataAfter'])
const matterModalRef = ref<InstanceType<typeof MatterModal>>()
const isShowModal = ref(false)
const formRef = ref()
const loading = ref(false)
const parameter = ref<AcceptParams>({
  ids: [],
  dwId: '',
  roleCode: ''
})

const formData = ref<EditParams>({
  byskz: '',
  cbjdlc: '',
  cblb: '',
  dyxzCode: '',
  ejfl: '',
  expenseCategory: '',
  gbdksfywdj: '',
  hasprovince: '',
  jhlx: '',
  zdtxName: '',
  mbzkkz: '',
  mbztolerance: '',
  processingMode: '',
  provincialManagementOffice: '',
  qgcCode: '',
  sfglzc: '',
  sfgmblr: '',
  sfjyzdtx: '',
  sflr: '',
  sfxmlr: '',
  sfxylhhs: '',
  sfxyxqsh: '',
  sfywdj: '',
  sfyxjdys: '',
  sjfl: '',
  sxyskz: '',
  tabType: '',
  xmbtolerance: '',
  yjfl: '',
  ysbzCode: '',
  ysly: '',
  yssfkz: '',
  ysspgn: '',
  zcsjfl: '',
  xtly: '',
  tghsJe: '',
  tghsRjh: '',
  zyxtyys: '',
  csbl: '',
  aiAuditInuseType: '',
  sfjjcl: '',
  xqlrWfCode: '',
  sfzdck: '',
  ysbgSfkyxgztz: '',
  xqlrEdit: ''
})

const detailData = (selectedData: any[]) => {
  const zdtxName = selectedData.map((item) => item.ctmc).join(',')
  const zdtx = selectedData.map((item) => item.id).join(',')
  formData.value.zdtxName = zdtxName
  formData.value.zdtx = zdtx
}

const validateTghsJe = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (formData.value.tghsRjh === '1' && !value) {
    callback(new Error('请输入建会跳过会审金额'))
    return
  }
  callback()
}

const tghsJeRules = [
  {
    validator: validateTghsJe,
    trigger: 'blur'
  },
  {
    validator: validateTghsJe,
    trigger: 'change'
  }
]

const validateCsbl = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (value === '' || value === null || value === undefined) {
    callback()
    return
  }
  const num = Number(value)
  if (isNaN(num)) {
    callback(new Error('请输入有效数值'))
    return
  }
  if (num < 0 || num > 1) {
    callback(new Error('抽审比例必须在0~1之间'))
    return
  }
  callback()
}

const csblRules = [
  {
    validator: validateCsbl,
    trigger: 'blur'
  },
  {
    validator: validateCsbl,
    trigger: 'change'
  }
]

const handletghsRjhChange = () => {
  if (formData.value.tghsRjh === '1') {
    nextTick(() => {
      formRef.value?.validateField?.('tghsJe', () => undefined)
    })
    return
  }
  formData.value.tghsJe = ''
}

const acceptParams = (params: AcceptParams) => {
  getPublicData()
  isShowModal.value = true
  parameter.value = { ...parameter.value, ...params }
}

const publicDataList = ref<PublicDataList>({
  DYXZ: [],
  YSBZ: [],
  YSSPGN: [],
  ZBCBFY: [],
  ['XMLB_QGCLCPZ']: [],
  ['XMLB_YSLY']: [],
  ['TAB_TYPE']: [],
  ['XMLB_CBLB']: [],
  ['QMYS_CLMS']: [],
  ['HIBERARCHY']: [],
  ['ZLYS_XQLR_LYXT']: [],
  ['XMLB_JHLX']: [],
  ['XMLBPZ_ZJSX']: [],
  ['MBZ_GKJB']: [],
  BYSKZ: [],
  ['AI_AUDIT_INUSE_TYPE_COM']: []
})

const fjList = ref<PublicDataList>({
  yjfl: [],
  ejfl: [],
  sjfl: [],
  sffl: []
})

type Flag = 'YJFL' | 'EJFL' | 'SJFL'

const changeData = async (flag: Flag, val: string | string[]) => {
  const value = Array.isArray(val) ? val.join(',') : val
  const res = await getESJfl(value)
  if (res.success) {
    if (flag === 'EJFL') {
      formData.value.ejfl = ''
      formData.value.sjfl = ''
      formData.value.yssfkz = ''
      formData.value.zcsjfl = ''
      fjList.value.ejfl = []
      fjList.value.sffl = []
      fjList.value.sjfl = []
      fjList.value.ejfl = res.data || []
    } else if (flag === 'SJFL') {
      formData.value.sjfl = ''
      formData.value.yssfkz = ''
      formData.value.zcsjfl = ''
      fjList.value.sjfl = res.data || []
      fjList.value.sffl = []
      const sfList = res.data.map((item: PublicData) => {
        return {
          ...item,
          name: item.code + ' | ' + item.name
        }
      })
      fjList.value.sffl = sfList
    }
  }
}

const clearData = (flag: Flag) => {
  if (flag === 'YJFL') {
    formData.value.ejfl = ''
    formData.value.sjfl = ''
    formData.value.yssfkz = ''
    formData.value.zcsjfl = ''
    fjList.value.ejfl = []
    fjList.value.sjfl = []
  } else if (flag === 'SJFL') {
    formData.value.yssfkz = ''
    formData.value.zcsjfl = ''
    fjList.value.sffl = []
  }
}

const getPublicData = async () => {
  try {
    loading.value = true
    const codes = [
      'DYXZ',
      'YSBZFS',
      'YSSPGN',
      'BYSKZ',
      'SXYSKZ',
      'ZBCBFY',
      'XMLB_QGCLCPZ',
      'XMLB_YSLY',
      'TAB_TYPE',
      'QMYS_CLMS',
      'XMLB_JHLX',
      'HIBERARCHY',
      'XMLB_CBLB',
      'XMLBPZ_ZJSX',
      'ZLYS_XQLR_LYXT',
      'MBZ_GKJB',
      'AI_AUDIT_INUSE_TYPE_COM'
    ]
    const yjflRes = await getDataByParent('GWXMFL')
    if (yjflRes.success) {
      fjList.value.yjfl = yjflRes.data || []
    }
    const res = await getPublicCodeList({
      codes: codes
    })
    if (res.success && res.data) {
      for (const key in res.data) {
        const element = res.data[key]
        publicDataList.value[key] = element
      }
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const showZdtxModal = () => {
  if (matterModalRef.value)
    matterModalRef.value.acceptParams({
      specialorgid: parameter.value.dwId,
      roleCode: parameter.value.roleCode
    })
}

const handleSave = async () => {
  const valid = await formRef.value
    ?.validate?.()
    .then(() => true)
    .catch(() => false)
  if (!valid) return
  try {
    const type = await VXETable.modal.confirm('是否确认保存?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否',
      showClose: false
    })
    if (type === 'confirm') {
      loading.value = true
      const formDataList = cloneDeep(formData.value)
      for (const key in formDataList) {
        const element = formDataList[key]
        if (Array.isArray(element)) {
          const data = formDataList[key].join(',')
          formDataList[key] = data
        }
      }
      const res = await eidtBaseInfo({
        params: {
          ...formDataList
        },
        ...parameter.value
      })
      if (res.success) {
        handleCancel()
        ElMessage.success('保存成功!')
        emit('saveDataAfter')
      } else {
        throw new Error(res.msg)
      }
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}
const handleCancel = () => {
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields()
    for (const key in publicDataList.value) {
      publicDataList.value[key] = []
    }
    for (const key in fjList.value) {
      fjList.value[key] = []
    }
    isShowModal.value = false
  }
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.select {
  width: 100%;
}

.operation {
  text-align: center;
}
:deep(.el-date-editor) {
  width: 100%;
}
</style>
