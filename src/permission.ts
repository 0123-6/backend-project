import {app} from "./app.js";
import {arrayToTree} from "./tree.js";
import express from "express";
import cookieParser from "cookie-parser";

export interface IPermission {
	// 唯一的名字
	name: string,
	// 父节点,不存在代表顶层结构
	parent?: string,
}

app.use(express.json());
app.use(cookieParser());

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
	permissionList.push(props)
	return true
}

app.post('/permission/add', (req, res) => {
	const result = addPermission(req.body as IPermission)
	res.json({
		code: result === true ? 200 : 999,
		msg: result,
	})
})

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

app.post('/permission/delete', (req, res) => {
	const result = deletePermission(req.body as string)
	res.json({
		code: result === true ? 200 : 999,
		msg: result,
	})
})

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
})
addPermission({
	name: '系统管理',
})
addPermission({
	name: '用户管理',
	parent: '系统管理',
})
addPermission({
	name: '角色管理',
	parent: '系统管理',
})
addPermission({
	name: '权限管理',
	parent: '系统管理',
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
})
addPermission({
	name: '业务目录二',
})
addPermission({
	name: '业务菜单1-1',
	parent: '业务目录一',
})
addPermission({
	name: '业务菜单1-2',
	parent: '业务目录一',
})
addPermission({
	name: '业务菜单1-3',
	parent: '业务目录一',
})
addPermission({
	name: '业务菜单1-4',
	parent: '业务目录一',
})
addPermission({
	name: '业务菜单2-1',
	parent: '业务目录二',
})
addPermission({
	name: '业务菜单2-2',
	parent: '业务目录二',
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












































