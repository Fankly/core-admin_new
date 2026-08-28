<template>
  <el-input v-model="text" :title="text" readonly="true">
    <template #append>
      <el-button @click="addData" icon="el-icon-circle-plus-outline" />
    </template>
  </el-input>
  <el-dialog v-model="dialogVisible" width="30%" :show-close="false" :close-on-click-modal="false">
    <el-input type="textarea" v-model="ids" rows="10"></el-input>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="determine">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { defineComponent, reactive } from 'vue'
export default defineComponent({
  setup() {
    return reactive({
      text: '',
      array: [],
      newArr: [],
      ids: '',
      dialogVisible: false
    })
  },

  methods: {
    addData() {
      this.dialogVisible = true
    },
    cancel() {
      this.dialogVisible = false
    },
    determine() {
      if (this.ids) {
        let str = this.ids.replace(/\n/g, ',')
        this.text = str
        this.array = str.split(',')
        if (this.array.length !== 0) this.newArr = this.array.map((item) => item.padStart(10, '0'))
        this.dialogVisible = false
      } else {
        this.clear()
        this.dialogVisible = false
      }
    },
    setValue(data) {
      this.ids = data
      this.determine()
    },
    clear() {
      this.text = ''
      this.array = []
      this.ids = ''
      this.newArr = []
    }
  }
})
</script>
<style lang="less" scoped></style>
