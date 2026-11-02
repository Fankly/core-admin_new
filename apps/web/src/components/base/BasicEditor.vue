<template>
  <div style="border: 1px solid #ccc; margin-top: 10px">
    <Toolbar :editor="editorRef" :default-config="toolbarConfig" :mode="mode" style="border-bottom: 1px solid #ccc"></Toolbar>
    <Editor
      :default-config="editorConfig"
      :mode="mode"
      v-model="valueHtml"
      style="height: 300px; overflow-y: hidden"
      @onCreated="handleCreated"
    ></Editor>
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor } from '@wangeditor/editor'
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import { uploadAttachOnly } from '@/api/metrics/index'
defineOptions({ name: 'BasicEditor' })

const editorRef = shallowRef<IDomEditor>()
// 'group-image' 图片
const toolbarConfig = {
  //去除的工具icon：代办,emo表情,超链接,视频,代码块,排除,插入表格,引用
  excludeKeys: ['todo', 'emotion', 'insertLink', 'group-video', 'codeBlock', 'fullScreen', 'insertTable', 'blockquote']
}
const mode = 'default'
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await uploadAttachOnly(formData)
        const url = `${window.location.origin}/budget-process/sys/menuConfig/downloadFj?fileName=${file.name}&uuid=${String(res.data)}`
        const alt = file.name
        const href = url
        insertFn(url, alt, href)
      }
    },
    fileName: 'file',
    maxFileSize: 5 * 1024 * 1024,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
    pasteignoreimg: true
  }
}

const valueHtml = ref('')

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => editorRef.value?.destroy())

defineExpose({
  editorRef,
  valueHtml
})
</script>

<style scoped></style>
