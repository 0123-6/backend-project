// 用户信息表
import {getRandomDate, getRandomTime} from "./date.js";

export interface IUserInfo {
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
	// 描述
	description?: string,
	// 创建日期
	createTime: string,
	// 最新活跃时间
	lastActiveTime: string,
	// 权限信息
	permissionList: string[],
	// 在线状态,动态设置,非用户自身信息
	isOnline?: boolean,
}

const createTime = getRandomDate() + ' ' + getRandomTime()
export const userList: IUserInfo[] = [
	{
		account: 'admin',
		password: 'password',
		nickname: '演示账号',
		sex: 'man',
		phone: '17796723651',
		status: 'normal',
		description: '这是演示账号',
		createTime,
		lastActiveTime: createTime,
		permissionList: [
			'首页',
			'系统管理',
			'用户管理',
			'角色管理',
			'权限管理',
			'新增和批量导入用户',
			'修改用户',
			'查询和批量导出用户',
		],
	},
]

const list1 = [
	'业务目录一',
	'业务菜单1-1',
]
const list2 = [
	'业务目录二',
	'业务菜单2-2',
]
const list3 = [
	'业务目录一',
	'业务目录二',
	'业务菜单1-1',
	'业务菜单1-2',
	'业务菜单1-3',
	'业务菜单2-1',
	'业务菜单2-2',
]
for (let i = 1; i <= 40; i++) {
	const random = Math.random()
	const createTime = getRandomDate() + ' ' + getRandomTime()
	userList.push({
		account: `user${i}`,
		password: 'password',
		nickname: Math.random() > 0.5 ? `用户${i}` : undefined,
		sex: random > 0.7 ? undefined : random > 0.4 ? 'man' : 'woman',
		phone: Math.random() > 0.5 ? `177967236${i < 10 ? '0'+i : i}` : undefined,
		status: Math.random() > 0.25 ? 'normal' : 'disabled',
		description: Math.random() > 0.5 ? `用户${i}的简介` : undefined,
		createTime,
		lastActiveTime: createTime,
		permissionList: i === 1
			? []
			: i < 10
				? list1
				: i < 20
					? list2
					: list3,
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