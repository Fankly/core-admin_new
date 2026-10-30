/**
 * 外壳用户资料 mock（GET /sys/getUserInfo）。
 *
 * 联调后端的 User 里 baseorg（基准组织）常年为 null，顶栏名称下方的第二行会一直空着，
 * 无法验证排版。这里只补这一个接口，菜单仍走真实后端；其余字段对齐 SysUserVO，
 * 让头像、姓名、悬停提示里的账号与域都有确定数据。
 */
import Mock from 'mockjs'
import { success } from '../helpers'

/** 演示用登录用户。baseorg 是基准组织名称，baseorg_id 是其组织 id。 */
export const MOCK_USER_PROFILE = {
  id: 'mock-user-001',
  name: '演示用户',
  namecode: 'mock_user',
  fullName: '演示用户',
  baseorg: '预算管理处',
  baseorg_id: 'bm-ysglc-001',
  domainName: 'sgcc.com.cn',
  systemCode: 'APPF_XMCB'
}

Mock.mock(/sys\/getUserInfo(?:\?.*)?$/, 'get', () => success({ ...MOCK_USER_PROFILE }))
