// 用户信息表
export interface IUser {
	// 账号,唯一标识
	account: string,
	// 密码
	password: string,
	// 昵称
	nickname?: string,
	// 性别
	sex?: 'man' | 'woman',
	// 说明
	description?: string,
	// 手机号,唯一
	phone?: string,
}
export const userList: IUser[] = [
	{
		account: 'admin',
		password: 'password',
		nickname: '演示账号',
		sex: 'man',
		description: '这是演示账号',
		phone: '17796723651',
	},
]
for (let i = 1; i <= 40; i++) {
	userList.push({
		account: `user${i}`,
		password: 'password',
		nickname: `用户${i}`,
		sex: Math.random() > 0.5 ? 'man' : 'woman',
		description: `用户${i}的简介`,
		phone: `177967236${i < 10 ? '0'+i : i}`
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