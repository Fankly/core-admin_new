/**
 * 常量字典数据
 */

class DictionaryBase extends Map {
  constructor(name, dataList, keyId = 'id', symbolId = 'symbol') {
    super()
    this.showName = name
    this.setList(dataList, keyId, symbolId)
  }

  setList(dataList, keyId = 'id', symbolId = 'symbol') {
    this.clear()
    if (Array.isArray(dataList)) {
      dataList.forEach((item) => {
        this.set(item[keyId], item)
        if (item[symbolId] != null) {
          Object.defineProperty(this, item[symbolId], {
            get: function () {
              return item[keyId]
            }
          })
        }
      })
    }
  }

  getList(valueId = 'name', parentIdKey = 'parentId', filter) {
    const temp = []
    this.forEach((value, key) => {
      let obj = {
        id: key,
        name: typeof value === 'string' ? value : value[valueId],
        parentId: value[parentIdKey],
        disabled: value.disabled || false
      }
      if (typeof value !== 'string') {
        obj = {
          ...value,
          ...obj
        }
      }
      if (typeof filter !== 'function' || filter(obj)) {
        temp.push(obj)
      }
    })

    return temp
  }

  getValue(id, valueId = 'name') {
    // 如果id为boolean类型，则自动转换为0和1
    if (typeof id === 'boolean') {
      id = id ? 1 : 0
    }
    return (this.get(id) || {})[valueId]
  }
}

const importStatus = new DictionaryBase('导入状态', [
  {
    id: 1,
    name: '上传成功',
    symbol: 'UPLOAD_SUCCESS'
  },
  {
    id: 2,
    name: '导入成功',
    symbol: 'IMPORT_SUCCESS'
  },
  {
    id: 3,
    name: '导入失败',
    symbol: 'IMPORT_FAIL'
  }
])

const TaskUnitStatus = new DictionaryBase('任务包状态', [
  {
    id: 0,
    name: '未开始',
    symbol: 'NOT_BEGUN'
  },
  {
    id: 1,
    name: '已完成',
    symbol: 'FINISHED'
  },
  {
    id: 2,
    name: '进行中',
    symbol: 'UNDERWAY'
  },
  {
    id: 3,
    name: '待添加',
    symbol: 'TO_BE_ADDED'
  }
])

const QualityStatus = new DictionaryBase('跟踪状态', [
  {
    id: 2,
    name: '未跟踪',
    symbol: 'NOT_BEGUN'
  },
  {
    id: 1,
    name: '通过',
    symbol: 'PASS'
  },
  {
    id: 0,
    name: '不通过',
    symbol: 'NOT_PASS'
  }
])

const ContactStatus = new DictionaryBase('联络状态', [
  {
    id: 1,
    name: '未拨号',
    symbol: 'NOT_CALL'
  },
  {
    id: 2,
    name: '待回访',
    symbol: 'VISIT'
  },
  {
    id: 3,
    name: '待跟进',
    symbol: 'FOLLOWED'
  },
  {
    id: 4,
    name: '已完成',
    symbol: 'FINISHED'
  },
  {
    id: 5,
    name: '未接通',
    symbol: 'NOT_THROUGH'
  }
])

const CheckFrequency = new DictionaryBase('跟踪频率', [
  {
    id: 1,
    name: '每月',
    symbol: 'MONTH'
  },
  {
    id: 2,
    name: '每周',
    symbol: 'WEEK'
  },
  {
    id: 3,
    name: '指定时间',
    symbol: 'TIME'
  }
])

const PlanStatus = new DictionaryBase('质检方案启用状态', [
  {
    id: 1,
    name: '启用',
    symbol: 'NORMAL'
  },
  {
    id: 2,
    name: '停用',
    symbol: 'DISABLE'
  }
])

const QualityTaskStatus = new DictionaryBase('跟踪任务状态', [
  {
    id: 0,
    name: '未开始',
    symbol: 'NOT_BEGUN'
  },
  {
    id: 1,
    name: '已完成',
    symbol: 'FINISHED'
  },
  {
    id: 2,
    name: '进行中',
    symbol: 'UNDERWAY'
  }
])

const SysUserStatus = new DictionaryBase('用户状态', [
  {
    id: 0,
    name: '正常状态',
    symbol: 'NORMAL'
  },
  {
    id: 1,
    name: '锁定状态',
    symbol: 'LOCKED'
  }
])

const SysUserType = new DictionaryBase('用户类型', [
  {
    id: 0,
    name: '管理员',
    symbol: 'ADMIN'
  },
  {
    id: 1,
    name: '系统操作员',
    symbol: 'SYSTEM'
  },
  {
    id: 2,
    name: '普通操作员',
    symbol: 'OPERATOR'
  }
])

const SysOperationType = new DictionaryBase('操作日志操作类型', [
  {
    id: 0,
    name: '登录',
    symbol: 'LOGIN'
  },
  {
    id: 5,
    name: '登出',
    symbol: 'LOGOUT'
  },
  {
    id: 10,
    name: '新增',
    symbol: 'ADD'
  },
  {
    id: 15,
    name: '修改',
    symbol: 'UPDATE'
  },
  {
    id: 20,
    name: '删除',
    symbol: 'DELETE'
  },
  {
    id: 35,
    name: '查询',
    symbol: 'LIST'
  },
  {
    id: 40,
    name: '分组查询',
    symbol: 'LIST_WITH_GROUP'
  },
  {
    id: 45,
    name: '导出',
    symbol: 'EXPORT'
  },
  {
    id: 25,
    name: '新增多对多关联',
    symbol: 'ADD_M2M'
  },
  {
    id: 30,
    name: '移除多对多关联',
    symbol: 'DELETE_M2M'
  },
  {
    id: 50,
    name: '上传',
    symbol: 'UPLOAD'
  },
  {
    id: 55,
    name: '下载',
    symbol: 'DOWNLOAD'
  },
  {
    id: 60,
    name: '重置缓存',
    symbol: 'RELOAD_CACHE'
  },
  {
    id: 65,
    name: '发布',
    symbol: 'PUBLISH'
  },
  {
    id: 70,
    name: '取消发布',
    symbol: 'UNPUBLISH'
  },
  {
    id: 75,
    name: '流程挂起',
    symbol: 'SUSPEND'
  },
  {
    id: 80,
    name: '流程恢复',
    symbol: 'RESUME'
  },
  {
    id: 100,
    name: '启动流程',
    symbol: 'START_FLOW'
  },
  {
    id: 105,
    name: '终止流程',
    symbol: 'STOP_FLOW'
  },
  {
    id: 110,
    name: '删除流程',
    symbol: 'DELETE_FLOW'
  },
  {
    id: 115,
    name: '撤销流程',
    symbol: 'CANCEL_FLOW'
  },
  {
    id: 120,
    name: '提交流程任务',
    symbol: 'SUBMIT_TASK'
  },
  {
    id: 125,
    name: '催办流程',
    symbol: 'REMIND_TASK'
  },
  {
    id: 126,
    name: '流程干预',
    symbol: 'INTERVENE_FLOW'
  },
  {
    id: 127,
    name: '流程数据补偿',
    symbol: 'FIX_FLOW_BUSINESS_DATA'
  }
])

const SysPermModuleType = new DictionaryBase('权限分组类型', [
  {
    id: 0,
    name: '分组模块',
    symbol: 'GROUP'
  },
  {
    id: 1,
    name: '接口模块',
    symbol: 'CONTROLLER'
  }
])

const SysPermCodeType = new DictionaryBase('权限字类型', [
  {
    id: 0,
    name: '表单',
    symbol: 'FORM'
  },
  {
    id: 1,
    name: '片段',
    symbol: 'FRAGMENT'
  },
  {
    id: 2,
    name: '操作',
    symbol: 'OPERATION'
  }
])

const SysMenuType = new DictionaryBase('菜单类型', [
  {
    id: 0,
    name: '目录',
    symbol: 'DIRECTORY'
  },
  {
    id: 1,
    name: '表单',
    symbol: 'MENU'
  },
  {
    id: 2,
    name: '片段',
    symbol: 'FRAGMENT'
  },
  {
    id: 3,
    name: '按钮',
    symbol: 'BUTTON'
  }
])

const MobileEntryType = new DictionaryBase('移动端首页配置项类型', [
  {
    id: 0,
    name: '轮播图',
    symbol: 'BANNER'
  },
  {
    id: 1,
    name: '九宫格',
    symbol: 'SUDOKU'
  },
  {
    id: 2,
    name: '分组',
    symbol: 'GROUP'
  }
])

const SysMenuBindType = new DictionaryBase('菜单绑定类型', [
  {
    id: 0,
    name: '路由菜单',
    symbol: 'ROUTER'
  },
  {
    id: 1,
    name: '在线表单',
    symbol: 'ONLINE_FORM'
  },
  {
    id: 2,
    name: '工单列表',
    symbol: 'WORK_ORDER'
  },
  {
    id: 4,
    name: '外部链接',
    symbol: 'THRID_URL'
  }
])

const SysDataPermType = new DictionaryBase('数据权限类型', [
  {
    id: 0,
    name: '查看全部',
    symbol: 'ALL'
  },
  {
    id: 1,
    name: '仅看自己',
    symbol: 'ONLY_USER'
  },
  {
    id: 2,
    name: '仅看所在部门',
    symbol: 'ONLY_DEPT'
  },
  {
    id: 3,
    name: '仅看所在部门及子部门',
    symbol: 'ONLY_DEPT_AND_CHILD'
  },
  {
    id: 4,
    name: '自选部门及子部门',
    symbol: 'CUSTOM_DEPT_AND_CHILD'
  },
  {
    id: 5,
    name: '仅自选部门',
    symbol: 'CUSTOM_DEPT'
  },
  {
    id: 6,
    name: '本部门用户',
    symbol: 'DEPT_USER'
  },
  {
    id: 7,
    name: '本部门及子部门用户',
    symbol: 'DEPT_AND_CHILD_USER'
  }
])

const ScatterSymbolType = new DictionaryBase('纵轴位置', [
  {
    id: 0,
    name: '固定大小',
    symbol: 'FIXED'
  },
  {
    id: 1,
    name: '值大小',
    symbol: 'VALUE'
  }
])

const SysCustomWidgetType = new DictionaryBase('组件类型', [
  {
    id: 0,
    name: '文本显示',
    symbol: 'Label'
  },
  {
    id: 1,
    name: '文本输入框',
    symbol: 'Input'
  },
  {
    id: 3,
    name: '数字输入框',
    symbol: 'NumberInput'
  },
  {
    id: 4,
    name: '数字范围输入框',
    symbol: 'NumberRange'
  },
  {
    id: 5,
    name: '开关组件',
    symbol: 'Switch'
  },
  {
    id: 6,
    name: '滑块组件',
    symbol: 'Slider'
  },
  {
    id: 7,
    name: '单选组件',
    symbol: 'Radio'
  },
  {
    id: 8,
    name: '复选框',
    symbol: 'CheckBox'
  },
  {
    id: 10,
    name: '下拉选择框',
    symbol: 'Select'
  },
  {
    id: 12,
    name: '级联选择框',
    symbol: 'Cascader'
  },
  {
    id: 13,
    name: '树形选择组件',
    symbol: 'Tree'
  },
  {
    id: 14,
    name: '评分组件',
    symbol: 'Rate'
  },
  {
    id: 15,
    name: '进步器',
    symbol: 'Stepper'
  },
  {
    id: 16,
    name: '日历组件',
    symbol: 'Calendar'
  },
  {
    id: 20,
    name: '日期选择框',
    symbol: 'Date'
  },
  {
    id: 21,
    name: '日期范围选择框',
    symbol: 'DateRange'
  },
  {
    id: 30,
    name: '颜色选择框',
    symbol: 'ColorPicker'
  },
  {
    id: 31,
    name: '上传组件',
    symbol: 'Upload'
  },
  {
    id: 32,
    name: '富文本编辑',
    symbol: 'RichEditor'
  },
  {
    id: 40,
    name: '分割线',
    symbol: 'Divider'
  },
  {
    id: 41,
    name: '文本',
    symbol: 'Text'
  },
  {
    id: 42,
    name: '图片',
    symbol: 'Image'
  },
  {
    id: 43,
    name: '超链接',
    symbol: 'Link'
  },
  {
    id: 100,
    name: '表格组件',
    symbol: 'Table'
  },
  {
    id: 101,
    name: '透视表',
    symbol: 'PivotTable'
  },
  {
    id: 102,
    name: '数据列表',
    symbol: 'List'
  },
  {
    id: 103,
    name: '查询列表',
    symbol: 'QueryList'
  },
  {
    id: 104,
    name: '工单列表',
    symbol: 'WorkOrderList'
  },
  {
    id: 200,
    name: '折线图',
    symbol: 'LineChart'
  },
  {
    id: 201,
    name: '柱状图',
    symbol: 'BarChart'
  },
  {
    id: 202,
    name: '饼图',
    symbol: 'PieChart'
  },
  {
    id: 203,
    name: '散点图',
    symbol: 'ScatterChart'
  },
  {
    id: 204,
    name: '普通表格',
    symbol: 'DataViewTable'
  },
  {
    id: 205,
    name: '轮播图',
    symbol: 'Carousel'
  },
  {
    id: 206,
    name: '富文本',
    symbol: 'RichText'
  },
  {
    id: 207,
    name: '仪表盘',
    symbol: 'GaugeChart'
  },
  {
    id: 208,
    name: '漏斗图',
    symbol: 'FunnelChart'
  },
  {
    id: 209,
    name: '雷达图',
    symbol: 'RadarChart'
  },
  {
    id: 210,
    name: '普通进度条',
    symbol: 'ProgressBar'
  },
  {
    id: 211,
    name: '环形进度条',
    symbol: 'ProgressCircle'
  },
  {
    id: 212,
    name: '通用卡片',
    symbol: 'DataCard'
  },
  {
    id: 213,
    name: '通用列表',
    symbol: 'CommonList'
  },
  {
    id: 214,
    name: '进度条卡片',
    symbol: 'DataProgressCard'
  },
  {
    id: 300,
    name: '基础块',
    symbol: 'Block'
  },
  {
    id: 301,
    name: '卡片组件',
    symbol: 'Card'
  },
  {
    id: 302,
    name: 'Tabs 组件',
    symbol: 'Tabs'
  },
  {
    id: 303,
    name: '图片卡片',
    symbol: 'ImageCard'
  },
  {
    id: 304,
    name: '分组容器',
    symbol: 'CellGroup'
  },
  {
    id: 400,
    name: '用户选择',
    symbol: 'UserSelect'
  },
  {
    id: 401,
    name: '部门选择',
    symbol: 'DeptSelect'
  },
  {
    id: 402,
    name: '关联选择',
    symbol: 'DataSelect'
  },
  {
    id: 403,
    name: '表格容器',
    symbol: 'TableContainer'
  },
  {
    id: 500,
    name: '单选过滤',
    symbol: 'MobileRadioFilter'
  },
  {
    id: 501,
    name: '多选过滤',
    symbol: 'MobileCheckBoxFilter'
  },
  {
    id: 502,
    name: '文本过滤',
    symbol: 'MobileInputFilter'
  },
  {
    id: 503,
    name: '开关过滤',
    symbol: 'MobileSwitchFilter'
  },
  {
    id: 504,
    name: '日期过滤',
    symbol: 'MobileDateRangeFilter'
  },
  {
    id: 505,
    name: '数字范围过滤',
    symbol: 'MobileNumberRangeFilter'
  }
])

const OnlineFormEventType = new DictionaryBase('在线表单事件类型', [
  {
    id: 'change',
    name: '数据改变',
    symbol: 'CHANGE'
  },
  {
    id: 'disable',
    name: '是否禁用',
    symbol: 'DISABLE'
  },
  {
    id: 'visible',
    name: '是否可见',
    symbol: 'VISIBLE'
  },
  {
    id: 'dropdownChange',
    name: '下拉数据改变',
    symbol: 'DROPDOWN_CHANGE'
  },
  {
    id: 'linkHerf',
    name: '链接地址',
    symbol: 'LINK_HERF'
  },
  {
    id: 'disabledDate',
    name: '日期是否可用',
    symbol: 'DISABLED_DATE'
  },
  {
    id: 'afterLoadTableData',
    name: '表格加载数据后',
    symbol: 'AFTER_LOAD_TABLE_DATA'
  },
  {
    id: 'beforeLoadTableData',
    name: '表格加载数据前',
    symbol: 'BEFORE_LOAD_TABLE_DATA'
  },
  {
    id: 'afterLoadFormData',
    name: '页面加载数据后',
    symbol: 'AFTER_LOAD_FORM_DATA'
  },
  {
    id: 'beforeLoadFormData',
    name: '页面加载数据前',
    symbol: 'BEFORE_LOAD_FORM_DATA'
  },
  {
    id: 'beforeCommitFormData',
    name: '页面数据提交前',
    symbol: 'BEFORE_COMMIT_FORM_DATA'
  },
  {
    id: 'formCreated',
    name: '页面创建完毕',
    symbol: 'AFTER_CREATE_FORM'
  },
  {
    id: 'tableOperationVisible',
    name: '操作是否可见',
    symbol: 'OPERATION_VISIBLE'
  },
  {
    id: 'tableOperationDisbled',
    name: '操作是否禁用',
    symbol: 'OPERATION_DISABLED'
  }
])

const SysOnlineFormType = new DictionaryBase('表单类型', [
  {
    id: 1,
    name: '查询表单',
    symbol: 'QUERY'
  },
  {
    id: 2,
    name: '左树右表查询',
    symbol: 'ADVANCE_QUERY'
  },
  {
    id: 3,
    name: '一对一查询',
    symbol: 'ONE_TO_ONE_QUERY'
  },
  {
    id: 5,
    name: '编辑表单',
    symbol: 'FORM'
  },
  {
    id: 10,
    name: '流程表单',
    symbol: 'FLOW'
  },
  {
    id: 11,
    name: '工单列表',
    symbol: 'WORK_ORDER'
  },
  {
    id: 50,
    name: '报表页面',
    symbol: 'REPORT'
  }
])

const SysCustomWidgetOperationType = new DictionaryBase('操作类型', [
  {
    id: 0,
    name: '新建',
    symbol: 'ADD'
  },
  {
    id: 1,
    name: '编辑',
    symbol: 'EDIT'
  },
  {
    id: 2,
    name: '删除',
    symbol: 'DELETE'
  },
  {
    id: 3,
    name: '导出',
    symbol: 'EXPORT'
  },
  {
    id: 4,
    name: '导入',
    symbol: 'IMPORT'
  },
  {
    id: 5,
    name: '启动流程',
    symbol: 'START_FLOW'
  },
  {
    id: 10,
    name: '批量删除',
    symbol: 'BATCH_DELETE'
  },
  {
    id: 20,
    name: '表单操作',
    symbol: 'FORM'
  },
  /*
  {
    id: 21,
    name: '打印操作',
    symbol: 'PRINT'
  },
  */
  {
    id: 22,
    name: '复制',
    symbol: 'COPY'
  },
  {
    id: 30,
    name: '保存',
    symbol: 'SAVE'
  },
  {
    id: 31,
    name: '取消',
    symbol: 'CANCEL'
  },
  {
    id: 50,
    name: '脚本操作',
    symbol: 'SCRIPT'
  },
  {
    id: 51,
    name: '下钻事件',
    symbol: 'DRILL'
  },
  {
    id: 52,
    name: '路由跳转',
    symbol: 'ROUTE'
  }
])

const OnlineSystemVariableType = new DictionaryBase('系统变量类型', [
  {
    id: 0,
    name: '登录用户',
    symbol: 'CURRENT_USER'
  },
  {
    id: 1,
    name: '所属部门',
    symbol: 'CURRENT_DEPT'
  },
  {
    id: 10,
    name: '当前日期',
    symbol: 'CURRENT_DATE'
  },
  {
    id: 11,
    name: '当前时间',
    symbol: 'CURRENT_TIME'
  },
  {
    id: 20,
    name: '流程发起人',
    symbol: 'FLOW_CREATE_USER'
  }
])

const SysCustomWidgetBindDataType = new DictionaryBase('组件绑定数据类型', [
  {
    id: 0,
    name: '字段',
    symbol: 'Column'
  },
  {
    id: 5,
    name: '系统变量',
    symbol: 'SYSTEM_VARIABLE'
  },
  {
    id: 10,
    name: '自定义字段',
    symbol: 'Custom'
  },
  {
    id: 20,
    name: '固定值',
    symbol: 'Fixed'
  }
])

const SysMaskFieldType = new DictionaryBase('脱敏类型', [
  {
    id: 'CUSTOM',
    name: '自定义',
    symbol: 'CUSTOM'
  },
  {
    id: 'NAME',
    name: '姓名',
    symbol: 'NAME'
  },
  {
    id: 'MOBILE_PHONE',
    name: '移动电话',
    symbol: 'MOBILE_PHONE'
  },
  {
    id: 'FIXED_PHONE',
    name: '座机电话',
    symbol: 'FIXED_PHONE'
  },
  {
    id: 'ID_CARD',
    name: '身份证',
    symbol: 'ID_CARD'
  },
  {
    id: 'BANK_CARD',
    name: '银行卡号',
    symbol: 'BANK_CARD'
  },
  {
    id: 'CAR_LICENSE',
    name: '汽车牌照号',
    symbol: 'CAR_LICENSE'
  },
  {
    id: 'EMAIL',
    name: '电子邮箱地址',
    symbol: 'EMAIL'
  }
])

const DirectionType = new DictionaryBase('方向', [
  {
    id: 0,
    name: '横轴',
    symbol: 'HORIZONTAL'
  },
  {
    id: 1,
    name: '纵轴',
    symbol: 'VERTICAL'
  }
])

const DblinkType = new DictionaryBase('数据库连接类型', [
  {
    id: 0,
    name: 'MySQL',
    symbol: 'MYSQL'
  },
  {
    id: 1,
    name: 'PostgreSQL',
    symbol: 'POSTGRESQL'
  },
  {
    id: 2,
    name: 'Oracle',
    symbol: 'ORACLE'
  },
  {
    id: 3,
    name: '达梦数据库',
    symbol: 'DM_DB'
  },
  {
    id: 4,
    name: '人大金仓',
    symbol: 'KINGBASE'
  },
  {
    id: 5,
    name: '华为高斯',
    symbol: 'OPENGAUSS'
  },
  {
    id: 10,
    name: 'ClickHouse',
    symbol: 'CLICK_HOUSE'
  },
  {
    id: 11,
    name: 'Doris',
    symbol: 'DORIS'
  }
])

const ApprovedTypeDict = new DictionaryBase('审核状态', [
  {
    id: 0,
    name: '待提交',
    type: 'info',
    symbol: 'UNSUBMIT'
  },
  {
    id: 1,
    name: '待审批',
    type: 'loading',
    symbol: 'UNAPPROVED'
  },
  {
    id: 2,
    name: '已通过',
    type: 'success',
    symbol: 'FINISH'
  },
  {
    id: 3,
    name: '已驳回',
    type: 'warning',
    symbol: 'ERROR'
  }
])

const ReserveTypeDict = new DictionaryBase('储备状态', [
  // {
  //   id: 0,
  //   name: '新建待储备',
  //   type: 'info',
  //   symbol: 'UNRESERVE'
  // },
  // {
  //   id: 1,
  //   name: '储备审批中',
  //   type: 'primary',
  //   symbol: 'APPROVAL'
  // },
  // {
  //   id: 2,
  //   name: '审批驳回',
  //   type: 'warning',
  //   symbol: 'REJECT'
  // },
  // {
  //   id: 3,
  //   name: '项目实施中',
  //   type: 'primary',
  //   symbol: 'OPERATION'
  // },
  // {
  //   id: 4,
  //   name: '结项待汇报',
  //   type: 'primary',
  //   symbol: 'REPORT_PENDING'
  // },
  // {
  //   id: 5,
  //   name: '汇报审批中',
  //   type: 'primary',
  //   symbol: 'REPORT_APPROVAL'
  // },
  // {
  //   id: 6,
  //   name: '已结项',
  //   type: 'success',
  //   symbol: 'COMPLETED'
  // }
  {
    id: 0,
    name: '待提交',
    symbol: 'CREATE'
  },
  {
    id: 1,
    name: '审批中',
    symbol: 'APPROVING'
  },
  {
    id: 2,
    name: '上报审批中',
    symbol: 'SUBMIT_APPROVING'
  },
  {
    id: 3,
    name: '费用确认中',
    symbol: 'FEE_CONFIRMING'
  },
  {
    id: 4,
    name: '储备待立项',
    symbol: 'RESERVE_PENDING'
  },
  {
    id: 5,
    name: '实施待立项',
    symbol: 'IMPLEMENT_PENDING'
  },
  {
    id: 6,
    name: '结项审批中',
    symbol: 'FINISH_APPROVING'
  },
  {
    id: 7,
    name: '审批驳回',
    symbol: 'REJECTED'
  },
  {
    id: 8,
    name: '审批延期',
    symbol: 'DELAYED'
  },
  {
    id: 9,
    name: '已结项',
    symbol: 'FINISHED'
  }
])

// 废弃
const StatusDict = new DictionaryBase('储备真实状态', [
  {
    id: 0,
    name: '新建待储备',
    symbol: 'UNRESERVE_0'
  },
  {
    id: 1,
    name: '新建待储备',
    symbol: 'UNRESERVE_1'
  },
  {
    id: 2,
    name: '储备审批中',
    symbol: 'APPROVAL'
  },
  {
    id: 3,
    name: '储备审批驳回',
    symbol: 'REJECT'
  },
  {
    id: 4,
    name: '项目实施中',
    symbol: 'OPERATION'
  },
  {
    id: 5,
    name: '结项待汇报',
    symbol: 'REPORT_PENDING'
  },
  {
    id: 6,
    name: '汇报审批中',
    symbol: 'REPORT_APPROVAL'
  },
  {
    id: 7,
    name: '汇报审批驳回',
    symbol: 'REPORT_APPROVAL_REJECT'
  },
  {
    id: 8,
    name: '已结项',
    symbol: 'COMPLETED'
  }
])

const StatusRealDict = new DictionaryBase('储备真实状态', [
  {
    id: 0,
    name: '创建待储备',
    symbol: 'CREATE'
  },
  {
    id: 1,
    name: '创建待储备-填写储备申请',
    symbol: 'CREATE_FINISH'
  },
  {
    id: 20,
    name: '储备审批中-部门领导',
    symbol: 'APPROVAL_DEPT'
  },
  {
    id: 21,
    name: '储备审批驳回-部门领导',
    symbol: 'REJECT_DEPT'
  },
  {
    id: 30,
    name: '储备审批中-财务',
    symbol: 'APPROVAL_FINANCE'
  },
  {
    id: 31,
    name: '储备审批驳回-财务',
    symbol: 'REJECT_FINANCE'
  },
  {
    id: 40,
    name: '储备审批中-联合会审',
    symbol: 'JOINT_REVIEW'
  },
  {
    id: 41,
    name: '发展部通过',
    symbol: 'DEV_DEPT_APPROVED'
  },
  {
    id: 42,
    name: '储备审批驳回-发展部',
    symbol: 'REJECT_DEV_DEPT'
  },
  {
    id: 43,
    name: '经研所通过',
    symbol: 'RESEARCH_INST_APPROVED'
  },
  {
    id: 44,
    name: '储备审批驳回-经研所',
    symbol: 'REJECT_RESEARCH_INST'
  },
  {
    id: 100,
    name: '上报审批中',
    symbol: 'SUBMIT_APPROVAL'
  }
])

// 储备列表详情专用
const StatusReserveDict = new DictionaryBase('储备真实状态', [
  {
    id: 0,
    name: '待提交',
    symbol: 'PENDING_SUBMIT'
  },
  {
    id: 10,
    name: '部门审核中',
    symbol: 'DEPARTMENT_REVIEWING'
  },
  {
    id: 20,
    name: '财务审核中',
    symbol: 'FINANCE_REVIEWING'
  },
  {
    id: 40,
    name: '联合会审中', // 新增状态
    symbol: 'JOINT_REVIEWING'
  },
  {
    id: 100,
    name: '预审完成', // 新增状态
    symbol: 'PRE_REVIEW_COMPLETED'
  },
  {
    id: 30,
    name: '审批驳回',
    symbol: 'REJECTED'
  }
])

const ApprovedDiffDict = new DictionaryBase('对比审核状态', [
  {
    id: 0,
    name: '模型分析中',
    symbol: 'ANALYZE'
  },
  {
    id: 1,
    name: '通过',
    symbol: 'PASS'
  },
  {
    id: 2,
    name: '建议复审',
    symbol: 'REJUECT'
  }
])

// 储备列表详情专用
const StatusMessageDict = new DictionaryBase('消息通知状态', [
  {
    id: 0,
    name: '待提交',
    symbol: 'PENDING_SUBMIT'
  },
  {
    id: 1,
    name: '部门领导-储备项目待审批',
    symbol: 'DEPT_LEADER_PENDING'
  },
  {
    id: 2,
    name: '部门领导-储备项目审批已通过',
    symbol: 'DEPT_LEADER_APPROVED'
  },
  {
    id: 3,
    name: '部门领导-储备项目审批驳回',
    symbol: 'DEPT_LEADER_REJECTED'
  },
  {
    id: 10,
    name: '财务-储备项目待审批',
    symbol: 'FINANCE_PENDING'
  },
  {
    id: 11,
    name: '财务-储备项目审批已通过',
    symbol: 'FINANCE_APPROVED'
  },
  {
    id: 12,
    name: '财务-储备项目审批驳回',
    symbol: 'FINANCE_REJECTED'
  },
  {
    id: 20,
    name: '经研所-储备项目待审批',
    symbol: 'INSTITUTE_PENDING'
  },
  {
    id: 21,
    name: '经研所-储备项目审批已通过',
    symbol: 'INSTITUTE_APPROVED'
  },
  {
    id: 22,
    name: '经研所-储备项目已驳回',
    symbol: 'INSTITUTE_REJECTED'
  },
  {
    id: 30,
    name: '发展部-储备项目待审批',
    symbol: 'DEVELOPMENT_PENDING'
  },
  {
    id: 31,
    name: '发展部-储备项目审批已通过',
    symbol: 'DEVELOPMENT_APPROVED'
  },
  {
    id: 32,
    name: '发展部-储备项目已驳回',
    symbol: 'DEVELOPMENT_REJECTED'
  }
])

const DiffCompanyStatus = new DictionaryBase('对比公司范围状态', [
  {
    id: 0,
    name: '未完成',
    symbol: 'UNFINISHED'
  },
  {
    id: 1,
    name: '未完成',
    symbol: 'INCOMPLETE'
  },
  {
    id: 2,
    name: '已完成',
    symbol: 'FINISHED'
  }
])

const ProjectMatchStatus = new DictionaryBase('项目匹配情况', [
  {
    id: 0,
    name: '进行中',
    symbol: 'IN_PROGRESS',
    type: 'warning'
  },
  {
    id: 1,
    name: '已匹配',
    symbol: 'MATCHED',
    type: 'success'
  },
  {
    id: 2,
    name: '未匹配',
    symbol: 'UNMATCHED',
    type: 'info'
  }
])

const RiskStatus = new DictionaryBase('风险情况', [
  {
    id: 1,
    name: '存在风险',
    symbol: 'HAS_RISK',
    type: 'danger'
  },
  {
    id: 2,
    name: '无风险',
    symbol: 'NO_RISK',
    type: 'success'
  }
])

const AICheckResult = new DictionaryBase('AI审查结果', [
  {
    id: 1,
    name: '内容存在不一致',
    symbol: 'INCONSISTENT'
  },
  {
    id: 2,
    name: '内容一致或高相似度',
    symbol: 'CONSISTENT_OR_HIGH_SIMILARITY'
  },
  {
    id: 3,
    name: '未匹配预算项目',
    symbol: 'BUDGET_NOT_MATCHED'
  }
])

const AIStatus = new DictionaryBase('AI审查状态', [
  {
    id: 0,
    name: '分析中',
    symbol: 'ANALYZING',
    type: 'primary-blue'
  },
  {
    id: 1,
    name: '待复审',
    symbol: 'REVIEW_PENDING',
    type: 'primary-blue'
  },
  {
    id: 2,
    name: '已采纳',
    symbol: 'ADOPTED',
    type: 'success'
  },
  {
    id: 3,
    name: '不采纳',
    symbol: 'NOT_ADOPTED',
    type: 'danger'
  }
])

// const AIRiskLevelDict = new DictionaryBase('AI初评结论', [
//   {
//     id: 0,
//     name: 'AI预审通过',
//     symbol: 'AI_APPROVED',
//     type: 'success'
//   },
//   {
//     id: 1,
//     name: '问题项目',
//     symbol: 'RISK_HIGH',
//     type: 'danger'
//   },
//   {
//     id: 2,
//     name: '隐患项目',
//     symbol: 'RISK_MEDIUM',
//     type: 'warning-orange'
//   },
//   {
//     id: 3,
//     name: '异常项目',
//     symbol: 'RISK_LOW',
//     type: 'yellow'
//   }
// ])
const AIRiskLevelDict = new DictionaryBase('AI初评结论', [
  {
    id: 0,
    name: '未分析',
    symbol: 'UNANALYZED',
    type: 'info'
  },
  {
    id: 1,
    name: '分析中',
    symbol: 'ANALYZING',
    type: 'primary-blue'
  },
  {
    id: 10,
    name: 'AI预审通过',
    symbol: 'AI_APPROVED',
    type: 'success'
  },
  {
    id: 20,
    name: '问题项目',
    symbol: 'RISK_HIGH',
    type: 'danger'
  },
  {
    id: 30,
    name: '隐患项目',
    symbol: 'RISK_MEDIUM',
    type: 'warning-orange'
  },
  {
    id: 40,
    name: '异常项目',
    symbol: 'RISK_LOW',
    type: 'yellow'
  }
])

// 提示词管理用
const SceneTypeDict = new DictionaryBase('场景类型', [
  {
    id: 10,
    name: '必要性分析',
    symbol: 'NECESSITY_ANALYSIS'
  },
  {
    id: 20,
    name: '相似分析',
    symbol: 'SIMILARITY_ANALYSIS'
  },
  {
    id: 30,
    name: '三比一挂钩-step1',
    symbol: 'THREE_TO_ONE_STEP1'
  },
  {
    id: 40,
    name: '三比一挂钩-step2',
    symbol: 'THREE_TO_ONE_STEP2'
  },
  {
    id: 50,
    name: '三比一挂钩-step3',
    symbol: 'THREE_TO_ONE_STEP3'
  },
  {
    id: 60,
    name: '同源资产比对',
    symbol: 'SAME_SOURCE_ASSET_COMPARISON'
  }
])

const PromptStatusDict = new DictionaryBase('提示词状态', [
  {
    id: 0,
    name: '未配置',
    symbol: 'UNCONFIGURED'
  },
  {
    id: 1,
    name: '未生效',
    symbol: 'INACTIVE'
  },
  {
    id: 2,
    name: '生效中',
    symbol: 'ACTIVE'
  }
])

const ModelTypeDict = new DictionaryBase('模型类型', [
  {
    id: 2,
    name: 'qwen2.5-32b',
    symbol: 'QWEN2_5_32B'
  },
  {
    id: 3,
    name: 'deepseek-r1-distill-llama-70b',
    symbol: 'DEEPSEEK_R1_DISTILL_LLAMA_70B'
  },
  {
    id: 5,
    name: 'qwen3-32b',
    symbol: 'QWEN3_32B'
  },
  {
    id: 6,
    name: 'qwen3-235b-a22b',
    symbol: 'QWEN3_235B_A22B'
  }
])

export {
  DictionaryBase,
  SysUserStatus,
  SysUserType,
  SysDataPermType,
  SysOperationType,
  SysPermModuleType,
  SysPermCodeType,
  SysMenuBindType,
  MobileEntryType,
  SysMenuType,
  ScatterSymbolType,
  SysCustomWidgetType,
  OnlineFormEventType,
  SysOnlineFormType,
  SysCustomWidgetOperationType,
  OnlineSystemVariableType,
  SysCustomWidgetBindDataType,
  SysMaskFieldType,
  DirectionType,
  DblinkType,
  ApprovedTypeDict,
  ReserveTypeDict,
  StatusRealDict,
  ApprovedDiffDict,
  StatusMessageDict,
  DiffCompanyStatus,
  ProjectMatchStatus,
  RiskStatus,
  AICheckResult,
  AIStatus,
  StatusReserveDict,
  AIRiskLevelDict,
  PromptStatusDict,
  ModelTypeDict
}
