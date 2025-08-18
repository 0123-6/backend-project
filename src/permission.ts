import {app} from "./app.js";
import {arrayToTree} from "./tree.js";
import {userList} from "./user.js";
import dayjs from "dayjs";
import {IEntity} from "./interfaceCommon.js";

// 权限
interface IPermission extends IEntity{
	// 唯一的名字
	name: string,
	// 父节点,不存在代表顶层结构
	parent?: string,
}

// 保存全部权限数据
export const permissionList: IPermission[] = []

// 添加
const addPermission = (props: IPermission)
	: (boolean | string) => {
	const {
		name,
	} = props
	// name不能重复
	if (permissionList.some(item => item.name === name)) {
		return '该名称已存在,换个名字吧~'
	}

	// 通过了所有检验,是合法值,插入
	permissionList.push({
		...props,
		createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
		lastChangeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
	})
	return true
}

app.post('/permission/add', (req, res) => {
	const result = addPermission(req.body)
	res.json({
		code: result === true ? 200 : 999,
		msg: result,
	})
})

// 删除
const deletePermission = (props: IPermission)
	: boolean | string => {
	const {
		name,
	} = props
	const index = permissionList.findIndex(item => item.name === name)
	if (index === -1) {
		return '要删除的权限不存在,请检查'
	}
	// 简单起见,不能删除非叶子节点
	const hasChildren = permissionList.some(item => item.parent === name)
	if (hasChildren) {
		return `该项存在子项,删除失败`
	}
	// 有用户正在使用该权限,无法删除
	for (let i = 0; i < userList.length; i++) {
		if (userList[i].permissionList.includes(name)) {
			return '有用户正在使用该权限标识,无法删除'
		}
	}

	permissionList.splice(index, 1)
	return true
}

app.post('/permission/delete', (req, res) => {
	const result = deletePermission(req.body)
	res.json({
		code: result === true ? 200 : 999,
		msg: result,
	})
})

// 更新
const updatePermission = (props: IPermission)
	: boolean | string => {
	const {
		name,
		parent,
		description,
	} = props
	const index = permissionList.findIndex(item => item.name === name)
	if (index === -1) {
		return '要更新的权限不存在,请检查'
	}

  // 功能信息存在parent
  if (parent) {
    const parentExist = permissionList.some(item => item.name === parent)
    if (!parentExist) {
      return '上级权限不存在,请检查'
    }
  }


	permissionList[index] = {
		...permissionList[index],
		parent,
		description,
		lastChangeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
	}
	return true
}

app.post('/permission/update', (req, res) => {
	const result = updatePermission(req.body)
	res.json({
		code: result === true ? 200 : 999,
		msg: result,
	})
})

// 通过方法初始化权限数据
addPermission({
	name: '首页',
	description: '这是首页的描述',
})
addPermission({
	name: '系统管理',
	description: '系统管理目录',
})
addPermission({
	name: '用户管理',
	parent: '系统管理',
	description: '管理全部的用户信息',
})
addPermission({
	name: '角色管理',
	parent: '系统管理',
	description: '管理全部角色信息',
})
addPermission({
	name: '权限管理',
	parent: '系统管理',
	description: '管理全部权限信息',
})
addPermission({
	name: '新增和批量导入用户',
	parent: '用户管理',
})
addPermission({
	name: '删除用户',
	parent: '用户管理',
})
addPermission({
	name: '修改用户',
	parent: '用户管理',
})
addPermission({
	name: '查询和批量导出用户',
	parent: '用户管理',
})

// 业务页面
addPermission({
	name: '业务目录一',
	description: '这是业务目录一',
})
addPermission({
	name: '业务目录二',
	description: '这是业务目录二',
})
addPermission({
	name: '业务菜单1-1',
	parent: '业务目录一',
	description: '业务菜单1-1',
})
addPermission({
	name: '业务菜单1-2',
	parent: '业务目录一',
})
addPermission({
	name: '业务菜单1-3',
	parent: '业务目录一',
	description: '业务菜单1-3',
})
addPermission({
	name: '业务菜单1-4',
	parent: '业务目录一',
	description: '业务菜单1-4',
})
addPermission({
	name: '业务菜单2-1',
	parent: '业务目录二',
	description: '业务菜单2-1',
})
addPermission({
	name: '业务菜单2-2',
	parent: '业务目录二',
	description: '业务菜单2-2',
})

// 获取权限信息列表
app.post('/getPermissionList', (req, res) => {
	const {
		pageNum,
		pageSize,
		orderFiled = 'createTime',
		orderStatus = 'desc',
	} = req.body

	const list = arrayToTree(
		permissionList,
		{
			idKey: 'name',
		},
	)

	// 分页
	const pageList = list.slice((pageNum - 1) * pageSize, pageNum * pageSize)

	res.json({
		code: 200,
		msg: '操作成功',
		data: {
			total: list.length,
			list: pageList,
		},
	})
})

// 获取全部权限信息数组
app.post('/getAllPermissionList', (req, res) => {
	res.json({
		code: 200,
		msg: '操作成功',
		data: arrayToTree(
			permissionList,
			{
				idKey: 'name',
			},
		),
	})
})











































