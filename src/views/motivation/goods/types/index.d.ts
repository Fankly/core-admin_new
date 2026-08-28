import type { Component } from "vue"
export declare interface TabItem {
    label: string,
    value: string,
    component: Component,
    data: {
        [key in string]?: any
    },
    events: {
        [key in string]?: (...args: any) => any
    },
}

export declare interface UserInfo {
    deptId: string
    deptName: string
    dwId: string
    dwName: string
    roleCode: string
    spRoleId: string
    specialorgcode: string
    roleId: string
}