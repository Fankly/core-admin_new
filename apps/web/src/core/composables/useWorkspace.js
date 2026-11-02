import projectConfig from '@/core/config'
import { buildGetUrl } from '@/core/http/requestUrl.js'
import { getToken, getAppId } from '@/utils'
import httpUtil from '@/core/http/index.js'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'
/**
 * 解析返回的上传文件数据
 * @param {String} jsonData 上传文件数据，[{name, downloadUri, filename}]
 * @param {Object} params 上传文件的参数
 * @returns {Array} 上传文件信息，[{name, downloadUri, filename, url}]
 */
import { reactive, toRef, toRefs, useTemplateRef } from 'vue'
import componentStore from '@/store/business'
import { onMounted, onActivated, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { CwProject, FinanceReserveNotice, CwCategoryInvest } from '@/api/mainController'
const padDatePart = (value) => String(value).padStart(2, '0')
const formatDate = (date, format = 'yyyy-MM-dd') => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return undefined
  const replacements = {
    yyyy: date.getFullYear(),
    MM: padDatePart(date.getMonth() + 1),
    dd: padDatePart(date.getDate()),
    HH: padDatePart(date.getHours()),
    mm: padDatePart(date.getMinutes()),
    ss: padDatePart(date.getSeconds())
  }
  return Object.keys(replacements).reduce((result, key) => result.replace(key, replacements[key]), format)
}
const parseDate = (value) => {
  if (value instanceof Date) return value
  if (typeof value !== 'string') return undefined
  const parsed = new Date(value.replace(/\//g, '-'))
  return isNaN(parsed.getTime()) ? undefined : parsed
}
const allowStatsType = ['time', 'datetime', 'day', 'month', 'year']
/**
 * 日期相关方法
 */
const isImage = (fileName) => {
  return /\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName)
}
export function useUpload() {
  function parseUploadData(jsonData, params) {
    let pathList = []
    if (jsonData != null) {
      try {
        pathList = JSON.parse(jsonData)
      } catch (e) {
        console.error(e)
      }
    }
    return Array.isArray(pathList)
      ? pathList.map((item) => {
          let downloadParams = {
            ...params
          }
          downloadParams.filename = item.filename
          return {
            ...item,
            url: getUploadFileUrl(item, downloadParams)
          }
        })
      : []
  }
  /**
   * 获得上传文件url列表
   * @param {*} jsonData 上传文件数据，[{name, downloadUri, filename}]
   * @param {*} params 上传文件的参数
   * @returns {Array} 文件url列表
   */
  function getPictureList(jsonData, params) {
    let tempList = parseUploadData(jsonData, params)
    if (Array.isArray(tempList)) {
      return tempList.map((item) => item.url)
    } else {
      return []
    }
  }
  /**
   * 将选中文件信息格式化成json信息
   * @param {Array} fileList 上传文件列表，[{name, fileUrl, data}]
   */
  function fileListToJson(fileList) {
    if (Array.isArray(fileList)) {
      return JSON.stringify(
        fileList.map((item) => {
          return {
            name: item.name,
            downloadUri: item.downloadUri || item.response.data.downloadUri,
            filename: item.filename || item.response.data.filename,
            uploadPath: item.uploadPath || item.response.data.uploadPath
          }
        })
      )
    } else {
      return undefined
    }
  }
  /**
   * 获得上传文件url
   * @param {*} item 上传文件
   * @param {*} params 上传文件的参数
   */
  function getUploadFileUrl(item, params) {
    if (item == null || item.downloadUri == null) {
      return null
    } else {
      let menuIdJsonStr = window.sessionStorage.getItem('currentMenuId')
      let currentMenuId
      if (menuIdJsonStr != null) {
        currentMenuId = (JSON.parse(menuIdJsonStr) || {}).data
      }
      params.Authorization = getToken()
      params.MenuId = currentMenuId
      params.AppCode = getAppId()
      return buildGetUrl(item.downloadUri, params)
    }
  }
  function filterEmptyValues(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null && value !== undefined && value !== ''))
  }
  async function getUploadFileUrlByFetch(item, bodyParams = {}, headers = {}) {
    if (item == null || item.downloadUri == null) {
      return null
    }
    let menuIdJsonStr = window.sessionStorage.getItem('currentMenuId')
    let currentMenuId
    if (menuIdJsonStr != null) {
      currentMenuId = (JSON.parse(menuIdJsonStr) || {}).data
    }
    const requestUrl = buildGetUrl(item.downloadUri, {})
    // 合并固定请求头和传入的headers
    const finalHeaders = {
      'Content-Type': 'application/json',
      Authorization: getToken(),
      MenuId: currentMenuId,
      AppCode: getAppId(),
      ...headers // 合并用户传入的headers
    }
    try {
      // 发送带请求头的fetch请求
      const response = await fetch(requestUrl, {
        // method: 'GET',
        method: 'POST',
        headers: filterEmptyValues(finalHeaders),
        body: JSON.stringify(bodyParams)
      })
      if (!response.ok) {
        console.error('图片请求失败:', response.status)
        return null
      }

      // 将响应转为Blob并生成URL
      const blob = await response.blob()
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('图片加载异常:', error)
      return null
    }
  }
  /**
   * 获得上传接口
   * @param {*} url 上传路径
   */
  function getUploadActionUrl(url) {
    if (url != null && url[0] === '/') {
      url = url.substr(1)
    }
    return projectConfig.baseUrl + url
  }
  /**
   * 上传文件是否图片文件
   * @param {*} file 上传文件
   */
  function pictureFile(file) {
    if (['image/jpeg', 'image/jpg', 'image/png'].indexOf(file.type) !== -1) {
      return true
    } else {
      ElMessage.error('图片文件格式不正确，请重新选择')
      return false
    }
  }
  const getUploadHeaders = computed(() => {
    let token = getToken()
    let appId = getAppId()
    let menuIdJsonStr = window.sessionStorage.getItem('currentMenuId')
    let currentMenuId
    if (menuIdJsonStr != null) {
      currentMenuId = (JSON.parse(menuIdJsonStr) || {}).data
    }
    let header = {
      Authorization: token,
      MenuId: currentMenuId
    }
    if (appId != null && appId !== '') header.AppCode = appId
    return header
  })
  return {
    parseUploadData,
    getPictureList,
    fileListToJson,
    getUploadFileUrl,
    filterEmptyValues,
    getUploadFileUrlByFetch,
    getUploadActionUrl,
    pictureFile,
    getUploadHeaders
  }
}
export function useUploadCustom() {
  const uploadFileRef = useTemplateRef('uploadFile')
  const componentData = reactive({
    uploadLoading: false,
    uploadList: [],
    maxSizeMap: {
      // 压缩文件
      'application/zip': 1024 * 1024 * 1024,
      // .zip 最大 1GB
      'application/x-zip-compressed': 1024 * 1024 * 1024,
      // .zip 最大 1GB (兼容旧版)
      'application/x-rar-compressed': 1024 * 1024 * 1024,
      // .rar 最大 1GB

      // Microsoft Office 文件
      'application/msword': 1024 * 1024 * 1024,
      // .doc 最大 1GB
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 1024 * 1024 * 1024,
      // .docx 最大 1GB
      'application/vnd.ms-excel': 1024 * 1024 * 1024,
      // .xls 最大 1GB
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 1024 * 1024 * 1024,
      // .xlsx 最大 1GB

      // Adobe 文件
      'application/pdf': 1024 * 1024 * 1024,
      // .pdf 最大 1GB

      // 图片文件
      'image/png': 1024 * 1024 * 1024,
      // .png 最大 1GB
      'application/vnd.ms-excel.et': 1024 * 1024 * 1024 // .et 最大 1GB
    },
    extToMimeType: {
      '.zip': ['application/zip', 'application/x-zip-compressed'],
      '.rar': ['application/x-rar-compressed'],
      '.doc': ['application/msword'],
      '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      '.xls': ['application/vnd.ms-excel'],
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.pdf': ['application/pdf'],
      '.png': ['image/png'],
      '.et': ['application/vnd.ms-excel.et', 'application/octet-stream'] // WPS表格格式
    }
  })
  componentData.uploadCallback = undefined
  function handleUploadList() {}
  function handlePreview(file, fieldName, downloadCallback = () => {}) {
    if (file.raw) {
      const fileUrl = URL.createObjectURL(file.raw)
      const link = document.createElement('a')
      link.href = fileUrl // Blob URL
      link.download = file.name // 设置下载文件名
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const obj = {
        // id: this.dataValue.id,
        filename: file.name,
        fieldName,
        // 'supportDoc',
        asImage: isImage(file.name)
      }
      // CwProjectClosure.download(this, obj, 'get');
      downloadCallback(obj)
    }
  }
  function onUploadLimit() {}
  function onRemove(file, fileList) {
    // this.dataValue.supportDoc = fileList; // 维护 fileList
    // this.uploadList = fileList;
    handleUploadList(fileList)
  }
  function customUpload({ file, fieldName, url, params }, callback = () => {}) {
    const formData = new FormData()
    formData.append('fieldName', fieldName) // 文件
    formData.append('uploadFile', file) // 文件
    formData.append('asImage', file.type.startsWith('image/')) // 额外参数
    if (params) {
      Object.keys(params).forEach((key) => {
        formData.append(key, params[key]) // 文件
      })
    }
    httpUtil
      .fetchUpload(url, {}, formData)
      .then((res) => {
        if (res.success) {
          // this.uploadList.push({ name: res.data.filename });
          handleUploadList(
            {
              name: res?.data?.filename
            },
            'add'
          )
          callback?.(res)
          ElMessage.success('上传成功')
        } else {
          ElMessage.error(res.errorMessage)
        }
        componentData.uploadLoading = false
      })
      .catch(() => {
        componentData.uploadLoading = false
      })
  }
  function onUploadSuccess(response, file, fileList) {
    console.log('response', response)
    if (response.success) {
      ElMessage.success('上传成功')
      //  上传成功回调
      if (componentData.uploadCallback && typeof componentData.uploadCallback === 'function') {
        componentData.uploadCallback(response)
        componentData.uploadCallback = null // 重置回调
      }
    } else {
      ElMessage.error(response.errorMessage)
    }
    componentData.uploadLoading = false
    uploadFileRef.value.clearFiles()
  }
  function onUploadError(e, file, fileList) {
    componentData.uploadLoading = false
    ElMessage.error('文件上传失败')
  }
  // 获取文件扩展名
  function getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.')
    return lastDot === -1 ? '' : filename.slice(lastDot).toLowerCase()
  }
  // 根据扩展名获取MIME类型
  function getMimeTypeByExtension(filename) {
    const ext = getFileExtension(filename)
    return componentData.extToMimeType[ext]?.[0] || ''
  }
  function onBeforeUpload(file) {
    // 优先使用file.type，如果为空则通过扩展名获取
    const fileType = file.type || getMimeTypeByExtension(file.name)
    const maxSize = componentData.maxSizeMap[fileType]

    // 1. 检查文件类型
    if (!maxSize) {
      ElMessage.error('仅支持上传 .rar .zip .doc .docx .xls .xlsx .pdf .png 文件！')
      return false
    }

    // 2. 检查文件大小
    if (file.size > maxSize) {
      ElMessage.error(`文件大小超出限制，${file.name} 最大不能超过 ${maxSize / (1024 * 1024)}MB！`)
      return false
    }
    componentData.uploadLoading = true
    return true
  }
  return {
    handleUploadList,
    handlePreview,
    onUploadLimit,
    onRemove,
    customUpload,
    onUploadSuccess,
    onUploadError,
    getFileExtension,
    getMimeTypeByExtension,
    onBeforeUpload,
    ...toRefs(componentData)
  }
}
export function useStatsDateRange() {
  /**
   * 根据输入的日期获得日期范围（例如：输入2019-12-12，输出['2019-12-12 00:00:00', '2019-12-12 23:59:59']）
   * @param {Date|String} date 要转换的日期
   * @param {String} statsType 转换类型（day, month, year）
   * @param {String} format 输出格式
   */
  function getDateRangeFilter(date, statsType = 'day', format = 'yyyy-MM-dd HH:mm:ss') {
    if (date == null) return []
    statsType = allowStatsType.indexOf(statsType) === -1 ? 'day' : statsType
    date = date.substr(0, date.indexOf(' '))
    let tempList = date.split('-')
    let year = Number.parseInt(tempList[0])
    let month = Number.parseInt(tempList[1])
    let day = Number.parseInt(tempList[2])
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return []
    }
    let tempDate = new Date(year, month - 1, day)
    // 判断是否正确的日期
    if (isNaN(tempDate.getTime())) return []
    tempDate.setHours(0, 0, 0, 0)
    let retDate
    switch (statsType) {
      case 'day':
        retDate = [new Date(tempDate), new Date(tempDate.setDate(tempDate.getDate() + 1))]
        break
      case 'month':
        tempDate.setDate(1)
        retDate = [new Date(tempDate), new Date(tempDate.setMonth(tempDate.getMonth() + 1))]
        break
      case 'year':
        tempDate.setDate(1)
        tempDate.setMonth(0)
        retDate = [new Date(tempDate), new Date(tempDate.setFullYear(tempDate.getFullYear() + 1))]
    }
    retDate[1] = new Date(retDate[1].getTime() - 1)
    return [formatDate(retDate[0], format), formatDate(retDate[1], format)]
  }
  /**
   * 格式化日期
   * @param {Date|String} date 要格式化的日期
   * @param {String} statsType 输出日期类型
   * @param {String} format 输入日期的格式
   */
  function formatDateByStatsType(date, statsType = 'day', format = 'yyyy-MM-dd') {
    if (date == null) return undefined
    if (statsType == null) return date
    statsType = allowStatsType.indexOf(statsType) === -1 ? 'day' : statsType
    if (statsType === 'datetime') format = 'yyyy-MM-dd HH:mm:ss'
    let tempDate = date instanceof Date ? date : parseDate(date, format)
    if (!tempDate) return undefined
    switch (statsType) {
      case 'time':
        return formatDate(tempDate, 'HH:mm:ss')
      case 'datetime':
        return formatDate(tempDate, 'yyyy-MM-dd HH:mm:ss')
      case 'day':
        return formatDate(tempDate, 'yyyy-MM-dd')
      case 'month':
        return formatDate(tempDate, 'yyyy-MM')
      case 'year':
        return formatDate(tempDate, 'yyyy')
      default:
        return formatDate(tempDate, 'yyyy-MM-dd')
    }
  }
  function formatDateTime(timestamp) {
    if (timestamp) {
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0') // 月份是从0开始的
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    }
  }
  /**
   * 获得统计类型中文名称
   * @param {String} statsType 统计类型（day, month, year）
   */
  function getStatsTypeShowName(statsType) {
    statsType = allowStatsType.indexOf(statsType) === -1 ? 'day' : statsType
    switch (statsType) {
      case 'day':
        return '日统计'
      case 'month':
        return '月统计'
      case 'year':
        return '年统计'
    }
  }
  /**
   * 获取统计类型字典列表
   * @param {Array} statsTypeList 统计类型列表
   */
  function getAllowStatsTypeList(statsTypeList) {
    if (Array.isArray(statsTypeList) && statsTypeList.length > 0) {
      return statsTypeList.map((item) => {
        return {
          id: item,
          name: getStatsTypeShowName(item)
        }
      })
    } else {
      return []
    }
  }
  return {
    getDateRangeFilter,
    formatDateByStatsType,
    formatDateTime,
    getStatsTypeShowName,
    getAllowStatsTypeList
  }
}
export function useProjectConfig() {
  const openAdmin = computed(() => {
    console.log(projectConfig)
    return projectConfig.openAdmin
  })
  return {
    openAdmin
  }
}
export function useCachedPage(onResume = () => {}) {
  const componentInstance = getCurrentInstance().proxy
  const route = useRoute()
  function addCachePage(payload) {
    return componentStore.commit('addCachePage', payload)
  }
  function removeCachePage(payload) {
    return componentStore.commit('removeCachePage', payload)
  }
  /**
   * 从跳转页面返回并且刷新当前页面时调用
   */

  onMounted(() => {
    route.meta.refresh = false
  })
  onActivated(() => {
    if (route && route.meta && route.meta.refresh) {
      onResume()
    }
    route.meta.refresh = true
  })
  ;(() => {
    addCachePage(componentInstance.$options.name)
  })()
  return {
    addCachePage,
    removeCachePage,
    onResume
  }
}
export function useCachedSinglePage(componentProps) {
  const route = useRoute()
  const router = useRouter()
  const componentData = reactive({
    savedKey: undefined
  })
  function removeTag(payload) {
    return componentStore.commit('removeTag', payload)
  }
  function routerPush(params) {
    router.push({
      ...params,
      query: {
        ...params.query,
        _origin: params.query?._origin || route.name
      }
    })
  }
  function singlePageReload(callback = () => {}) {
    if (componentProps._key != componentData.savedKey) {
      callback()
      componentData.savedKey = componentProps._key
    }
  }
  // true触发刷新
  function oncancel(bool) {
    const id = getCurrentMenuId.value
    if (componentProps._origin) {
      router.push({
        name: componentProps._origin,
        params: {
          _key: bool ? Date.now() : componentProps._key
        }
      })
    }
    setTimeout(() => {
      removeTag(id)
    }, 500)
  }
  function refreshUrlParams() {
    const hash = window.location.hash // `#/path?name=John`

    // 拆分路径和参数
    const [path, search] = hash.split('?') // `#/path` 和 `name=John`

    // 初始化 URLSearchParams
    const params = new URLSearchParams(search || '')

    // 修改或添加参数
    params.set('_key', Date.now()) // 修改 name 参数

    // 构建新的 Hash
    const newHash = `${path}?${params.toString()}` // `#/path?name=Jane&city=NewYork`

    // 更新 URL
    window.history.replaceState({}, '', `${window.location.pathname}${newHash}`)
  }
  const getCurrentMenuId = computed(() => componentStore.getters.getCurrentMenuId)
  return {
    removeTag,
    getCurrentMenuId,
    routerPush,
    singlePageReload,
    oncancel,
    refreshUrlParams,
    ...toRefs(componentData)
  }
}
export function useCategorys() {
  const componentInstance = getCurrentInstance().proxy
  const componentData = reactive({
    categorysKeyValue: {
      year: ['batchId', 'categoryId', 'keyInvestId', 'courseTitleId'],
      batchId: ['categoryId', 'keyInvestId', 'courseTitleId'],
      categoryId: ['keyInvestId', 'courseTitleId'],
      keyInvestId: ['courseTitleId'],
      courseTitleId: []
    },
    selectImpl: {
      year: [],
      batchId: [],
      categoryId: [],
      keyInvestId: [],
      courseTitleId: []
    }
  })
  function handleCategoryEventChange(dataValue, key, value, callback = () => {}) {
    dataValue = {
      ...dataValue,
      [key]: value
    }
    componentData.categorysKeyValue[key].forEach((k) => {
      dataValue[k] = null
      componentData.selectImpl[k] = []
    })
    const [nextKey] = componentData.categorysKeyValue[key]
    if (nextKey && value != null && value != '') {
      callback((res) => {
        componentData.selectImpl = {
          ...componentData.selectImpl,
          [nextKey]: res
        }
      })
    }
    return dataValue
  }
  function handleCategoryChange(dataValue, key, value) {
    dataValue = {
      ...dataValue,
      [key]: value
    }
    componentData.categorysKeyValue[key].forEach((k) => {
      dataValue[k] = null
      componentData.selectImpl[k] = []
    })
    const [nextKey] = componentData.categorysKeyValue[key]
    if (nextKey) {
      getCategorys(dataValue[key], (res) => {
        componentData.selectImpl = {
          ...componentData.selectImpl,
          [nextKey]: res
        }
      })
    }
    return dataValue
  }
  async function getDefaultCategory(dataValue, flag) {
    let { year, batchId, categoryId, keyInvestId, courseTitleId } = dataValue || {}
    await yearList({}, (res) => {
      componentData.selectImpl = {
        ...componentData.selectImpl,
        year: res.map((item) => ({
          label: item,
          value: item
        }))
      }
    })
    if (year) {
      // taskstatus: 1
      await getFinanceReserveNotice(
        {
          financeReserveNoticeDtoFilter: {
            taskstatus: flag ? 1 : null,
            year
          }
        },
        (res) => {
          componentData.selectImpl = {
            ...componentData.selectImpl,
            batchId: res.dataList
          }
        }
      )
    }
    if (batchId) {
      batchId = typeof batchId == 'string' ? batchId : batchId.join(',')
      // const [{ cwCategoryId }] = this.selectImpl.batchId.filter(item => item.reserveId == batchId);
      const array = componentData.selectImpl.batchId.filter((item) => batchId.indexOf(item.reserveId) > -1)
      if (array && array.length > 0) {
        // const cwCategoryId = array.map(item => item.cwCategoryId).join(',');
        const cwCategoryId = array.map((item) => item.cwCategoryId)?.[0]
        await getCategorys(cwCategoryId, (res) => {
          componentData.selectImpl = {
            ...componentData.selectImpl,
            categoryId: res
          }
        })
      }
    }
    if (categoryId) {
      if (componentData.selectImpl.categoryId.length > 0 && componentData.selectImpl.categoryId.find((item) => item.id == categoryId)) {
        await getCwCategoryInvest(categoryId, (res) => {
          componentData.selectImpl = {
            ...componentData.selectImpl,
            keyInvestId: res
          }
        })
      } else {
        ElMessage.warning('类型模版已发生变更，请重新选择类型、重点投向及预算事项')
        categoryId = null
        keyInvestId = null
        courseTitleId = null
        dataValue.categoryId = null
        dataValue.keyInvestId = null
        dataValue.courseTitleId = null
      }
    }
    if (keyInvestId) {
      if (componentData.selectImpl.keyInvestId.length > 0 && componentData.selectImpl.keyInvestId.find((item) => item.id == keyInvestId)) {
        await getCwCategoryInvestItemsList(keyInvestId, (res) => {
          componentData.selectImpl = {
            ...componentData.selectImpl,
            courseTitleId: res
          }
        })
      } else {
        ElMessage.warning('重点投向已发生变更，请重新选择重点投向及预算事项')
        keyInvestId = null
        courseTitleId = null
        dataValue.keyInvestId = null
        dataValue.courseTitleId = null
      }
    }
    if (courseTitleId && !componentData.selectImpl.courseTitleId.find((item) => item.id == courseTitleId)) {
      ElMessage.warning('预算事项已发生变更，请重新选择预算事项')
      courseTitleId = null
      dataValue.courseTitleId = null
    }
    if (dataValue && (!batchId || batchId.length == 0) && componentData.selectImpl.batchId.length > 0) {
      // dataValue.batchId = [this.selectImpl.batchId?.[0].reserveId].filter(item => item);
      const array = componentData.selectImpl.batchId.filter((item) => item.reserveId == dataValue.batchId)
      if (array) {
        dataValue = handleCategoryEventChange(dataValue, 'batchId', dataValue.batchId, (callback) => {
          // const cwCategoryId = array.map(item => item.cwCategoryId).join(',');
          const cwCategoryId = array.map((item) => item.cwCategoryId)?.[0]
          getCategorys(cwCategoryId, (res) => {
            callback(res)
          })
        })
      }
    }
    return dataValue
  }
  // 储备批次数据
  function yearList(params, callback = () => {}) {
    return FinanceReserveNotice.yearList(componentInstance, params, null, {
      showMask: false
    }).then((res) => {
      callback(res.data)
    })
  }
  function getCategorys(parentId, callback = () => {}) {
    return CwProject.categorys(
      componentInstance,
      {
        parentId
      },
      null,
      {
        showMask: false
      }
    ).then((res) => {
      callback(res.data)
    })
  }
  // 储备批次数据
  function getFinanceReserveNotice(params, callback = () => {}) {
    return FinanceReserveNotice.list(componentInstance, params, null, {
      showMask: false
    }).then((res) => {
      callback(res.data)
    })
  }
  // 查询重点投向
  function getCwCategoryInvest(parentId, callback = () => {}) {
    let cwCategoryInvestDtoFilter = {
      parentId
    }
    return CwCategoryInvest.list(
      componentInstance,
      {
        cwCategoryInvestDtoFilter
      },
      null,
      {
        showMask: false
      }
    ).then((res) => {
      callback(res.data.dataList)
    })
  }
  //  查询预算事项
  function getCwCategoryInvestItemsList(id, callback = () => {}) {
    return CwCategoryInvest.view(
      componentInstance,
      {
        id
      },
      null,
      {
        showMask: false
      }
    ).then((res) => {
      if (res.data) {
        const { cwCategoryInvestItemsList } = res.data
        callback(cwCategoryInvestItemsList)
      }
    })
  }
  function getCategoryFilter(dataValue, finalCallback = () => {}, obj, options = {}) {
    const filters = [
      {
        tag: 'select',
        prop: 'year',
        label: '储备年份',
        attrs: {
          props: {
            value: 'value',
            label: 'label'
          },
          options: componentData.selectImpl.year || [],
          filterable: true
        },
        listeners: {
          change: (year) => {
            dataValue = handleCategoryEventChange(dataValue, 'year', year, (callback) => {
              getFinanceReserveNotice(
                {
                  financeReserveNoticeDtoFilter: {
                    year,
                    taskstatus: options.taskstatus
                  }
                },
                (res) => {
                  componentData.selectImpl = {
                    ...componentData.selectImpl,
                    batchId: res.dataList
                  }
                }
              )
            })
            finalCallback(dataValue, 'year')

            // if (year) {
            // }
          }
        },
        ...obj
      },
      {
        tag: 'select',
        prop: 'batchId',
        label: '储备批次',
        attrs: {
          props: {
            value: 'reserveId',
            label: 'batchTitle'
          },
          options: componentData.selectImpl.batchId || [],
          filterable: true,
          multiple: options.multiple,
          'collapse-tags': options['collapse-tags']
        },
        listeners: {
          change: (reserveId) => {
            // if (reserveId) {
            // reserveId = typeof reserveId == 'string' ? reserveId : reserveId.join(',');
            // if (reserveId) {
            const array = componentData.selectImpl.batchId.filter((item) => reserveId.indexOf(item.reserveId) > -1)
            if (array) {
              const cwCategoryId = array.map((item) => item.cwCategoryId)?.[0]
              dataValue = handleCategoryEventChange(dataValue, 'batchId', reserveId, (callback) => {
                getCategorys(cwCategoryId, (res) => {
                  callback(res)
                })
              })
              finalCallback(dataValue, 'batchId')
            }
            // }
          }
          // }
        },
        ...obj
      },
      {
        tag: 'select',
        prop: 'categoryId',
        label: '项目类型',
        attrs: {
          props: {
            value: 'id',
            label: 'name',
            checkStrictly: true
          },
          options: componentData.selectImpl.categoryId || [],
          filterable: true
        },
        listeners: {
          change: (categoryId) => {
            dataValue = handleCategoryEventChange(dataValue, 'categoryId', categoryId, (callback) => {
              getCwCategoryInvest(categoryId, (res) => {
                callback(res)
              })
            })
            finalCallback(dataValue, 'categoryId')
          }
        },
        ...obj
      },
      {
        tag: 'select',
        prop: 'keyInvestId',
        label: '重点投向',
        attrs: {
          props: {
            value: 'id',
            label: 'name',
            checkStrictly: true
          },
          options: componentData.selectImpl.keyInvestId || [],
          filterable: true
        },
        listeners: {
          change: (keyInvestId) => {
            dataValue = handleCategoryEventChange(dataValue, 'keyInvestId', keyInvestId, (callback) => {
              getCwCategoryInvestItemsList(keyInvestId, (res) => {
                callback(res)
              })
            })
            finalCallback(dataValue, 'keyInvestId')
          }
        },
        ...obj
      },
      {
        tag: 'select',
        prop: 'courseTitleId',
        label: '预算事项',
        attrs: {
          props: {
            value: 'id',
            label: 'name',
            checkStrictly: true
          },
          options: componentData.selectImpl.courseTitleId || [],
          filterable: true
        },
        listeners: {
          change: (courseTitleId) => {
            dataValue.courseTitleId = courseTitleId
            finalCallback(dataValue, 'courseTitleId')
          }
        },
        ...obj
      }
    ]

    // 根据showProps过滤显示的筛选条件
    if (options.showProps) {
      const showProps = Array.isArray(options.showProps) ? options.showProps : [options.showProps]
      return filters.filter((filter) => showProps.includes(filter.prop))
    }

    // 如果没有showProps，返回所有筛选条件
    return filters
  }
  return {
    handleCategoryEventChange,
    handleCategoryChange,
    getDefaultCategory,
    yearList,
    getCategorys,
    getFinanceReserveNotice,
    getCwCategoryInvest,
    getCwCategoryInvestItemsList,
    getCategoryFilter,
    ...toRefs(componentData)
  }
}
