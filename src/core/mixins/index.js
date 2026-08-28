import projectConfig from '@/core/config'
import { buildGetUrl } from '@/core/http/requestUrl.js'
import { mapMutations, mapGetters } from 'vuex'
import { getToken, getAppId } from '@/utils'

import httpUtil from '@/core/http/index.js'

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

export const isImage = (fileName) => {
  return /\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName)
}

const projectConfigMixin = {
  computed: {
    projectConfig() {
      return projectConfig
    },
    openAdmin() {
      console.log(projectConfig)
      return projectConfig.openAdmin
    }
  }
}

const uploadCustomMixin = {
  data() {
    return {
      uploadLoading: false,
      uploadList: [],
      maxSizeMap: {
        // 压缩文件
        'application/zip': 1024 * 1024 * 1024, // .zip 最大 1GB
        'application/x-zip-compressed': 1024 * 1024 * 1024, // .zip 最大 1GB (兼容旧版)
        'application/x-rar-compressed': 1024 * 1024 * 1024, // .rar 最大 1GB

        // Microsoft Office 文件
        'application/msword': 1024 * 1024 * 1024, // .doc 最大 1GB
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 1024 * 1024 * 1024, // .docx 最大 1GB
        'application/vnd.ms-excel': 1024 * 1024 * 1024, // .xls 最大 1GB
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 1024 * 1024 * 1024, // .xlsx 最大 1GB

        // Adobe 文件
        'application/pdf': 1024 * 1024 * 1024, // .pdf 最大 1GB

        // 图片文件
        'image/png': 1024 * 1024 * 1024, // .png 最大 1GB
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
    }
  },
  methods: {
    handleUploadList() {},
    handlePreview(file, fieldName, downloadCallback = () => {}) {
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
          fieldName, // 'supportDoc',
          asImage: isImage(file.name)
        }
        // CwProjectClosure.download(this, obj, 'get');
        downloadCallback(obj)
      }
    },
    onUploadLimit() {},
    onRemove(file, fileList) {
      // this.dataValue.supportDoc = fileList; // 维护 fileList
      // this.uploadList = fileList;
      this.handleUploadList(fileList)
    },
    customUpload({ file, fieldName, url, params }, callback = () => {}) {
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
            this.handleUploadList({ name: res?.data?.filename }, 'add')
            callback?.(res)
            this.$message.success('上传成功')
          } else {
            this.$message.error(res.errorMessage)
          }
          this.uploadLoading = false
        })
        .catch(() => {
          this.uploadLoading = false
        })
    },
    onUploadSuccess(response, file, fileList) {
      console.log('response', response)
      if (response.success) {
        this.$message.success('上传成功')
        //  上传成功回调
        if (this.uploadCallback && typeof this.uploadCallback === 'function') {
          this.uploadCallback(response)
          this.uploadCallback = null // 重置回调
        }
      } else {
        this.$message.error(response.errorMessage)
      }
      this.uploadLoading = false
      this.$refs.uploadFile.clearFiles()
    },
    onUploadError(e, file, fileList) {
      this.uploadLoading = false
      this.$message.error('文件上传失败')
    },
    // 获取文件扩展名
    getFileExtension(filename) {
      const lastDot = filename.lastIndexOf('.')
      return lastDot === -1 ? '' : filename.slice(lastDot).toLowerCase()
    },
    // 根据扩展名获取MIME类型
    getMimeTypeByExtension(filename) {
      const ext = this.getFileExtension(filename)
      return this.extToMimeType[ext]?.[0] || ''
    },
    onBeforeUpload(file) {
      // 优先使用file.type，如果为空则通过扩展名获取
      const fileType = file.type || this.getMimeTypeByExtension(file.name)
      const maxSize = this.maxSizeMap[fileType]

      // 1. 检查文件类型
      if (!maxSize) {
        this.$message.error('仅支持上传 .rar .zip .doc .docx .xls .xlsx .pdf .png 文件！')
        return false
      }

      // 2. 检查文件大小
      if (file.size > maxSize) {
        this.$message.error(`文件大小超出限制，${file.name} 最大不能超过 ${maxSize / (1024 * 1024)}MB！`)
        return false
      }

      this.uploadLoading = true
      return true
    }
  }
}
/**
 * 上传文件组件相关方法
 */
const uploadMixin = {
  methods: {
    /**
     * 解析返回的上传文件数据
     * @param {String} jsonData 上传文件数据，[{name, downloadUri, filename}]
     * @param {Object} params 上传文件的参数
     * @returns {Array} 上传文件信息，[{name, downloadUri, filename, url}]
     */
    parseUploadData(jsonData, params) {
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
            let downloadParams = { ...params }
            downloadParams.filename = item.filename
            return {
              ...item,
              url: this.getUploadFileUrl(item, downloadParams)
            }
          })
        : []
    },
    /**
     * 获得上传文件url列表
     * @param {*} jsonData 上传文件数据，[{name, downloadUri, filename}]
     * @param {*} params 上传文件的参数
     * @returns {Array} 文件url列表
     */
    getPictureList(jsonData, params) {
      let tempList = this.parseUploadData(jsonData, params)
      if (Array.isArray(tempList)) {
        return tempList.map((item) => item.url)
      } else {
        return []
      }
    },
    /**
     * 将选中文件信息格式化成json信息
     * @param {Array} fileList 上传文件列表，[{name, fileUrl, data}]
     */
    fileListToJson(fileList) {
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
    },
    /**
     * 获得上传文件url
     * @param {*} item 上传文件
     * @param {*} params 上传文件的参数
     */
    getUploadFileUrl(item, params) {
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
    },

    filterEmptyValues(obj) {
      return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null && value !== undefined && value !== ''))
    },

    async getUploadFileUrlByFetch(item, bodyParams = {}, headers = {}) {
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
          headers: this.filterEmptyValues(finalHeaders),
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
    },
    /**
     * 获得上传接口
     * @param {*} url 上传路径
     */
    getUploadActionUrl(url) {
      if (url != null && url[0] === '/') {
        url = url.substr(1)
      }
      return projectConfig.baseUrl + url
    },
    /**
     * 上传文件是否图片文件
     * @param {*} file 上传文件
     */
    pictureFile(file) {
      if (['image/jpeg', 'image/jpg', 'image/png'].indexOf(file.type) !== -1) {
        return true
      } else {
        this.$message.error('图片文件格式不正确，请重新选择')
        return false
      }
    }
  },
  computed: {
    getUploadHeaders() {
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
    }
  }
}

const allowStatsType = ['time', 'datetime', 'day', 'month', 'year']
/**
 * 日期相关方法
 */
const statsDateRangeMixin = {
  methods: {
    /**
     * 根据输入的日期获得日期范围（例如：输入2019-12-12，输出['2019-12-12 00:00:00', '2019-12-12 23:59:59']）
     * @param {Date|String} date 要转换的日期
     * @param {String} statsType 转换类型（day, month, year）
     * @param {String} format 输出格式
     */
    getDateRangeFilter(date, statsType = 'day', format = 'yyyy-MM-dd HH:mm:ss') {
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
    },
    /**
     * 格式化日期
     * @param {Date|String} date 要格式化的日期
     * @param {String} statsType 输出日期类型
     * @param {String} format 输入日期的格式
     */
    formatDateByStatsType(date, statsType = 'day', format = 'yyyy-MM-dd') {
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
    },
    formatDateTime(timestamp) {
      if (timestamp) {
        const date = new Date(timestamp)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0') // 月份是从0开始的
        const day = String(date.getDate()).padStart(2, '0')
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day} ${hour}:${minute}`
      }
    },
    /**
     * 获得统计类型中文名称
     * @param {String} statsType 统计类型（day, month, year）
     */
    getStatsTypeShowName(statsType) {
      statsType = allowStatsType.indexOf(statsType) === -1 ? 'day' : statsType
      switch (statsType) {
        case 'day':
          return '日统计'
        case 'month':
          return '月统计'
        case 'year':
          return '年统计'
      }
    },
    /**
     * 获取统计类型字典列表
     * @param {Array} statsTypeList 统计类型列表
     */
    getAllowStatsTypeList(statsTypeList) {
      if (Array.isArray(statsTypeList) && statsTypeList.length > 0) {
        return statsTypeList.map((item) => {
          return {
            id: item,
            name: this.getStatsTypeShowName(item)
          }
        })
      } else {
        return []
      }
    }
  }
}
/**
 * 页面缓存相关方法
 */
const cachePageMixin = {
  methods: {
    /**
     * 移除缓存页面
     * @param {*} name 缓存组件的名称
     */
    removeCachePage(name) {
      this.removeCachePage(name)
    },
    /**
     * 从跳转页面返回并且刷新当前页面时调用
     */
    onResume() {},
    ...mapMutations(['addCachePage', 'removeCachePage'])
  },
  created() {
    this.addCachePage(this.$options.name)
  },
  mounted() {
    this.$route.meta.refresh = false
  },
  activated() {
    if (this.$route && this.$route.meta && this.$route.meta.refresh) {
      this.onResume()
    }
    this.$route.meta.refresh = true
  }
}
/**
 * 缓存页面跳转页面相关方法
 */
const cachedPageChildMixin = {
  data() {
    return {
      // 是否刷新父页面
      refreshParentCachedPage: false
    }
  },
  beforeRouteLeave(to, from, next) {
    if (to.meta == null) to.meta = {}
    to.meta.refresh = this.refreshParentCachedPage
    next()
  }
}

/**
 * 缓存页面跳转页面相关方法
 */
const cachedUrlParamsMixin = {
  data() {
    return {}
  },
  methods: {
    addQueryParam() {
      const params = { taskList: this.taskList.active || '', taskSubList: this.taskSubList.active || '', tabActive: this.taskSubList.tabActive || '' }
      this.$router.replace({ name: this.$route.name, params: { [this.__paramName || 'params']: this.$utils.encodeParams(params) } })
    },
    async getRouteQuery() {
      const params = this.$route.params[this.__paramName || 'params']
      if (params) {
        const _params = this.$utils.decodeParams(params) || {}
        this.handleSelected({ [this.taskList.dataKey]: _params['taskList'] || undefined }, _params['tabActive'] || undefined)
        this.taskSubList.active = _params['taskSubList'] || undefined
      }
    }
  },
  watch: {
    'taskList.active': {
      handler(val = '') {
        this.addQueryParam()
      }
    },
    'taskSubList.active': {
      handler(val = '') {
        this.addQueryParam()
      }
    }
  },
  beforeRouteEnter(to, from, next) {
    if (to.params) {
      next((vm) => {
        vm.$router.replace({ ...to, params: { ...to.params } })
      })
    } else {
      next()
    }
  }
}

const cachedSinglePageMixin = {
  data() {
    return {
      savedKey: undefined
    }
  },
  props: {
    // originCallback: {
    //   type: [Function]
    // }
    _key: {
      type: [Number, String],
      default: undefined
    },
    _origin: {
      type: String
    }
  },
  methods: {
    routerPush(params) {
      this.$router.push({
        ...params,
        query: {
          ...params.query,
          _origin: params.query?._origin || this.$route.name
        }
      })
    },
    singlePageReload(callback = () => {}) {
      if (this._key != this.savedKey) {
        callback()
        this.savedKey = this._key
      }
    },
    // true触发刷新
    oncancel(bool) {
      const id = this.getCurrentMenuId
      if (this._origin) {
        this.$router.push({
          name: this._origin,
          params: {
            _key: bool ? Date.now() : this._key
          }
        })
      }
      setTimeout(() => {
        this.removeTag(id)
      }, 500)
    },
    refreshUrlParams() {
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
    },
    ...mapMutations(['removeTag'])
  },
  computed: {
    ...mapGetters(['getCurrentMenuId'])
  }
}

export {
  projectConfigMixin,
  uploadCustomMixin,
  uploadMixin,
  statsDateRangeMixin,
  cachePageMixin,
  cachedPageChildMixin,
  cachedUrlParamsMixin,
  cachedSinglePageMixin
}
