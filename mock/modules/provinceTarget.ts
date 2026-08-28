import Mock from 'mockjs'
import { MockOptions, pageResult, parseBody, success } from '../helpers'

const versionList = [
  {
    id: '202600000000000001',
    nd: '2026',
    status: 1,
    statusName: '草稿',
    versionNo: 'SJTC-2026-001',
    versionName: '2026年省级统筹目标调整测试版本',
    mbz: '3500.000000',
    gkbmId: 'GK001',
    gkbmName: '发展策划部',
    bmName: '发展策划部',
    remark: '用于目标总控值调整功能联调',
    tzsm: '目标总控值调整模拟数据',
    activeTime: '2026-07-20 09:00:00',
    createUserName: '模拟用户',
    createTime: '2026-07-20 09:00:00'
  }
]

// 省级统筹目标值版本列表
Mock.mock(/\/api\/sjtcmbztz\/getVersionPage(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const versionName = String(params.versionName || '').trim()
  const gkbmName = String(params.gkbmName || '').trim()
  const status = String(params.status || '').trim()
  const nd = String(params.nd || '').trim()
  const filteredList = versionList.filter((item) => {
    if (versionName && !item.versionName.includes(versionName)) return false
    if (gkbmName && !item.gkbmName.includes(gkbmName)) return false
    if (status && String(item.status) !== status) return false
    if (nd && item.nd !== nd) return false
    return true
  })

  return success(pageResult(filteredList, params.page, params.limit))
})

// 模拟目标总控值数据
const generateMockData = () => {
  const projectTypes = [
    { xmdl: '1', xmdlName: '基建', protypeName: '变电站建设' },
    { xmdl: '1', xmdlName: '基建', protypeName: '线路改造' },
    { xmdl: '', xmdlName: '小计', protypeName: '' },
    { xmdl: '2', xmdlName: '技改', protypeName: '设备更新' },
    { xmdl: '2', xmdlName: '技改', protypeName: '系统升级' },
    { xmdl: '', xmdlName: '小计', protypeName: '' },
    { xmdl: '-1', xmdlName: '合计', protypeName: '' }
  ]

  const data = projectTypes.map((item, index) => {
    const isSubtotal = item.xmdl === ''
    const isTotal = item.xmdl === '-1'
    const isSummary = isSubtotal || isTotal

    const detailValues: Record<number, { tzqYsje: number; tzqDwSum: number; bcsqYsje: number; bcsqDwSum: number }> = {
      0: { tzqYsje: 1000, tzqDwSum: 400, bcsqYsje: 200, bcsqDwSum: 100 },
      1: { tzqYsje: 1000, tzqDwSum: 500, bcsqYsje: 200, bcsqDwSum: 100 },
      3: { tzqYsje: 700, tzqDwSum: 300, bcsqYsje: 150, bcsqDwSum: 100 },
      4: { tzqYsje: 800, tzqDwSum: 350, bcsqYsje: 150, bcsqDwSum: 100 }
    }
    const detailValue = detailValues[index] || { tzqYsje: 0, tzqDwSum: 0, bcsqYsje: 0, bcsqDwSum: 0 }
    let tzqYsje = detailValue.tzqYsje
    let tzqDwSum = detailValue.tzqDwSum
    let tzqDfj = tzqYsje - tzqDwSum
    let bcsqYsje = detailValue.bcsqYsje
    let bcsqDwSum = detailValue.bcsqDwSum
    let bcsqDfj = bcsqYsje - bcsqDwSum

    if (isSummary) {
      // 小计和合计行的值
      if (isSubtotal) {
        if (index === 2) {
          // 基建小计
          tzqYsje = 2000
          tzqDfj = 1100
          tzqDwSum = 900
          bcsqYsje = 400
          bcsqDfj = 200
          bcsqDwSum = 200
        } else if (index === 5) {
          // 技改小计
          tzqYsje = 1500
          tzqDfj = 850
          tzqDwSum = 650
          bcsqYsje = 300
          bcsqDfj = 100
          bcsqDwSum = 200
        }
      } else if (isTotal) {
        // 合计
        tzqYsje = 3500
        tzqDfj = 1950
        tzqDwSum = 1550
        bcsqYsje = 700
        bcsqDfj = 300
        bcsqDwSum = 400
      }
    }

    // 调整后初始值等于调整前
    const bcxgYsje = tzqYsje
    const bcxgDfj = bcxgYsje - bcsqDwSum - tzqDwSum
    const bcxgDwSum = tzqDwSum + bcsqDwSum

    return {
      id: `${index + 1}`,
      xmdl: item.xmdl,
      xmdlName: item.xmdlName,
      protypeId: isSummary ? '' : `PT${index + 1}`,
      protypeName: item.protypeName,
      // 调整前
      tzqYsje: tzqYsje.toFixed(6),
      tzqDfj: tzqDfj.toFixed(6),
      tzqDwSum: tzqDwSum.toFixed(6),
      // 本次申请
      bcsqYsje: bcsqYsje.toFixed(6),
      bcsqDfj: bcsqDfj.toFixed(6),
      bcsqDwSum: bcsqDwSum.toFixed(6),
      // 调整后
      bcxgYsje: bcxgYsje.toFixed(6),
      bcxgDfj: bcxgDfj.toFixed(6),
      bcxgDwSum: bcxgDwSum.toFixed(6)
    }
  })

  return data
}

// 获取目标总控值数据
Mock.mock(/\/api\/sjtcmbztz\/getZkzAndDfjData/, 'get', (options: any) => {
  const url = new URL(options.url, 'http://localhost')
  const version = url.searchParams.get('version')

  console.log('[Mock] getZkzAndDfjData called with version:', version)

  return success(generateMockData())
})

// 保存目标总控值修改
Mock.mock(/\/api\/sjtcmbztz\/modifyZkzAndDfj/, 'post', (options: any) => {
  const body = JSON.parse(options.body)

  console.log('[Mock] modifyZkzAndDfj called with data:', body)

  // 模拟验证
  if (Array.isArray(body)) {
    for (const item of body) {
      const ysje = parseFloat(item.ysje || 0)
      if (ysje < 0) {
        return {
          code: 1,
          success: false,
          msg: '目标总控值不能为负数'
        }
      }
    }
  }

  return success({
    msg: '保存成功'
  })
})

console.log('[Mock] provinceTarget module loaded')
