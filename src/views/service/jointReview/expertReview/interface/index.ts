// 消息列表
export interface MessageItem {
  type: string
  activityDefName: string
  startTime: string
  bizName: string
}

// 驾驶舱角色数据
export interface GlobalInfo {
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleId: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  fqzzFlag: string
  userId: string
}
