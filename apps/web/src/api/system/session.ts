import baseService from '@/service/baseService'
import type { IServerMenus } from '@/types/interface'
import type { UserProfile } from '@/types/domain'

export const getNavigationMenus = () => baseService.get<IServerMenus[]>('/sys/menu/nav')
export const getCurrentUser = () => baseService.get<Partial<UserProfile>>('/sys/getUserInfo')
