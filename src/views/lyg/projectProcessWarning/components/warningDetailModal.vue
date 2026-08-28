<!-- <template>
  <vxe-modal
    ref="dialogFormRef"
    v-model="modalRef.isShow"
    :destroy-on-close="true"
    :title="modalRef.title"
    :width="800"
    :close-on-press-escape="false"
    @close="closeHandle"
  >
    <el-form label-suffix=" : " ref="rmarkDataRef" :rules="rules" label-width="160px" label-position="right" :model="rmarkData">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="预警环节" prop="yjhj">
            <el-input :maxlength="120" clearable resize="none" v-model.trim="rmarkData.yjhj" placeholder="请输入预警环节"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="预警时间周期(天)" prop="yjzq">
            <el-input
              :maxlength="10"
              type="number"
              clearable
              resize="none"
              v-model.trim="rmarkData.yjzq"
              placeholder="请输入预警时间周期(天)"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="状态" prop="status">
            <el-switch v-model="rmarkData.status" active-value="1" inactive-value="0" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="bz">
            <el-input :maxlength="256" clearable resize="none" v-model.trim="rmarkData.bz" placeholder="请输入备注"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div style="text-align: center">
      <el-button size="mini" type="primary" plain @click="pushMsgHandle">保 存</el-button>
      <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
    </div>
  </vxe-modal>
</template>
<script lang="ts">
export default {
  name: 'warningDetailModal'
}
</script>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const modalRef = reactive<any>({ isShow: false, title: '' })
const rmarkDataRef = ref()
const rmarkData = ref<any>({})
const 
const rules = {
  yjhj: [{ required: true, message: '请输入预警环节', trigger: 'input' }],
  yjzq: [{ required: true, message: '请输入预警时间周期(天)', trigger: 'input' }]
}
// 关闭
const closeHandle = async () => {
  rmarkDataRef.value.resetFields()
  modalRef.isShow = false
}
//保存
const pushMsgHandle = async () => {
  const result = await rmarkDataRef.value.validate()
  try {
    if (result) {
      let res: any = await processLockSave(rmarkData.value)
      if (res.success) {
        ElMessage.success(`${modalRef.title}成功`)
        closeHandle()
      } else {
        ElMessage.error(res.msg)
      }
    }
  } catch (error: any) {
    console.error(error.toString())
  }
}
</script> -->
