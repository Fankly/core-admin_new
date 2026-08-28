<template>
  <div style="border: 1px solid #ccc; margin-top: 10px">
    <Toolbar
      :editor="(editorRef as any)"
      :default-config="toolbarConfig"
      :mode="mode"
      style="border-bottom: 1px solid #ccc"
    ></Toolbar>
    <Editor
      :default-config="editorConfig"
      :mode="mode"
      v-model="valueHtml"
      style="height: 200px; overflow-y: hidden"
      @onCreated="handleCreated"
    ></Editor>
  </div>
</template>

<script setup lang="ts" name="BasicEditor">
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import {uploadAttachOnly} from '@/api/metrics/index'
import baseService from "@/service/baseService";

const editorRef = shallowRef<InstanceType<typeof Editor>>()
  // 'group-image' 图片
const toolbarConfig = {
  //去除的工具icon：代办,emo表情,超链接,视频,代码块,排除,插入表格,引用
  excludeKeys:['todo','emotion','insertLink','group-video','codeBlock','fullScreen','insertTable','blockquote'] 
}
const mode = 'default'
const editorConfig = { placeholder: '请输入内容...',
MENU_CONF:{
  uploadImage:{
    async customUpload(file: any,insertFn: any){
      const formData = new FormData();
      formData.append("file", file);
      let res: any = await uploadAttachOnly(formData)
      const url =  `${window.location.origin}/budget-process/sys/menuConfig/downloadFj?fileName=${file.name}&uuid=${res.data}`
      const alt = file.name;
      const href = url
      insertFn(url,alt,href)
    }
  },
  fileName:'file',
  maxFileSize:5*1024*1024,
  allowedFileTypes:['image/jpeg','image/png','image/gif','image/bmp','image/webp'],
  pasteignoreimg:true
} }

const valueHtml = ref('')

const handleCreated = (editor: InstanceType<typeof Editor>) => {
  editorRef.value = editor
}

defineExpose({
  editorRef,
  valueHtml
})
</script>

<style scoped></style>
