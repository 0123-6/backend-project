// 权限基本结构
type IPermissionType = 'directory' | 'menu' | 'button'

export interface IPermission {
	// 唯一的名字
	name: string,
	// 类型
	type: IPermissionType,
	// 父节点,不存在代表顶层结构
	parent?: string,
}

// 保存全部权限数据
export const permissionList: IPermission[] = []
const permissionTypeList: IPermissionType[] = ['directory', 'menu', 'button']

// 添加
const addPermission = (props: IPermission)
	: (boolean | string) => {
	const {
		name,
		type,
		parent,
	} = props
	// name不能重复
	if (permissionList.some(item => item.name === name)) {
		return '该名称已存在,换个名字吧~'
	}
	// type必须是3个中的1个
	if (!permissionTypeList.includes(type)) {
		return "类型必须是'directory', 'menu', 'button'中的1个"
	}
	// type='directory' | 'menu',parent可以不存在,如果存在,则必须为directory
	// type='button',parent必须存在且为'menu'
	if (type === 'directory' || type === 'menu') {
		if (permissionList.find(item => item.name === parent && item.type !== 'directory')) {
			return `父级必须为目录,请检查`
		}
	} else {
		// type === button
		if (!permissionList.find(item => item.name === parent && item.type === 'menu')) {
			return `不存在名称为${parent}的菜单`
		}
	}

	// 通过了所有检验,是合法值,插入
	permissionList.push(props)
	return true
}

// 删除
const deletePermission = (permissionName: string)
	: boolean | string => {
	const index = permissionList.findIndex(item => item.name === permissionName)
	if (index === -1) {
		return '要删除的权限不存在,请检查'
	}
	// 简单起见,不能删除非叶子节点
	const hasChildren = permissionList.some(item => item.parent === permissionName)
	if (hasChildren) {
		return `该项存在子项,删除失败`
	}

	permissionList.splice(index, 1)
	return true
}

// 暂不支持修改
// const updatePermission = (oldPermissionName: string, newPermission: IPermission)
// 	: string | boolean => {
// 	// 1. 如果名字变了, 则新名字不可以已经存在,目前只支持修改名字
// 	const oldNameExist = permissionList.some(item => item.name === oldPermissionName)
// 	const newNameExist = permissionList.some(item => item.name === newPermission.name)
// 	if (!oldNameExist) {
// 		return `该项不存在,请检查`
// 	}
// 	if (newNameExist) {
// 		return `新名字已经存在,换个名字吧~`
// 	}
//
// 	const index = permissionList.findIndex(item => item.name === oldPermissionName)
// 	permissionList[index].name = newPermission.name
// 	return true
// }

// 通过方法初始化权限数据
addPermission({
	name: '首页',
	type: 'menu',
})
addPermission({
	name: '系统管理',
	type: 'directory',
})
addPermission({
	name: '用户管理',
	type: 'menu',
	parent: '系统管理',
})
addPermission({
	name: '角色管理',
	type: 'menu',
	parent: '系统管理',
})
addPermission({
	name: '权限管理',
	type: 'menu',
	parent: '系统管理',
})
addPermission({
	name: '新增和批量导入用户',
	type: 'button',
	parent: '用户管理',
})
addPermission({
	name: '删除用户',
	type: 'button',
	parent: '用户管理',
})
addPermission({
	name: '修改用户',
	type: 'button',
	parent: '用户管理',
})
addPermission({
	name: '查询和批量导出用户',
	type: 'button',
	parent: '用户管理',
})




































