# OfficePreview

用于前端预览 PDF、DOCX、DOC、XLSX、XLS、ET（WPS 表格）。

- **PDF**：浏览器内置预览（`iframe` + `blob:` URL），**不安装** `@file-viewer/renderer-pdf` / PDF.js
- **Word / Excel**：基于 [file-viewer](https://github.com/flyfish-dev/file-viewer) 的 `@file-viewer/core` + `@file-viewer/renderer-word` + `@file-viewer/renderer-spreadsheet`

组件统一处理 URL / 本地文件 / 二进制数据、文件头校验与体积上限。

## 依赖

```bash
npm i @file-viewer/core @file-viewer/renderer-word @file-viewer/renderer-spreadsheet
```

> 项目当前为 Vue 3.2 + Vite 2 + TypeScript 4.3，未使用 `@file-viewer/vue3`（要求 Vue ≥3.3）和 `@file-viewer/vite-plugin`（要求 Vite ≥5）。在 `OfficePreview` 内通过 `mountViewer` 接入。
>
> `@file-viewer` 官方 `.d.ts` 使用了 TS 4.5+ 的 `import { type X }` 语法，会在本项目 TS 4.3 下报 `TS1005`。
> - 类型：`tsconfig paths` → `src/types/file-viewer/*` + 组件内 `fileViewerTypes.ts`
> - 运行时：`vite resolve.alias` → `node_modules` 真包（覆盖 paths 桩）
> - 加载：`fileViewerLoader.ts` 动态 `import`，避免首屏同步拉包

Word / Excel 默认 **关闭 Worker**（主线程渲染），无需拷贝 `public/file-viewer` 静态资源。若以后需要 Worker，再部署 vendor 资源并在 `docxOptions` / `excelOptions` 中开启。

## 基本用法

```vue
<template>
  <OfficePreview
    :src="previewSource"
    file-type="word"
    file-name="项目说明.docx"
    height="600px"
    @rendered="handleRendered"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import OfficePreview, { OfficePreviewSource } from '@/components/OfficePreview'

const previewSource = shallowRef<OfficePreviewSource>(null)
</script>
```

`src` 支持 URL、`File`、`Blob`、`ArrayBuffer`、`Uint8Array`。带登录鉴权的接口建议通过项目请求工具按 `responseType: 'blob'` 下载后，把 Blob 传给组件：

```ts
import http from '@/utils/http'

const response = await http({
  url: '/admin/files/123/preview',
  method: 'get',
  responseType: 'blob'
})
previewSource.value = response as unknown as Blob
```

公开 URL 或不依赖项目 Axios 拦截器的地址可以直接传给 `src`。这时可通过 `request-options` 传递 Fetch 参数：

```vue
<OfficePreview
  src="https://files.example.com/report.pdf"
  file-type="pdf"
  :request-options="{ credentials: 'include' }"
/>
```

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `src` | `string \| File \| Blob \| ArrayBuffer \| Uint8Array` | - | 预览数据源 |
| `fileType` | `pdf \| word \| excel \| docx \| doc \| xlsx \| xls \| et` | 自动推断 | 无扩展名 URL/Blob 建议显式传入 |
| `fileName` | `string` | - | 辅助推断类型 |
| `height` | `string \| number` | `100%` | 数字按 px 处理 |
| `emptyText` | `string` | `暂无可预览文件` | 空状态文案 |
| `requestOptions` | `RequestInit` | - | URL 下载时传给 Fetch |
| `docxOptions` | `object` | `{ worker: false }` | 透传 file-viewer docx |
| `excelOptions` | `object` | `{ worker: false }` | 透传 file-viewer spreadsheet |
| `pdfOptions` | `object` | - | 浏览器内置 PDF 查看器的初始 `pageMode` / `zoom` 参数 |
| `toolbar` | `boolean \| object` | `false` | file-viewer 工具栏开关或操作配置 |

组件会触发 `loading-change`、`rendered`、`error` 事件，并通过组件实例暴露 `reload()`。

## 渲染方式

| 类型 | 渲染方式 | 说明 |
| --- | --- | --- |
| PDF | `iframe` + blob URL | 不引入 PDF.js / renderer-pdf |
| DOCX / DOC | `@file-viewer/renderer-word` | 支持 OpenXML 与部分二进制 DOC |
| XLSX / XLS / ET | `@file-viewer/renderer-spreadsheet` | `et` 不在引擎扩展名表内，组件按文件头映射为 `xls`（OLE）或 `xlsx`（ZIP）后渲染 |

### 文件头优先于扩展名

后端做格式转换时通常沿用原文件名，扩展名会和真实内容不一致。组件先读文件头再决定渲染器，扩展名与内容冲突时**以内容为准**：

| 声明（`fileType` / `fileName`） | 实际内容 | 组件行为 |
| --- | --- | --- |
| `doc` / `docx` / `word` | PDF（`%PDF-`） | 走 PDF 分支，用浏览器内置查看器渲染，`rendered` 事件抛 `pdf` |
| `doc` | OpenXML（ZIP） | 按 `docx` 交给 word 渲染器 |
| `docx` | 旧版二进制（OLE） | 按 `doc` 交给 word 渲染器 |
| `xls` | OpenXML（ZIP） | 按 `xlsx` 交给 spreadsheet 渲染器 |
| `xlsx` / `et` | 旧版二进制（OLE） | 按 `xls` 交给 spreadsheet 渲染器 |

所以后端把 doc 转成 PDF 后，前端调用方**不需要改动**：仍按原文件名传 `fileName`（如 `项目说明.doc`）即可正常预览；只在文件名声明为 PDF 而内容不是 PDF 时报「文件内容不是有效的 PDF」。

`fileType` 只用于 ZIP 容器的语义消歧（docx 与 xlsx 文件头相同），不会覆盖 PDF 的文件头判定。

## 后端接口要求

后端不需要安装 Office 或 OnlyOffice，只需返回原始文件二进制流，不能用 JSON 包一层，也不建议返回 Base64。推荐响应头如下：

| 文件 | Content-Type |
| --- | --- |
| PDF | `application/pdf` |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| XLSX | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| XLS | `application/vnd.ms-excel` |
| ET（WPS 表格） | `application/vnd.ms-excel.et` 或 `application/vnd.ms-excel` |

DOC 已由后端转换为 PDF 时，响应体是 PDF 二进制，`Content-Type` 建议改成 `application/pdf`；文件名沿用 `.doc` 也能正常预览（组件按文件头识别），但把 `filename*` 一并改成 `.pdf` 更利于下载与排查。

同时建议设置：

```http
Content-Disposition: inline; filename*=UTF-8''report.xlsx
Content-Length: 123456
```

前后端跨域时还需允许 `GET/OPTIONS`，并暴露 `Content-Disposition` 响应头。
