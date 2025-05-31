// 用户信息表
import {getRandomDate, getRandomTime} from "./date.js";

export interface IUser {
	// 账号,唯一标识
	account: string,
	// 密码
	password: string,
	// 昵称
	nickname?: string,
	// 性别
	sex?: 'man' | 'woman',
	// 手机号,唯一
	phone?: string,
	// 状态
	status: 'normal' | 'disabled',
	// 说明
	description?: string,
	// 创建日期
	createTime: string,
}
export const userList: IUser[] = [
	{
		account: 'admin',
		password: 'password',
		nickname: '演示账号',
		sex: 'man',
		phone: '17796723651',
		status: Math.random() > 0.1 ? 'normal' : 'disabled',
		description: '这是演示账号',
		createTime: getRandomDate() + ' ' + getRandomTime(),
	},
]
for (let i = 1; i <= 40; i++) {
	const random = Math.random()
	userList.push({
		account: `user${i}`,
		password: 'password',
		nickname: Math.random() > 0.5 ? `用户${i}` : undefined,
		sex: random > 0.7 ? undefined : random > 0.4 ? 'man' : 'woman',
		phone: Math.random() > 0.5 ? `177967236${i < 10 ? '0'+i : i}` : undefined,
		status: Math.random() > 0.1 ? 'normal' : 'disabled',
		description: Math.random() > 0.5 ? `用户${i}的简介` : undefined,
		createTime: getRandomDate() + ' ' + getRandomTime(),
	})
}

// 角色表
export interface IRole {
	// 角色名称,唯一标识
	roleName: string,
	// 说明
	description?: string,
}
export const roleList: IRole[] = []

// 权限表
export interface IPermission {
	// 权限名,唯一标识
	permissionName: string,
	// 类型
	type: 'menu-group' | 'menu' | 'button',
	// 标识符,格式'a:b:c'
	code: string,
	// 上一级
	father: string,
}
export const permissionList: IPermission[] = []

// 用户-角色表, 多对多
export interface IUserAndRole {
	// 唯一标识为2个属性的整体
	account: string,
	roleName: string,
}
export const userAndRoleList: IUserAndRole[] = []

// 角色-权限表,多对多
export interface IRoleAndPermission {
	// 唯一标识为2个属性的整体
	roleName: string,
	permissionName: string,
}