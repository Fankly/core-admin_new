import { CwProject, CwProjectApprove } from '@/api/mainController'
import { ApprovedTypeDict, StatusReserveDict } from '@/staticDict/index.js'
// 财务首页默认一级单位的配置参数Key（如需调整请同步后台 sysParam 配置，值为一级单位 code）
export const DASHBOARD_YJDW_PARAM = 'DASHBOARD_YJDW'

// --- 新增：抽离审批人通用的参数构造逻辑，避免下面的代码重复写4遍 ---
export const buildApproveParams = (pageNum) => ({
  orderParam: [
    {
      fieldName: 'createTime',
      asc: 1
    }
  ],
  pageParam: {
    pageNum: pageNum,
    pageSize: 20
  },
  cwProjectApproveDtoFilter: {
    // 如果未来需要针对某个具体审批人传特定参数，也可以在这里处理
    status: ApprovedTypeDict.UNAPPROVED,
    noticeRunning: 1
  }
})
export const strategyMap = {
  reporter: {
    apiMethod: CwProject.list,
    detailPath: 'projectDetail',
    // 填报人专属参数构造器
    getParams: (pageNum) => ({
      orderParam: [
        {
          fieldName: 'createTime',
          asc: 1
        }
      ],
      pageParam: {
        pageNum: pageNum,
        pageSize: 20
      },
      cwProjectDtoFilter: {
        // 填报人特有的过滤条件放这里
        reserveStatus: `${StatusReserveDict.DEPARTMENT_REVIEWING},${StatusReserveDict.FINANCE_REVIEWING},${StatusReserveDict.JOINT_REVIEWING}`,
        noticeRunning: 1
      }
    })
  },
  deptApproval: {
    vtSource: 1,
    apiMethod: CwProjectApprove.deptList,
    detailPath: 'deptApprovalDetail',
    getParams: buildApproveParams // 使用通用审批参数
  },
  financeApproval: {
    vtSource: 2,
    apiMethod: CwProjectApprove.financeList,
    detailPath: 'financeApprovalDetail',
    getParams: buildApproveParams
  },
  jysApproval: {
    vtSource: 3,
    apiMethod: CwProjectApprove.jysList,
    detailPath: 'jysApprovalDetail',
    getParams: buildApproveParams
  },
  fzbApproval: {
    vtSource: 4,
    apiMethod: CwProjectApprove.fzbList,
    detailPath: 'fzbApprovalDetail',
    getParams: buildApproveParams
  }
}
